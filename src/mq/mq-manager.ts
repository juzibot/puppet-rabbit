import { log, types } from '@juzi/wechaty-puppet'
import type { LoggerLike } from '@juzi/wechaty-puppet'
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

const DEFAULT_COMMAND_TIMEOUT = 1 * MINUTE
const INITIAL_RECONNECT_DELAY = 5 * SECOND
const CONSUMER_TAG = 'puppetConsumer'
// 发邮件带大附件时 SMTP 上传可达数分钟，对齐 bot-nested 发送队列的 6 分钟信封；
// MQ 消息自身 expiration 为 10 分钟，仍留有余量
const COMMAND_TIMEOUT_OVERRIDES: Partial<Record<MqCommandType, number>> = {
  [MqCommandType.messageSendEmail]: 6 * MINUTE,
}

enum LISTENER_TYPE {
  ERROR,
  CLOSE,
}

interface MqInitOptions {
  token: string
  mqUri: string
  exchangeBaseName: string
}

export class MqCommandTimeoutError extends Error {}

export class MqManager extends EventEmitter {
  private puppetConnection: AmqpConnectService | undefined
  private puppetChannel: AmqpChannelService | undefined
  private consumerChannel: AmqpChannelService | undefined
  private readonly failedConnections = new WeakSet<AmqpConnectService>()
  private readonly closedChannels = new WeakSet<AmqpChannelService>()

  private connected = false
  private destroyed = false
  private lifecycle = 0
  private restartingConnection = false
  private restartingChannel = false

  private token: string | undefined
  private exchangeBaseName: string | undefined
  private mqUri: string | undefined

  private readonly _log: LoggerLike

  private MqCommandResponsePool = new Map<
    string,
    MqCommandResponseWaiter
  >()

  constructor (logger?: LoggerLike) {
    super()
    this._log = logger ?? log
    this._log.verbose(PRE, 'constructor()')
  }

