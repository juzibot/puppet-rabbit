import { filters, payloads } from "@juzi/wechaty-puppet"

export type PostPayloadRequest = {
  postId: string,
}

export type PostPayloadResponse = {
  payload: payloads.Post,
}

export type PostPayloadSayableRequest = {
  postId: string,
  sayableId: string,
}

export type PostPayloadSayableResponse = {
  sayable: payloads.Sayable,
}

export type PostPublishRequest = {
  post: payloads.Post,
}

export type PostPublishResponse = {
  postId?: string,
}

export type PostUnpublishRequest = {
  postId: string
}

export type PostUnpublishResponse = {}

export type PostSearchRequest = {
  filter: filters.Post,
  pagination?: filters.PaginationRequest,
}

export type PostSearchResponse = filters.PaginationResponse<string[]>
