import { payloads, types } from '@juzi/wechaty-puppet'

export type ConversationReadMarkRequest = {
  conversationId: string,
  hasRead?: boolean,
}

export type ConversationReadMarkResponse = {
  hasRead?: boolean,
}

export type MessageContactRequest = {
  messageId: string,
}

export type MessageContactResponse = {
  contactId: string,
}

export type MessageFileRequest = {
  messageId: string,
}

export type MessageFileResponse = {
  fileFilebox: string,
}

export type MessageImageRequest = {
  messageId: string,
  imageType: types.Image,
}

export type MessageImageResponse = {
  imageFilebox: string,
}

export type MessageMiniProgramRequest = {
  messageId: string,
}

export type MessageMiniProgramResponse = {
  miniProgram: payloads.MiniProgram
}

export type MessageUrlRequest = {
  messageId: string,
}

export type MessageUrlResponse = {
  urlLink: payloads.UrlLink
}

export type MessageLocationRequest = {
  messageId: string,
}

export type MessageLocationResponse = {
  location: payloads.Location,
}

export type MessageChannelRequest = {
  messageId: string,
}

export type MessageChannelResponse = {
  channel: payloads.Channel,
}

export type MessageCallRecordRequest = {
  messageId: string,
}

export type MessageCallRecordResponse = {
  callRecord: payloads.CallRecord,
}

export type MessageChatHistoryRequest = {
  messageId: string,
}

export type MessageChatHistoryResponse = {
  history: payloads.ChatHistory[],
}

export type MessageForwardRequest = {
  messageId: string,
  conversationId: string,
}

export type MessageForwardResponse = {
  messageId?: string,
}

export type MessageSendContactRequest = {
  conversationId: string,
  contactId: string,
}

export type MessageSendContactResponse = {
  messageId?: string,
}

export type MessageSendFileRequest = {
  conversationId: string,
  fileFilebox: string,
}

export type MessageSendFileResponse = {
  messageId?: string,
}

export type MessageSendLocationRequest = {
  conversationId: string,
  location: payloads.Location,
}

export type MessageSendLocationResponse = {
  messageId?: string,
}

export type MessageSendMiniProgramRequest = {
  conversationId: string,
  miniProgram: payloads.MiniProgram,
}

export type MessageSendMiniProgramResponse = {
  messageId?: string,
}

export type MessageSendPostRequest = {
  conversationId: string,
  post: payloads.Post,
}

export type MessageSendPostResponse = {
  messageId?: string,
}

export type MessageSendTextRequest = {
  conversationId: string,
  text: string,
  option?: types.MessageSendTextOptions,
}

export type MessageSendTextResponse = {
  messageId?: string,
}

export type MessageSendUrlRequest = {
  conversationId: string,
  url: payloads.UrlLink,
}

export type MessageSendUrlResponse = {
  messageId?: string,
}

export type MessageSendChannelRequest = {
  conversationId: string,
  channel: payloads.Channel,
}

export type MessageSendChannelResponse = {
  messageId?: string,
}

export type MessageRecallRequest = {
  messageId: string
}

export type MessageRecallResponse = {
  result: boolean,
}

export type MessagePreviewRequest = {
  messageId: string,
}

export type MessagePreviewResponse = {
  imageFilebox: string,
}

export type GetMessageBroadcastTargetRequest = {}

export type GetMessageBroadcastTargetResponse = {
  contactIds?: string[],
  roomIds?: string,
}

export type CreateMessageBroadcastRequest = {
  targets: string[],
  content: payloads.Post,
}

export type CreateMessageBroadcastResponse = {
  broadcastId: string,
}

export type GetMessageBroadcastStatusRequest = {
  broadcastId: string,
}

export type GetMessageBroadcastStatusResponse = {
  status: types.BroadcastStatus,
  detail: {
    contactId?: string,
    roomId: string,
    status: types.BroadcastTargetStatus,
  }[]
}

export type MessagePayloadRequest = {
  messageId: string,
}

export type MessagePayloadResponse = {
  payload: payloads.Message,
}

export type MessageConsultCardRequest = {
  messageId: string,
}

export type MessageConsultCardResponse = {
  consultCard: payloads.ConsultCard
}

export type MessageSendPremiumOnlineAppointmentCardRequest = {
  conversationId: string,
  cardType: string,
  componentId: string,
}

export type MessageSendPremiumOnlineAppointmentCardResponse = {
  messageId?: string,
}

export type MessagePremiumOnlineAppointmentCardRequest = {
  messageId: string,
}

export type MessagePremiumOnlineAppointmentCardResponse = {
  premiumOnlineAppointmentCard: payloads.PremiumOnlineAppointmentCard
}

export type MessageSendConsultCardRequest = {
  conversationId: string,
  consultCard: payloads.ConsultCard, 
}

export type MessageSendConsultCardResponse = {
  messageId?: string,
}

export type MessageSendDouyinOneClickPhoneCollectionRequest = {
  conversationId: string,
  douyinOneClickPhoneCollection: {},
}

export type MessageSendDouyinOneClickPhoneCollectionResponse = {
  messageId?: string,
}

export type MessageSendProductRequest = {
  conversationId: string,
  productId: string,
}

export type MessageSendProductResponse = {
  messageId?: string,
}

export type MessageSendOrderRequest = {
  conversationId: string,
  orderId: string,
}

export type MessageSendOrderResponse = {
  messageId?: string,
}