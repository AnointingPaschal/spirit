'use client';
import { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { CodeBlock } from '../../components/CodeBlock';

// ─── Doc sections ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'introduction',  label: 'Introduction' },
  { id: 'quickstart',    label: 'Quick Start' },
  { id: 'installation',  label: 'Installation' },
  { id: 'react-sdk',     label: 'React SDK' },
  { id: 'vanilla-sdk',   label: 'Vanilla JS SDK' },
  { id: 'wallets',       label: 'Wallet Adapters' },
  { id: 'chains',        label: 'Chain Registry' },
  { id: 'auth-flow',     label: 'Auth Flow' },
  { id: 'session',       label: 'Session Management' },
  { id: 'relay',         label: 'Relay Server' },
  { id: 'api',           label: 'API Reference' },
  { id: 'security',      label: 'Security' },
  { id: 'deployment',    label: 'Deployment' },
];

// ─── Code snippets ────────────────────────────────────────────────────────────
const SNIPPETS = {
  install: `# pnpm (recommended)
pnpm add @spirit-protocol/core @spirit-protocol/react

# npm
npm install @spirit-protocol/core @spirit-protocol/react

# yarn
yarn add @spirit-protocol/core @spirit-protocol/react`,

  provider: `// app/providers.tsx
import { SpiritProvider } from '@spirit-protocol/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpiritProvider
      config={{
        relayUrl: process.env.NEXT_PUBLIC_RELAY_URL, // optional
        appName: 'My App',
        appUrl: 'https://myapp.com',
        domain: 'myapp.com',
        sessionDuration: 86400,   // 24h in seconds
        autoReconnect: true,
        debug: false,
      }}
    >
      {children}
    </SpiritProvider>
  );
}`,

  useWallet: `import { useWallet } from '@spirit-protocol/react';

export function ConnectButton() {
  const {
    wallets,          // all known wallets with installed flag
    installedWallets, // only detected wallets
    address,          // connected wallet address
    chain,            // current chain
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
  } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <button
          onClick={() => connect('metamask')}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting…' : 'Connect MetaMask'}
        </button>
      ) : (
        <div>
          <p>{address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  );
}`,

  useSession: `import { useSession } from '@spirit-protocol/react';

export function AuthSection() {
  const {
    session,           // AuthSession | null
    isAuthenticated,
    isAuthenticating,
    token,             // JWT string | null
    address,
    authenticate,
    logout,
  } = useSession();

  if (isAuthenticated) {
    return (
      <div>
        <p>Signed in as: {address}</p>
        <p>JWT: {token}</p>
        <p>Expires: {new Date(session!.expiresAt).toLocaleString()}</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => authenticate('metamask')}
      disabled={isAuthenticating}
    >
      {isAuthenticating ? 'Signing…' : 'Sign In With Wallet'}
    </button>
  );
}`,

  useChain: `import { useChain } from '@spirit-protocol/react';

export function ChainInfo() {
  const { chain, evmChains, allChains, switchChain } = useChain();

  return (
    <div>
      <p>Current chain: {chain?.name}</p>
      <select onChange={(e) => switchChain(parseInt(e.target.value))}>
        {evmChains.map((c) => (
          <option key={c.id} value={c.chainId}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}`,

  vanillaConnect: `import { createSpirit, ETHEREUM, BASE } from '@spirit-protocol/core';

// Initialize the SDK
const spirit = createSpirit({
  relayUrl: 'https://relay.myapp.com',
  appName: 'My App',
  domain: 'myapp.com',
  debug: true,
});

// Detect what's installed
const wallets = spirit.detectWallets();
const installed = spirit.getInstalledWallets();
console.log('Installed:', installed.map(w => w.name));

// Connect a wallet
const { account } = await spirit.connect('metamask', ETHEREUM);
console.log('Address:', account.address);
console.log('Chain:', account.chain.name);`,

  vanillaAuth: `// Full authentication (connect + sign + verify)
const session = await spirit.authenticate('metamask', BASE, {
  // Optional: bring your own nonce endpoint
  fetchNonce: async () => {
    const res = await fetch('/api/nonce', { method: 'POST' });
    return res.json(); // { nonce: string, expiresAt: number }
  },
  // Optional: bring your own verify endpoint
  verify: async (payload) => {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json(); // { valid: boolean, session?: AuthSession }
  },
});

console.log('JWT token:', session.token);
console.log('Address:',   session.address);
console.log('Wallet ID:', session.walletId);
console.log('Expires:',   new Date(session.expiresAt).toISOString());`,

  walletAdapters: `import {
  WalletDetector,
  MetaMaskAdapter,
  PhantomAdapter,
  UnisatAdapter,
} from '@spirit-protocol/core';

// Auto-detect all wallets
const all       = WalletDetector.detectAll();
const installed = WalletDetector.detectInstalled();
const evmOnly   = WalletDetector.detectForChainType('evm');

// Get a specific adapter
const metamask = WalletDetector.getAdapter('metamask');
if (metamask?.isInstalled()) {
  const result = await metamask.connect(ETHEREUM);
  const sig    = await metamask.signMessage('hello');
  await metamask.switchChain(8453); // switch to Base
}

// Listen for wallet events
metamask?.on('accountsChanged', (accounts) => {
  console.log('New accounts:', accounts);
});
metamask?.on('chainChanged', (chainId) => {
  console.log('New chain:', chainId);
});
metamask?.on('disconnect', () => {
  console.log('Wallet disconnected');
});`,

  chainRegistry: `import {
  ETHEREUM, BASE, POLYGON, ARBITRUM, OPTIMISM,
  BNB_CHAIN, AVALANCHE, SOLANA, BITCOIN,
  CHAIN_REGISTRY,
  getChainById,
  getChainByChainId,
  EVM_CHAINS,
} from '@spirit-protocol/core';

// Access any chain
console.log(ETHEREUM.name);       // "Ethereum"
console.log(ETHEREUM.chainId);    // 1
console.log(ETHEREUM.rpcUrls);    // ["https://eth.llamarpc.com", ...]

// Look up by string ID
const base = getChainById('base');

// Look up by numeric chainId
const poly = getChainByChainId(137);

// All EVM chains as array
EVM_CHAINS.forEach(c => console.log(c.name, c.chainId));`,

  authFlow: `// The authentication flow Spirit runs under the hood:

// 1. Detect wallet provider
const provider = window.ethereum; // EIP-1193

// 2. Connect wallet
const accounts = await provider.request({ method: 'eth_requestAccounts' });
const address  = accounts[0];

// 3. Fetch nonce from relay
const { nonce } = await fetch('/auth/nonce', {
  method: 'POST',
  body: JSON.stringify({ address }),
}).then(r => r.json());

// 4. Build SIWE message (EIP-4361)
const message = \`myapp.com wants you to sign in with your Ethereum account:
\${address}

Sign in with Spirit Protocol.

URI: https://myapp.com
Version: 1
Chain ID: 1
Nonce: \${nonce}
Issued At: \${new Date().toISOString()}\`;

// 5. Request signature
const hexMsg  = '0x' + Buffer.from(message).toString('hex');
const signature = await provider.request({
  method: 'personal_sign',
  params: [hexMsg, address],
});

// 6. Verify on server
const { valid, session } = await fetch('/auth/verify', {
  method: 'POST',
  body: JSON.stringify({ message, signature, address, nonce, chainType: 'evm' }),
}).then(r => r.json());

// 7. Store session — JWT + refresh token issued
localStorage.setItem('spirit:session', JSON.stringify(session));`,

  sessionManager: `import { SessionManager } from '@spirit-protocol/core';

const sessions = new SessionManager('my-app:session');

// Store a session after authentication
sessions.set(session);

// Check auth status
if (sessions.isAuthenticated()) {
  const token   = sessions.getToken();   // JWT string
  const address = sessions.getAddress(); // wallet address
  const expires = sessions.expiresIn();  // seconds until expiry
}

// Auto-clears expired sessions on get()
const current = sessions.get(); // AuthSession | null

// Clear on logout
sessions.clear();`,

  relayServer: `# Start with Docker Compose (recommended)
docker-compose up postgres relay -d

# Or run manually:
cd apps/relay
cp .env.example .env   # configure JWT_SECRET and DATABASE_URL
pnpm dev               # starts on port 4000`,

  relayEnv: `# apps/relay/.env
NODE_ENV=production
PORT=4000

# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/spirit

# JWT — generate with: openssl rand -hex 32
JWT_SECRET=your-super-secret-key-at-least-32-chars
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=30d

# CORS — comma-separated origins
CORS_ORIGIN=https://myapp.com,https://www.myapp.com

# Rate limiting
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW=60000`,

  protectedRoute: `// Protect your API routes with the JWT the relay issues

// Next.js App Router API Route
export async function GET(req: Request) {
  const token = req.headers.get('Authorization')?.slice(7);
  if (!token) return new Response('Unauthorized', { status: 401 });

  // Verify against Spirit Relay
  const res = await fetch(\`\${process.env.RELAY_URL}/me\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });

  if (!res.ok) return new Response('Unauthorized', { status: 401 });

  const user = await res.json();
  // { address, walletId, chainId, chainType, sessionId, expiresAt }

  return Response.json({ message: \`Hello \${user.address}\` });
}`,

  cryptoVerify: `import {
  verifySignature,
  verifyEVMSignature,
  verifySolanaSignature,
  verifyBitcoinSignature,
} from '@spirit-protocol/core';

// Universal verifier (auto-picks by chainType)
const valid = await verifySignature({
  message,
  signature,
  address,
  chainType: 'evm', // 'evm' | 'solana' | 'bitcoin'
});

// Chain-specific verifiers
const evmValid = await verifyEVMSignature(message, sig, address);
const solValid = await verifySolanaSignature(message, sig, pubkeyBase58);
const btcValid = await verifyBitcoinSignature(message, sig, address);`,

  vercelDeploy: `# 1. Push apps/web to Vercel
cd apps/web
vercel --prod

# 2. Set environment variable in Vercel dashboard:
#    NEXT_PUBLIC_RELAY_URL = https://your-relay.railway.app

# Or deploy all at once via vercel.json:`,

  vercelJson: `{
  "version": 2,
  "builds": [
    { "src": "apps/web/package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "apps/web/$1" }
  ]
}`,

  railwayDeploy: `# Deploy relay server to Railway
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy from repo root
railway login
railway init
railway up

# 3. Set environment variables in Railway dashboard:
#    DATABASE_URL (Railway auto-provisions Postgres)
#    JWT_SECRET = $(openssl rand -hex 32)
#    CORS_ORIGIN = https://your-vercel-app.vercel.app`,
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [active, setActive] = useState('introduction');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-[#0F1F35] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto pt-8 pb-12 px-4">
          <p className="text-xs font-display font-700 text-muted uppercase tracking-widest px-3 mb-3">
            Documentation
          </p>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-display transition-all ${
                  active === s.id
                    ? 'bg-cyan/10 text-cyan font-600'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {active === s.id && <span className="w-1 h-1 rounded-full bg-cyan flex-shrink-0" />}
                {s.label}
              </a>
            ))}
          </nav>

          {/* Quick links */}
          <div className="mt-8 px-3">
            <p className="text-xs text-muted uppercase tracking-widest mb-3 font-display font-700">Links</p>
            <a href="https://github.com/AnointingPaschal/spirit" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors py-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </a>
            <a href="/demo" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors py-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Live Demo
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-20">

          {/* Introduction */}
          <DocSection id="introduction" title="Introduction" onVisible={setActive}>
            <p className="text-ink leading-relaxed mb-4">
              Spirit Protocol is a fully decentralized, self-hosted wallet authentication system that works across EVM chains, Solana, and Bitcoin. It requires no third-party authentication APIs — all signature verification happens cryptographically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '⛓', label: '9 Chains', desc: 'ETH, Base, Polygon, ARB, OP, BNB, AVAX, SOL, BTC' },
                { icon: '👛', label: '12 Wallets', desc: 'MetaMask, Phantom, Xverse and 9 more' },
                { icon: '🔐', label: 'Zero APIs', desc: 'No WalletConnect. No Infura. Fully self-hosted.' },
              ].map((f) => (
                <div key={f.label} className="card p-4">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="font-display font-700 text-white text-sm mb-1">{f.label}</p>
                  <p className="text-xs text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Quick Start */}
          <DocSection id="quickstart" title="Quick Start" badge="5 minutes" onVisible={setActive}>
            <p className="text-ink mb-6">Get Spirit running in your Next.js app in under 5 minutes.</p>
            <Steps steps={[
              { label: 'Install packages', content: <CodeBlock code={SNIPPETS.install} language="bash" filename="terminal" /> },
              { label: 'Wrap your app with SpiritProvider', content: <CodeBlock code={SNIPPETS.provider} filename="app/providers.tsx" /> },
              { label: 'Use the hooks in your components', content: <CodeBlock code={SNIPPETS.useWallet} filename="components/ConnectButton.tsx" /> },
              { label: '(Optional) Start the relay server for full auth', content: <CodeBlock code={SNIPPETS.relayServer} language="bash" filename="terminal" /> },
            ]} />
          </DocSection>

          {/* Installation */}
          <DocSection id="installation" title="Installation" onVisible={setActive}>
            <p className="text-ink mb-4">Spirit is a pnpm monorepo. Install individual packages based on your needs:</p>
            <div className="space-y-4">
              <InfoCard
                title="@spirit-protocol/core"
                badge="Required"
                badgeColor="cyan"
                desc="Framework-agnostic SDK. Wallet adapters, crypto utilities, session manager, relay client."
              />
              <InfoCard
                title="@spirit-protocol/react"
                badge="Optional"
                badgeColor="violet"
                desc="React hooks and SpiritProvider context. Requires @spirit-protocol/core as peer dependency."
              />
              <InfoCard
                title="apps/relay"
                badge="Optional"
                badgeColor="lime"
                desc="Self-hosted Fastify relay server. Needed for server-side signature verification and JWT issuance."
              />
            </div>
            <div className="mt-6">
              <CodeBlock code={SNIPPETS.install} language="bash" filename="terminal" />
            </div>
          </DocSection>

          {/* React SDK */}
          <DocSection id="react-sdk" title="React SDK" onVisible={setActive}>
            <p className="text-ink mb-6">Three primary hooks cover 95% of use cases.</p>

            <SubSection title="SpiritProvider">
              <p className="text-ink text-sm mb-4">Wrap your root layout (or _app.tsx) once. All hooks become available to child components.</p>
              <CodeBlock code={SNIPPETS.provider} filename="app/providers.tsx" />
            </SubSection>

            <SubSection title="useWallet()">
              <p className="text-ink text-sm mb-4">Manages wallet connection state, installed wallet detection, and account/chain info.</p>
              <CodeBlock code={SNIPPETS.useWallet} filename="components/ConnectButton.tsx" />
            </SubSection>

            <SubSection title="useSession()">
              <p className="text-ink text-sm mb-4">Manages authentication — sign-in with wallet, JWT tokens, and logout.</p>
              <CodeBlock code={SNIPPETS.useSession} filename="components/AuthSection.tsx" />
            </SubSection>

            <SubSection title="useChain()">
              <p className="text-ink text-sm mb-4">Access the current chain and switch between EVM networks.</p>
              <CodeBlock code={SNIPPETS.useChain} filename="components/ChainInfo.tsx" />
            </SubSection>
          </DocSection>

          {/* Vanilla SDK */}
          <DocSection id="vanilla-sdk" title="Vanilla JS SDK" onVisible={setActive}>
            <p className="text-ink mb-6">Use Spirit without React — works with Vue, Svelte, Angular, or plain TypeScript.</p>

            <SubSection title="Connect a wallet">
              <CodeBlock code={SNIPPETS.vanillaConnect} filename="main.ts" />
            </SubSection>

            <SubSection title="Authenticate (full flow)">
              <CodeBlock code={SNIPPETS.vanillaAuth} filename="auth.ts" />
            </SubSection>
          </DocSection>

          {/* Wallet Adapters */}
          <DocSection id="wallets" title="Wallet Adapters" onVisible={setActive}>
            <p className="text-ink mb-6">Each wallet has a typed adapter that handles detection, connection, signing, and events.</p>
            <CodeBlock code={SNIPPETS.walletAdapters} filename="wallets.ts" />

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border border-[#0F1F35] rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-surface text-left">
                    <th className="px-4 py-3 text-xs font-display font-700 text-muted uppercase tracking-wider">Wallet ID</th>
                    <th className="px-4 py-3 text-xs font-display font-700 text-muted uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-display font-700 text-muted uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-display font-700 text-muted uppercase tracking-wider">Signing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1F35]">
                  {[
                    ['metamask','MetaMask','EVM','personal_sign (EIP-191)'],
                    ['rabby','Rabby','EVM','personal_sign (EIP-191)'],
                    ['coinbase','Coinbase Wallet','EVM','personal_sign (EIP-191)'],
                    ['trust','Trust Wallet','EVM','personal_sign (EIP-191)'],
                    ['okx','OKX Wallet','EVM','personal_sign (EIP-191)'],
                    ['brave','Brave Wallet','EVM','personal_sign (EIP-191)'],
                    ['phantom','Phantom','Solana','Ed25519 signMessage'],
                    ['solflare','Solflare','Solana','Ed25519 signMessage'],
                    ['backpack','Backpack','Solana','Ed25519 signMessage'],
                    ['unisat','Unisat','Bitcoin','ECDSA signMessage'],
                    ['xverse','Xverse','Bitcoin','ECDSA signMessage'],
                    ['leather','Leather','Bitcoin','ECDSA signMessage'],
                  ].map(([id,name,type,signing]) => (
                    <tr key={id} className="bg-bg/40 hover:bg-bg/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-cyan text-xs">{id}</td>
                      <td className="px-4 py-3 text-white">{name}</td>
                      <td className="px-4 py-3"><span className={`badge ${type==='EVM'?'bg-cyan/10 text-cyan border-cyan/20':type==='Solana'?'bg-violet/10 text-violet border-violet/20':'bg-lime/10 text-lime border-lime/20'} border`}>{type}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{signing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          {/* Chain Registry */}
          <DocSection id="chains" title="Chain Registry" onVisible={setActive}>
            <p className="text-ink mb-6">All chains are pre-configured with public RPC endpoints. No environment variables needed for basic use.</p>
            <CodeBlock code={SNIPPETS.chainRegistry} filename="chains.ts" />
          </DocSection>

          {/* Auth Flow */}
          <DocSection id="auth-flow" title="Authentication Flow" onVisible={setActive}>
            <p className="text-ink mb-6">Under the hood, Spirit runs a 7-step cryptographic authentication flow for every wallet type.</p>
            <CodeBlock code={SNIPPETS.authFlow} filename="auth-flow.ts" />
            <div className="mt-6 card p-5">
              <p className="text-xs font-display font-700 text-muted uppercase tracking-widest mb-4">Flow diagram</p>
              <div className="space-y-2">
                {[
                  ['1','Detect provider','window.ethereum / window.solana / window.unisat','cyan'],
                  ['2','Connect','eth_requestAccounts → address','cyan'],
                  ['3','Generate nonce','32-byte crypto.getRandomValues() + SHA-256 hash','violet'],
                  ['4','Build message','SIWE (EVM) / custom (Solana, Bitcoin)','violet'],
                  ['5','Sign','personal_sign / signMessage / signMessage','lime'],
                  ['6','Verify','ethers.verifyMessage / tweetnacl / noble-secp256k1','lime'],
                  ['7','Issue JWT','HS256 access token + refresh token → session','cyan'],
                ].map(([n,title,detail,color]) => (
                  <div key={n} className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-display font-700 ${color==='cyan'?'bg-cyan/15 text-cyan':color==='violet'?'bg-violet/15 text-violet':'bg-lime/15 text-lime'}`}>{n}</span>
                    <div>
                      <p className="text-sm font-display font-600 text-white">{title}</p>
                      <p className="text-xs text-muted font-mono">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DocSection>

          {/* Session */}
          <DocSection id="session" title="Session Management" onVisible={setActive}>
            <p className="text-ink mb-6">Sessions are dual-token: a short-lived JWT access token (1h) and a long-lived refresh token (30d), both stored in localStorage with server-side persistence in PostgreSQL.</p>
            <CodeBlock code={SNIPPETS.sessionManager} filename="session.ts" />

            <SubSection title="Protecting API routes">
              <CodeBlock code={SNIPPETS.protectedRoute} filename="app/api/protected/route.ts" />
            </SubSection>
          </DocSection>

          {/* Relay */}
          <DocSection id="relay" title="Relay Server" onVisible={setActive}>
            <p className="text-ink mb-6">The relay is a Fastify server that handles nonce issuance, signature verification, JWT minting, and WebSocket pub/sub for QR pairing.</p>

            <SubSection title="Environment configuration">
              <CodeBlock code={SNIPPETS.relayEnv} language="bash" filename="apps/relay/.env" />
            </SubSection>

            <SubSection title="API endpoints">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-[#0F1F35] rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-surface">
                      <th className="px-4 py-3 text-left text-xs font-display font-700 text-muted uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-display font-700 text-muted uppercase tracking-wider">Path</th>
                      <th className="px-4 py-3 text-left text-xs font-display font-700 text-muted uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F1F35]">
                    {[
                      ['GET','green','/health','Health check'],
                      ['POST','cyan','/auth/nonce','Generate sign-in nonce'],
                      ['POST','cyan','/auth/verify','Verify signature + issue JWT'],
                      ['POST','cyan','/auth/refresh','Refresh access token'],
                      ['POST','red','/auth/logout','Revoke session'],
                      ['GET','green','/me','Current user (Bearer token required)'],
                      ['WS','violet','/relay/ws','WebSocket relay (QR pairing)'],
                      ['GET','green','/relay/stats','Connection stats'],
                    ].map(([method,color,path,desc]) => (
                      <tr key={path} className="bg-bg/40">
                        <td className="px-4 py-3">
                          <span className={`badge border text-xs ${
                            color==='green'?'bg-lime/10 text-lime border-lime/20':
                            color==='cyan'?'bg-cyan/10 text-cyan border-cyan/20':
                            color==='violet'?'bg-violet/10 text-violet border-violet/20':
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>{method}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-white">{path}</td>
                        <td className="px-4 py-3 text-sm text-muted">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>
          </DocSection>

          {/* API Reference */}
          <DocSection id="api" title="API Reference" onVisible={setActive}>
            <p className="text-ink mb-6">Core cryptographic utilities available for advanced use cases.</p>
            <CodeBlock code={SNIPPETS.cryptoVerify} filename="verify.ts" />
          </DocSection>

          {/* Security */}
          <DocSection id="security" title="Security" onVisible={setActive}>
            <p className="text-ink mb-6">Spirit is designed with a security-first mindset. Every component has explicit protections.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Nonce replay protection', desc: 'Nonces are SHA-256 hashed before storage. The server atomically marks them used — a SELECT then UPDATE in one transaction prevents race-condition replay.' },
                { title: 'Cryptographic verification', desc: 'ethers.verifyMessage for EVM (ECDSA), tweetnacl for Solana (Ed25519), and @noble/secp256k1 for Bitcoin. All industry-standard.' },
                { title: 'AES-256-GCM relay encryption', desc: 'Relay messages use AES-256-GCM with a 96-bit random IV per message. Keys are derived via HKDF-SHA256.' },
                { title: 'Rate limiting', desc: '60 requests/minute per IP by default. Configurable via RATE_LIMIT_MAX and RATE_LIMIT_WINDOW env vars.' },
                { title: 'CORS origin validation', desc: 'Relay server validates Origin headers. Configure CORS_ORIGIN with your exact frontend URLs.' },
                { title: 'Session expiry + cleanup', desc: 'Access tokens expire in 1h. Refresh tokens in 30d. A background job cleans expired records every 60s.' },
                { title: 'No third-party trust', desc: 'Zero calls to WalletConnect, Infura, Alchemy, or any hosted service. All verification is local.' },
                { title: 'Wallet ownership proof', desc: 'The sign-in message includes domain, URI, nonce, and timestamp. Replay on another domain is impossible.' },
              ].map((s) => (
                <div key={s.title} className="card p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <svg className="w-4 h-4 text-lime mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                    </svg>
                    <p className="font-display font-600 text-white text-sm">{s.title}</p>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Deployment */}
          <DocSection id="deployment" title="Deployment" onVisible={setActive}>
            <p className="text-ink mb-6">Deploy the web app to Vercel and the relay server to Railway (or any Node.js host).</p>

            <SubSection title="Web app → Vercel">
              <CodeBlock code={SNIPPETS.vercelDeploy} language="bash" filename="terminal" />
            </SubSection>

            <SubSection title="vercel.json (monorepo)">
              <CodeBlock code={SNIPPETS.vercelJson} language="json" filename="vercel.json" />
            </SubSection>

            <SubSection title="Relay server → Railway">
              <CodeBlock code={SNIPPETS.railwayDeploy} language="bash" filename="terminal" />
            </SubSection>

            <div className="card p-5 border-cyan/20 mt-4">
              <p className="text-sm font-display font-600 text-cyan mb-2">💡 Tip: Environment variables</p>
              <p className="text-sm text-muted">Set <code className="text-cyan font-mono">NEXT_PUBLIC_RELAY_URL</code> in Vercel to point to your Railway relay URL. The demo works client-only even without a relay (local signature verification fallback).</p>
            </div>
          </DocSection>

        </main>
      </div>
      <Footer />
    </div>
  );
}

// ─── Doc section wrapper ──────────────────────────────────────────────────────
function DocSection({ id, title, badge, children, onVisible }: {
  id: string; title: string; badge?: string;
  children: React.ReactNode; onVisible: (id: string) => void;
}) {
  return (
    <section id={id} className="scroll-mt-24" onMouseEnter={() => onVisible(id)}>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display font-800 text-2xl text-white">{title}</h2>
        {badge && <span className="badge bg-cyan/10 text-cyan border border-cyan/20">{badge}</span>}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display font-600 text-white text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-cyan rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoCard({ title, badge, badgeColor, desc }: { title: string; badge: string; badgeColor: string; desc: string }) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan/10 text-cyan border-cyan/20',
    violet: 'bg-violet/10 text-violet border-violet/20',
    lime: 'bg-lime/10 text-lime border-lime/20',
  };
  return (
    <div className="card p-4 flex items-start gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-mono text-sm text-white">{title}</p>
          <span className={`badge border ${colors[badgeColor]}`}>{badge}</span>
        </div>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </div>
  );
}

function Steps({ steps }: { steps: { label: string; content: React.ReactNode }[] }) {
  return (
    <div className="space-y-6">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-cyan/15 border border-cyan/30 flex items-center justify-center text-xs font-display font-700 text-cyan flex-shrink-0">{i+1}</div>
            {i < steps.length - 1 && <div className="w-px flex-1 bg-[#0F1F35] mt-2" />}
          </div>
          <div className="flex-1 pb-2">
            <p className="font-display font-600 text-white mb-3">{s.label}</p>
            {s.content}
          </div>
        </div>
      ))}
    </div>
  );
}
