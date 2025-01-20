import { types } from "@juzi/wechaty-puppet"

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