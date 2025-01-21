import * as PuppetDTO from "./puppet"

export interface MqSendMessage {
  traceId?: string
  commandType: MqCommandType
  data: string
}

export interface MqReceiveMessage {
  traceId: string
  type: MqMessageType
  eventType?: MqEventType
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

  messageImage = 'messageImage',
  messageFile = 'messageFile',
  messageUrl = 'messageUrl',
  messageLocation = 'messageLocation',
  messageContact = 'messageContact',
  messageMiniProgram = 'messageMiniProgram',
  
  postSearch = 'postSearch',
  postPayload = 'postPayload',
  postPayloadSayable = 'postPayloadSayable',
  postPublish = 'postPublish',
  dirtyPayload = 'dirtyPayload',
  postUnpublish = 'postUnpublish',
  tap = 'tap',
  logout = 'logout',
}

export enum MqEventType {
  dong = 'dong',
  login = 'login',
  loginUrl = 'loginUrl',
  postComment = 'postComment',
  dirty = 'dirty',
  logout = 'logout',
  ready = 'ready',
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

  [MqCommandType.messageImage]: PuppetDTO.MessageImageRequest
  [MqCommandType.messageFile]: PuppetDTO.MessageFileRequest
  [MqCommandType.messageUrl]: PuppetDTO.MessageUrlRequest
  [MqCommandType.messageLocation]: PuppetDTO.MessageLocationRequest
  [MqCommandType.messageContact]: PuppetDTO.MessageContactRequest
  [MqCommandType.messageMiniProgram]: PuppetDTO.MessageMiniProgramRequest
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

  [MqCommandType.messageImage]: PuppetDTO.MessageImageResponse
  [MqCommandType.messageFile]: PuppetDTO.MessageFileResponse
  [MqCommandType.messageUrl]: PuppetDTO.MessageUrlResponse
  [MqCommandType.messageLocation]: PuppetDTO.MessageLocationResponse
  [MqCommandType.messageContact]: PuppetDTO.MessageContactResponse
  [MqCommandType.messageMiniProgram]: PuppetDTO.MessageMiniProgramResponse
}
