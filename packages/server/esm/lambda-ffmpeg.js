// src/lambda.ts
import { createClient } from "@supabase/supabase-js";

// src/Encoder.ts
import ffmpeg from "fluent-ffmpeg";
import crypto2 from "crypto";
import path2 from "path";

// src/download.ts
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
var download = async (remote, supabase, env) => {
  const local = { path: "" };
  const { input } = remote;
  if (!input) {
    local.error = { message: "no input" };
    return local;
  }
  const { url: inputUrl } = input;
  if (!inputUrl) {
    local.error = { message: "no input url" };
    return local;
  }
  const extension = path.extname(inputUrl);
  const url = new URL(inputUrl);
  const { pathname, protocol, hostname } = url;
  const hash = crypto.createHash("md5").update(inputUrl).digest("hex");
  const filePath = `/tmp/${hash}${extension}`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  local.path = filePath;
  let blob;
  switch (protocol) {
    case "supabase:": {
      const { MEDIA_BUCKET: bucket = hostname } = env;
      if (!bucket) {
        local.error = { message: "no bucket" };
        break;
      }
      const joined = pathname.slice(1);
      const { data, error } = await supabase.storage.from(bucket).download(joined);
      if (error)
        local.error = error;
      else
        blob = data;
      break;
    }
    default: {
      const response = await fetch(url);
      blob = await response.blob();
      break;
    }
  }
  if (blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const bos = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, bos);
  } else
    local.error ||= { message: "no blob" };
  return local;
};

// src/upload.ts
import fs2 from "fs/promises";
var upload = async (localFile, destination, supabase, env) => {
  const result = {};
  const url = new URL(destination);
  const { pathname, protocol, hostname } = url;
  const buffer = await fs2.readFile(localFile);
  switch (protocol) {
    case "supabase:": {
      const { MEDIA_BUCKET: bucket = hostname } = env;
      if (!bucket) {
        result.error = { message: "no bucket" };
        break;
      }
      const joined = pathname.slice(1);
      const { error } = await supabase.storage.from(bucket).upload(joined, buffer);
      if (error)
        result.error = error;
      break;
    }
    default: {
      result.error = { message: `unsupported protocol: ${protocol}` };
      break;
    }
  }
  return result;
};

// src/Encoder.ts
var commandCombinedOptions = (args) => Object.entries(args).map(
  ([key, value]) => {
    const keyString = `-${key}`;
    const valueString = String(value);
    if (valueString.length)
      return `${keyString} ${valueString}`;
    return keyString;
  }
);
var Encoder = class {
  static async encode(request, supabase, env) {
    const { input, id, output } = request;
    const response = {
      id,
      completed: 1
    };
    const { type } = input;
    const localInput = await download(request, supabase, env);
    const { path: localPath, error } = localInput;
    if (error) {
      response.error = error;
      return response;
    }
    const command = ffmpeg();
    command.addInput(localPath);
    if (type === "video") {
      const { videoBitrate, videoCodec, videoRate } = output;
      if (videoBitrate)
        command.videoBitrate(videoBitrate);
      if (videoCodec)
        command.videoCodec(videoCodec);
      if (videoRate)
        command.fpsOutput(videoRate);
    }
    if (type === "video" || type === "image") {
      const { width, height } = output;
      if (width && height)
        command.size([width, height].join("x"));
    }
    if (type === "audio" || type === "video") {
      const { audioBitrate, audioChannels, audioCodec, audioRate } = output;
      if (audioBitrate)
        command.audioBitrate(audioBitrate);
      if (audioChannels)
        command.audioChannels(audioChannels);
      if (audioCodec)
        command.audioCodec(audioCodec);
      if (audioRate)
        command.audioFrequency(audioRate);
    }
    const { options = {}, destination } = output;
    options.hide_banner = "";
    command.addOptions(commandCombinedOptions(options));
    const extension = path2.extname(destination);
    const hash = crypto2.createHash("md5").update(destination).digest("hex");
    const localFile = `/tmp/${hash}${extension}`;
    const promise = new Promise((resolve, reject) => {
      const result = {};
      command.on("error", (error2) => {
        reject({ error: error2 });
      });
      command.on("end", () => {
        resolve(result);
      });
      try {
        command.save(localFile);
      } catch (error2) {
        reject({ error: error2 });
      }
    });
    const runResult = await promise;
    const { error: runError } = runResult;
    if (runError)
      response.error = runError;
    else {
      const uploadResult = await upload(localFile, destination, supabase, env);
      const { error: uploadError } = uploadResult;
      if (uploadError)
        response.error = uploadError;
    }
    return response;
  }
};

