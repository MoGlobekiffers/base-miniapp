'use client'
import { useEffect } from 'react'
import { miniapp } from '@farcaster/miniapp-sdk'

export default function ReadyClient() {
  useEffect(() => {
    miniapp.ready()
  }, [])
  return null
}
