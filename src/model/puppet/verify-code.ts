export type EnterVerifyCodeRequest = {
  code: string,
  id: string,
}

export type EnterVerifyCodeResponse = {}

export type CancelVerifyCodeRequest = {
  id: string,
}

export type CancelVerifyCodeResponse = {}
