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
  roomMember: payloads.RoomMember,
}
