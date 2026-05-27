import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#0F1F35] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan to-violet rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-bg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
                </svg>
              </div>
              <span className="font-display font-700 text-white">Spirit<span className="text-cyan">.</span></span>
            </Link>
            <p className="text-xs text-muted leading-relaxed max-w-[200px]">
              Decentralized multi-chain wallet authentication. Open source. MIT licensed.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <p className="text-xs font-display font-700 text-white uppercase tracking-widest mb-3">Protocol</p>
            <div className="space-y-2">
              {[['/#features','Features'],['/#wallets','Wallets'],['/#security','Security']].map(([href,label]) => (
                <Link key={href} href={href} className="block text-sm text-muted hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Developers */}
          <div>
            <p className="text-xs font-display font-700 text-white uppercase tracking-widest mb-3">Developers</p>
            <div className="space-y-2">
              {[['/docs','Documentation'],['/docs#quickstart','Quick Start'],['/docs#api','API Reference'],['/demo','Live Demo']].map(([href,label]) => (
                <Link key={href} href={href} className="block text-sm text-muted hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-display font-700 text-white uppercase tracking-widest mb-3">Community</p>
            <div className="space-y-2">
              {[['https://github.com/AnointingPaschal/spirit','GitHub'],['https://github.com/AnointingPaschal/spirit/issues','Issues'],['https://github.com/AnointingPaschal/spirit/blob/main/README.md','README']].map(([href,label]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="block text-sm text-muted hover:text-white transition-colors">{label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">© 2025 Spirit Protocol. MIT License.</p>
          <div className="flex items-center gap-4">
            <span className="badge bg-lime/10 text-lime border border-lime/20">v0.1.0</span>
            <a
              href="https://github.com/AnointingPaschal/spirit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
