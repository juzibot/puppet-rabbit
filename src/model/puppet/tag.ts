import { payloads, types } from "@juzi/wechaty-puppet"

export type TagContactTagAddRequest = {
  tagIds: string[],
  contactIds: string[],
}

export type TagContactTagAddResponse = {}

export type TagContactTagRemoveRequest = {
  tagIds: string[],
  contactIds: string[],
}

export type TagContactTagRemoveResponse = {}

export type TagContactTagListRequest = {
  contactId: string,
}

export type TagContactTagListResponse = {
  tagIds: string[],
}

export type TagGroupAddRequest = {
  groupName: string,
}

export type TagGroupAddResponse = {
  tagGroupId: string
}

export type TagGroupDeleteRequest = {
  tagGroupId: string,
}

export type TagGroupDeleteResponse = {}

export type TagGroupListRequest = {}

export type TagGroupListResponse = {
  tagGroupIds: string[],
}

export type TagGroupTagListRequest = {
  tagGroupId: string,
}

export type TagGroupTagListResponse = {
  tagIds: string[],
}

export type TagGroupPayloadPuppetRequest = {
  tagGroupId: string,
}

export type TagGroupPayloadPuppetResponse = {
  payload: payloads.TagGroup,
}

export type TagTagAddRequest = {
  tagNames: string[],
  groupId?: string,
}

export type TagTagAddResponse = {
  tagInfos: types.TagInfo[],
}

export type TagTagDeleteRequest = {
  tagIds: string[],
}

export type TagTagDeleteResponse = {}

export type TagTagModifyRequest = {
  tagInfos: types.TagInfo[],
}

export type TagTagModifyResponse = {
  tagInfos?: types.TagInfo[],
}

export type TagTagListRequest = {}

export type TagTagListResponse = {
  tagIds: string[],
}

export type TagTagContactListRequest = {
  tagId: string,
}

export type TagTagContactListResponse = {
  contactIds: string[],
}

export type TagPayloadPuppetRequest = {
  tagId: string,
}

export type TagPayloadPuppetResponse = {
  payload: payloads.Tag,
}
