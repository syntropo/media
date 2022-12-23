import React from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { useClient } from './useClient'

export const SignOut = () => {
  const session = Auth.useUser()
  const { user } = session
  const client = useClient()
  if (!user) return null

  const buttonProps = { 
    children: 'Sign Out', 
    onClick: () => { client.supabaseClient.auth.signOut() }
  }
  return <button { ...buttonProps } />
}