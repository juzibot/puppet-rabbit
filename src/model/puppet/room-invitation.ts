import { payloads } from '@juzi/wechaty-puppet'

export type RoomInvitationAcceptRequest = {
  roomInvitationId: string,
}

export type RoomInvitationAcceptResponse = {}

export type RoomInvitationAcceptByQRCodeRequest = {
  qrCode: string,
}

export type RoomInvitationAcceptByQRCodeResponse = {
  roomId: string,
}

export type RoomInvitationPayloadRequest = {
  roomInvitationId: string,
}

export type RoomInvitationPayloadResponse = {
  payload: payloads.RoomInvitation,
}
