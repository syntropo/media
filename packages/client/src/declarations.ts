

import { FileObject } from '@supabase/storage-js'

export const EmptyMethod = () => {}
export type VoidMethod = typeof EmptyMethod

export interface MediaError { 
  message: string 
} 

export interface Media {
  fileObject?: FileObject
  file?: File
  error?: MediaError
}

export type Value = number | string

export type ValueObject = Record<string, Value> ;

export interface ProbingObject {
  id: string
  completed: number
  error?: any
  info?: any
  width?: number
  height?: number
  duration?: number
  alpha?: boolean
  audio?: boolean
}
export interface EncodingObject {
  id: string
  name: string
}
export interface MediaObject {
  name: string
  id: string
  type: string
  kind: string
  probing: ProbingObject[]
  encoding: EncodingObject[]
  url: string
  size: number
}

export interface AudibleOutput {
  audioBitrate?: Value
  audioChannels?: number
  audioCodec?: string
  audioRate?: number
}
export interface VisibleOutput {
  width?: number
  height?: number
}

export interface VideoOutput {
  videoBitrate?: Value
  videoCodec?: string
  videoRate?: number
}
export interface SharedOutput  {
  name?: string
  format?: string
  options?: ValueObject
  extension?: string
}

export interface Output extends SharedOutput, VideoOutput, VisibleOutput, AudibleOutput {}

export type MediaType = "video" | "audio" | "image"