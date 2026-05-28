'use client';

interface HeroProps {
  onConnectClick: () => void;
}

export function Hero({ onConnectClick }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet/5 blur-[80px] rounded-full pointer-events-none" />
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent pointer-events-none"
        style={{ animation: 'scan 10s linear infinite', top: 0 }}
      />

      <div className="relative max-w-6xl mx-auto px-6 text-center stagger">
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="badge bg-cyan/10 text-cyan border border-cyan/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-[glow-pulse_2s_ease-in-out_infinite]" />
            Open Source · Self-Hosted
          </span>
        </div>

        <h1 className="font-display font-800 text-5xl md:text-7xl lg:text-8xl leading-[1.0] tracking-tight mb-6">
          <span className="text-white">Auth across</span>
          <br />
          <span className="text-gradient-cyan">every chain.</span>
        </h1>

        <p className="text-ink text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Spirit Protocol connects{' '}
          <span className="text-white font-500">12 wallets</span> across{' '}
          <span className="text-white font-500">9 chains</span> — EVM, Solana, and Bitcoin —
          with cryptographic signature verification and zero third-party APIs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* ← This now opens the modal */}
          <button
            onClick={onConnectClick}
            className="btn-primary px-8 py-3.5 text-base inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Connect your wallet
          </button>
          <a href="/docs" className="btn-ghost px-8 py-3.5 text-base inline-flex items-center justify-center gap-2">
            Read the docs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-px max-w-lg mx-auto rounded-2xl overflow-hidden border border-[#0F1F35]">
          {[
            { value: '12', label: 'Wallets' },
            { value: '9',  label: 'Chains' },
            { value: '0',  label: 'Third-party APIs' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface/80 px-6 py-5 text-center">
              <div className="font-display font-800 text-2xl text-gradient-cyan">{stat.value}</div>
              <div className="text-xs text-muted mt-1 font-display uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
    </section>
  );
}
