# ⚡ Spirit Protocol

> **Decentralized multi-chain Web3 authentication and wallet connection protocol.**
> EVM · Solana · Bitcoin. No third-party APIs. Self-hosted. Open standard.

---

## Overview

Spirit Protocol is a fully self-hosted wallet authentication system that lets users connect and authenticate with wallets across multiple blockchain ecosystems using:

- **Native wallet providers** – EIP-1193 injected wallets (MetaMask, Rabby, etc.)
- **Direct JSON-RPC communication** – no intermediary services
- **Cryptographic signature verification** – ECDSA (EVM), Ed25519 (Solana), secp256k1 (Bitcoin)
- **Custom session management** – JWT access + refresh tokens, PostgreSQL persistence
- **Custom relay server** – WebSocket-based encrypted QR pairing (Phase 3)

---

## Supported Wallets & Chains

| Chain Type | Wallets | Networks |
|---|---|---|
| **EVM** | MetaMask, Trust Wallet, Coinbase Wallet, Rabby, OKX, Brave | Ethereum, Base, Polygon, Arbitrum, Optimism, BNB Chain, Avalanche |
| **Solana** | Phantom, Solflare, Backpack | Solana Mainnet |
| **Bitcoin** | Xverse, Unisat, Leather | Bitcoin Mainnet |

---

## Monorepo Structure

```
spirit/
├── packages/
│   ├── core/          # TypeScript SDK – adapters, crypto, auth, relay client
│   └── react/         # React hooks & SpiritProvider context
├── apps/
│   ├── relay/         # Fastify relay server (auth API + WebSocket broker)
│   └── demo/          # Next.js demo application
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8 (`npm i -g pnpm`)
- PostgreSQL (or use Docker Compose)

### 1. Clone & Install

```bash
git clone https://github.com/AnointingPaschal/spirit.git
cd spirit
pnpm install
```

### 2. Configure Relay Server

```bash
cd apps/relay
cp .env.example .env
# Edit .env – set JWT_SECRET and DATABASE_URL
```

### 3. Start with Docker Compose

```bash
# From repo root
docker-compose up -d
```

This starts:
- PostgreSQL at `localhost:5432`
- Spirit Relay at `http://localhost:4000`
- Demo App at `http://localhost:3000`

### 4. Start in Development Mode

```bash
# Terminal 1 – relay server
pnpm --filter @spirit-protocol/relay dev

# Terminal 2 – demo app
pnpm --filter @spirit-protocol/demo dev
```

---

## Core Package Usage

### Basic Setup (React)

```tsx
// app/providers.tsx
import { SpiritProvider } from '@spirit-protocol/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpiritProvider
      config={{
        relayUrl: 'http://localhost:4000',
        appName: 'My App',
        domain: 'myapp.com',
      }}
    >
      {children}
    </SpiritProvider>
  );
}
```

### Connect a Wallet

```tsx
import { useWallet } from '@spirit-protocol/react';

function ConnectButton() {
  const { connect, isConnecting, address } = useWallet();

  return (
    <button onClick={() => connect('metamask')}>
      {isConnecting ? 'Connecting…' : address ?? 'Connect MetaMask'}
    </button>
  );
}
```

### Sign In With Wallet (SIWE)

```tsx
import { useSession } from '@spirit-protocol/react';

function AuthButton() {
  const { authenticate, isAuthenticated, session, logout } = useSession();

  if (isAuthenticated) {
    return (
      <div>
        <p>Signed in as {session?.address}</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={() => authenticate('metamask')}>
      Sign In With Wallet
    </button>
  );
}
```

### Vanilla JS (no React)

```ts
import { createSpirit, ETHEREUM } from '@spirit-protocol/core';

const spirit = createSpirit({
  relayUrl: 'http://localhost:4000',
  appName: 'My App',
  domain: 'myapp.com',
  debug: true,
});

// Connect wallet
const { account } = await spirit.connect('metamask', ETHEREUM);
console.log('Connected:', account.address);

// Authenticate
const session = await spirit.authenticate('metamask', ETHEREUM);
console.log('JWT Token:', session.token);
```

### Detect Installed Wallets

```ts
import { WalletDetector } from '@spirit-protocol/core';

const installed = WalletDetector.detectInstalled();
installed.forEach(w => console.log(w.name, w.type));
```

---

## Authentication Flow

```
User clicks "Connect Wallet"
         │
         ▼
Detect wallet provider (EIP-1193 / Solana / Bitcoin API)
         │
         ▼
Request wallet accounts (eth_requestAccounts / connect())
         │
         ▼
POST /auth/nonce  →  server generates & stores nonce
         │
         ▼
Build SIWE / Solana / Bitcoin sign-in message
         │
         ▼
Wallet signs message (personal_sign / signMessage)
         │
         ▼
POST /auth/verify  →  server verifies signature + nonce
         │
         ▼
Issue JWT access token + refresh token
         │
         ▼
Store session in localStorage + DB
         │
         ▼
✅ Authenticated
```

---

## Relay Server API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/auth/nonce` | Generate a sign-in nonce |
| `POST` | `/auth/verify` | Verify signature + issue JWT |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Revoke session |
| `GET` | `/me` | Get current user (requires Bearer token) |
| `WS` | `/relay/ws` | WebSocket relay (QR pairing) |
| `GET` | `/relay/stats` | Relay connection stats |

---

## Security Architecture

| Feature | Implementation |
|---|---|
| **Nonce replay protection** | Nonces are SHA-256 hashed in DB; atomically marked `used = TRUE` on consumption |
| **Signature verification** | `ethers.verifyMessage` (EVM), `tweetnacl` ed25519 (Solana), `noble-secp256k1` (Bitcoin) |
| **Session expiration** | JWT expiry + DB `expires_at` column; background cleanup job |
| **Encrypted relay comms** | AES-256-GCM with HKDF-derived per-session keys |
| **Rate limiting** | `@fastify/rate-limit` – 60 req/min per IP by default |
| **Origin validation** | CORS configured per origin; `domain` field in sign-in message |
| **Secure WebSocket** | TLS (WSS) in production; per-client subscription limits |
| **No third-party APIs** | All verification is self-hosted; no WalletConnect cloud |

---

## Development Phases

| Phase | Status | Features |
|---|---|---|
| **Phase 1** | ✅ Complete | Injected browser wallets, EIP-1193, SIWE auth, JWT sessions |
| **Phase 2** | 🔄 In Progress | Mobile deep linking, auto-discovery, session persistence |
| **Phase 3** | 📋 Planned | QR pairing, custom relay, WalletConnect-like encrypted sessions |

---

## Future Expansion

- Account abstraction & smart wallets
- MPC wallet support
- Gasless authentication
- Social login bridge (email → wallet)
- zkLogin
- Cross-chain identity profiles
- Decentralized identity (DID)

---

## License

MIT © Spirit Protocol
