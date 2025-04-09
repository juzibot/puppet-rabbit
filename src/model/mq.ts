import { types } from "@juzi/wechaty-puppet"
import * as PuppetDTO from "./puppet"

export interface MqSendMessage {
  traceId?: string
  commandType: MqCommandType
  data: string
}

export interface MqReceiveMessage {
  traceId: string
  type: MqMessageType
  eventType?: types.PuppetEventName,
  data: string
  code?: number
  error?: string
}

export enum MqMessageType {
  command = 'command',
  event = 'event',
}

export enum MqCommandType {
  start = 'start',
  ding = 'ding',

  contactPayload = 'contactPayload',
  contactList = 'contactList',

  roomAdd = 'roomAdd',
  roomAvatar = 'roomAvatar',
  roomCreate = 'roomCreate',
  roomDel = 'roomDel',
  roomList = 'roomList',
  roomQRCode = 'roomQRCode',
  roomParseDynamicQRCode = 'roomParseDynamicQRCode',
  roomQuit = 'roomQuit',
  roomTopic = 'roomTopic',
  roomRemark = 'roomRemark',
  roomOwnerTransfer = 'roomOwnerTransfer',
  roomDismiss = 'roomDismiss',
  roomPermission = 'roomPermission',
  roomAddAdmins = 'roomAddAdmins',
  roomDelAdmins = 'roomDelAdmins',
  roomPayload = 'roomPayload',
  roomAnnounce = 'roomAnnounce',

  roomMemberList = 'roomMemberList',
  roomMemberPayload = 'roomMemberPayload',
  batchRoomMemberPayload = 'batchRoomMemberRawPayload',

  roomInvitationAccept = 'roomInvitationAccept',
  roomInvitationAcceptByQRCode = 'roomInvitationAcceptByQRCode',
  roomInvitationPayload = 'roomInvitationPayload',

  conversationReadMark = 'conversationReadMark',
  messagePayload = 'messagePayload',
  messageSendText = 'messageSendText',
  messageSendFile = 'messageSendFile',
  messageSendMiniProgram = 'messageSendMiniProgram',
  messageSendUrl = 'messageSendUrl',
  messageSendLocation = 'messageSendLocation',

  messageRecall = 'messageRecall',

  messageImage = 'messageImage',
  messageFile = 'messageFile',
  messageUrl = 'messageUrl',
  messageLocation = 'messageLocation',
  messageContact = 'messageContact',
  messageMiniProgram = 'messageMiniProgram',

  friendshipPayload = 'friendshipPayload',

  postSearch = 'postSearch',
  postPayload = 'postPayload',
  postPayloadSayable = 'postPayloadSayable',
  postPublish = 'postPublish',
  dirtyPayload = 'dirtyPayload',
  postUnpublish = 'postUnpublish',
  tap = 'tap',
  logout = 'logout',
}

export interface MqCommandResponseWaiter {
  resolver: (data: any) => void
  rejector: (e: Error) => void
  traceId: string
  timer: NodeJS.Timeout
}

export type MqRequest<T extends MqCommandType> = {
  traceId?: string,
  commandType: T,
  data: T extends keyof PuppetRequestTypeMap ? PuppetRequestTypeMap[T] : never
}

export type MqResponse<T extends MqCommandType> = T extends keyof PuppetResponseTypeMap ? PuppetResponseTypeMap[T] : never

