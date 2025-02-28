import * as PUPPET from '@juzi/wechaty-puppet'
import { MqManager } from './mq/mq-manager.js'
import { log } from '@juzi/wechaty-puppet'
import { MqCommandType } from './model/mq.js'
import { FileBox, FileBoxInterface } from 'file-box'
import { ContactListResponse } from './dto.js'
import { stringifyFileBox } from './util/file.js'

export type PuppetRabbitOptions = PUPPET.PuppetOptions & {
  mqUri: string
  exchangeBaseName: string
  token: string
}

const PRE = 'PuppetRabbit'

class PuppetRabbit extends PUPPET.Puppet {
  private readonly mqManager = MqManager.Instance

  private heartbeatTimer: NodeJS.Timer | undefined

  constructor(public override options: PuppetRabbitOptions) {
    super(options)
    if (!options.mqUri || !options.token) {
      throw new Error(`PuppetRabbit need mqUri and token`)
    }
    this.initEvents()
  }

  override name() {
    return 'wechaty-puppet-rabbit'
  }

  override version() {
    return '0.0.0'
  }

  override async onStart(): Promise<void> {
    log.verbose(PRE, 'onStart()')
    await this.mqManager.init({
      token: this.options.token,
      mqUri: this.options.mqUri,
      exchangeBaseName: this.options.exchangeBaseName,
    })

    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.start,
      data: {},
    })

    this.startHeartbeat()
  }

  override async onStop(): Promise<void> {
    log.verbose(PRE, 'onStop()')
    this.stopHeartbeat()
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(async () => {
      void this.ding('heartbeat')
    }, 30 * 1000)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  // base

  override async ding(msg: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.ding,
      data: {
        data: msg,
      }
    })
  }

  override async dirtyPayload(type: PUPPET.types.Dirty, id: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.dirtyPayload,
      data: {
        type,
        id,
      },
    })
  }

  // contact

  override async contactList() {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.contactList,
      data: {},
    }) as ContactListResponse
    return data.contactIds
  }

  override async contactRawPayload(
    id: string,
  ): Promise<PUPPET.payloads.Contact> {
    // TODO: add local cache

    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.contactPayload,
      data: {
        contactId: id,
      },
    })
    return data.payload
  }

  override async contactRawPayloadParser(
    payload: PUPPET.payloads.Contact,
  ): Promise<PUPPET.payloads.Contact> {
    return payload
  }

  override async contactAvatar(contactId: string, fileBox?: FileBoxInterface) {
    if (fileBox) {
      throw new Error('not supported')
    }
    const contactPayload = await this.contactPayload(contactId)
    return FileBox.fromUrl(contactPayload.avatar) as any
  }

  // message

  override async conversationReadMark(conversationId: string, hasRead?: boolean) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.conversationReadMark,
      data: {
        conversationId,
        hasRead,
      },
    })
    return response.hasRead
  }

  // message send

  override async messageSendText(conversationId: string, text: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendText,
      data: {
        conversationId,
        text,
      },
    })
    return response.messageId
  }

  override async messageSendFile(conversationId: string, file: FileBoxInterface) {
    const fileboxStr = stringifyFileBox(file)
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendFile,
      data: {
        conversationId,
        fileFilebox: fileboxStr,
      },
    })
    return response.messageId
  }

  override async messageSendMiniProgram(conversationId: string, miniProgram: PUPPET.payloads.MiniProgram) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendMiniProgram,
      data: {
        conversationId,
        miniProgram,
      },
    })
    return response.messageId
  }

  override async messageSendUrl(conversationId: string, url: PUPPET.payloads.UrlLink) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendUrl,
      data: {
        conversationId,
        url,
      },
    })
    return response.messageId
  }

  override async messageSendLocation(conversationId: string, location: PUPPET.payloads.Location) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendLocation,
      data: {
        conversationId,
        location,
      },
    })
    return response.messageId
  }

  override async messageRecall(messageId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageRecall,
      data: {
        messageId,
      },
    })
    return response.result
  }
  
  // message payload


  override async messageRawPayload(
    id: string,
  ): Promise<PUPPET.payloads.Message> {
    // TODO: add local cache

    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messagePayload,
      data: {
        messageId: id,
      },
    })
    return data.payload
  }

  override async messageRawPayloadParser(
    payload: PUPPET.payloads.Message,
  ): Promise<PUPPET.payloads.Message> {
    return payload
  }
  

  override async messageImage(messageId: string, imageType: PUPPET.types.Image) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageImage,
      data: {
        messageId,
        imageType,
      },
    })
    return FileBox.fromJSON(response.imageFilebox)
  }

  override async messageFile(messageId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageFile,
      data: {
        messageId,
      },
    })
    return FileBox.fromJSON(response.fileFilebox)
  }

  override async messageUrl(messageId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageUrl,
      data: {
        messageId,
      },
    })
    return response.urlLink
  }

  override async messageLocation(messageId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageLocation,
      data: {
        messageId,
      },
    })
    return response.location
  }

  override async messageContact(messageId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageContact,
      data: {
        messageId,
      },
    })
    return response.contactId
  }

  override async messageMiniProgram(messageId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageMiniProgram,
      data: {
        messageId,
      },
    })
    return response.miniProgram
  }

  // friendship

  override async friendshipRawPayload(friendshipId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.friendshipPayload,
      data: {
        friendshipId,
      },
    })
    return response.payload
  }

  override async friendshipRawPayloadParser(
    payload: PUPPET.payloads.Friendship,
  ): Promise<PUPPET.payloads.Friendship> {
    return payload
  }

  // room
  
  override async roomList() {
    return []
  }

  // post

  override async postSearch(
    filter: PUPPET.filters.Post,
    pagination: PUPPET.filters.PaginationRequest,
  ): Promise<PUPPET.filters.PaginationResponse<string[]>> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.postSearch,
      data: {
        filter,
        pagination,
      },
    })
    return data
  }

  override async postRawPayload(id: string): Promise<PUPPET.payloads.Post> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.postPayload,
      data: {
        postId: id,
      },
    })
    return data.payload
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
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.postPayloadSayable,
      data: {
        postId,
        sayableId,
      },
    })
    return data.sayable
  }

  override async postPublish(payload: PUPPET.payloads.PostClient) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.postPublish,
      data: {
        post: payload,
      },
    })
    return data.postId
  }

  override async postUnpublish(id: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.postUnpublish,
      data: {
        postId: id,
      },
    })
  }

  override async tap(postId: string, type: PUPPET.types.Tap = PUPPET.types.Tap.Like, tap = true) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.tap,
      data: {
        postId,
        type,
        tap,
      },
    })
    return tap
  }

  override async logout(reason?: string, event = false) {
    await super.logout(reason)

    if (event) {
      return
    }

    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.logout,
      data: {
        reason,
      },
    })
  }

  initEvents() {
    this.mqManager
      .on('dong', (data: PUPPET.payloads.EventDong) => {
        this.emit('dong', data)
      })
      .on('login', (data: PUPPET.payloads.EventLogin) => {
        this.__currentUserId = data.contactId
        this.emit('login', data)
      })
      .on('post-comment', (data: PUPPET.payloads.EventPostComment) => {
        this.emit('post-comment', data)
      })
      .on('login-url', (data: PUPPET.payloads.EventLoginUrl) => {
        this.__currentUserId = undefined
        this.emit('login-url', data)
      })
      .on('dirty', (data: PUPPET.payloads.EventDirty) => {
        this.emit('dirty', data)
      })
      .on('logout', (data: PUPPET.payloads.EventLogout) => {
        this.logout(data.data, true).catch(e =>
          log.error('PuppetService', 'onGrpcStreamEvent() this.logout() rejection %s',
            (e as Error).message,
          )
        )
      })
      .on('ready', (data: PUPPET.payloads.EventReady) => {
        this.emit('ready', data)
      })
      .on('message', (data: PUPPET.payloads.EventMessage) => {
        this.emit('message', data)
      })
      .on('friendship', (data: PUPPET.payloads.EventFriendship) => {
        this.emit('friendship', data)
      })
  }

  removeEvents() {
    this.mqManager.removeAllListeners()
  }
}

export { PuppetRabbit }

export default PuppetRabbit
