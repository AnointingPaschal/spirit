'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavbarProps {
  onConnectClick?: () => void;
}

export function Navbar({ onConnectClick }: NavbarProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-bg/90 backdrop-blur-xl border-b border-[#0F1F35]' : ''
    }`}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-cyan rounded-lg opacity-20 group-hover:opacity-40 transition-opacity blur-sm" />
            <div className="relative w-8 h-8 bg-gradient-to-br from-cyan to-violet rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-bg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
              </svg>
            </div>
          </div>
          <span className="font-display font-700 text-lg tracking-tight">
            Spirit<span className="text-cyan">.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/#features', label: 'Features' },
            { href: '/docs',      label: 'Docs' },
            { href: '/demo',      label: 'Demo' },
            { href: '/#wallets',  label: 'Wallets' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-ink hover:text-white font-display font-500 transition-colors rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/AnointingPaschal/spirit"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-4 py-2 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            GitHub
          </a>
          {onConnectClick ? (
            <button onClick={onConnectClick} className="btn-primary px-4 py-2 text-sm">
              Connect Wallet →
            </button>
          ) : (
            <Link href="/demo" className="btn-primary px-4 py-2 text-sm">
              Try Demo →
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-ink hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-xl border-b border-[#0F1F35] px-6 py-4 space-y-1">
          {[
            { href: '/#features', label: 'Features' },
            { href: '/docs',      label: 'Docs' },
            { href: '/demo',      label: 'Demo' },
            { href: '/#wallets',  label: 'Wallets' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-ink hover:text-white font-display rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            {onConnectClick ? (
              <button
                onClick={() => { setMobileOpen(false); onConnectClick(); }}
                className="btn-primary w-full px-4 py-2.5 text-sm text-center"
              >
                Connect Wallet
              </button>
            ) : (
              <Link href="/demo" className="btn-primary px-4 py-2.5 text-sm block text-center">
                Try Demo
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
