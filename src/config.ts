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
    appName: 'chattr',
    appDescription: 'A shared USDC room for a team.',
    appUrl: 'https://chattr.app',
    appIcon: '/chattr.svg',
  }),
)
