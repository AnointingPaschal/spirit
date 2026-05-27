import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan/6 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <span className="badge bg-lime/10 text-lime border border-lime/20 mb-6 inline-flex">
          Open Source · MIT License
        </span>

        <h2 className="font-display font-800 text-4xl md:text-6xl text-white mb-6 leading-tight">
          Start building
          <br />
          <span className="text-gradient-lime">the open web.</span>
        </h2>

        <p className="text-ink text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Clone the repo, install dependencies, and have wallet authentication running locally in under 5 minutes.
          No API keys. No sign-ups. Just code.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/demo" className="btn-primary px-8 py-4 text-base inline-flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Try the live demo
          </Link>
          <Link href="/docs" className="btn-ghost px-8 py-4 text-base inline-flex items-center justify-center gap-2">
            Read the docs
          </Link>
          <a
            href="https://github.com/AnointingPaschal/spirit"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-8 py-4 text-base inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Star on GitHub
          </a>
        </div>

        {/* Terminal snippet */}
        <div className="inline-block text-left bg-[#020810] border border-[#0F1F35] rounded-xl p-5 font-mono text-sm">
          <div className="flex gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="space-y-1.5 text-left">
            <div><span className="text-muted">$</span> <span className="text-lime">git clone</span> <span className="text-white">https://github.com/AnointingPaschal/spirit</span></div>
            <div><span className="text-muted">$</span> <span className="text-lime">cd</span> <span className="text-white">spirit && pnpm install</span></div>
            <div><span className="text-muted">$</span> <span className="text-lime">docker-compose up</span> <span className="text-white">postgres relay -d</span></div>
            <div><span className="text-muted">$</span> <span className="text-lime">pnpm</span> <span className="text-white">--filter @spirit-protocol/web dev</span></div>
            <div className="text-cyan mt-1">🚀 Spirit running at http://localhost:3001</div>
          </div>
        </div>
      </div>
    </section>
  );
}
