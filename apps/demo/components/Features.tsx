'use client';

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
      </svg>
    ),
    color: 'cyan',
    title: 'Cryptographic Auth',
    desc: 'ECDSA for EVM, Ed25519 for Solana, secp256k1 for Bitcoin. Every signature verified on-chain without third parties.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
      </svg>
    ),
    color: 'violet',
    title: 'Multi-Chain Native',
    desc: 'EVM (7 networks), Solana, and Bitcoin from a single SDK. Chain-agnostic architecture via modular adapters.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"/>
      </svg>
    ),
    color: 'lime',
    title: 'Self-Hosted Relay',
    desc: 'Your own WebSocket relay server. AES-256-GCM encrypted pairing sessions. No WalletConnect cloud dependency.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
      </svg>
    ),
    color: 'cyan',
    title: 'React SDK',
    desc: 'Drop-in hooks: useWallet(), useSession(), useChain(). SpiritProvider wraps your app in one line.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
      </svg>
    ),
    color: 'violet',
    title: 'Nonce Replay Protection',
    desc: 'SHA-256 hashed nonces with atomic DB updates. Prevents replay attacks even under race conditions.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/>
      </svg>
    ),
    color: 'lime',
    title: 'Vanilla JS SDK',
    desc: 'Framework-agnostic core. Use with Vue, Svelte, Angular, or plain TypeScript. Zero framework lock-in.',
  },
];

const COLOR_MAP: Record<string, string> = {
  cyan: 'bg-cyan/10 text-cyan border-cyan/20',
  violet: 'bg-violet/10 text-violet border-violet/20',
  lime: 'bg-lime/10 text-lime border-lime/20',
};

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge bg-violet/10 text-violet border border-violet/20 mb-4">
            Protocol Features
          </span>
          <h2 className="font-display font-800 text-4xl md:text-5xl text-white mb-4">
            Built for the open web
          </h2>
          <p className="text-ink text-lg max-w-xl mx-auto">
            Everything you need to add wallet authentication to your app — no sign-ups, no API keys, no vendor lock-in.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-glow p-6 group hover:border-[#1A3050] transition-all duration-300">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${COLOR_MAP[f.color]} mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-display font-700 text-white text-lg mb-2">{f.title}</h3>
              <p className="text-ink text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
