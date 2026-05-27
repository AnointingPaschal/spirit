import type { Metadata } from 'next';
import { Syne, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
});

const dm = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  weight: ['300', '400', '500'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
});

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
    <html lang="en" className={`${syne.variable} ${dm.variable} ${dmMono.variable}`}>
      <body className="bg-bg text-white font-body antialiased">
        {children}
      </body>
    </html>
  );
}
