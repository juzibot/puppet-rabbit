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
  postSearch = 'postSearch',
  postPayload = 'postPayload',
  postPayloadSayable = 'postPayloadSayable',
  postPublish = 'postPublish',
  dirtyPayload = 'dirtyPayload',
  postUnpublish = 'postUnpublish',
  tap = 'tap',
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
