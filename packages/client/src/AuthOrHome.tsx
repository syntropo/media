import React from 'react'
import { Provider } from '@supabase/supabase-js'
import { Auth, ThemeSupa } from '@supabase/auth-ui-react'

import { useClient } from './useClient'
import { Home } from './Home'
import { AppContext } from './Contexts'

export const AuthOrHome = () => {
  const appContext = React.useContext(AppContext)
  const { initialize, initialized } = appContext
  const client = useClient()
  const authSession = Auth.useUser()
  const { user } = authSession
  React.useEffect(() => {
    if (initialized) return 
    if (user) initialize()
    else setTimeout(initialize, 500)
  }, [initialize, initialized, user])

  if (!initialized) return <main />
  if (user) return <Home />

  const authProps = { 
    ...client, providers: ['github' as Provider], 
    appearance: { theme: ThemeSupa }, theme: 'dark',
  }
  return <main>
    <section><Auth { ...authProps } /></section>
    <aside>

      <h1>Welcome</h1>
      <p>
        This example Supabase deployment adds the following tables:
       
      </p>
       <ul>
          <li>media</li>
          <li>probing</li>
          <li>encoding</li>
        </ul>
    </aside>
  </main>
}

