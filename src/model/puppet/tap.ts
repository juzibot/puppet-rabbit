import { filters, payloads, types } from "@juzi/wechaty-puppet"

export type TapRequest = {
  postId: string,
  type?: types.Tap,
  tap?: boolean,
}

export type TapResponse = {
  tap?: boolean,
}

export type TapSearchRequest = {
  postId: string,
  query?: filters.Tap,
  pagination?: filters.PaginationRequest,
}

export type TapSearchResponse = filters.PaginationResponse<payloads.Tap>
