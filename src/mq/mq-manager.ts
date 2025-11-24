import { log, types } from '@juzi/wechaty-puppet'
import { ConsumeMessage } from 'amqplib'
import Onirii from 'onirii'
import { AmqpChannelService } from 'onirii/lib/service/amqp/amqp-channel-service'
import { AmqpConnectService } from 'onirii/lib/service/amqp/amqp-connect-service'
import { sleep, SECOND, MINUTE } from '../util/time.js'
import {
  MqCommandResponseWaiter,
  MqCommandType,
  MqMessageType,
  MqReceiveMessage,
  MqRequest,
  MqResponse,
  MqSendMessage,
} from '../model/mq.js'
import EventEmitter from 'events'
import {
  getClientExchangeName,
  getServerExchangeName,
  getTokenQueueName,
} from './config.js'
import { v4 } from 'uuid'

const PRE = 'MqManager'

enum LISTENER_TYPE {
  ERROR,
  CLOSE,
}

export class MqManager extends EventEmitter {
  private static _instance: MqManager

  public static get Instance(): MqManager {
    return this._instance || (this._instance = new this())
  }

  private puppetConnection: AmqpConnectService | undefined
  private puppetChannel: AmqpChannelService | undefined

  private connected = false
  private restartingConnection = false
  private restartingChannel = false

  private token: string | undefined
  private exchangeBaseName: string | undefined
  private mqUri: string | undefined

  private static MqCommandResponsePool = new Map<
    string,
    MqCommandResponseWaiter
  >()

  private static async consumption(
    msg: ConsumeMessage | null,
    channel: AmqpChannelService | undefined,
  ) {
    log.verbose(PRE, `consuming content: ${msg?.content.toString()}`)
    const messageString = msg?.content.toString()
    if (!messageString) {
      await channel?.ackMessage(msg!)
      return
    }

    try {
      const message: MqReceiveMessage = JSON.parse(messageString)
      if (message.type === MqMessageType.command) {
        const waiter = this.MqCommandResponsePool.get(message.traceId)
        if (!waiter) {
          log.warn(PRE, `MqCommandResponsePool Not Found ${message.traceId}`)
          await channel?.ackMessage(msg!)
          return
        }
        if (message.code) {
          waiter.rejector(new Error(message.error))
        } else {
          waiter.resolver(JSON.parse(message.data))
        }
        clearTimeout(waiter.timer)
      } else {
        this.Instance.handleEvent(message.eventType!, message.data)
      }
    } catch (e) {
      log.error(PRE, `consumption() error: ${(e as Error).stack}`)
    }
    await channel?.ackMessage(msg!)
  }

  public async init(option: {token: string, mqUri: string, exchangeBaseName: string}) {
    const { token, mqUri, exchangeBaseName } = option
    log.info(PRE, `init(${token})`)
    if (!this.puppetConnection) {
      if (!(token && mqUri)) {
        throw new Error(`init() need token and mqUri`)
      }
      // no idea why have to add default
      const creator = Onirii.createAmqpConnect || (Onirii as any).default.createAmqpConnect
      this.puppetConnection = creator(
        `puppet-${token}-${Date.now()}`,
        mqUri,
      )
      this.token = token
      this.exchangeBaseName = exchangeBaseName
      this.mqUri = mqUri
    }

    await this.initConnect()
    this.connected = true
    await this.initChannel()
    await this.startConsumer()
  }

  private async initConnect() {
    log.info(PRE, 'initConnect()')
    await this.puppetConnection!.ready()
    await this.prepareConnectListener()
    log.info(PRE, 'initConnect() connected mq service...')
  }

  private async initChannel() {
    log.info(PRE, 'initChannel()')
    this.puppetChannel = await this.createChannelService(10)
    await this.prepareChannelListener()
    await this.prepareQueue(this.puppetChannel)
  }

  private async prepareConnectListener() {
    this.puppetConnection?.addCloseListener(
      (err) => void this.reconnectMainConnect(err, LISTENER_TYPE.CLOSE),
    )
    this.puppetConnection?.addErrorListener(
      (err) => void this.reconnectMainConnect(err, LISTENER_TYPE.ERROR),
    )
  }

