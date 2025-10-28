'use client'
import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function ReadyClient() {
  useEffect(() => {
    (async () => {
      try {
        const inMini = await sdk.isInMiniApp().catch(() => false)
        if (inMini) {
          // Déclenche la récupération du contexte (utile pour les logs Base Build)
          void sdk.context
          console.log('[DailyWheel] Mini App context requested')
        } else {
          console.log('[DailyWheel] Not running in a Mini App')
        }
      } catch (e) {
        console.error('Mini App init failed:', e)
      }
    })()
  }, [])
  return null
}
