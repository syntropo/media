export interface PotentialError {
  error?: { message: string }
}
export interface LocalInput extends PotentialError {
  path: string
}

export interface RemoteInput {
  url: string
  type: string
  token: string
}

export interface Output {

}

export interface MediaRequest {
  input: RemoteInput
  id: string
}

export interface MediaResponse {
  id: string
  error?: any
  completed: number
}

export interface ProbeRequest extends MediaRequest {}

export interface ProbeResponse extends MediaResponse {
  info?: any
  width?: number
  height?: number
  duration?: number
  alpha?: boolean
  audio?: boolean
}

export type NumberString = number | string

export interface Output extends Record<string, unknown> {
  url: string
  width?: number
  height?: number
  audioBitrate?: NumberString
  audioChannels?: number
  audioCodec?: string
  audioRate?: number
  format?: string
  options?: Record<string, NumberString>
  videoBitrate?: NumberString
  videoCodec?: string
  videoRate?: number
}

export interface EncodeRequest extends MediaRequest {
  output: Output
}

export interface EncodeResponse extends MediaResponse {}

export type EnvScope = Record<string, string | undefined>

export interface MediaEvent {
  body: string
}

export interface MediaEventPayload {
  record: MediaRequest
  table: string
}

export type Value = number | string

export type ValueObject = Record<string, Value> ;


