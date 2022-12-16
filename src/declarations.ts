

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