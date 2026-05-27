'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useWallet, useSession, useChain, type Chain } from '@spirit-protocol/react';
import { WalletModal } from '../components/WalletModal';
import { SessionCard } from '../components/SessionCard';
import { ChainSelector } from '../components/ChainSelector';

export default function Home() {
  const { isConnected, address, connectedWalletId, error, disconnect } = useWallet();
  const { isAuthenticated, isAuthenticating, session, authenticate } = useSession();
  const { chain, evmChains } = useChain();

  const [showModal, setShowModal] = useState(false);
  const [selectedChain, setSelectedChain] = useState<Chain>(evmChains[0]!);

  const handleAuthenticate = async () => {
    if (!connectedWalletId) return;
    try {
      await authenticate(connectedWalletId, selectedChain);
    } catch (err) {
      console.error('Authentication failed:', err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-6 right-6">
        <Link
          href="/docs"
          className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-sky-400 hover:text-white transition-colors"
        >
          Developer Docs
        </Link>
      </div>
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
            Spirit Protocol
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Decentralized multi-chain wallet authentication.
          EVM · Solana · Bitcoin. No third-party APIs.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md glass-card p-6 space-y-4">

        {/* Chain selector */}
        <ChainSelector
          selectedChain={selectedChain}
          onSelect={setSelectedChain}
          chains={evmChains}
        />

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error.message}
          </div>
        )}

        {/* Not connected */}
        {!isConnected && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500
                       hover:from-sky-400 hover:to-violet-400 font-semibold text-white
                       transition-all duration-200 shadow-lg shadow-sky-500/20
                       active:scale-95"
          >
            Connect Wallet
          </button>
        )}

        {/* Connected but not authenticated */}
        {isConnected && !isAuthenticated && (
          <div className="space-y-3">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-xs text-gray-400 mb-1">Connected</p>
              <p className="text-sm font-mono text-green-400 truncate">{address}</p>
              {chain && (
                <p className="text-xs text-gray-500 mt-1">
                  {chain.name} · {connectedWalletId}
                </p>
              )}
            </div>

            <button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500
                         hover:from-sky-400 hover:to-violet-400 font-semibold text-white
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         active:scale-95"
            >
              {isAuthenticating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing…
                </span>
              ) : (
                'Sign In With Wallet'
              )}
            </button>

            <button
              onClick={() => void disconnect()}
              className="w-full py-2 rounded-xl border border-gray-700 text-gray-400
                         hover:border-gray-600 hover:text-gray-300 text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Authenticated */}
        {isAuthenticated && session && (
          <SessionCard session={session} onLogout={() => void disconnect()} />
        )}
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-3 gap-4 mt-8 max-w-md w-full text-center">
        {[
          { label: 'EVM Chains', icon: '⛓', desc: 'ETH, Base, Polygon, ARB, OP, BNB, AVAX' },
          { label: 'Solana', icon: '◎', desc: 'Phantom, Solflare, Backpack' },
          { label: 'Bitcoin', icon: '₿', desc: 'Xverse, Unisat, Leather' },
        ].map((f) => (
          <div key={f.label} className="glass-card p-4">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-xs font-semibold text-gray-300">{f.label}</div>
            <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Wallet modal */}
      {showModal && (
        <WalletModal
          selectedChain={selectedChain}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  );
}
