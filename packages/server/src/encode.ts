import { EncodeRequest, EncodeResponse } from "./declarations"

export const encode = (request: EncodeRequest): Promise<EncodeResponse> => {
  const response: EncodeResponse = {}
  return Promise.resolve(response)
}
