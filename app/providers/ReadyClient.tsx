'use client'
import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function ReadyClient() {
  useEffect(() => {
    try {
      sdk.ready()
    } catch (e) {
      console.error('sdk.ready() failed', e)
    }
  }, [])
  return null
}
