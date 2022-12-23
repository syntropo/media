/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'

import { useClient } from './useClient'

import { BsFillFileEarmarkImageFill, BsFillFileEarmarkMusicFill, BsFillFileEarmarkPlayFill } from "react-icons/bs"
import { Auth } from '@supabase/auth-ui-react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MediaObject, ProbingObject, Output } from './declarations'
import { EncodeContext, EncodeContextInterface } from './Contexts/EncodeContext'
import { useRefresh } from './Hooks'
import { HomeContext, HomeContextInterface } from './Contexts/HomeContext'

import { SelectFile } from './SelectFile'

const MediaIcons = {
  video: <BsFillFileEarmarkPlayFill key='icon' />,
  audio: <BsFillFileEarmarkMusicFill key='icon' />,
  image: <BsFillFileEarmarkImageFill key='icon' />,
}

export interface MediaItemProps {
  media: MediaObject
}

export const MediaItem = (props: MediaItemProps) => {
  const homeContext = React.useContext(HomeContext)
  const { selected, select, refresh } = homeContext
  const { supabaseClient: supabase } = useClient()
  const channelRef = React.useRef<RealtimeChannel | null>(null)
  const { media } = props
  const { name, id, type, kind, encoding } = media

  const initialProbing = mediaProbing(media)!

  const probingRef = React.useRef<ProbingObject>(initialProbing)
  const { current: probing} = probingRef

  const children: React.ReactNode[] = []
  const { error, completed: initialCompleted, id: probingId } = probing

  const [completed, setCompleted] = React.useState(initialCompleted)

  if (error) children.push(error.message || JSON.stringify(error))
  else {
    if (completed < 1) {
      const filter = `id=eq.${probingId}`
      if (!probingId.startsWith('temp-')) {
        const { current: channel } = channelRef
        if (channel) return 
        
        console.log("MediaItem subscribe", filter)
        const handleRecordUpdated = (event) => {
          const { new: updated } = event
          console.log("updated", updated)
          probingRef.current = updated
          const { completed: currentCompleted } = updated

          setCompleted(currentCompleted)
          if (currentCompleted >= 1) supabase.removeChannel(channelRef.current!)
        }
        channelRef.current = supabase
          .channel(`public:probing:${filter}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'probing', filter }, handleRecordUpdated)
          .subscribe()

      } else setTimeout(refresh, 1000)
      
      const progressProps = {
        key: id, 
        value: completed,
        max: 1,
      }
      children.push(<progress { ...progressProps } />)
    } else {
      const bits: string[] = []
      const { duration, alpha, audio, width, height } = probing
      if (duration) bits.push(`${duration} seconds`)
      if (width && height) bits.push(`${width}x${height}`)
      if (alpha) bits.push('transparency')
      if (audio) bits.push('audio')
      children.push(bits.join(', '))
    }
  }
  const encodingElements = encoding.map(object => {
    return <span key={object.name}>{object.name}</span>
  })
  const className = selected === media ? 'selected' : ''
  const nameProps = { key: "name", children: [MediaIcons[type], name],  }
  const infoProps = { key: 'info', children }
  const kindProps = { key: 'kind', children: kind }
  const encodingProps = { key: 'encodings', children: encodingElements }
  const trProps = {
    className, onClick: () => { select(media)},
    children: [
      <td { ...nameProps } />,
      <td { ...kindProps } />,
      <td { ...infoProps } />,
      <td { ...encodingProps } />
    ],
  }
  return <tr { ...trProps} />
}

export const MediaItems = () => {
  const homeContext = React.useContext(HomeContext)
  const { media, drop } = homeContext
  const divChildren: React.ReactNode[] = []
  if (media.length) {
    const children = media.map(media => <MediaItem key={media.id} media={media} />)
    const tbodyProps = { children }
      divChildren.push(<table key='table'>
      <thead>
        <tr>
          <th><SelectFile/>File</th><th>Kind</th><th>Info</th><th>Encodings</th>
        </tr>
      </thead>
      <tbody { ...tbodyProps } />
    </table>)
  } else divChildren.push('Drop a file here')

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }
  const onDrop = (event: React.DragEvent) => {
    event.stopPropagation()
    event.preventDefault()
    const { dataTransfer } = event
    if (!dataTransfer) return
   
    drop(dataTransfer.files)
  }
  const divProps = { onDragOver, onDrop, className: 'rows', children: divChildren }
  return <div { ...divProps } />
}

export const AudibleRows = () => {
  const encodeContext = React.useContext(EncodeContext)
  const { output, setOutput } = encodeContext
  const { audioBitrate, audioChannels, audioCodec, audioRate } = output
  const trElements: React.ReactNode[] = []

  const audioBitrateInputProps = {
    type: 'number', value: audioBitrate,
    onChange: event => { 
      setOutput(old => ({ ...old, audioBitrate: event.target.value }))
    }
  }
  const audioBitrateRowProps = {
    label: 'Audio Bitrate', key: 'audioBitrate',
    children: <input { ...audioBitrateInputProps } />
  }
  trElements.push(<Row {...audioBitrateRowProps} />)

  const audioRateInputProps = {
    type: 'number', value: audioRate,
    onChange: event => { 
      setOutput(old => ({ ...old, audioRate: event.target.value }))
    }
  }
  const audioRateRowProps = {
    label: 'Audio Rate', key: 'audioRate',
    children: <input { ...audioRateInputProps } />
  }
  trElements.push(<Row {...audioRateRowProps} />)

  const audioChannelsInputProps = {
    type: 'number', value: audioChannels,
    onChange: event => { 
      setOutput(old => ({ ...old, audioChannels: event.target.value }))
    }
  }
  const audioChannelsRowProps = {
    label: 'Audio Channels', key: 'audioChannels',
    children: <input { ...audioChannelsInputProps } />
  }
  trElements.push(<Row {...audioChannelsRowProps} />)

  const audioCodecInputProps = {
    type: 'text', value: audioCodec,
    onChange: event => { 
      setOutput(old => ({ ...old, audioCodec: event.target.value }))
    }
  }
  const audioCodecRowProps = {
    label: 'Audio Codec', key: 'audioCodec',
    children: <input { ...audioCodecInputProps } />
  }
  trElements.push(<Row {...audioCodecRowProps} />)

  return <>{trElements}</>
}


export const EncodeProperties = {
  audible: ['audioBitrate', 'audioChannels', 'audioCodec', 'audioRate'],
  visible: ['width', 'height'],
  video: ['videoBitrate', 'videoCodec', 'videoRate'],
  shared: ['name', 'format', 'options', 'extension'],
}
export const VisibleRows = () => {
  const encodeContext = React.useContext(EncodeContext)
  const { output, setOutput } = encodeContext
  const { width, height } = output
  const trElements: React.ReactNode[] = []

  const widthInputProps = {
    key: 'width',
    type: 'number', value: width,
    onChange: event => { 
      setOutput(old => ({ ...old, width: event.target.value }))
    }
  }
  const heightInputProps = {
    key: 'height',
    type: 'number', value: height,
    onChange: event => { 
      setOutput(old => ({ ...old, height: event.target.value }))
    }
  }
  const dimensionsRowProps = {
    label: 'Dimensions', key: 'dimensions',
    children: [
      <input { ...widthInputProps } />, 
      <span key='x'>x</span>,
      <input { ...heightInputProps } />
    ]
  }
  trElements.push(<Row {...dimensionsRowProps} />)
  return <>{trElements}</>
}

export const VideoRows = () => {
  const encodeContext = React.useContext(EncodeContext)
  const { output, setOutput } = encodeContext
  const { videoCodec, videoBitrate, videoRate } = output
  const trElements: React.ReactNode[] = []

  const videoBitrateInputProps = {
    type: 'number', value: videoBitrate,
    onChange: event => { 
      setOutput(old => ({ ...old, videoBitrate: event.target.value }))
    }
  }
  const videoBitrateRowProps = {
    label: 'Video Bitrate', key: 'videoBitrate',
    children: <input { ...videoBitrateInputProps } />
  }
  trElements.push(<Row {...videoBitrateRowProps} />)

  const videoRateInputProps = {
    type: 'number', value: videoRate,
    onChange: event => { 
      setOutput(old => ({ ...old, videoRate: event.target.value }))
    }
  }
  const videoRateRowProps = {
    label: 'Video Rate', key: 'videoRate',
    children: <input { ...videoRateInputProps } />
  }
  trElements.push(<Row {...videoRateRowProps} />)

  const videoCodecInputProps = {
    type: 'text', value: videoCodec,
    onChange: event => { 
      setOutput(old => ({ ...old, videoCodec: event.target.value }))
    }
  }
  const videoCodecRowProps = {
    label: 'Video Codec', key: 'videoCodec',
    children: <input { ...videoCodecInputProps } />
  }
  trElements.push(<Row {...videoCodecRowProps} />)

  return <>{trElements}</>
}

export interface RowProps {
  children: React.ReactNode
  label: string
}
export const Row = (props: RowProps) => {
  const { label, ...rest } = props
  const labelProps = { children: label }
  return <tr>
    <td key='label'><label { ...labelProps } /></td>
    <td { ...rest } />
  </tr>
}

export const OutputRows = () => {
  const encodeContext = React.useContext(EncodeContext)
  const { output, setOutput } = encodeContext
  const { name, format, extension } = output
  const trElements: React.ReactNode[] = []

  const nameInputProps = {
    type: 'text', value: name,
    onChange: event => { 
      setOutput(old => ({ ...old, name: event.target.value }))
    }
  }
  const nameRowProps = {
    label: 'Name', key: 'name',
    children: <input { ...nameInputProps } />
  }
  trElements.push(<Row {...nameRowProps} />)


  const extensionInputProps = {
    type: 'text', value: extension,
    onChange: event => { 
      setOutput(old => ({ ...old, extension: event.target.value }))
    }
  }
  const extensionRowProps = {
    label: 'Extension', key: 'extension',
    children: <input { ...extensionInputProps } />
  }
  trElements.push(<Row {...extensionRowProps} />)


  const formatInputProps = {
    type: 'text', value: format,
    onChange: event => { 
      setOutput(old => ({ ...old, format: event.target.value }))
    }
  }
  const formatRowProps = {
    label: 'Format', key: 'format',
    children: <input { ...formatInputProps } />
  }
  trElements.push(<Row {...formatRowProps} />)
  return <>{trElements}</>
}

export const OutputDefaultsByType = {
  video: {
    name: 'video', 
    extension: 'mp4', 
    options: { g: 60, level: 41, movflags: 'faststart' },
    audioBitrate: 160,
    audioCodec: 'aac',
    audioChannels: 2,
    audioRate: 44100,
    videoBitrate: 2000,
    videoCodec: 'libx264',
    videoRate: 30,
    format: '',
  },
  audio: {
    name: 'audio', 
    options: {},
    audioBitrate: 160,
    audioCodec: 'libmp3lame',
    audioChannels: 2,
    audioRate: 44100,
    extension: 'mp3',
    format: '',
  },
  image: {
    name: 'image',
    options: {},
    width: 320,
    height: 240,
    extension: 'jpg',
    format: '',
  }
}

export const OutputDefaults = {
  audioBitrate: 0,
  audioChannels: 0,
  audioCodec: '',
  audioRate: 0,
  width: 0,
  height: 0,
  videoBitrate: 0,
  videoCodec: '',
  videoRate: 0,
  name: 'basename',
  format: '',
  extension: '',
  options: {}
}

export const mediaProbing = (mediaObject: MediaObject): ProbingObject | undefined => {
  return mediaObject.probing[0]
}

export const mediaEncodable = (mediaObject: MediaObject): boolean => {
  const probing = mediaProbing(mediaObject)
  if (!probing) return false

  const { error, completed } = probing
  if (error || completed < 1) return false

  return true
}
export const mediaAudible = (mediaObject: MediaObject): boolean => {
  const { type } = mediaObject
  if (type === 'audio') return true

  const probing = mediaProbing(mediaObject)
  return !!probing?.audio
}

export const mediaVideo = (mediaObject: MediaObject): boolean => {
  return mediaObject.type === 'video'
}

export const mediaVisible = (mediaObject: MediaObject): boolean => {
  return mediaObject.type !== 'audio'
}

export const EncodeForm = () => {
  const [refresh, refreshed] = useRefresh()
  const { supabaseClient: supabase } = useClient()
  const { user } = Auth.useUser()
  if (!user) throw new Error('auth')

  const homeContext = React.useContext(HomeContext)

  const [output, setOutput] = React.useState<Output>(OutputDefaults)
  const { selected } = homeContext
  React.useEffect(() => {
    if (selected) {
      const probing = mediaProbing(selected)!
      const { type } = selected
      const { width, height } = probing
      setOutput(old => (
        { ...old, ...OutputDefaultsByType[type], width, height }
      ))
     
    }
  }, [selected])

  if (!selected) return <div>Welcome...</div>

  const encodeContext: EncodeContextInterface = { output, setOutput, refresh, refreshed }
  const tbodyChildren: React.ReactNode[] = []
  if (mediaAudible(selected)) tbodyChildren.push(<AudibleRows key='audible' />)
  if (mediaVideo(selected)) tbodyChildren.push(<VideoRows key='video' />)
  if (mediaVisible(selected)) tbodyChildren.push(<VisibleRows key='visible' />)
  tbodyChildren.push(<OutputRows key='output' />)
  tbodyChildren.push(<tr key='submit'><td /><td><input type='submit' value='Encode' /></td></tr>)
  const theadProps = {
    children: [<tr key='head'><th>Create Encoding</th><th></th></tr>], 
    key: 'head'
  }
  const tbodyProps = { children: tbodyChildren, key: 'body' }
  const tableProps = {
    children: [
      <thead { ...theadProps } />, 
      <tbody { ...tbodyProps } />, 
    ]
  }

  const onSubmit = event => {
    event.stopPropagation()
    event.preventDefault()
    const keys = [...EncodeProperties.shared]
    if (mediaAudible(selected)) keys.push(...EncodeProperties.audible)
    if (mediaVisible(selected)) keys.push(...EncodeProperties.visible)
    if (mediaVideo(selected)) keys.push(...EncodeProperties.video)
    const limitedOutput: Output = Object.fromEntries(keys.map(key => (
      [key, output[key]]
    )))
    const { extension, name } = output
    const record = { 
      output: { 
        ...limitedOutput, 
        destination: [selected.url, '/', name, '.', extension].join('')
      }, 
      name: `${name}.${extension}`,
      media_id: selected.id, 
    }
    supabase.from('encoding').insert(record).then(({ data, error }) => {
      if (error) console.error(error)
      else console.log(data)
    })
  }
  const formProps = { children: <table { ...tableProps } />, onSubmit }

  const encodeContextProps = {
    value: encodeContext, children: <form {...formProps } />
  }
  return <EncodeContext.Provider { ...encodeContextProps }/>

}
const MAX_FILE_SIZE = 1028 * 1028 * 20

export const Home = () => {
  const { supabaseClient: supabase } = useClient()
  const [refresh, refreshed] = useRefresh()
  const [media, setMedia] = React.useState<MediaObject[]>([])
  const [selected, select] = React.useState<MediaObject | undefined>(undefined)
  const [initialized, setInitialized] = React.useState(true)

  const authSession = Auth.useUser()
  const { user } = authSession
    if (!user) throw new Error('auth')

  const drop = async (fileList: FileList) => {
    const { user } = authSession
    if (!user) throw new Error('auth')

    const files = [...fileList]
    const media = files.map((file, index) => { 
      const { name, type: mimetype, size } = file
      const [type, kind] = mimetype.split('/')
      const id = `temp-${index}-${name}`
      const url = ''
      const probing: ProbingObject = { id, completed: 0 }
       if (file.size > MAX_FILE_SIZE) {
        probing.error = { message: 'File is too large' }
        probing.completed = 1
      }
      const object: MediaObject = { 
        size, url, id, name, type, kind, probing: [probing], encoding: [] 
      }
      return object
    })
    const upload = async () => {
      const acceptable = files.filter(file => file.size <= MAX_FILE_SIZE)
      const promises = acceptable.map(file => {
        const path = [user.id, file.name].join('/')
        console.log("path", path, file.size, file)
        return supabase.storage.from('media').upload(path, file)
      })

      const promise = Promise.all(promises)
      const results = await promise
      results.forEach((result, index) => {
        const { error, data } = result
        console.log('data', data)
        if (error) {
          const file = acceptable[index]
          const { name } = file
          const mediaObject = media.find(object => object.name === name)
          if (!mediaObject) throw new Error('no mediaObject')

          const probing = mediaProbing(mediaObject)
          if (!probing) throw new Error('no probing')
      
          if (probing.completed < 1) probing.error = error
        }
      })
      updateMediaItems()
    }
    
    upload()
    setMedia(old => {
      return [...media, ...old]
    })
  }
  const updateMediaItems = () => {
    supabase.from('media').select('*, probing (*), encoding (*)').order('created_at', { ascending: false }).then(({data, error}) => {
      if (error) console.error(error)
      else if (data) setMedia(old => {
        const combined = [...data, ...old]
        const names: Record<string, boolean> = {}
        setInitialized(true)
        return combined.filter(object => {
          if (names[object.name]) return false

          return names[object.name] = true
        })
      })
    })
  }
  
  React.useEffect(() => { updateMediaItems() }, [user])

  const children: React.ReactNode[] = []
  if (initialized) {
    children.push(<section key='items'><MediaItems /></section>)
    if (media.length) {
      if (selected) {
        if (mediaEncodable(selected)) {
          children.push(<aside key='aside'><EncodeForm /></aside>)
        } else {
          const probing = mediaProbing(selected)
          if (probing?.error) children.push(<aside key='aside'>{probing.error.message}</aside>)
          else children.push(<aside key='aside' />)
        }
      } else children.push(<aside key='aside'>{'⬅️ Make a selection'}</aside>)
    } else children.push('Video, audio, and images are supported')
  }
  
  const mainProps = { children }
  const homeContext: HomeContextInterface = {
    refresh, refreshed, drop, media, selected, select
  }
  const homeProps = {
    value: homeContext, children: <main { ...mainProps } />
  }
  return <HomeContext.Provider { ...homeProps } />
}
