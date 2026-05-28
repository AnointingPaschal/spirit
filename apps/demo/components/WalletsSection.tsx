'use client';

interface WalletsSectionProps {
  onConnectClick: () => void;
}

const WALLET_GROUPS = [
  {
    type: 'EVM',
    color: 'cyan',
    chains: 'Ethereum · Base · Polygon · Arbitrum · Optimism · BNB · Avalanche',
    wallets: [
      { name: 'MetaMask', icon: '🦊' },
      { name: 'Rabby',    icon: '🐰' },
      { name: 'Coinbase', icon: '🔵' },
      { name: 'Trust',    icon: '🛡' },
      { name: 'OKX',      icon: '⭕' },
      { name: 'Brave',    icon: '🦁' },
    ],
  },
  {
    type: 'Solana',
    color: 'violet',
    chains: 'Solana Mainnet',
    wallets: [
      { name: 'Phantom',  icon: '👻' },
      { name: 'Solflare', icon: '🌞' },
      { name: 'Backpack', icon: '🎒' },
    ],
  },
  {
    type: 'Bitcoin',
    color: 'lime',
    chains: 'Bitcoin Mainnet',
    wallets: [
      { name: 'Xverse',  icon: '✖' },
      { name: 'Unisat',  icon: '🟠' },
      { name: 'Leather', icon: '🟫' },
    ],
  },
];

const BORDER_MAP: Record<string, string> = {
  cyan:   'border-cyan/20 hover:border-cyan/40',
  violet: 'border-violet/20 hover:border-violet/40',
  lime:   'border-lime/20 hover:border-lime/40',
};
const BADGE_MAP: Record<string, string> = {
  cyan:   'bg-cyan/10 text-cyan border-cyan/20',
  violet: 'bg-violet/10 text-violet border-violet/20',
  lime:   'bg-lime/10 text-lime border-lime/20',
};
const DOT_MAP: Record<string, string> = {
  cyan: 'bg-cyan', violet: 'bg-violet', lime: 'bg-lime',
};

export function WalletsSection({ onConnectClick }: WalletsSectionProps) {
  return (
    <section id="wallets" className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge bg-lime/10 text-lime border border-lime/20 mb-4">Ecosystem</span>
          <h2 className="font-display font-800 text-4xl md:text-5xl text-white mb-4">
            Every wallet. Every chain.
          </h2>
          <p className="text-ink text-lg max-w-xl mx-auto">
            Auto-detects installed wallets and adapts the UI accordingly. No configuration needed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {WALLET_GROUPS.map(group => (
            <div
              key={group.type}
              className={`card p-6 border ${BORDER_MAP[group.color]} transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className={`w-2 h-2 rounded-full ${DOT_MAP[group.color]}`} />
                <h3 className="font-display font-700 text-white text-lg">{group.type}</h3>
                <span className={`badge ${BADGE_MAP[group.color]} border ml-auto`}>
                  {group.wallets.length} wallets
                </span>
              </div>
              <p className="text-xs text-muted font-mono mb-5 leading-relaxed">{group.chains}</p>
              <div className="space-y-2">
                {group.wallets.map(w => (
                  <div key={w.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg/60 border border-[#0F1F35]">
                    <span className="text-lg leading-none">{w.icon}</span>
                    <span className="text-sm text-white font-display font-500">{w.name}</span>
                    <span className="ml-auto text-xs text-muted">○ auto-detect</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onConnectClick}
            className="btn-primary px-7 py-3 text-sm inline-flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Connect your wallet now
          </button>
          <p className="text-sm text-muted">
            Wallet detection runs client-side via EIP-1193 / Solana / Bitcoin provider APIs. No fingerprinting. No tracking.
          </p>
        </div>
      </div>
    </section>
  );
}
