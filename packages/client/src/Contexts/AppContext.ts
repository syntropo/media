
import React from 'react'

import { EmptyMethod, VoidMethod } from "../declarations"

export interface AppContextInterface {
  initialize: VoidMethod
  initialized: boolean
}

export const AppContextDefault: AppContextInterface = { 
  initialize: EmptyMethod,
  initialized: false,
}

export const AppContext = React.createContext(AppContextDefault)
