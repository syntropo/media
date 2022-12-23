/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { Auth } from '@supabase/auth-ui-react'

import { useClient } from './useClient'

import { SignOut } from './SignOut'
import { AuthOrHome} from "./AuthOrHome"

import { AppContext, AppContextInterface } from './Contexts'

import './App.css'



export const AuthApp = () => {
  const [initialized, setInitialized] = React.useState(false)
  const children = [<header key='header'>Media<SignOut /></header>]
  children.push(<AuthOrHome key='main'/>)
  children.push(<footer key='footer'>Made with 🍁 in Vermont</footer>)
  const initialize = () => { setInitialized(true) }
  const appContext: AppContextInterface = { initialized, initialize }
  const appProps = {
    value: appContext, children
  }
  return <AppContext.Provider { ...appProps }/>
}

export const App = () => {
  const client = useClient()
  const authProps = { children: <AuthApp />, ...client }
  return <Auth.UserContextProvider { ...authProps } />
}
