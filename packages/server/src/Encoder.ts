import { SupabaseClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg'
import crypto from 'crypto'
import path from 'path'

import { EnvScope, LocalInput, EncodeRequest, EncodeResponse, ValueObject, PotentialError } from "./declarations";
import { download } from './download';
import { upload } from './upload';

const commandCombinedOptions = (args: ValueObject): string[] => Object.entries(args).map(
  ([key, value]) => {
    const keyString = `-${key}`
    const valueString = String(value)
    if (valueString.length) return `${keyString} ${valueString}`
    return keyString
  }
)

export class Encoder {
  static async encode(request: EncodeRequest, supabase: SupabaseClient, env: EnvScope): Promise<EncodeResponse> {
    const { input, id, output } = request
    const response: EncodeResponse = {
      id, completed: 1
    }
    const { type } = input
    const localInput: LocalInput = await download(request, supabase, env)
    const { path: localPath, error } = localInput
    if (error) {
      response.error = error
      return response
    }
    const command = ffmpeg()
    command.addInput(localPath)
    if (type === 'video') {
      const { videoBitrate, videoCodec, videoRate } = output
      if (videoBitrate) command.videoBitrate(videoBitrate)
      if (videoCodec) command.videoCodec(videoCodec)
      if (videoRate) command.fpsOutput(videoRate)
    }
    if (type === 'video' || type === 'image') {
      const { width, height } = output
      if (width && height) command.size([width, height].join('x'))
    }
    if (type === 'audio' || type === 'video') {
      const { audioBitrate, audioChannels, audioCodec, audioRate } = output
      if (audioBitrate) command.audioBitrate(audioBitrate)
      if (audioChannels) command.audioChannels(audioChannels)
      if (audioCodec) command.audioCodec(audioCodec)
      if (audioRate) command.audioFrequency(audioRate)
    }
    const { options = {}, url } = output
    options.hide_banner = ''
    command.addOptions(commandCombinedOptions(options))
    const extension = path.extname(url)
    const hash = crypto.createHash('md5').update(url).digest("hex")
    const localFile = `/tmp/${hash}${extension}`

    const promise = new Promise<PotentialError>((resolve, reject) => {
      const result:PotentialError = {}
      command.on('error', (error) => { reject({ error }) })
      command.on('end', () => { resolve(result) })
      try { command.save(localFile) }
      catch (error) { reject({ error }) }
    })

    const runResult = await promise
    
    const { error: runError } = runResult
    if (runError) response.error = runError
    else {
      const uploadResult = await upload(localFile, url, supabase, env)
      const { error: uploadError } = uploadResult
      if (uploadError) response.error = uploadError
    }
    
    return response
  }
}