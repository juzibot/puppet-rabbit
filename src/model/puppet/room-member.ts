import { payloads } from '@juzi/wechaty-puppet'

export type RoomMemberListRequest = {
  roomId: string,
}

export type RoomMemberListResponse = {
  contactIds: string[],
}

export type RoomMemberPayloadRequest = {
  roomId: string,
  contactId: string,
}

export type RoomMemberPayloadResponse = {
  payload: payloads.RoomMember,
}

export type BatchRoomMemberPayloadRequest = {
  roomId: string,
  contactIds: string[],
}

export type BatchRoomMemberPayloadResponse = {
  [roomMemberId: string]: payloads.RoomMember,
}
