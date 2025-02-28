import { types } from "@juzi/wechaty-puppet"

export type RefreshQRCodeRequest = {}

export type RefreshQRCodeResponse = {}

export type DingRequest = {
  data: string,
}

export type DingResponse = {}

export type StartRequest = {}

export type StartResponse = {}

export type DirtyPayloadRequest = {
  id: string,
  type: types.Dirty,
}

export type DirtyPayloadResponse = {}

export type LogoutRequest = {
  reason?: string,
}

export type LogoutResponse = {}
