import Link from 'next/link';

const installSnippet = `pnpm add @spirit-protocol/core @spirit-protocol/react`;

const providerSnippet = `import { SpiritProvider } from '@spirit-protocol/react';

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
}`;

const hookSnippet = `import { useWallet, useSession } from '@spirit-protocol/react';

export function AuthCard() {
  const { connect, disconnect, address, connectedWalletId } = useWallet();
  const { authenticate, isAuthenticated, session } = useSession();

  return (
    <>
      <button onClick={() => connect('metamask')}>Connect Wallet</button>
      <button onClick={() => authenticate(connectedWalletId!, undefined)}>
        Sign In with Wallet
      </button>
      {isAuthenticated && <p>{session?.address}</p>}
      <button onClick={() => void disconnect()}>Disconnect</button>
    </>
  );
}`;


const vercelSteps = [
  'Push this repository to GitHub, GitLab, or Bitbucket.',
  'In Vercel, click "Add New Project" and import the repo.',
  'Set Root Directory to apps/demo.',
  'Set Build Command to pnpm turbo run build --filter=@spirit-protocol/demo.',
  'Set Install Command to pnpm install --frozen-lockfile.',
  'Add NEXT_PUBLIC_RELAY_URL (and any auth env values your app needs).',
  'Deploy and your docs page will be available at /docs.',
];

export default function DocsPage() {
  return (
    <main className="min-h-screen px-6 py-14 md:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-sky-300">Developer Docs</p>
            <h1 className="text-4xl font-semibold text-white md:text-5xl">Integrate Spirit Protocol in minutes</h1>
            <p className="mt-4 max-w-3xl text-gray-300">
              A clean, production-ready auth layer for wallet sign-in across EVM, Solana, and Bitcoin.
              Use this guide to install, configure, and ship wallet-based authentication in your own app.
            </p>
          </div>
          <Link href="/" className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-sky-400 hover:text-white">
            Open Demo App
          </Link>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            ['Wallet Auth', 'Signature-based login, no passwords'],
            ['Multi-Chain', 'EVM, Solana, and Bitcoin support'],
            ['Self-Hosted', 'Run your own relay and database'],
          ].map(([title, desc]) => (
            <article key={title} className="glass-card p-5">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-gray-400">{desc}</p>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <article className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white">1) Install SDK packages</h3>
            <p className="mt-2 text-sm text-gray-300">Install React bindings and core SDK in your project.</p>
            <pre className="code-block mt-4"><code>{installSnippet}</code></pre>
          </article>

          <article className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white">2) Add the provider</h3>
            <p className="mt-2 text-sm text-gray-300">Wrap your app with <code>SpiritProvider</code> to share wallet state and auth methods.</p>
            <pre className="code-block mt-4"><code>{providerSnippet}</code></pre>
          </article>

          <article className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white">3) Connect + authenticate with hooks</h3>
            <p className="mt-2 text-sm text-gray-300">Use the built-in hooks to connect wallets and run signature auth.</p>
            <pre className="code-block mt-4"><code>{hookSnippet}</code></pre>
          </article>

          <article className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white">4) Deploy on Vercel</h3>
            <p className="mt-2 text-sm text-gray-300">Use this setup to host the demo and docs UI with zero custom server setup.</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-300">
              {vercelSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white">5) Relay server endpoints</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-300">
              <li><code>POST /auth/nonce</code> issues challenge nonces.</li>
              <li><code>POST /auth/verify</code> verifies signatures and returns JWT tokens.</li>
              <li><code>POST /auth/refresh</code> rotates access tokens from refresh tokens.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
