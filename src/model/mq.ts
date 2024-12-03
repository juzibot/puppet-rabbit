export interface MqSendMessage {
  traceId: string
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
}

export enum MqEventType {
  dong = 'dong',
}

export interface MqCommandResponseWaiter {
  resolver: (data: any) => void
  rejector: (e: Error) => void
  traceId: string
  timer: NodeJS.Timeout
}
