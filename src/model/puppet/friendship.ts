import { payloads, types } from '@juzi/wechaty-puppet'

export type FriendshipAcceptRequest = {
  friendshipId: string,
}

export type FriendshipAcceptResponse = {}

export type FriendshipAddRequest = {
  contactId: string,
  option?: types.FriendshipAddOptions,
}

export type FriendshipAddResponse = {}

export type FriendshipSearchPhoneRequest = {
  phone: string,
  type?: types.Contact
}

export type FriendshipSearchPhoneResponse = {
  contactId?: string,
}

export type FriendshipSearchHandleRequest = {
  handle: string,
  type?: types.Contact,
}

export type FriendshipSearchHandleResponse = {
  contactId?: string,
}

export type FriendshipPayloadRequest = {
  friendshipId: string,
}

export type FriendshipPayloadResponse = {
  payload: payloads.Friendship,
}