  private async createChannelService(prefetch: number) {
    log.info(PRE, 'Creating Channel ...')
    const instance = await this.puppetConnection?.createChannelService(false)
    if (instance) {
      await instance.setPrefetchCount(prefetch)
      return instance
    } else {
      throw new Error(`Cant Create Amqp Channel Instance`)
    }
  }

  private async prepareChannelListener() {
    this.puppetChannel?.addCloseListener(() => {
      log.info(`puppetChannel on close listener`)
      void this.reconnectChannel()
    })
  }

  private async reconnectMainConnect(err: Error, type: LISTENER_TYPE) {
    log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]})`)
    this.connected = false
    if (this.restartingConnection) {
      log.error(
        PRE,
        `reconnectMainConnect(${LISTENER_TYPE[type]}) under processing...`,
      )
      return
    }

    this.restartingConnection = true
    log.error(
      PRE,
      `reconnectMainConnect(${LISTENER_TYPE[type]}) MQ Service Connect Receive ${LISTENER_TYPE[type]} event: ${err}`,
    )

    try {
      await this.init({
        token: this.token!,
        mqUri: this.mqUri!,
        exchangeBaseName: this.exchangeBaseName!,
      })
      await this.startConsume()
    } catch (e) {
      log.error(
        PRE,
        `reconnectMainConnect(${
          LISTENER_TYPE[type] || type
        }) Reconnect MQ Service Failed: ${e}`,
      )
      void this.reconnectMainConnect(e as Error, type)
    } finally {
      this.restartingConnection = false
    }

    log.info(
      PRE,
      `reconnectMainConnect(${LISTENER_TYPE[type]}) Reconnected MQ Service Done.`,
    )
  }

  public async reconnectChannel(): Promise<void> {
    log.info(PRE, `reconnectChannel()`)
    if (this.restartingConnection) {
      log.error(PRE, `reconnectChannel() restart connect under processing...`)
      return
    }
    if (this.restartingChannel) {
      log.error(PRE, `reconnectChannel(}) restart channel under processing...`)
      return
    }

    this.restartingChannel = true
    log.error(
      PRE,
      `reconnectChannel(}) MQ Service Channel Connect Receive Close event.`,
    )

    try {
      await sleep(MINUTE)
      this.puppetChannel = await this.createChannelService(10)
      await this.startConsumer()
    } catch (e) {
      log.error(PRE, `reconnectChannel(}) Reconnect MQ Service Failed: ${e}`)
      return this.reconnectChannel()
    } finally {
      this.restartingChannel = false
    }

    log.info(PRE, `reconnectChannel(}) Reconnected MQ Service Done.`)
  }

  public async startConsume() {
    while (true) {
      if (this.connected) {
        break
      }
      log.warn(PRE, 'startConsume() MQ Server Connect Not Ready Yet')
      await sleep(5 * SECOND)
    }
    await this.stopConsume()
    log.info(PRE, 'startConsume() Creating Consumer ...')
    await this.startConsumer()
  }

  public async stopConsume() {
    log.info(PRE, 'stopConsume() Stopping Consumer ...')
    this.puppetChannel?.killConsume('puppetConsumer')
  }

  private async startConsumer() {
    log.info(PRE, 'startConsumer()')
    this.puppetChannel?.consume(
      getTokenQueueName(this.token!),
      (msg) => void MqManager.consumption(msg, this.puppetChannel),
      {
        consumerTag: 'puppetConsumer',
      },
    )
  }

  public async sendToServer(message: MqSendMessage) {
    if (!message.traceId) {
      message.traceId = v4()
    }
    log.verbose(PRE, `sendToServer(${JSON.stringify(message)})`)
    this.puppetChannel?.sendMessageToExchange(
      getServerExchangeName(this.exchangeBaseName!),
      'command',
      Buffer.from(JSON.stringify(message)),
      {
        timestamp: Date.now(),
        appId: this.token,
        expiration: 10 * MINUTE,
      },
    )
    return new Promise<any>((resolve, reject) => {
      const waiter: MqCommandResponseWaiter = {
        resolver: resolve,
        rejector: reject,
        traceId: message.traceId!,
        timer: setTimeout(() => {
          reject(
            new Error(`async ${message.commandType} request timeout, traceId: ${message.traceId}`),
          )
        }, 1 * MINUTE),
      }
      MqManager.MqCommandResponsePool.set(message.traceId!, waiter)
    })
      .then((data) => {
        log.verbose(PRE, `handleResponse(${JSON.stringify(data)})`)
        return data
      })
      .finally(() => {
        const waiterInPool = MqManager.MqCommandResponsePool.get(
          message.traceId!,
        )
        if (waiterInPool) {
          clearTimeout(waiterInPool.timer)
          MqManager.MqCommandResponsePool.delete(message.traceId!)
        }
      })
  }

  public async sendMqCommand<T extends MqCommandType>(command: MqRequest<T>): Promise<MqResponse<T>> {
    const message: MqSendMessage = {
      commandType: command.commandType,
      traceId: command.traceId,
      data: JSON.stringify(command.data),
    }
    const response = await this.sendToServer(message) as MqResponse<T>
    return response
  }

  private handleEvent(eventType: types.PuppetEventName, data: string) {
    log.verbose(PRE, `handleEvent(${eventType}, ${data})`)
    switch (eventType) {
      case 'dong':
        this.emit('dong', JSON.parse(data))
        break
      case 'login':
        log.info(PRE, `receive login event: ${data}`)
        this.emit('login', JSON.parse(data))
        break
      case 'post-comment':
        this.emit('post-comment', JSON.parse(data))
        break
      case 'login-url':
        this.emit('login-url', JSON.parse(data))
        break
      case 'dirty':
        this.emit('dirty', JSON.parse(data))
        break
      case 'logout':
        log.info(PRE, `receive logout event: ${data}`)
        this.emit('logout', JSON.parse(data))
        break
      case 'ready':
        this.emit('ready', JSON.parse(data))
        break
      case 'message':
        this.emit('message', JSON.parse(data))
        break
      case 'friendship':
        this.emit('friendship', JSON.parse(data))
        break
      case 'room-invite':
        this.emit('room-invite', JSON.parse(data))
        break
      case 'room-join':
        this.emit('room-join', JSON.parse(data))
        break
      case 'room-leave':
        this.emit('room-leave', JSON.parse(data))
        break
      case 'room-topic':
        this.emit('room-topic', JSON.parse(data))
        break
      case 'room-announce':
        this.emit('room-announce', JSON.parse(data))
        break
      case 'verify-code':
        this.emit('verify-code', JSON.parse(data))
        break
      case 'intent-comment':
        this.emit('intent-comment', JSON.parse(data))
        break
      case 'contact-enter-conversation':
        this.emit('contact-enter-conversation', JSON.parse(data))
        break
      case 'contact-lead-filled':
        this.emit('contact-lead-filled', JSON.parse(data))
        break
      default:
        log.warn(PRE, `handleEvent(${eventType}, ${data}) Not Support`)
    }
  }

  private async prepareQueue(channel: AmqpChannelService) {
    if (!channel) {
      log.warn(PRE, `prepare() need channel`)
      return
    }
    await channel.initMetaConfigure({
      queueList: [
        {
          name: getTokenQueueName(this.token!),
          options: {
            arguments: Object({
              'x-queue-type': 'quorum',
            }),
          },
        },
      ],
      exchangeList: [
        {
          name: getServerExchangeName(this.exchangeBaseName!),
          type: 'direct',
          options: {
            arguments: Object({
              'x-queue-type': 'quorum',
            }),
          },
        },
        {
          name: getClientExchangeName(this.exchangeBaseName!),
          type: 'direct',
          options: {
            arguments: Object({
              'x-queue-type': 'quorum',
            }),
          },
        },
      ],
      bindList: [
        {
          type: 'qte',
          fromSourceName: getTokenQueueName(this.token!),
          targetSourceName: getClientExchangeName(this.exchangeBaseName!),
          key: this.token!,
        },
      ],
    })
  }
}
