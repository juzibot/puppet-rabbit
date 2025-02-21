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

  [MqCommandType.contactList]: PuppetDTO.ContactListRequest
  [MqCommandType.contactPayload]: PuppetDTO.ContactPayloadRequest

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
}

export type PuppetResponseTypeMap = {
  [MqCommandType.start]: PuppetDTO.StartResponse

  [MqCommandType.contactList]: PuppetDTO.ContactListResponse
  [MqCommandType.contactPayload]: PuppetDTO.ContactPayloadResponse

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
}
