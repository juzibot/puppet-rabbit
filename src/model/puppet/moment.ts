export type MomentSignatureRequest = {
  signature?: string,
}

export type MomentSignatureResponse = {
  signature?: string,
}

export type MomentCoverageRequest = {
  cover?: string,
}

export type MomentCoverageResponse = {
  cover?: string,
}

export type MomentVisibleListRequest = {}

export type MomentVisibleListResponse = {
  contactIds: string[],
}