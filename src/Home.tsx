/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'

import { useClient } from './useClient'

import { BsBucketFill } from "react-icons/bs"
import { FileObject } from '@supabase/storage-js'
import { Auth } from '@supabase/auth-ui-react'
import { Media } from './declarations'

export const BucketButton = (props: { bucket: FileObject }) => {
  const { bucket } = props
  return <button><BsBucketFill />{bucket.name}</button>
}
export const BucketButtons = () => {
  const { user } = Auth.useUser()

  const [_, setNonce] = React.useState(0)
  const updateNonce = () => { setNonce(new Date().valueOf()) }
  const {supabaseClient: supabase} = useClient()
  const buckets = React.useRef<FileObject[]>([])
  
  const updateBuckets = () => {
    if (!user) return
    supabase.storage.from(user.id).list('', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  }).then(({data, error}) => {
      if (error) console.error(error)
      else if (data) {
        buckets.current = data
        updateNonce()
      }
    })
  }
  
  React.useEffect(() => {
    updateBuckets()
  }, [])
  
  const children = buckets.current.map(bucket => 
    <BucketButton key={bucket.id} bucket={bucket} />
  )

  const navProps = { children }
  return <nav { ...navProps } />
}

export const Home = () => {
  return <main>
    <section>
      <BucketButtons />
    </section> 
    <aside>explanation...</aside>
  </main>
}
