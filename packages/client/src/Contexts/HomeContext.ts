
import React from 'react'

import { EmptyMethod, MediaObject, VoidMethod } from "../declarations"

export interface HomeContextInterface {
  drop: (files: FileList) => void
  media: MediaObject[]
  refresh: VoidMethod
  refreshed: number
  select: (_: MediaObject) => void
  selected?: MediaObject
}

export const HomeContextDefault: HomeContextInterface = { 
  drop: EmptyMethod,
  media: [],
  refresh: EmptyMethod,
  refreshed: 0,
  select: () => {},
}

export const HomeContext = React.createContext(HomeContextDefault)
