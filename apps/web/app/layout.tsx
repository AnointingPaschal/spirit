import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spirit Protocol — Decentralized Multi-Chain Auth',
  description:
    'Open-source wallet authentication for EVM, Solana, and Bitcoin. No third-party APIs. Self-hosted. Connect MetaMask, Phantom, Xverse and 9 more wallets across 9 chains.',
  openGraph: {
    title: 'Spirit Protocol',
    description: 'Decentralized multi-chain Web3 authentication',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
