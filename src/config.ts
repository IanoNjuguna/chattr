import { createConfig, http } from 'wagmi'
import { arcTestnet } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

export const config = createConfig(
  getDefaultConfig({
    chains: [arcTestnet],
    transports: {
      [arcTestnet.id]: http('https://rpc.testnet.arc.io'),
    },
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? '',
    appName: 'Chattr',
    appDescription: 'Pay to post. Earn to host.',
    appUrl: 'https://chattr.app',
    appIcon: 'https://chattr.app/chattr.svg',
  }),
)
