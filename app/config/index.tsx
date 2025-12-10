import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
// export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
export const projectId = '250f08c3cb735e4b171e223e3d44f6d8' // ENV NOT WORKING, HARDCODED

if (!projectId) {
    // throw new Error('Project ID is not defined')
    console.warn('Project ID is not defined')
}

export const networks = [base]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    projectId: projectId || 'YOUR_PROJECT_ID', // Fallback to avoid crash if missing
    networks
})

export const config = wagmiAdapter.wagmiConfig
