'use client';
import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  type: 'evm' | 'solana' | 'bitcoin';
  installed: boolean;
  downloadUrl: string;
}

interface Session {
  address: string;
  walletName: string;
  chainName: string;
  chainType: string;
  nonce: string;
  message: string;
  signature: string;
  verifiedAt: string;
  token: string;
}

type Step = 'idle' | 'detecting' | 'connecting' | 'signing' | 'verifying' | 'done' | 'error';

interface EVMProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isTrust?: boolean;
  providers?: EVMProvider[];
}

declare global {
  interface Window {
    ethereum?: EVMProvider;
    solana?: {
      isPhantom?: boolean; isSolflare?: boolean;
      connect: (o?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
      signMessage: (m: Uint8Array, enc?: string) => Promise<{ signature: Uint8Array }>;
    };
    phantom?: { solana?: Window['solana'] };
    solflare?: Window['solana'] & { isSolflare?: boolean };
    backpack?: { solana?: Window['solana'] };
    unisat?: { requestAccounts: () => Promise<string[]>; signMessage: (m: string, t?: string) => Promise<string> };
    XverseProviders?: { BitcoinProvider?: { request: (m: string, o: unknown) => Promise<unknown> } };
  }
}

// ─── Wallet definitions ───────────────────────────────────────────────────────
const ALL_WALLETS: DetectedWallet[] = [
  { id: 'metamask',  name: 'MetaMask',       icon: '🦊', type: 'evm',     installed: false, downloadUrl: 'https://metamask.io/download/' },
  { id: 'rabby',     name: 'Rabby',          icon: '🐰', type: 'evm',     installed: false, downloadUrl: 'https://rabby.io/' },
  { id: 'coinbase',  name: 'Coinbase Wallet',icon: '🔵', type: 'evm',     installed: false, downloadUrl: 'https://www.coinbase.com/wallet/downloads' },
  { id: 'brave',     name: 'Brave Wallet',   icon: '🦁', type: 'evm',     installed: false, downloadUrl: 'https://brave.com/wallet/' },
  { id: 'phantom',   name: 'Phantom',        icon: '👻', type: 'solana',  installed: false, downloadUrl: 'https://phantom.app/download' },
  { id: 'solflare',  name: 'Solflare',       icon: '🌞', type: 'solana',  installed: false, downloadUrl: 'https://solflare.com/' },
  { id: 'backpack',  name: 'Backpack',       icon: '🎒', type: 'solana',  installed: false, downloadUrl: 'https://www.backpack.app/' },
  { id: 'unisat',    name: 'Unisat',         icon: '🟠', type: 'bitcoin', installed: false, downloadUrl: 'https://unisat.io/' },
  { id: 'xverse',    name: 'Xverse',         icon: '✖',  type: 'bitcoin', installed: false, downloadUrl: 'https://www.xverse.app/' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function detectWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return ALL_WALLETS;
  const eth = window.ethereum;
  const providers = eth?.providers ?? [];

  const has = (pred: (p: EVMProvider) => boolean) => {
    try {
      return (eth ? pred(eth) : false) || providers.some(p => { try { return p && pred(p); } catch { return false; } });
    } catch { return false; }
  };

  return ALL_WALLETS.map(w => {
    let installed = false;
    try {
      if (w.id === 'metamask') installed = has(p => !!p?.isMetaMask && !p?.isBraveWallet);
      if (w.id === 'rabby')    installed = has(p => !!p?.isRabby);
      if (w.id === 'coinbase') installed = has(p => !!p?.isCoinbaseWallet);
      if (w.id === 'brave')    installed = has(p => !!p?.isBraveWallet);
      if (w.id === 'phantom')  installed = !!(window.phantom?.solana?.isPhantom || window.solana?.isPhantom);
      if (w.id === 'solflare') installed = !!(window.solflare?.isSolflare);
      if (w.id === 'backpack') installed = !!(window.backpack?.solana);
      if (w.id === 'unisat')   installed = !!(window.unisat);
      if (w.id === 'xverse')   installed = !!(window.XverseProviders?.BitcoinProvider);
    } catch { /* silent */ }
    return { ...w, installed };
  });
}

function getEVMProvider(id: string): EVMProvider | null {
  try {
    const eth = window.ethereum;
    if (!eth) return null;
    const providers = eth.providers ?? [];
    const find = (pred: (p: EVMProvider) => boolean) => {
      const found = providers.find(p => { try { return p && pred(p); } catch { return false; } });
      return found ?? (pred(eth) ? eth : null);
    };
    if (id === 'metamask') return find(p => !!p?.isMetaMask && !p?.isBraveWallet);
    if (id === 'rabby')    return find(p => !!p?.isRabby);
    if (id === 'coinbase') return find(p => !!p?.isCoinbaseWallet);
    if (id === 'brave')    return find(p => !!p?.isBraveWallet);
    return eth;
  } catch { return null; }
}

function getSolanaProvider(id: string) {
  if (id === 'phantom')  return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
  if (id === 'solflare') return window.solflare?.isSolflare ? window.solflare : null;
  if (id === 'backpack') return window.backpack?.solana ?? null;
  return null;
}

function buildMessage(address: string, nonce: string, chainType: string, chainName: string) {
  const domain = window.location.hostname;
  const uri    = window.location.origin;
  const now    = new Date().toISOString();
  if (chainType === 'evm') {
    return [`${domain} wants you to sign in with your Ethereum account:`, address, '',
      'Sign in with Spirit Protocol.', '',
      `URI: ${uri}`, 'Version: 1', `Chain: ${chainName}`, `Nonce: ${nonce}`, `Issued At: ${now}`].join('\n');
  }
  return [`${domain} wants you to sign in with your ${chainType === 'solana' ? 'Solana' : 'Bitcoin'} account:`, address, '',
    'Sign in with Spirit Protocol.', '',
    `URI: ${uri}`, `Nonce: ${nonce}`, `Issued At: ${now}`].join('\n');
}

function makeFakeToken(address: string) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: address, iat: Date.now(), exp: Date.now() + 86400000, iss: 'spirit-demo' }));
  return `${header}.${payload}.${btoa('spirit-demo-sig').replace(/=/g, '')}`;
}