  private async consumption(
    msg: ConsumeMessage | null,
    channel: AmqpChannelService | undefined,
  ) {
    this._log.verbose(PRE, `consuming content: ${msg?.content.toString()}`)
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
          this._log.warn(PRE, `MqCommandResponsePool Not Found ${message.traceId}`)
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
        this.handleEvent(message.eventType!, message.data)
      }
    } catch (e) {
      this._log.error(PRE, `consumption() error: ${(e as Error).stack}`)
    }
    await channel?.ackMessage(msg!)
  }

  public async init(option: MqInitOptions): Promise<void> {
    this.destroyed = false
    await this.initialize(option, this.lifecycle)
  }

  private async initialize(option: MqInitOptions, lifecycle: number): Promise<void> {
    const { token, mqUri, exchangeBaseName } = option
    this._log.info(PRE, `init(${token})`)
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

    await this.initConnect(lifecycle)
    if (!this.isActive(lifecycle)) return
    await this.initChannel(lifecycle)
    if (!this.isActive(lifecycle)) return
    await this.startConsumer()
    if (this.isActive(lifecycle)) this.connected = true
  }

  public async destroy(): Promise<void> {
    this._log.info(PRE, `destroy(${this.token})`)
    this.destroyed = true
    this.lifecycle++
    this.restartingConnection = false
    this.restartingChannel = false
    await this.closeTransport()
  }

  private isActive(lifecycle: number): boolean {
    return !this.destroyed && this.lifecycle === lifecycle
  }

  private async closeTransport(): Promise<void> {
    const connection = this.puppetConnection
    const channel = this.puppetChannel
    this.puppetConnection = undefined
    this.puppetChannel = undefined
    this.connected = false
    try {
      if (channel) await this.closeChannel(channel, connection)
    } finally {
      await connection?.close()
    }
  }

  private async closeChannel(channel: AmqpChannelService, connection: AmqpConnectService | undefined): Promise<void> {
    if (this.consumerChannel === channel) this.consumerChannel = undefined
    // Remove the service first: Onirii may skip closing the connection if closing a dead channel rejects.
    await connection?.killChannel(channel.instanceName)
    try {
      await channel.close()
    } catch (error: unknown) {
      this._log.warn(PRE, `closeChannel() failed: ${error}`)
    }
  }

  private async initConnect(lifecycle: number): Promise<void> {
    this._log.info(PRE, 'initConnect()')
    const connection = this.puppetConnection!
    while (this.isActive(lifecycle) && this.puppetConnection === connection) {
      try {
        // Own retries so stopping the puppet also stops Onirii's default retry loop.
        await connection.ready(undefined, -1)
      } catch (error: unknown) {
        if (!this.isActive(lifecycle) || this.puppetConnection !== connection) return
        if (this.restartingConnection) throw error
        this._log.warn(PRE, `initConnect() failed: ${error}`)
        await sleep(INITIAL_RECONNECT_DELAY)
        continue
      }
      if (!this.isActive(lifecycle) || this.puppetConnection !== connection) {
        await connection.close()
        return
      }
      this.prepareConnectListener()
      this._log.info(PRE, 'initConnect() connected mq service...')
      return
    }
  }

  private async initChannel(lifecycle: number): Promise<void> {
    this._log.info(PRE, 'initChannel()')
    const connection = this.puppetConnection
    const channel = await this.createChannelService(10)
    if (!this.isActive(lifecycle) || this.puppetConnection !== connection) {
      await this.closeChannel(channel, connection)
      return
    }
    this.puppetChannel = channel
    this.prepareChannelListener()
    await this.prepareQueue(channel)
  }

  private prepareConnectListener(): void {
    const connection = this.puppetConnection
    const reconnect = (err: Error, type: LISTENER_TYPE): void => {
      if (this.destroyed || !connection || this.puppetConnection !== connection) return
      this.failedConnections.add(connection)
      void this.reconnectMainConnect(err, type)
    }
    connection?.addCloseListener(err => reconnect(err, LISTENER_TYPE.CLOSE))
    connection?.addErrorListener(err => reconnect(err, LISTENER_TYPE.ERROR))
  }

  private async createChannelService(prefetch: number): Promise<AmqpChannelService> {
    this._log.info(PRE, 'Creating Channel ...')
    const connection = this.puppetConnection
    const channel = await connection?.createChannelService(false)
    if (!channel) throw new Error('Cant Create Amqp Channel')
    try {
      await channel.setPrefetchCount(prefetch)
      return channel
    } catch (error: unknown) {
      await this.closeChannel(channel, connection)
      throw error
    }
  }

  private prepareChannelListener(): void {
    const channel = this.puppetChannel
    channel?.addCloseListener(() => {
      if (this.destroyed || this.puppetChannel !== channel) return
      this.closedChannels.add(channel)
      this._log.info(`puppetChannel on close listener`)
      void this.reconnectChannel()
    })
  }

  private async reconnectMainConnect(err: Error, type: LISTENER_TYPE): Promise<void> {
    if (this.destroyed) return
    this._log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]})`)
    if (this.restartingConnection) {
      this._log.error(
        PRE,
        `reconnectMainConnect(${LISTENER_TYPE[type]}) under processing...`,
      )
      return
    }

    this.restartingConnection = true
    this.restartingChannel = false
    const lifecycle = this.lifecycle
    const option = { token: this.token!, mqUri: this.mqUri!, exchangeBaseName: this.exchangeBaseName! }
    this._log.error(
      PRE,
      `reconnectMainConnect(${LISTENER_TYPE[type]}) MQ Service Connect Receive ${LISTENER_TYPE[type]} event: ${err}`,
    )

    let retryDelay = INITIAL_RECONNECT_DELAY
    try {
      while (this.isActive(lifecycle)) {
        try {
          await this.closeTransport()
          if (!this.isActive(lifecycle)) return
          await this.initialize(option, lifecycle)
          if (!this.isActive(lifecycle)) return
          await this.startConsume()
          if (!this.isActive(lifecycle)) return
          this.assertTransportReady()
          this._log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) Reconnected MQ Service Done.`)
          return
        } catch (error: unknown) {
          if (!this.isActive(lifecycle)) return
          this._log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) Reconnect MQ Service Failed: ${error}`)
          await sleep(retryDelay)
          retryDelay = Math.min(retryDelay * 2, MINUTE)
        }
      }
    } finally {
      if (this.isActive(lifecycle)) this.restartingConnection = false
    }
  }

  public async reconnectChannel(): Promise<void> {
    if (this.destroyed) return
    this._log.info(PRE, `reconnectChannel()`)
    if (this.restartingConnection) {
      this._log.error(PRE, `reconnectChannel() restart connect under processing...`)
      return
    }
    if (this.restartingChannel) {
      this._log.error(PRE, `reconnectChannel() restart channel under processing...`)
      return
    }

    this.restartingChannel = true
    const lifecycle = this.lifecycle
    const connection = this.puppetConnection
    try {
      while (this.isActive(lifecycle) && this.puppetConnection === connection) {
        await sleep(MINUTE)
        if (!this.isActive(lifecycle) || this.puppetConnection !== connection) return
        try {
          const channel = this.puppetChannel
          this.puppetChannel = undefined
          if (channel) await this.closeChannel(channel, connection)
          if (!this.isActive(lifecycle) || this.puppetConnection !== connection) return
          await this.initChannel(lifecycle)
          if (!this.isActive(lifecycle) || this.puppetConnection !== connection) return
          await this.startConsumer()
          if (!this.isActive(lifecycle) || this.puppetConnection !== connection) return
          this.assertTransportReady()
          this._log.info(PRE, 'reconnectChannel() Reconnected MQ Service Done.')
          return
        } catch (error: unknown) {
          if (!this.isActive(lifecycle) || this.puppetConnection !== connection) return
          this._log.error(PRE, `reconnectChannel() Reconnect MQ Service Failed: ${error}`)
        }
      }
    } finally {
      if (this.isActive(lifecycle) && this.puppetConnection === connection) this.restartingChannel = false
    }
  }

  public async startConsume(): Promise<void> {
    const lifecycle = this.lifecycle
    while (this.isActive(lifecycle) && !this.connected) {
      this._log.warn(PRE, 'startConsume() MQ Server Connect Not Ready Yet')
      await sleep(5 * SECOND)
    }
    if (!this.isActive(lifecycle)) return
    const channel = this.puppetChannel
    await this.stopConsume()
    if (!this.isActive(lifecycle) || this.puppetChannel !== channel) return
    this._log.info(PRE, 'startConsume() Creating Consumer ...')
    await this.startConsumer()
  }

  public async stopConsume(): Promise<void> {
    this._log.info(PRE, 'stopConsume() Stopping Consumer ...')
    const channel = this.consumerChannel
    if (!channel) return
    await channel.currentChannelInstance.cancel(CONSUMER_TAG)
    if (this.consumerChannel === channel) this.consumerChannel = undefined
  }

  private async startConsumer(): Promise<void> {
    this._log.info(PRE, 'startConsumer()')
    const channel = this.puppetChannel
    if (!channel || this.consumerChannel === channel) return
    // Onirii's consume wrapper returns before the broker acknowledges registration.
    await channel.currentChannelInstance.consume(
      getTokenQueueName(this.token!),
      msg => {
        if (msg) void this.consumption(msg, channel)
      },
      { consumerTag: CONSUMER_TAG },
    )
    if (this.puppetChannel === channel) this.consumerChannel = channel
  }

  private assertTransportReady(): void {
    const connection = this.puppetConnection
    const channel = this.puppetChannel
    if ((connection && this.failedConnections.has(connection)) || !channel || this.closedChannels.has(channel)) {
      throw new Error('MQ transport closed during recovery')
    }
  }

  public async sendToServer(message: MqSendMessage): Promise<unknown> {
    const channel = this.puppetChannel
    if (!channel) throw new Error('MQ channel is not available')
    const traceId = message.traceId || v4()
    const request = { ...message, traceId }
    this._log.verbose(PRE, `sendToServer(${JSON.stringify(request)})`)
    const response = new Promise<unknown>((resolve, reject) => {
      const waiter: MqCommandResponseWaiter = {
        resolver: resolve,
        rejector: reject,
        traceId,
        timer: setTimeout(() => {
          reject(
            new MqCommandTimeoutError(`async ${message.commandType} request timeout, traceId: ${traceId}`),
          )
        }, COMMAND_TIMEOUT_OVERRIDES[message.commandType] ?? DEFAULT_COMMAND_TIMEOUT),
      }
      this.MqCommandResponsePool.set(traceId, waiter)
    })
    try {
      const [data] = await Promise.all([response, this.publishCommand(channel, request)])
      this._log.verbose(PRE, `handleResponse(${JSON.stringify(data)})`)
      return data
    } finally {
      const waiter = this.MqCommandResponsePool.get(traceId)
      if (waiter) clearTimeout(waiter.timer)
      this.MqCommandResponsePool.delete(traceId)
    }
  }

  private async publishCommand(channel: AmqpChannelService, message: MqSendMessage): Promise<void> {
    await channel.sendMessageToExchange(
      getServerExchangeName(this.exchangeBaseName!),
      'command',
      Buffer.from(JSON.stringify(message)),
      {
        timestamp: Date.now(),
        appId: this.token,
        expiration: 10 * MINUTE,
      },
    )
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
    this._log.verbose(PRE, `handleEvent(${eventType}, ${data})`)
    switch (eventType) {
      case 'dong':
        this.emit('dong', JSON.parse(data))
        break
      case 'login':
        this._log.info(PRE, `receive login event: ${data}`)
        this.emit('login', JSON.parse(data))
        break
      case 'scan':
        this.emit('scan', JSON.parse(data))
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
        this._log.info(PRE, `receive logout event: ${data}`)
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
      case 'wxxd-shop':
        this.emit('wxxd-shop', {})
        break
      case 'wxxd-product':
        this.emit('wxxd-product', JSON.parse(data))
        break
      case 'wxxd-order':
        this.emit('wxxd-order', JSON.parse(data))
        break
      default:
        this._log.warn(PRE, `handleEvent(${eventType}, ${data}) Not Support`)
    }
  }

  private async prepareQueue(channel: AmqpChannelService) {
    if (!channel) {
      this._log.warn(PRE, `prepare() need channel`)
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
