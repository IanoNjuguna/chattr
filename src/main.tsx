import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { config } from './config'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          customTheme={{
            '--ck-font-family': "'DM Sans', sans-serif",
            '--ck-primary-button-background': '#acc6e9',
            '--ck-primary-button-color': '#0d1b2f',
            '--ck-body-background': '#0f1e33',
            '--ck-body-color': '#f0f4fb',
          }}
        >
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#122d45',
                border: '1px solid rgba(172,198,233,0.2)',
                color: '#f0f4fb',
                fontFamily: "'DM Sans', sans-serif",
              },
            }}
          />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
