import { filters, payloads, types } from "@juzi/wechaty-puppet"

export type GetContactExternalUserIdRequest = {
  contactIds: string[],
  serviceProviderId: string,
}

export type GetContactExternalUserIdResponse = {
  contactIdExternalUserIdPairs: types.ContactIdExternalUserIdPair[],
}

export type GetRoomAntiSpamStrategyListRequest = {}

export type GetRoomAntiSpamStrategyListResponse = {
  strategies: types.RoomAntiSpamStrategy[],
}

export type GetRoomAntiSpamStrategyEffectRoomListRequest = {
  strategyId: string,
}

export type GetRoomAntiSpamStrategyEffectRoomListResponse = {
  roomIds: string[],
}

export type GetCorpMessageInterceptionStrategies = {}

export type GetCorpMessageInterceptionStrategiesResponse = {
  strategies: types.CorpMessageInterceptionStrategy[],
}

export type ListConsultCardsRequest = {
  cardType: number,
  status?: number,
  ids?: string[],
  page: number,
  pageSize: number,
}

export type ListConsultCardsResponse = {
  total: number,
  cards: {
    id: string,
    cardType: number,
    name: string,
    content: string,
    status: number,
    statusMsg: string,
    actions?: {
      name: string,
      actionType: number,
      imComponent?: {
        type: string,
        componentId: string,
        componentName: string,
        extra: string,
      }
    }[]
  }[],
}

export type ListPremiumOnlineAppointmentCardsRequest = {
  cardType: string,
  page: number,
  pageSize: number,
}

export type ListPremiumOnlineAppointmentCardsResponse = {
  total: number,
  tools: payloads.PremiumOnlineAppointmentCard[],
}

export type ListIntentCommentsRequest = filters.PaginationRequest

export type ListIntentCommentsResponse = filters.PaginationResponse<payloads.IntentComment[]>

export type IntentCommentPayloadRequest = {
  intentCommentId: string,
}

export type IntentCommentPayloadResponse = {
  payload: payloads.IntentComment,
}
