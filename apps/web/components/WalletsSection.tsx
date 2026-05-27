'use client';

const WALLET_GROUPS = [
  {
    type: 'EVM',
    color: 'cyan',
    chains: 'Ethereum · Base · Polygon · Arbitrum · Optimism · BNB · Avalanche',
    wallets: [
      { name: 'MetaMask', icon: '🦊', installed: true },
      { name: 'Rabby', icon: '🐰', installed: false },
      { name: 'Coinbase', icon: '🔵', installed: false },
      { name: 'Trust Wallet', icon: '🛡', installed: false },
      { name: 'OKX Wallet', icon: '⭕', installed: false },
      { name: 'Brave', icon: '🦁', installed: false },
    ],
  },
  {
    type: 'Solana',
    color: 'violet',
    chains: 'Solana Mainnet',
    wallets: [
      { name: 'Phantom', icon: '👻', installed: false },
      { name: 'Solflare', icon: '🌞', installed: false },
      { name: 'Backpack', icon: '🎒', installed: false },
    ],
  },
  {
    type: 'Bitcoin',
    color: 'lime',
    chains: 'Bitcoin Mainnet',
    wallets: [
      { name: 'Xverse', icon: '✖', installed: false },
      { name: 'Unisat', icon: '🟠', installed: false },
      { name: 'Leather', icon: '🟫', installed: false },
    ],
  },
];

const BORDER_MAP: Record<string, string> = {
  cyan: 'border-cyan/20 hover:border-cyan/40',
  violet: 'border-violet/20 hover:border-violet/40',
  lime: 'border-lime/20 hover:border-lime/40',
};

const BADGE_MAP: Record<string, string> = {
  cyan: 'bg-cyan/10 text-cyan border-cyan/20',
  violet: 'bg-violet/10 text-violet border-violet/20',
  lime: 'bg-lime/10 text-lime border-lime/20',
};

const DOT_MAP: Record<string, string> = {
  cyan: 'bg-cyan',
  violet: 'bg-violet',
  lime: 'bg-lime',
};

export function WalletsSection() {
  return (
    <section id="wallets" className="py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge bg-lime/10 text-lime border border-lime/20 mb-4">
            Ecosystem
          </span>
          <h2 className="font-display font-800 text-4xl md:text-5xl text-white mb-4">
            Every wallet. Every chain.
          </h2>
          <p className="text-ink text-lg max-w-xl mx-auto">
            Auto-detects installed wallets and adapts the UI accordingly. No configuration needed.
          </p>
        </div>

        {/* Wallet groups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {WALLET_GROUPS.map((group) => (
            <div
              key={group.type}
              className={`card p-6 border ${BORDER_MAP[group.color]} transition-all duration-300`}
            >
              {/* Group header */}
              <div className="flex items-center gap-3 mb-5">
                <span className={`w-2 h-2 rounded-full ${DOT_MAP[group.color]}`} />
                <h3 className="font-display font-700 text-white text-lg">{group.type}</h3>
                <span className={`badge ${BADGE_MAP[group.color]} border ml-auto`}>
                  {group.wallets.length} wallets
                </span>
              </div>

              {/* Chain list */}
              <p className="text-xs text-muted font-mono mb-5 leading-relaxed">{group.chains}</p>

              {/* Wallet list */}
              <div className="space-y-2">
                {group.wallets.map((w) => (
                  <div
                    key={w.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg/60 border border-[#0F1F35]"
                  >
                    <span className="text-lg leading-none">{w.icon}</span>
                    <span className="text-sm text-white font-display font-500">{w.name}</span>
                    <span className={`ml-auto text-xs ${w.installed ? 'text-lime' : 'text-muted'}`}>
                      {w.installed ? '● detected' : '○ auto-detect'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted mt-8">
          Wallet detection runs client-side via EIP-1193 / Solana / Bitcoin provider APIs.
          No fingerprinting. No tracking.
        </p>
      </div>
    </section>
  );
}