// src/Prober.ts
import ffmpeg2 from "fluent-ffmpeg";
import { execSync } from "child_process";
var Prober = class {
  static get alphaFormats() {
    return this._alphaFormats ||= this.alphaFormatsInitialize;
  }
  static get alphaFormatsInitialize() {
    const result = execSync(this.AlphaFormatsCommand).toString().trim();
    return result.split("\n");
  }
  static async probe(request, supabase, env) {
    const { input, id } = request;
    const response = {
      id,
      completed: 1
    };
    const { type } = input;
    const localInput = await download(request, supabase, env);
    const { path: localPath, error } = localInput;
    if (error) {
      response.error = error;
      return response;
    }
    const command = ffmpeg2();
    command.addInput(localPath);
    return new Promise((resolve) => {
      command.ffprobe((error2, data) => {
        if (error2)
          response.error = error2;
        else {
          response.info = data;
          const { streams, format } = data;
          const { duration = 0 } = format;
          const durations = [];
          const rotations = [];
          const sizes = [];
          for (const stream of streams) {
            const { rotation, width, height, duration: duration2, codec_type, pix_fmt } = stream;
            if (type !== "audio" && pix_fmt)
              response.alpha = this.alphaFormats.includes(pix_fmt);
            if (typeof rotation !== "undefined")
              rotations.push(Math.abs(Number(rotation)));
            if (type !== "audio" && codec_type === "audio")
              response.audio = true;
            if (typeof duration2 !== "undefined")
              durations.push(Number(duration2));
            if (width && height)
              sizes.push({ width, height });
          }
          if (type !== "image" && (duration || durations.length)) {
            if (durations.length) {
              const maxDuration = Math.max(...durations);
              response.duration = duration ? Math.max(maxDuration, duration) : maxDuration;
            } else
              response.duration = duration;
          }
          if (type !== "audio" && sizes.length) {
            const flipped = rotations.some((n) => n === 90 || n === 270);
            const widthKey = flipped ? "height" : "width";
            const heightKey = flipped ? "width" : "height";
            response[widthKey] = Math.max(...sizes.map((size) => size.width));
            response[heightKey] = Math.max(...sizes.map((size) => size.height));
          }
        }
        resolve(response);
      });
    });
  }
};
Prober.AlphaFormatsCommand = "ffprobe -v 0 -of compact=p=0 -show_entries pixel_format=name:flags=alpha | grep 'alpha=1' | sed 's/.*=\\(.*\\)|.*/\\1/' ";

// src/lambda.ts
var handler = async (event, context) => {
  console.log("event", event);
  const json = JSON.parse(event.body);
  const { record, table } = json;
  const { id, input } = record;
  const { token } = input;
  const { env } = process;
  const { SUPABASE_PROJECT_URL: url, SUPABASE_ANON_KEY: key } = env;
  const initResponse = { id, completed: 0.5 };
  const initArgs = { body: initResponse };
  if (!(url && key))
    throw "no url or key";
  const options = { global: { headers: { Authorization: `Bearer ${token}` } } };
  const supabase = createClient(url, key, options);
  const { error: beginError } = await supabase.functions.invoke(table, initArgs);
  if (beginError) {
    console.error(beginError);
    return { error: beginError };
  }
  const endResponse = { id, completed: 1 };
  const endArgs = { body: endResponse };
  switch (table) {
    case "probing": {
      const probeRequest = record;
      const probeResult = await Prober.probe(probeRequest, supabase, env);
      Object.assign(endResponse, probeResult);
      break;
    }
    case "encoding": {
      const encodeRequest = record;
      const encodeResult = await Encoder.encode(encodeRequest, supabase, env);
      Object.assign(endResponse, encodeResult);
      break;
    }
    default: {
      endResponse.error = { message: `unsupported table: ${table}` };
    }
  }
  return await supabase.functions.invoke(table, endArgs);
};
export {
  handler
};