export type PuppetRequestTypeMap = {
  [MqCommandType.start]: PuppetDTO.StartRequest
  [MqCommandType.logout]: PuppetDTO.LogoutRequest
  [MqCommandType.ding]: PuppetDTO.DingRequest
  [MqCommandType.dirtyPayload]: PuppetDTO.DirtyPayloadRequest

  [MqCommandType.contactList]: PuppetDTO.ContactListRequest
  [MqCommandType.contactPayload]: PuppetDTO.ContactPayloadRequest

  [MqCommandType.roomAdd]: PuppetDTO.RoomAddRequest
  [MqCommandType.roomAvatar]: PuppetDTO.RoomAvatarRequest
  [MqCommandType.roomCreate]: PuppetDTO.RoomCreateRequest
  [MqCommandType.roomDel]: PuppetDTO.RoomDelRequest
  [MqCommandType.roomList]: PuppetDTO.RoomListRequest
  [MqCommandType.roomQRCode]: PuppetDTO.RoomQRCodeRequest
  [MqCommandType.roomParseDynamicQRCode]: PuppetDTO.RoomParseDynamicQRCodeRequest
  [MqCommandType.roomQuit]: PuppetDTO.RoomQuitRequest
  [MqCommandType.roomTopic]: PuppetDTO.RoomTopicRequest
  [MqCommandType.roomRemark]: PuppetDTO.RoomRemarkRequest
  [MqCommandType.roomOwnerTransfer]: PuppetDTO.RoomOwnerTransferRequest
  [MqCommandType.roomDismiss]: PuppetDTO.RoomDismissRequest
  [MqCommandType.roomPermission]: PuppetDTO.RoomPermissionRequest
  [MqCommandType.roomAddAdmins]: PuppetDTO.RoomAddAdminsRequest
  [MqCommandType.roomDelAdmins]: PuppetDTO.RoomDelAdminsRequest
  [MqCommandType.roomPayload]: PuppetDTO.RoomPayloadRequest
  [MqCommandType.roomAnnounce]: PuppetDTO.RoomAnnounceRequest

  [MqCommandType.roomMemberList]: PuppetDTO.RoomMemberListRequest
  [MqCommandType.roomMemberPayload]: PuppetDTO.RoomMemberPayloadRequest
  [MqCommandType.batchRoomMemberPayload]: PuppetDTO.BatchRoomMemberPayloadRequest

  [MqCommandType.roomInvitationAccept]: PuppetDTO.RoomInvitationAcceptRequest
  [MqCommandType.roomInvitationAcceptByQRCode]: PuppetDTO.RoomInvitationAcceptByQRCodeRequest
  [MqCommandType.roomInvitationPayload]: PuppetDTO.RoomInvitationPayloadRequest

  [MqCommandType.conversationReadMark]: PuppetDTO.ConversationReadMarkRequest
  [MqCommandType.messagePayload]: PuppetDTO.MessagePayloadRequest
  [MqCommandType.messageSendText]: PuppetDTO.MessageSendTextRequest
  [MqCommandType.messageSendFile]: PuppetDTO.MessageSendFileRequest
  [MqCommandType.messageSendMiniProgram]: PuppetDTO.MessageSendMiniProgramRequest
  [MqCommandType.messageSendUrl]: PuppetDTO.MessageSendUrlRequest
  [MqCommandType.messageSendLocation]: PuppetDTO.MessageSendLocationRequest

  [MqCommandType.messageRecall]: PuppetDTO.MessageRecallRequest

  [MqCommandType.messageImage]: PuppetDTO.MessageImageRequest
  [MqCommandType.messageFile]: PuppetDTO.MessageFileRequest
  [MqCommandType.messageUrl]: PuppetDTO.MessageUrlRequest
  [MqCommandType.messageLocation]: PuppetDTO.MessageLocationRequest
  [MqCommandType.messageContact]: PuppetDTO.MessageContactRequest
  [MqCommandType.messageMiniProgram]: PuppetDTO.MessageMiniProgramRequest

  [MqCommandType.friendshipPayload]: PuppetDTO.FriendshipPayloadRequest

  [MqCommandType.postSearch]: PuppetDTO.PostSearchRequest
  [MqCommandType.postPayload]: PuppetDTO.PostPayloadRequest
  [MqCommandType.postPayloadSayable]: PuppetDTO.PostPayloadSayableRequest
  [MqCommandType.postPublish]: PuppetDTO.PostPublishRequest
  [MqCommandType.postUnpublish]: PuppetDTO.PostUnpublishRequest

  [MqCommandType.tap]: PuppetDTO.TapRequest
}

