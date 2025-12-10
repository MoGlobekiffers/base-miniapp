'use client'

import { wagmiAdapter, projectId } from '@/app/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { base } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
    console.warn('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: 'DailyWheel',
    description: 'Spin daily to earn Brain Points on Base.',
    url: 'https://base-miniapp-gamma.vercel.app', // Production URL
    icons: ['https://base-miniapp-gamma.vercel.app/preview-wheel.png']
}

// Create the modal
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId: projectId || 'YOUR_PROJECT_ID',
    networks: [base],
    defaultNetwork: base,
    metadata: metadata,
    features: {
        analytics: true,
    }
})

function AppKitProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}

export default AppKitProvider
