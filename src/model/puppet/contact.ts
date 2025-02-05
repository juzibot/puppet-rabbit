import { payloads } from '@juzi/wechaty-puppet'

// contact self

export type ContactSelfNameRequest = {
  name: string
}

export type ContactSelfNameResponse = {}

export type ContactSelfAkaRequest = {
  aka: string
}

export type ContactSelfAkaResponse = {}

export type ContactSelfRealNameRequest = {
  realName: string
}

export type ContactSelfRealNameResponse = {}

export type ContactSelfQRCodeRequest = {}

export type ContactSelfQRCodeResponse = {
  qrCode: string
}

export type ContactSelfSignatureRequest = {
  signature: string
}

export type ContactSelfSignatureResponse = {}

export type ContactSelfRoomAliasRequest = {
  roomId: string,
  alias: string,
}

export type ContactSelfRoomAliasResponse = {}

// contact

export type ContactAliasRequest = {
  contactId: string
}

export type ContactAliasResponse = {
  alias: string
}

export type ContactAvatarRequest = {
  contactId: string
}

export type ContactAvatarResponse = {
  avatarFilebox: string,
}

export type ContactPhoneRequest = {
  contactId: string,
  phones: string[],
}

export type ContactPhoneResponse = {}

export type ContactCorporationRemarkRequest = {
  contactId: string,
  corporationRemark: string,
}

export type ContactCorporationRemarkResponse = {}

export type ContactPayloadModifyRequest = Partial<payloads.Contact>

export type ContactPayloadModifyResponse = {}

export type ContactDescriptionRequest = {
  contactId: string,
  description: string,
}

export type ContactDescriptionResponse = {}

export type ContactListRequest = {}

export type ContactListResponse = {
  contactIds: string[],
}

export type ContactDeleteRequest = {
  contactId: string
}

export type ContactDeleteResponse = {}

export type ContactPayloadRequest = {
  contactId: string,
}

export type ContactPayloadResponse = {
  payload: payloads.Contact
}
