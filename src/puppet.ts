import * as PUPPET from '@juzi/wechaty-puppet'
import { MqManager } from './mq/mq-manager.js'
import { log } from '@juzi/wechaty-puppet'
import { MqCommandType } from './model/mq.js'
import { FileBox, FileBoxInterface, FileBoxType } from 'file-box'
import { ContactListResponse } from './dto.js'
import { stringifyFileBox } from './util/file.js'
import { PremiumOnlineAppointmentCardListRequest, PremiumOnlineAppointmentCardListResponse, PremiumOnlineAppointmentCardSendPayload } from '@juzi/wechaty-puppet/dist/esm/src/schemas/mod.js'

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

  override async messageSendText(conversationId: string, text: string, option?: PUPPET.types.MessageSendTextOptions) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendText,
      data: {
        conversationId,
        text,
        option,
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

  override async messageSendChannel(conversationId: string, channel: PUPPET.payloads.Channel) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendChannel,
      data: {
        conversationId,
        channel,
      },
    })
    return response.messageId
  }

  override async messageSendContact(conversationId: string, contactId: string) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendContact,
      data: {
        conversationId,
        contactId,
      },
    })
    return response.messageId
  }


  override async messageSendConsultCard(conversationId: string, consultCard: PUPPET.payloads.ConsultCard) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendConsultCard,
      data: {
        conversationId,
        consultCard,
      },
    })
    return response.messageId
  }


  override async listConsultCards(query: any): Promise<any> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.listConsultCards,
      data: query,
    })
    return data
  }

  override async messageConsultCard(messageId: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageConsultCard,
      data: {
        messageId,
      },
    })
    return data.consultCard as any
  }

  override async messageSendPremiumOnlineAppointmentCard(conversationId: string, premiumOnlineAppointmentCardSendPayload: PremiumOnlineAppointmentCardSendPayload) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendPremiumOnlineAppointmentCard,
      data: {
        conversationId,
        cardType: premiumOnlineAppointmentCardSendPayload.cardType,
        componentId: premiumOnlineAppointmentCardSendPayload.componentId,
      },
    })
    return response.messageId
  }

  override async listPremiumOnlineAppointmentCards(query: PremiumOnlineAppointmentCardListRequest): Promise<PremiumOnlineAppointmentCardListResponse> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.listPremiumOnlineAppointmentCards,
      data: query,
    })
    return data
  }

  override async messagePremiumOnlineAppointmentCard(messageId: string): Promise<PUPPET.payloads.PremiumOnlineAppointmentCard> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messagePremiumOnlineAppointmentCard,
      data: {
        messageId,
      },
    })
    return data.premiumOnlineAppointmentCard
  }

  override async messageSendDouyinOneClickPhoneCollection(conversationId: string, douyinOneClickPhoneCollection: {}) {
    const response = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.messageSendDouyinOneClickPhoneCollection,
      data: {
        conversationId,
        douyinOneClickPhoneCollection,
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

  override async roomAdd (roomId: string, contactId: string | string[], inviteOnly?: boolean, quoteIds?: string[]) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomAdd,
      data: {
        roomId,
        contactId,
        inviteOnly,
        quoteIds,
      }
    })
  }

  override async roomAvatar(roomId: string, fileBox?: FileBoxInterface) {
    if (fileBox?.type !== FileBoxType.Url) {
      throw new Error('not supported')
    }
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomAvatar,
      data: {
        roomId,
        avatarFilebox: JSON.stringify(fileBox.toJSON()),
      }
    })
    if (data.avatarFilebox) {
      return FileBox.fromJSON(data.avatarFilebox)
    }
    return
  }

  override async roomCreate(contactIds: string[], topic?: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomCreate,
      data: {
        contactIds,
        topic,
      }
    })
    return data.roomId
  }

  override async roomDel(roomId: string, contactIds: string | string[]) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomDel,
      data: {
        roomId,
        contactIds: Array.isArray(contactIds) ? contactIds : [contactIds],
      }
    })
  }

  override async roomList() {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomList,
      data: {},
    })
    return data.roomIds
  }

  override async roomQRCode(roomId: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomQRCode,
      data: {
        roomId,
      }
    })
    return data.qrCode
  }

  override async roomParseDynamicQRCode(url: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomParseDynamicQRCode,
      data: {
        url,
      }
    })
    return data.dynamicQRCodeResult
  }

  override async roomQuit(roomId: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomQuit,
      data: {
        roomId,
      }
    })
  }

  override async roomTopic(roomId: string): Promise<string>
  override async roomTopic(roomId: string, topic: string): Promise<void>
  override async roomTopic(roomId: string, topic?: string): Promise<string | void> {
    if (!topic) {
      const payload = await this.roomPayload(roomId)
      return payload.topic || ''
    }
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomTopic,
      data: {
        roomId,
        topic,
      }
    })
  }

  override async roomRemark(roomId: string, remark: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomRemark,
      data: {
        roomId,
        remark,
      }
    })
  }

  override async roomOwnerTransfer(roomId: string, contactId: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomOwnerTransfer,
      data: {
        roomId,
        contactId,
      }
    })
  }

  override async roomDismiss(roomId: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomDismiss,
      data: {
        roomId,
      }
    })
  }

  override async roomPermission(roomId: string, permissions?: PUPPET.types.RoomPermission) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomPermission,
      data: {
        roomId,
        permissions,
      }
    })
    return data.permissions
  }

  override async roomAddAdmins(roomId: string, contactIds: string[]) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomAddAdmins,
      data: {
        roomId,
        contactIds,
      }
    })
  }

  override async roomDelAdmins(roomId: string, contactIds: string[]) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomDelAdmins,
      data: {
        roomId,
        contactIds,
      }
    })
  }

  override async roomRawPayload(
    id: string,
  ): Promise<PUPPET.payloads.Room> {
    // TODO: add local cache

    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomPayload,
      data: {
        roomId: id,
      },
    })
    return data.payload
  }

  override async roomRawPayloadParser(
    payload: PUPPET.payloads.Room,
  ): Promise<PUPPET.payloads.Room> {
    return payload
  }

  override async roomAnnounce(roomId: string): Promise<string>
  override async roomAnnounce(roomId: string, text: string): Promise<void>
  override async roomAnnounce(roomId: string, announcement?: string): Promise<string | void> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomAnnounce,
      data: {
        roomId,
        announcement,
      }
    })
    return data.announcement || ''
  }
  
  // room member

  override async roomMemberList(roomId: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomMemberList,
      data: {
        roomId,
      }
    })
    return data.contactIds
  }

  override async roomMemberRawPayload(roomId: string, contactId: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomMemberPayload,
      data: {
        roomId,
        contactId,
      }
    })
    return data.payload
  }

  override async roomMemberRawPayloadParser(
    payload: PUPPET.payloads.RoomMember,
  ): Promise<PUPPET.payloads.RoomMember> {
    return payload
  }

  override async batchRoomMemberRawPayload(roomId: string, contactIds: string[]) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.batchRoomMemberPayload,
      data: {
        roomId,
        contactIds,
      }
    })
    return new Map(Object.entries(data))
  }

  // room invitation

  override async roomInvitationAccept(roomInvitationId: string) {
    await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomInvitationAccept,
      data: {
        roomInvitationId,
      }
    })
  }

  override async roomInvitationAcceptByQRCode(qrCode: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomInvitationAcceptByQRCode,
      data: {
        qrCode,
      }
    })
    const roomPayload = await this.roomPayload(data.roomId)
    return {
      roomId: data.roomId,
      chatId: roomPayload.handle || '',
    }
  }

  override async roomInvitationRawPayload(roomInvitationId: string) {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.roomInvitationPayload,
      data: {
        roomInvitationId,
      }
    })
    return data.payload
  }

  override async roomInvitationRawPayloadParser(
    payload: PUPPET.payloads.RoomInvitation,
  ): Promise<PUPPET.payloads.RoomInvitation> {
    return payload
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

  override async listIntentComments(query: PUPPET.filters.PaginationRequest): Promise<PUPPET.filters.PaginationResponse<PUPPET.payloads.IntentComment[]>> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.listIntentComments,
      data: query
    })
    return data
  }

  override async intentCommentPayload(id: string): Promise<PUPPET.payloads.IntentComment> {
    const data = await this.mqManager.sendMqCommand({
      commandType: MqCommandType.intentCommentPayload,
      data: {
        intentCommentId: id,
      }
    })
    return data.payload
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
      .on('room-invite', (data: PUPPET.payloads.EventRoomInvite) => {
        this.emit('room-invite', data)
      })
      .on('room-join', (data: PUPPET.payloads.EventRoomJoin) => {
        this.emit('room-join', data)
      })
      .on('room-leave', (data: PUPPET.payloads.EventRoomLeave) => {
        this.emit('room-leave', data)
      })
      .on('room-topic', (data: PUPPET.payloads.EventRoomTopic) => {
        this.emit('room-topic', data)
      })
      .on('room-announce', (data: PUPPET.payloads.EventRoomAnnounce) => {
        this.emit('room-announce', data)  
      })
      .on('verify-code', (data: PUPPET.payloads.EventVerifyCode) => {
        this.emit('verify-code', data)
      })
      .on('intent-comment', (data: PUPPET.payloads.EventIntentComment) => {
        this.emit('intent-comment', data)
      })
  }

  removeEvents() {
    this.mqManager.removeAllListeners()
  }
}

export { PuppetRabbit }

export default PuppetRabbit
