
import React from 'react'

import { EmptyMethod, Media, VoidMethod } from "../declarations"

export interface AppContextInterface {
  drop: (files: FileList) => void
  media: Media[]
  initialized: boolean
  refresh: VoidMethod
  initialize: VoidMethod
  refreshed: number
}

export const AppContextDefault: AppContextInterface = { 
  refresh: EmptyMethod,
  media: [],
  drop: EmptyMethod,
  initialize: EmptyMethod,
  refreshed: 0,
  initialized: false,
 }

export const AppContext = React.createContext(AppContextDefault)
