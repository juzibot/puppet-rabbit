import * as PUPPET from '@juzi/wechaty-puppet'
import { MqManager } from './mq/mq-manager.js'
import { log } from '@juzi/wechaty-puppet'
import { MqCommandType } from './model/mq.js'

export type PuppetRabbitOptions = PUPPET.PuppetOptions & {
  mqUri?: string
  token?: string
}

const PRE = 'PuppetRabbit'

class PuppetRabbit extends PUPPET.Puppet {
  private readonly mqManager = MqManager.Instance

  constructor(public override options: PuppetRabbitOptions = {}) {
    super(options)
    if (!options.mqUri || !options.token) {
      throw new Error(`PuppetRabbit need mqUri and token`)
    }
  }

  override name() {
    return 'wechaty-puppet-rabbit'
  }

  override version() {
    return '0.0.0'
  }

  override async onStart(): Promise<void> {
    log.verbose(PRE, 'onStart()')
    await this.mqManager.init(this.options.token, this.options.mqUri)

    this.initEvents()

    await this.mqManager.sendToServer({
      commandType: MqCommandType.start,
      data: '{}',
    })
  }

  override async onStop(): Promise<void> {
    log.verbose(PRE, 'onStop()')
  }

  override async contactRawPayload(
    id: string,
  ): Promise<PUPPET.payloads.Contact> {
    // TODO: add local cache

    const data = await this.mqManager.sendToServer({
      commandType: MqCommandType.contactPayload,
      data: JSON.stringify({
        id,
      }),
    })
    return data as PUPPET.payloads.Contact
  }

  override async contactRawPayloadParser(
    payload: PUPPET.payloads.Contact,
  ): Promise<PUPPET.payloads.Contact> {
    return payload
  }

  override async postSearch(
    filter: PUPPET.filters.Post,
    pagination: PUPPET.filters.PaginationRequest,
  ): Promise<PUPPET.filters.PaginationResponse<string[]>> {
    const data = await this.mqManager.sendToServer({
      commandType: MqCommandType.postSearch,
      data: JSON.stringify({
        filter,
        pagination,
      }),
    })
    return data as PUPPET.filters.PaginationResponse<string[]>
  }

  override async postRawPayload(id: string): Promise<PUPPET.payloads.Post> {
    const data = await this.mqManager.sendToServer({
      commandType: MqCommandType.postPayload,
      data: JSON.stringify({
        id,
      }),
    })
    return data as PUPPET.payloads.Post
  }

  override async postRawPayloadParser(
    payload: PUPPET.payloads.Post,
  ): Promise<PUPPET.payloads.Post> {
    return payload
  }

  override async postPayloadSayable(
    postId: string,
    sayableId: string,
  ): Promise<PUPPET.payloads.Sayable> {
    const data = await this.mqManager.sendToServer({
      commandType: MqCommandType.postPayloadSayable,
      data: JSON.stringify({
        postId,
        sayableId,
      }),
    })
    return data as PUPPET.payloads.Sayable
  }

  override async postPublish(payload: PUPPET.payloads.PostClient) {
    const data = await this.mqManager.sendToServer({
      commandType: MqCommandType.postPublish,
      data: JSON.stringify(payload),
    })
    return data.postId as string
  }

  initEvents() {
    this.mqManager
      .on('dong', (data: PUPPET.payloads.EventDong) => {
        this.emit('dong', data)
      })
      .on('login', (data: PUPPET.payloads.EventLogin) => {
        this.emit('login', data)
      })
  }

  removeEvents() {
    this.mqManager.removeAllListeners()
  }
}

export { PuppetRabbit }

export default PuppetRabbit