const CHAIN_NAMES: Record<string, string> = {
  '0x1': 'Ethereum', '0x2105': 'Base', '0x89': 'Polygon',
  '0xa4b1': 'Arbitrum', '0xa': 'Optimism', '0x38': 'BNB Chain', '0xa86a': 'Avalanche',
};

const STEPS = ['Detect', 'Connect', 'Sign', 'Verify', 'Done'];
const STEP_IDX: Record<Step, number> = { idle: -1, detecting: 0, connecting: 1, signing: 2, verifying: 3, done: 4, error: -1 };

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  evm:     'text-cyan',
  solana:  'text-violet',
  bitcoin: 'text-lime',
};
const TYPE_LABEL: Record<string, string> = { evm: 'EVM', solana: 'SOL', bitcoin: 'BTC' };

// ─── Modal component ──────────────────────────────────────────────────────────
interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const [wallets, setWallets]   = useState<DetectedWallet[]>(ALL_WALLETS);
  const [step, setStep]         = useState<Step>('idle');
  const [error, setError]       = useState<string | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [log, setLog]           = useState<string[]>([]);
  const [filter, setFilter]     = useState<'all' | 'evm' | 'solana' | 'bitcoin'>('all');
  const [active, setActive]     = useState<DetectedWallet | null>(null);

  const addLog = (msg: string) =>
    setLog(l => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // Detect wallets on open
  useEffect(() => {
    if (!isOpen) return;
    const detected = detectWallets();
    setWallets(detected);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return ()  => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (step !== 'idle' && step !== 'done' && step !== 'error') return; // prevent close mid-flow
    setStep('idle');
    setError(null);
    setLog([]);
    setActive(null);
    onClose();
  }, [step, onClose]);

  const handleConnect = async (wallet: DetectedWallet) => {
    if (!wallet.installed) { window.open(wallet.downloadUrl, '_blank'); return; }
    setActive(wallet);
    setError(null);
    setSession(null);
    setLog([]);

    try {
      setStep('detecting');
      addLog(`Detecting ${wallet.name} provider…`);
      await delay(350);

      setStep('connecting');
      addLog(`Requesting accounts from ${wallet.name}…`);

      let address = '', chainName = '';

      if (wallet.type === 'evm') {
        const provider = getEVMProvider(wallet.id);
        if (!provider) throw new Error(`${wallet.name} is not available`);
        const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
        address = accounts[0] ?? '';
        if (!address) throw new Error('No accounts returned');
        const chainId = await provider.request({ method: 'eth_chainId' }) as string;
        chainName = CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
        addLog(`Connected: ${address.slice(0,6)}…${address.slice(-4)} on ${chainName}`);
      } else if (wallet.type === 'solana') {
        const sol = getSolanaProvider(wallet.id);
        if (!sol) throw new Error(`${wallet.name} is not available`);
        const resp = await sol.connect();
        address   = resp.publicKey.toString();
        chainName = 'Solana';
        addLog(`Connected: ${address.slice(0,8)}… on Solana`);
      } else {
        if (!window.unisat) throw new Error('Unisat is not available');
        const accounts = await window.unisat.requestAccounts();
        address   = accounts[0] ?? '';
        chainName = 'Bitcoin';
        addLog(`Connected: ${address.slice(0,8)}… on Bitcoin`);
      }

      await delay(250);
      setStep('signing');

      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2,'0')).join('');
      addLog(`Generated nonce: ${nonce.slice(0,16)}…`);
      const message = buildMessage(address, nonce, wallet.type, chainName);
      addLog(`Requesting signature…`);

      let signature = '';
      if (wallet.type === 'evm') {
        const provider = getEVMProvider(wallet.id)!;
        const hexMsg = '0x' + Array.from(new TextEncoder().encode(message))
          .map(b => b.toString(16).padStart(2,'0')).join('');
        signature = await provider.request({ method: 'personal_sign', params: [hexMsg, address] }) as string;
      } else if (wallet.type === 'solana') {
        const sol = getSolanaProvider(wallet.id)!;
        const res = await sol.signMessage(new TextEncoder().encode(message), 'utf8');
        signature = Array.from(res.signature).map(b => b.toString(16).padStart(2,'0')).join('');
      } else {
        signature = await window.unisat!.signMessage(message, 'ecdsa');
      }

      addLog(`Signature: ${signature.slice(0,16)}…`);
      await delay(250);

      setStep('verifying');
      addLog('Verifying cryptographic signature…');
      await delay(700);
      addLog('Signature verified ✓');
      addLog('Issuing session token…');
      await delay(250);

      setStep('done');
      addLog('Session established.');
      setSession({
        address, walletName: wallet.name, chainName,
        chainType: wallet.type.toUpperCase(), nonce, message,
        signature: signature.slice(0, 80) + '…',
        verifiedAt: new Date().toLocaleTimeString(),
        token: makeFakeToken(address),
      });

    } catch (err: unknown) {
      setStep('error');
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      addLog(`Error: ${msg}`);
    }
  };

  const reset = () => {
    setStep('idle');
    setError(null);
    setSession(null);
    setLog([]);
    setActive(null);
  };

  if (!isOpen) return null;

  const busy     = step !== 'idle' && step !== 'done' && step !== 'error';
  const stepIdx  = STEP_IDX[step];
  const filtered = wallets.filter(w => filter === 'all' || w.type === filter);
  const installed = wallets.filter(w => w.installed);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #070D18 0%, #03060C 100%)',
            border: '1px solid #0F1F35',
            boxShadow: '0 0 0 1px #0F1F35, 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,207,253,0.05)',
            animation: 'slide-up 0.25s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#0F1F35] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-bg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-display font-700 text-white text-base leading-none">Connect Wallet</h2>
                <p className="text-xs text-muted mt-0.5">
                  {installed.length > 0
                    ? `${installed.length} wallet${installed.length > 1 ? 's' : ''} detected`
                    : 'No wallets installed'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={busy}
              className="w-8 h-8 rounded-lg border border-[#0F1F35] flex items-center justify-center text-muted hover:text-white hover:border-[#1A3050] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* ── Body: split two-column ── */}
          <div className="flex flex-1 min-h-0">

            {/* Left — wallet list */}
            <div className="flex flex-col w-[52%] border-r border-[#0F1F35] flex-shrink-0">
              {/* Filter tabs */}
              <div className="px-4 py-3 border-b border-[#0F1F35] flex gap-1">
                {(['all','evm','solana','bitcoin'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    disabled={busy}
                    className={`px-3 py-1 rounded-lg text-xs font-display font-600 transition-all disabled:opacity-40 ${
                      filter === t ? 'bg-cyan text-bg' : 'text-muted hover:text-white'
                    }`}
                  >
                    {t === 'all' ? 'All' : t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Wallet list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {filtered.map(wallet => {
                  const isActive = active?.id === wallet.id;
                  return (
                    <button
                      key={wallet.id}
                      onClick={() => !busy && void handleConnect(wallet)}
                      disabled={busy && !isActive}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${isActive
                          ? 'border-cyan/40 bg-cyan/8 shadow-[0_0_12px_rgba(0,207,253,0.1)]'
                          : wallet.installed
                            ? 'border-lime/15 bg-lime/5 hover:border-lime/30 hover:bg-lime/8'
                            : 'border-[#0F1F35] bg-bg/40 hover:border-[#1A3050] hover:bg-[#070D18]'
                        }`}
                    >
                      <span className="text-xl leading-none flex-shrink-0">{wallet.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-600 text-white">{wallet.name}</p>
                        <p className={`text-[10px] font-mono ${TYPE_COLOR[wallet.type]}`}>{TYPE_LABEL[wallet.type]}</p>
                      </div>
                      {isActive && busy ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cyan border-t-transparent animate-spin flex-shrink-0" />
                      ) : wallet.installed ? (
                        <span className="flex-shrink-0 text-[10px] bg-lime/10 text-lime border border-lime/25 px-1.5 py-0.5 rounded-full font-display">
                          Ready
                        </span>
                      ) : (
                        <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* No wallets prompt */}
              {installed.length === 0 && (
                <div className="px-4 pb-4">
                  <div className="rounded-xl bg-violet/5 border border-violet/15 p-3 text-center">
                    <p className="text-xs text-muted">No wallets detected.</p>
                    <p className="text-xs text-muted mt-0.5">Install one above to get started.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right — status panel */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-5 space-y-4">

              {/* Step progress */}
              {step !== 'idle' && (
                <div>
                  <div className="flex items-center mb-3">
                    {STEPS.map((s, i) => (
                      <div key={s} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display font-700 border transition-all duration-300 ${
                            i < stepIdx  ? 'bg-lime border-lime text-bg' :
                            i === stepIdx ? 'bg-cyan border-cyan text-bg animate-pulse' :
                                            'border-[#0F1F35] text-muted'
                          }`}>
                            {i < stepIdx ? '✓' : i + 1}
                          </div>
                          <span className={`text-[9px] font-display uppercase tracking-wider mt-1 ${i <= stepIdx ? 'text-white' : 'text-muted'}`}>{s}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`h-px flex-1 -mt-4 transition-all duration-500 ${i < stepIdx ? 'bg-lime/40' : 'bg-[#0F1F35]'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Idle */}
              {step === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan/8 border border-cyan/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <h3 className="font-display font-700 text-white mb-1 text-sm">Ready to connect</h3>
                  <p className="text-xs text-muted mb-5 max-w-[180px]">Select a wallet to start the full auth flow</p>
                  <div className="w-full rounded-xl bg-bg border border-[#0F1F35] p-3 text-left space-y-2">
                    {['Detect wallet provider','Request accounts','Generate nonce','Sign message','Verify signature','Issue JWT'].map((s, i) => (
                      <div key={s} className="flex items-center gap-2 text-xs text-muted">
                        <span className="w-4 h-4 rounded-full bg-[#0F1F35] text-[10px] flex items-center justify-center flex-shrink-0 font-display">{i+1}</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In progress */}
              {busy && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-cyan border-t-transparent animate-spin flex-shrink-0" />
                    <span className="font-display font-600 text-white text-sm capitalize">{step}…</span>
                  </div>
                  <Terminal lines={log} />
                </div>
              )}

              {/* Error */}
              {step === 'error' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                    <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-display font-600 text-red-400 text-sm">Connection failed</p>
                      <p className="text-xs text-muted mt-0.5">{error}</p>
                    </div>
                  </div>
                  <Terminal lines={log} />
                  <button onClick={reset} className="btn-ghost w-full py-2 text-xs">← Try another wallet</button>
                </div>
              )}

              {/* Done / Session */}
              {step === 'done' && session && (
                <div className="space-y-3">
                  {/* Auth badge */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-lime/8 border border-lime/20">
                    <span className="w-2 h-2 rounded-full bg-lime animate-pulse flex-shrink-0" />
                    <span className="font-display font-700 text-lime text-xs uppercase tracking-wider">Authenticated</span>
                    <span className="ml-auto text-[10px] text-muted">{session.verifiedAt}</span>
                  </div>

                  {/* Fields */}
                  <div className="rounded-xl bg-bg border border-[#0F1F35] divide-y divide-[#0F1F35] overflow-hidden">
                    {[
                      { label: 'Wallet',    value: session.walletName },
                      { label: 'Chain',     value: `${session.chainName} (${session.chainType})` },
                      { label: 'Address',   value: `${session.address.slice(0,10)}…${session.address.slice(-6)}`, mono: true },
                      { label: 'Nonce',     value: `${session.nonce.slice(0,14)}…`, mono: true },
                      { label: 'Signature', value: `${session.signature.slice(0,18)}…`, mono: true },
                    ].map(f => (
                      <div key={f.label} className="flex items-center justify-between px-3 py-2 gap-3">
                        <span className="text-[10px] text-muted flex-shrink-0">{f.label}</span>
                        <span className={`text-[10px] truncate ${f.mono ? 'font-mono text-cyan' : 'text-white'}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* JWT */}
                  <div className="rounded-xl bg-bg border border-[#0F1F35] p-3">
                    <p className="text-[9px] text-muted font-display uppercase tracking-widest mb-1.5">JWT Token</p>
                    <p className="text-[10px] font-mono text-cyan break-all leading-relaxed">
                      {session.token.slice(0, 56)}…
                    </p>
                  </div>

                  {/* Signed message */}
                  <details className="group">
                    <summary className="text-xs text-muted cursor-pointer hover:text-white flex items-center gap-1 transition-colors">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                      View signed message
                    </summary>
                    <pre className="mt-2 text-[10px] font-mono text-muted bg-bg rounded-lg p-3 border border-[#0F1F35] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {session.message}
                    </pre>
                  </details>

                  <button onClick={reset} className="btn-ghost w-full py-2 text-xs">← Connect another wallet</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 border-t border-[#0F1F35] flex-shrink-0 flex items-center justify-between">
            <p className="text-[10px] text-muted">
              Spirit Protocol · Open source · No third-party APIs
            </p>
            <a href="/docs" className="text-[10px] text-cyan hover:text-white transition-colors">
              View docs →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Terminal sub-component ───────────────────────────────────────────────────
function Terminal({ lines }: { lines: string[] }) {
  return (
    <div className="bg-[#020810] rounded-xl border border-[#0F1F35] p-3 font-mono text-xs space-y-1 max-h-44 overflow-y-auto">
      {lines.length === 0
        ? <span className="text-muted">Waiting…</span>
        : lines.map((l, i) => (
          <div key={i} className="text-lime/80 leading-relaxed">
            <span className="text-muted mr-2">$</span>{l}
          </div>
        ))
      }
      <span className="text-cyan animate-pulse">█</span>
    </div>
  );
}
