/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { Auth } from '@supabase/auth-ui-react'

import { useClient } from './useClient'

import { SignOut } from './SignOut'
import { AuthOrHome} from "./AuthOrHome"

import { SelectFile } from './SelectFile'
import { AppContext, AppContextInterface } from './Contexts'
import { useRefresh } from './Hooks'

import './App.css'
import { Media } from './declarations'

const MAX_FILE_SIZE = 1028 * 1028 * 50


export const App = () => {
  const authSession = Auth.useUser()
  const mediaRef = React.useRef<Media[]>([])
  const { current: media } = mediaRef
  
  const children = [<header key='header'>Media<SelectFile/><SignOut /></header>]
  children.push(<AuthOrHome key='main'/>)
  children.push(<footer key='footer'>Made with 🍁 in Vermont</footer>)
  const client = useClient()
  const [initialized, setInitialized] = React.useState(false)
  const initialize = () => { setInitialized(true) }
  const [refresh, refreshed] = useRefresh()
  const drop = (fileList: FileList) => {
    const { user } = authSession
    const files = [...fileList]
    console.log("drop", authSession, fileList, files)
    if (!user) return

    const mediaObjects = files.map(file => { 
      const object: Media = { file }
      if (file.size > MAX_FILE_SIZE) object.error = { message: 'File is too large' }

      return object
    })
    media.push(...mediaObjects)
    refresh()
    const acceptable = mediaObjects.filter(file => !file.error)
    acceptable.forEach(mediaObject => {
      const { file } = mediaObject
      if (!file) return

      client.supabaseClient.storage.from(user.id).upload(file.name, file).then(({ data, error}) => {
        if (error) console.log(error)
        else if (data) {
          console.log('data', data)
        }
      })
    })

  }
  const appContext: AppContextInterface = {
    refresh, refreshed, initialized, initialize, drop, media
  }
  const appProps = {
    value: appContext, children
  }
  const authProps = { children: <AppContext.Provider { ...appProps }/>, ...client }
  return <Auth.UserContextProvider { ...authProps } />
}