export type PuppetResponseTypeMap = {
  [MqCommandType.start]: PuppetDTO.StartResponse
  [MqCommandType.logout]: PuppetDTO.LogoutResponse
  [MqCommandType.ding]: PuppetDTO.DingResponse
  [MqCommandType.dirtyPayload]: PuppetDTO.DirtyPayloadResponse

  [MqCommandType.contactList]: PuppetDTO.ContactListResponse
  [MqCommandType.contactPayload]: PuppetDTO.ContactPayloadResponse

  [MqCommandType.roomAdd]: PuppetDTO.RoomAddResponse
  [MqCommandType.roomAvatar]: PuppetDTO.RoomAvatarResponse
  [MqCommandType.roomCreate]: PuppetDTO.RoomCreateResponse
  [MqCommandType.roomDel]: PuppetDTO.RoomDelResponse
  [MqCommandType.roomList]: PuppetDTO.RoomListResponse
  [MqCommandType.roomQRCode]: PuppetDTO.RoomQRCodeResponse
  [MqCommandType.roomParseDynamicQRCode]: PuppetDTO.RoomParseDynamicQRCodeResponse
  [MqCommandType.roomQuit]: PuppetDTO.RoomQuitResponse
  [MqCommandType.roomTopic]: PuppetDTO.RoomTopicResponse
  [MqCommandType.roomRemark]: PuppetDTO.RoomRemarkResponse
  [MqCommandType.roomOwnerTransfer]: PuppetDTO.RoomOwnerTransferResponse
  [MqCommandType.roomDismiss]: PuppetDTO.RoomDismissResponse
  [MqCommandType.roomPermission]: PuppetDTO.RoomPermissionResponse
  [MqCommandType.roomAddAdmins]: PuppetDTO.RoomAddAdminsResponse
  [MqCommandType.roomDelAdmins]: PuppetDTO.RoomDelAdminsResponse
  [MqCommandType.roomPayload]: PuppetDTO.RoomPayloadResponse
  [MqCommandType.roomAnnounce]: PuppetDTO.RoomAnnounceResponse

  [MqCommandType.roomMemberList]: PuppetDTO.RoomMemberListResponse
  [MqCommandType.roomMemberPayload]: PuppetDTO.RoomMemberPayloadResponse
  [MqCommandType.batchRoomMemberPayload]: PuppetDTO.BatchRoomMemberPayloadResponse

  [MqCommandType.roomInvitationAccept]: PuppetDTO.RoomInvitationAcceptResponse
  [MqCommandType.roomInvitationAcceptByQRCode]: PuppetDTO.RoomInvitationAcceptByQRCodeResponse
  [MqCommandType.roomInvitationPayload]: PuppetDTO.RoomInvitationPayloadResponse

  [MqCommandType.conversationReadMark]: PuppetDTO.ConversationReadMarkResponse
  [MqCommandType.messagePayload]: PuppetDTO.MessagePayloadResponse
  [MqCommandType.messageSendText]: PuppetDTO.MessageSendTextResponse
  [MqCommandType.messageSendFile]: PuppetDTO.MessageSendFileResponse
  [MqCommandType.messageSendMiniProgram]: PuppetDTO.MessageSendMiniProgramResponse
  [MqCommandType.messageSendUrl]: PuppetDTO.MessageSendUrlResponse
  [MqCommandType.messageSendLocation]: PuppetDTO.MessageSendLocationResponse

  [MqCommandType.messageRecall]: PuppetDTO.MessageRecallResponse

  [MqCommandType.messageImage]: PuppetDTO.MessageImageResponse
  [MqCommandType.messageFile]: PuppetDTO.MessageFileResponse
  [MqCommandType.messageUrl]: PuppetDTO.MessageUrlResponse
  [MqCommandType.messageLocation]: PuppetDTO.MessageLocationResponse
  [MqCommandType.messageContact]: PuppetDTO.MessageContactResponse
  [MqCommandType.messageMiniProgram]: PuppetDTO.MessageMiniProgramResponse

  [MqCommandType.friendshipPayload]: PuppetDTO.FriendshipPayloadResponse

  [MqCommandType.postSearch]: PuppetDTO.PostSearchResponse
  [MqCommandType.postPayload]: PuppetDTO.PostPayloadResponse
  [MqCommandType.postPayloadSayable]: PuppetDTO.PostPayloadSayableResponse
  [MqCommandType.postPublish]: PuppetDTO.PostPublishResponse
  [MqCommandType.postUnpublish]: PuppetDTO.PostUnpublishResponse

  [MqCommandType.tap]: PuppetDTO.TapResponse
}
