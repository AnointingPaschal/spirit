'use client';

import { SpiritProvider } from '@spirit-protocol/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpiritProvider
      config={{
        appName: 'Spirit Demo',
        appUrl: 'http://localhost:3000',
        domain: 'localhost',
        debug: true,
        autoReconnect: true,
        sessionDuration: 86400,
        relayUrl: process.env.NEXT_PUBLIC_RELAY_URL,
      }}
    >
      {children}
    </SpiritProvider>
  );
}
