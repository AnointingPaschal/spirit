'use client';
import { useState } from 'react';
import { CodeBlock } from './CodeBlock';

const TABS = [
  {
    id: 'react',
    label: 'React',
    filename: 'ConnectButton.tsx',
    code: `import { useWallet, useSession } from '@spirit-protocol/react';

export function ConnectButton() {
  const { connect, disconnect, address, isConnected, isConnecting } = useWallet();
  const { authenticate, isAuthenticated, session } = useSession();

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-green-400">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <button onClick={disconnect}>Sign Out</button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <button onClick={() => authenticate('metamask')} disabled={isConnecting}>
        Sign In With Wallet
      </button>
    );
  }

  return (
    <button onClick={() => connect('metamask')} disabled={isConnecting}>
      {isConnecting ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}`,
  },
  {
    id: 'detect',
    label: 'Detect Wallets',
    filename: 'detector.ts',
    code: `import { WalletDetector } from '@spirit-protocol/core';

// Get all wallets with installed flag
const all = WalletDetector.detectAll();
// [
//   { id: 'metamask', name: 'MetaMask', installed: true, type: 'evm' },
//   { id: 'phantom',  name: 'Phantom',  installed: false, type: 'solana' },
//   ...
// ]

// Only installed ones
const installed = WalletDetector.detectInstalled();

// By chain type
const evmWallets     = WalletDetector.detectForChainType('evm');
const solanaWallets  = WalletDetector.detectForChainType('solana');
const bitcoinWallets = WalletDetector.detectForChainType('bitcoin');

// Direct adapter access
const metamask = WalletDetector.getAdapter('metamask');
if (metamask?.isInstalled()) {
  console.log('MetaMask is ready!');
}`,
  },
  {
    id: 'verify',
    label: 'Verify Signatures',
    filename: 'verify.ts',
    code: `import { verifySignature, generateNonce } from '@spirit-protocol/core';

// Server-side verification (works for all chains)
const nonce   = generateNonce(); // 32-byte cryptographically secure random
const message = buildAuthMessage({ address, nonce, chain, domain, uri });

// After wallet signs the message:
const isValid = await verifySignature({
  message,
  signature,  // hex string (EVM) or base58 (Solana)
  address,    // wallet address or Solana pubkey
  chainType,  // 'evm' | 'solana' | 'bitcoin'
});

// Chain-specific verifiers also available:
// verifyEVMSignature(message, sig, address)     → ethers.verifyMessage
// verifySolanaSignature(message, sig, pubkey)   → tweetnacl Ed25519
// verifyBitcoinSignature(message, sig, address) → noble-secp256k1`,
  },
  {
    id: 'relay',
    label: 'Relay API',
    filename: 'relay-usage.ts',
    code: `// Full server-side auth flow via the Spirit Relay

// 1. Get a nonce
const { nonce } = await fetch('https://relay.myapp.com/auth/nonce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address }),
}).then(r => r.json());

// 2. Sign on the client, then verify server-side
const { valid, session } = await fetch('https://relay.myapp.com/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, signature, address, nonce, chainType: 'evm', walletId: 'metamask' }),
}).then(r => r.json());

// session = { token, refreshToken, address, expiresAt, ... }

// 3. Protect your routes with the JWT
const user = await fetch('https://relay.myapp.com/me', {
  headers: { Authorization: \`Bearer \${session.token}\` },
}).then(r => r.json());
// { address, walletId, chainId, chainType, sessionId, expiresAt }`,
  },
];

export function CodeShowcase() {
  const [active, setActive] = useState('react');
  const current = TABS.find((t) => t.id === active)!;

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-cyan/4 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          {/* Left */}
          <div>
            <span className="badge bg-cyan/10 text-cyan border border-cyan/20 mb-6 inline-flex">
              Developer SDK
            </span>
            <h2 className="font-display font-800 text-4xl md:text-5xl text-white mb-6 leading-tight">
              Ship wallet auth
              <br />
              <span className="text-gradient-cyan">in minutes.</span>
            </h2>
            <p className="text-ink leading-relaxed mb-8">
              The React SDK gives you typed hooks that handle the entire flow — detection, connection, signing, verification, and session persistence — with zero boilerplate.
            </p>

            <div className="space-y-3">
              {[
                { icon: '⚡', text: 'Auto-detects installed wallets on mount' },
                { icon: '🔒', text: 'SIWE-compliant messages for EVM wallets' },
                { icon: '🔁', text: 'Auto-reconnect from persisted session' },
                { icon: '📡', text: 'Optional relay for server-side verification' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-ink">
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <a href="/docs" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                Full docs →
              </a>
              <a
                href="https://github.com/AnointingPaschal/spirit"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost px-5 py-2.5 text-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                View source
              </a>
            </div>
          </div>

          {/* Right — code window */}
          <div className="space-y-3">
            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-surface border border-[#0F1F35] rounded-xl w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-600 transition-all ${
                    active === tab.id
                      ? 'bg-cyan text-bg'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CodeBlock code={current.code} filename={current.filename} />
          </div>
        </div>
      </div>
    </section>
  );
}
