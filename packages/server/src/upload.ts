import { EnvScope, PotentialError } from "./declarations"
import fs from 'fs/promises'
import { SupabaseClient } from "@supabase/supabase-js"

export const upload = async (localFile: string, destination: string, supabase: SupabaseClient, env: EnvScope): Promise<PotentialError> => {
  const result: PotentialError = {}
  const url = new URL(destination)
  const { pathname, protocol, hostname } = url
  const buffer = await fs.readFile(localFile)
  switch (protocol) {
    case 'supabase:': {
      const { MEDIA_BUCKET: bucket = hostname } = env
      if (!bucket) {
        result.error = { message: 'no bucket' }
        break
      }
      const joined = pathname.slice(1)
      const { error } = await supabase.storage.from(bucket).upload(joined, buffer)
      if (error) result.error = error
      break
    }
    default: {
      result.error = { message: `unsupported protocol: ${protocol}`}
      break
    }
  }
  return result
}
