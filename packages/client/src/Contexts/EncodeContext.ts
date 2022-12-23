
import React from 'react'

import { EmptyMethod, Output, VoidMethod } from "../declarations"

export interface EncodeContextInterface {
  setOutput: React.Dispatch<React.SetStateAction<Output>>
  output: Output
  refresh: VoidMethod
  refreshed: number
}

export const EncodeContextDefault: EncodeContextInterface = { 
  setOutput: EmptyMethod,
  output: {},
  refresh: EmptyMethod,
  refreshed: 0,
}

export const EncodeContext = React.createContext(EncodeContextDefault)
