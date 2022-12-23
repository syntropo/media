// import fs from 'fs/promises'

import { createClient } from "@supabase/supabase-js"
import { EncodeRequest, MediaEvent, MediaEventPayload, MediaResponse, ProbeRequest } from "./declarations"
import { Encoder } from "./Encoder"
import { Prober } from './Prober'

export const handler = async (event: MediaEvent, context: any) => {
  console.log("event", event)
  const json: MediaEventPayload = JSON.parse(event.body)
  const { record, table } = json
  const { id, input } = record
  const { token } = input
  const { env } = process
  const { SUPABASE_PROJECT_URL: url, SUPABASE_ANON_KEY: key } = env
  const initResponse: MediaResponse = { id, completed: 0.5 }
  const initArgs = { body: initResponse }
  if (!(url && key)) throw 'no url or key' 
 
  
  const options = { global: { headers: { Authorization: `Bearer ${token}`}}}
  const supabase = createClient(url, key, options)

  const { error: beginError } = await supabase.functions.invoke(table, initArgs)
  if (beginError) {
    console.error(beginError)
    return { error: beginError }
  }
  const endResponse: MediaResponse = { id, completed: 1.0 }
  const endArgs = { body: endResponse }
  switch(table) {
    case 'probing': {
      const probeRequest = record as ProbeRequest
      const probeResult = await Prober.probe(probeRequest, supabase, env)
      Object.assign(endResponse, probeResult)
      break
    }
    case 'encoding': {
      const encodeRequest = record as EncodeRequest
      const encodeResult = await Encoder.encode(encodeRequest, supabase, env)
      Object.assign(endResponse, encodeResult)
      break
    }
    default: {
      endResponse.error = { message: `unsupported table: ${table}`}
    }
  }
  return await supabase.functions.invoke(table, endArgs)
}
