import { LocalInput, EnvScope, MediaRequest } from "./declarations"
import fs from 'fs/promises'
import crypto from 'crypto'
import path from 'path'
import { SupabaseClient } from "@supabase/supabase-js"

export const download = async (remote: MediaRequest, supabase: SupabaseClient, env: EnvScope): Promise<LocalInput> => {
  const local: LocalInput = { path: '' } 
  const { input } = remote
  if (!input) {
    local.error = { message: 'no input' }
    return local
  }
  const { url: inputUrl } = input
  if (!inputUrl) {
    local.error = { message: 'no input url' }
    return local
  }

  const extension = path.extname(inputUrl)
  const url = new URL(inputUrl)
  const { pathname, protocol, hostname } = url
  
  const hash = crypto.createHash('md5').update(inputUrl).digest("hex")
  const filePath = `/tmp/${hash}${extension}`

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  local.path = filePath
  let blob: Blob | undefined 
  switch (protocol) {
    case 'supabase:': {
      const { MEDIA_BUCKET: bucket = hostname } = env
      if (!bucket) {
        local.error = { message: 'no bucket' }
        break
      }
      const joined = pathname.slice(1)
      const { data, error } = await supabase.storage.from(bucket).download(joined)
      if (error) local.error = error
      else blob = data
      break
    }
    default: {
      const response = await fetch(url)
      blob = await response.blob()
      break
    }
  }
  if (blob) {
    const arrayBuffer = await blob.arrayBuffer()
    const bos = Buffer.from(arrayBuffer)
    await fs.writeFile(filePath, bos)
  } else local.error ||= { message: 'no blob' }
  return local
}
