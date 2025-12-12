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
  contactPayloadModify = 'contactPayloadModify',

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
  messageSendChannel = 'messageSendChannel',
  messageSendContact = 'messageSendContact',
  messageSendConsultCard = 'messageSendConsultCard',
  messageSendDouyinOneClickPhoneCollection = 'messageSendDouyinOneClickPhoneCollection',
  messageSendPost = 'messageSendPost',

  listConsultCards = 'listConsultCards',
  messageConsultCard = 'messageConsultCard',
  messageSendPremiumOnlineAppointmentCard = 'messageSendPremiumOnlineAppointmentCard',
  listPremiumOnlineAppointmentCards = 'listPremiumOnlineAppointmentCards',
  messagePremiumOnlineAppointmentCard = 'messagePremiumOnlineAppointmentCard',

  messageRecall = 'messageRecall',

  messageImage = 'messageImage',
  messageFile = 'messageFile',
  messageUrl = 'messageUrl',
  messageLocation = 'messageLocation',
  messageContact = 'messageContact',
  messageMiniProgram = 'messageMiniProgram',
  messageChatHistory = 'messageChatHistory',

  friendshipPayload = 'friendshipPayload',

  postSearch = 'postSearch',
  postPayload = 'postPayload',
  postPayloadSayable = 'postPayloadSayable',
  postPublish = 'postPublish',
  dirtyPayload = 'dirtyPayload',
  postUnpublish = 'postUnpublish',
  tap = 'tap',
  logout = 'logout',

  listIntentComments = 'listIntentComments',
  intentCommentPayload = 'intentCommentPayload',
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
  [MqCommandType.contactPayloadModify]: PuppetDTO.ContactPayloadModifyRequest

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
  [MqCommandType.messageSendChannel]: PuppetDTO.MessageSendChannelRequest
  [MqCommandType.messageSendContact]: PuppetDTO.MessageSendContactRequest
  [MqCommandType.messageSendConsultCard]: PuppetDTO.MessageSendConsultCardRequest
  [MqCommandType.messageSendDouyinOneClickPhoneCollection]: PuppetDTO.MessageSendDouyinOneClickPhoneCollectionRequest
  [MqCommandType.messageSendPost]: PuppetDTO.MessageSendPostRequest

  [MqCommandType.listConsultCards]: PuppetDTO.ListConsultCardsRequest
  [MqCommandType.messageConsultCard]: PuppetDTO.MessageConsultCardRequest
  [MqCommandType.messageSendPremiumOnlineAppointmentCard]: PuppetDTO.MessageSendPremiumOnlineAppointmentCardRequest
  [MqCommandType.listPremiumOnlineAppointmentCards]: PuppetDTO.ListPremiumOnlineAppointmentCardsRequest
  [MqCommandType.messagePremiumOnlineAppointmentCard]: PuppetDTO.MessagePremiumOnlineAppointmentCardRequest

  [MqCommandType.messageRecall]: PuppetDTO.MessageRecallRequest

  [MqCommandType.messageImage]: PuppetDTO.MessageImageRequest
  [MqCommandType.messageFile]: PuppetDTO.MessageFileRequest
  [MqCommandType.messageUrl]: PuppetDTO.MessageUrlRequest
  [MqCommandType.messageLocation]: PuppetDTO.MessageLocationRequest
  [MqCommandType.messageContact]: PuppetDTO.MessageContactRequest
  [MqCommandType.messageMiniProgram]: PuppetDTO.MessageMiniProgramRequest
  [MqCommandType.messageChatHistory]: PuppetDTO.MessageChatHistoryRequest

  [MqCommandType.friendshipPayload]: PuppetDTO.FriendshipPayloadRequest

  [MqCommandType.postSearch]: PuppetDTO.PostSearchRequest
  [MqCommandType.postPayload]: PuppetDTO.PostPayloadRequest
  [MqCommandType.postPayloadSayable]: PuppetDTO.PostPayloadSayableRequest
  [MqCommandType.postPublish]: PuppetDTO.PostPublishRequest
  [MqCommandType.postUnpublish]: PuppetDTO.PostUnpublishRequest

  [MqCommandType.tap]: PuppetDTO.TapRequest

  [MqCommandType.listIntentComments]: PuppetDTO.ListIntentCommentsRequest
  [MqCommandType.intentCommentPayload]: PuppetDTO.IntentCommentPayloadRequest
}

export type PuppetResponseTypeMap = {
  [MqCommandType.start]: PuppetDTO.StartResponse
  [MqCommandType.logout]: PuppetDTO.LogoutResponse
  [MqCommandType.ding]: PuppetDTO.DingResponse
  [MqCommandType.dirtyPayload]: PuppetDTO.DirtyPayloadResponse

  [MqCommandType.contactList]: PuppetDTO.ContactListResponse
  [MqCommandType.contactPayload]: PuppetDTO.ContactPayloadResponse
  [MqCommandType.contactPayloadModify]: PuppetDTO.ContactPayloadModifyResponse

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
  [MqCommandType.messageSendChannel]: PuppetDTO.MessageSendChannelResponse
  [MqCommandType.messageSendContact]: PuppetDTO.MessageSendContactResponse
  [MqCommandType.messageSendConsultCard]: PuppetDTO.MessageSendConsultCardResponse
  [MqCommandType.messageSendDouyinOneClickPhoneCollection]: PuppetDTO.MessageSendDouyinOneClickPhoneCollectionResponse
  [MqCommandType.messageSendPost]: PuppetDTO.MessageSendPostResponse
  
  [MqCommandType.listConsultCards]: PuppetDTO.ListConsultCardsResponse
  [MqCommandType.messageConsultCard]: PuppetDTO.MessageConsultCardResponse
  [MqCommandType.messageSendPremiumOnlineAppointmentCard]: PuppetDTO.MessageSendPremiumOnlineAppointmentCardResponse
  [MqCommandType.listPremiumOnlineAppointmentCards]: PuppetDTO.ListPremiumOnlineAppointmentCardsResponse
  [MqCommandType.messagePremiumOnlineAppointmentCard]: PuppetDTO.MessagePremiumOnlineAppointmentCardResponse

  [MqCommandType.messageRecall]: PuppetDTO.MessageRecallResponse

  [MqCommandType.messageImage]: PuppetDTO.MessageImageResponse
  [MqCommandType.messageFile]: PuppetDTO.MessageFileResponse
  [MqCommandType.messageUrl]: PuppetDTO.MessageUrlResponse
  [MqCommandType.messageLocation]: PuppetDTO.MessageLocationResponse
  [MqCommandType.messageContact]: PuppetDTO.MessageContactResponse
  [MqCommandType.messageMiniProgram]: PuppetDTO.MessageMiniProgramResponse
  [MqCommandType.messageChatHistory]: PuppetDTO.MessageChatHistoryResponse
  
  [MqCommandType.friendshipPayload]: PuppetDTO.FriendshipPayloadResponse

  [MqCommandType.postSearch]: PuppetDTO.PostSearchResponse
  [MqCommandType.postPayload]: PuppetDTO.PostPayloadResponse
  [MqCommandType.postPayloadSayable]: PuppetDTO.PostPayloadSayableResponse
  [MqCommandType.postPublish]: PuppetDTO.PostPublishResponse
  [MqCommandType.postUnpublish]: PuppetDTO.PostUnpublishResponse

  [MqCommandType.tap]: PuppetDTO.TapResponse

  [MqCommandType.listIntentComments]: PuppetDTO.ListIntentCommentsResponse
  [MqCommandType.intentCommentPayload]: PuppetDTO.IntentCommentPayloadResponse
}
