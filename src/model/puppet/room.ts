import { payloads, types } from "@juzi/wechaty-puppet"

export type RoomAddRequest = {
  roomId: string,
  contactId: string | string[],
  inviteOnly?: boolean,
  quoteIds?: string[],
}

export type RoomAddResponse = {}

export type RoomAvatarRequest = {
  roomId: string,
  avatarFilebox?: string,
}

export type RoomAvatarResponse = {
  avatarFilebox?: string,
}

export type RoomCreateRequest = {
  contactIds: string[],
  topic?: string,
}

export type RoomCreateResponse = {
  roomId: string,
}

export type RoomDelRequest = {
  roomId: string,
  contactIds: string[],
}

export type RoomDelResponse = {}

export type RoomListRequest = {}

export type RoomListResponse = {
  roomIds: string[],
}

export type RoomQRCodeRequest = {
  roomId: string,
}

export type RoomQRCodeResponse = {
  qrCode: string,
}

export type RoomParseDynamicQRCodeRequest = {
  url: string,
}

export type RoomParseDynamicQRCodeResponse = {
  dynamicQRCodeResult: types.RoomParseDynamicQRCode,
}

export type RoomQuitRequest = {
  roomId: string,
}

export type RoomQuitResponse = {}

export type RoomTopicRequest = {
  roomId: string,
  topic?: string,
}

export type RoomTopicResponse = {}

export type RoomRemarkRequest = {
  roomId: string,
  remark: string,
}

export type RoomRemarkResponse = {}

export type RoomOwnerTransferRequest = {
  roomId: string,
  contactId: string,
}

export type RoomOwnerTransferResponse = {}

export type RoomDismissRequest = {
  roomId: string,
}

export type RoomDismissResponse = {}

export type RoomPermissionRequest = {
  roomId: string,
  permissions?: types.RoomPermission,
}

export type RoomPermissionResponse = {
  permissions?: types.RoomPermission,
}

export type RoomAddAdminsRequest = {
  roomId: string,
  contactIds: string[],
} 

export type RoomAddAdminsResponse = {}

export type RoomDelAdminsRequest = {
  roomId: string,
  contactIds: string[],
}

export type RoomDelAdminsResponse = {}

export type RoomPayloadRequest = {
  roomId: string,
}

export type RoomPayloadResponse = {
  payload: payloads.Room,
}

export type RoomAnnounceRequest = {
  roomId: string,
  announcement?: string,
}

export type RoomAnnounceResponse = {
  announcement?: string,
}