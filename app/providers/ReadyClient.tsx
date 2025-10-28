'use client'
import { useEffect } from 'react'
import sdk from '@farcaster/miniapp-sdk'

export default function ReadyClient() {
  useEffect(() => {
    try {
      // signale au Preview/Base App que l'app est prête
      sdk.actions.ready()
    } catch (e) {
      console.error('sdk.actions.ready() failed', e)
    }
  }, [])
  return null
}
