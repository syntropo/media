import React from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { GoFileMedia } from "react-icons/go"

import { FaPlus } from "react-icons/fa"
import { HomeContext } from './Contexts/HomeContext'

const BrowserControlId = 'file-input'


export const SelectFile = () => {
  const fileInput = React.useRef<HTMLInputElement>(null)
  const homeContext = React.useContext(HomeContext)
  const { drop } = homeContext
  const { user } = Auth.useUser()
  if (!user) return null
  

  const onChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { files } = event.currentTarget
    if (files) drop(files)
  }

  const inputProps = {
    accept: ['video/*', 'audio/*', 'image/*'].join(','),
    id: BrowserControlId,
    onChange,
    type: 'file',
    key: 'browser-control-input',
    ref: fileInput,
  }
  const input = <input {...inputProps}/>

  const buttonProps = {
    children: [<FaPlus key='plus' />, <GoFileMedia key='icon'/>],
    className: 'button',
    key: 'button',
  }
  const button = <div { ...buttonProps } />
  const kids = [input, button]

  const labelProps = {
    children: kids,
    className: 'upload',
    key: 'browser-control',
    htmlFor: BrowserControlId
  }
  return <label {...labelProps} />

}
