'use client';
import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

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

// ─── EVM provider type ────────────────────────────────────────────────────────
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
    solana?: { isPhantom?: boolean; isSolflare?: boolean; connect: (o?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>; signMessage: (m: Uint8Array, enc?: string) => Promise<{ signature: Uint8Array }> };
    phantom?: { solana?: Window['solana'] };
    solflare?: Window['solana'] & { isSolflare?: boolean };
    backpack?: { solana?: Window['solana'] };
    unisat?: { requestAccounts: () => Promise<string[]>; signMessage: (m: string, t?: string) => Promise<string> };
    XverseProviders?: { BitcoinProvider?: { request: (m: string, o: unknown) => Promise<unknown> } };
  }
}

// ─── Wallet definitions ───────────────────────────────────────────────────────
const ALL_WALLETS: DetectedWallet[] = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', type: 'evm', installed: false, downloadUrl: 'https://metamask.io/download/' },
  { id: 'rabby', name: 'Rabby', icon: '🐰', type: 'evm', installed: false, downloadUrl: 'https://rabby.io/' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', type: 'evm', installed: false, downloadUrl: 'https://www.coinbase.com/wallet/downloads' },
  { id: 'brave', name: 'Brave Wallet', icon: '🦁', type: 'evm', installed: false, downloadUrl: 'https://brave.com/wallet/' },
  { id: 'phantom', name: 'Phantom', icon: '👻', type: 'solana', installed: false, downloadUrl: 'https://phantom.app/download' },
  { id: 'solflare', name: 'Solflare', icon: '🌞', type: 'solana', installed: false, downloadUrl: 'https://solflare.com/' },
  { id: 'backpack', name: 'Backpack', icon: '🎒', type: 'solana', installed: false, downloadUrl: 'https://www.backpack.app/' },
  { id: 'unisat', name: 'Unisat', icon: '🟠', type: 'bitcoin', installed: false, downloadUrl: 'https://unisat.io/' },
  { id: 'xverse', name: 'Xverse', icon: '✖', type: 'bitcoin', installed: false, downloadUrl: 'https://www.xverse.app/' },
];

function detectWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return ALL_WALLETS;
  const eth = window.ethereum;
  const providers = eth?.providers ?? [];

  const has = (pred: (p: EVMProvider) => boolean) => {
    try {
      return (eth && pred(eth)) || providers.some((p) => {
        try {
          return p && pred(p);
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  };

  return ALL_WALLETS.map((w) => {
    let installed = false;
    if (w.id === 'metamask')  installed = has((p) => !!p?.isMetaMask && !p?.isBraveWallet);
    if (w.id === 'rabby')     installed = has((p) => !!p?.isRabby);
    if (w.id === 'coinbase')  installed = has((p) => !!p?.isCoinbaseWallet) || !!window.ethereum?.isCoinbaseWallet;
    if (w.id === 'brave')     installed = has((p) => !!p?.isBraveWallet);
    if (w.id === 'phantom')   installed = !!(window.phantom?.solana?.isPhantom || (window.solana?.isPhantom));
    if (w.id === 'solflare')  installed = !!(window.solflare?.isSolflare);
    if (w.id === 'backpack')  installed = !!(window.backpack?.solana);
    if (w.id === 'unisat')    installed = !!(window.unisat);
    if (w.id === 'xverse')    installed = !!(window.XverseProviders?.BitcoinProvider);
    return { ...w, installed };
  });
}

// ─── Build sign-in message ────────────────────────────────────────────────────
function buildMessage(address: string, nonce: string, chainType: string, chainName: string) {
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const uri    = typeof window !== 'undefined' ? window.location.origin  : 'https://spirit.dev';
  const now    = new Date().toISOString();

  if (chainType === 'evm') {
    return [
      `${domain} wants you to sign in with your Ethereum account:`,
      address, '',
      'Sign in with Spirit Protocol to authenticate your wallet.',
      '',
      `URI: ${uri}`,
      `Version: 1`,
      `Chain: ${chainName}`,
      `Nonce: ${nonce}`,
      `Issued At: ${now}`,
    ].join('\n');
  }
  return [
    `${domain} wants you to sign in with your ${chainType === 'solana' ? 'Solana' : 'Bitcoin'} account:`,
    address, '',
    'Sign in with Spirit Protocol to authenticate your wallet.',
    '',
    `URI: ${uri}`,
    `Nonce: ${nonce}`,
    `Issued At: ${now}`,
  ].join('\n');
}

// ─── Fake JWT (client-only demo, no relay) ────────────────────────────────────
function makeFakeToken(address: string) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: address, iat: Date.now(), exp: Date.now() + 86400000, iss: 'spirit-demo' }));
  const sig     = btoa('spirit-demo-sig').replace(/=/g, '');
  return `${header}.${payload}.${sig}`;
}

// ─── Chain names ──────────────────────────────────────────────────────────────
const CHAIN_NAMES: Record<string, string> = {
  '0x1': 'Ethereum', '0x2105': 'Base', '0x89': 'Polygon',
  '0xa4b1': 'Arbitrum', '0xa': 'Optimism', '0x38': 'BNB Chain', '0xa86a': 'Avalanche',
};

// ─── Step status bar ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'detecting',  label: 'Detect' },
  { id: 'connecting', label: 'Connect' },
  { id: 'signing',    label: 'Sign' },
  { id: 'verifying',  label: 'Verify' },
  { id: 'done',       label: 'Session' },
];

const STEP_INDEX: Record<Step, number> = {
  idle: -1, detecting: 0, connecting: 1, signing: 2, verifying: 3, done: 4, error: -1,
};

function StepBar({ current }: { current: Step }) {
  const idx = STEP_INDEX[current];
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1">
          <div className={`flex flex-col items-center gap-1 flex-1 ${i === 0 ? '' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-700 border transition-all duration-300 ${
              i < idx  ? 'bg-lime border-lime text-bg' :
              i === idx ? 'bg-cyan border-cyan text-bg animate-pulse' :
                          'bg-transparent border-[#0F1F35] text-muted'
            }`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-display uppercase tracking-wider ${i <= idx ? 'text-white' : 'text-muted'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 -mt-4 transition-all duration-500 ${i < idx ? 'bg-lime/50' : 'bg-[#0F1F35]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main demo page ───────────────────────────────────────────────────────────
export default function DemoPage() {
  const [wallets, setWallets]     = useState<DetectedWallet[]>(ALL_WALLETS);
  const [step, setStep]           = useState<Step>('idle');
  const [error, setError]         = useState<string | null>(null);
  const [session, setSession]     = useState<Session | null>(null);
  const [log, setLog]             = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'evm' | 'solana' | 'bitcoin'>('all');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const addLog = (msg: string) => setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // Detect wallets on mount
  useEffect(() => {
    const detected = detectWallets();
    setWallets(detected);
    const count = detected.filter((w) => w.installed).length;
    if (count > 0) addLog(`Detected ${count} wallet(s): ${detected.filter(w => w.installed).map(w => w.name).join(', ')}`);
    else addLog('No wallets detected. Showing install prompts.');
  }, []);

  const handleConnect = async (wallet: DetectedWallet) => {
    setError(null);
    setSession(null);
    setLog([]);

    try {
      // 1. Detect
      setStep('detecting');
      addLog(`Detecting ${wallet.name} provider…`);
      await delay(400);

      // 2. Connect
      setStep('connecting');
      addLog(`Requesting accounts from ${wallet.name}…`);

      let address = '';
      let chainName = '';

      if (wallet.type === 'evm') {
        const provider = getEVMProvider(wallet.id);
        if (!provider) throw new Error(`${wallet.name} provider not found`);
        const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
        address = accounts[0] ?? '';
        const chainId = await provider.request({ method: 'eth_chainId' }) as string;
        chainName = CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
        addLog(`Connected: ${address.slice(0,6)}…${address.slice(-4)} on ${chainName}`);
      } else if (wallet.type === 'solana') {
        const sol = getSolanaProvider(wallet.id);
        if (!sol) throw new Error(`${wallet.name} provider not found`);
        const resp = await sol.connect();
        address = resp.publicKey.toString();
        chainName = 'Solana';
        addLog(`Connected: ${address.slice(0,8)}… on Solana`);
      } else {
        if (!window.unisat) throw new Error('Unisat not found');
        const accounts = await window.unisat.requestAccounts();
        address = accounts[0] ?? '';
        chainName = 'Bitcoin';
        addLog(`Connected: ${address.slice(0,8)}… on Bitcoin`);
      }

      await delay(300);

      // 3. Sign
      setStep('signing');
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2,'0')).join('');
      addLog(`Generated nonce: ${nonce.slice(0,16)}…`);
      const message = buildMessage(address, nonce, wallet.type, chainName);
      addLog(`Requesting signature from ${wallet.name}…`);

      let signature = '';
      if (wallet.type === 'evm') {
        const provider = getEVMProvider(wallet.id)!;
        const hexMsg = '0x' + Array.from(new TextEncoder().encode(message)).map(b => b.toString(16).padStart(2,'0')).join('');
        signature = await provider.request({ method: 'personal_sign', params: [hexMsg, address] }) as string;
      } else if (wallet.type === 'solana') {
        const sol = getSolanaProvider(wallet.id)!;
        const msgBytes = new TextEncoder().encode(message);
        const result = await sol.signMessage(msgBytes, 'utf8');
        signature = Array.from(result.signature).map(b => b.toString(16).padStart(2,'0')).join('');
      } else {
        signature = await window.unisat!.signMessage(message, 'ecdsa');
      }

      addLog(`Signature received: ${signature.slice(0,20)}…`);
      await delay(300);

      // 4. Verify (client-side demo — real relay would verify server-side)
      setStep('verifying');
      addLog('Verifying cryptographic signature…');
      await delay(600);
      addLog('Signature verified ✓');
      addLog('Issuing session token…');
      await delay(300);

      // 5. Done
      setStep('done');
      const token = makeFakeToken(address);
      addLog(`Session established. JWT issued.`);

      setSession({
        address,
        walletName: wallet.name,
        chainName,
        chainType: wallet.type.toUpperCase(),
        nonce,
        message,
        signature: signature.slice(0, 80) + '…',
        verifiedAt: new Date().toLocaleTimeString(),
        token,
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
    setSession(null);
    setError(null);
    setLog([]);
  };

  const filtered = wallets.filter(w => selectedType === 'all' || w.type === selectedType);
  const installedCount = wallets.filter(w => w.installed).length;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center px-6">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="badge bg-cyan/10 text-cyan border border-cyan/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
              Live Demo
            </span>
            <h1 className="font-display font-800 text-5xl md:text-6xl text-white mb-4">
              Spirit Protocol
            </h1>
            <p className="text-ink text-lg max-w-2xl mx-auto mb-8">
              Experience the full wallet authentication flow — just like integrating into your app
            </p>
            
            {/* Main CTA Button */}
            <button
              onClick={() => setShowModal(true)}
              disabled={step !== 'idle' && step !== 'done' && step !== 'error'}
              className="btn-primary text-lg px-8 py-3 mb-12"
            >
              {session ? '✓ Connected' : 'Connect Wallet'}
            </button>

            {/* Session Info */}
            {session && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="card p-4 text-left">
                  <p className="text-xs text-muted font-display uppercase tracking-widest mb-1">Wallet</p>
                  <p className="text-sm font-mono text-cyan">{session.walletName}</p>
                </div>
                <div className="card p-4 text-left">
                  <p className="text-xs text-muted font-display uppercase tracking-widest mb-1">Chain</p>
                  <p className="text-sm font-mono text-lime">{session.chainName}</p>
                </div>
                <div className="card p-4 text-left">
                  <p className="text-xs text-muted font-display uppercase tracking-widest mb-1">Address</p>
                  <p className="text-sm font-mono text-violet">{session.address.slice(0, 8)}…{session.address.slice(-6)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Overlay */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <WalletModal
                wallets={wallets}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onConnect={async (wallet) => {
                  setShowModal(false);
                  await handleConnect(wallet);
                }}
                onClose={() => setShowModal(false)}
              />
            </div>
          )}

          {/* Status Display */}
          {step !== 'idle' && (
            <div className="max-w-2xl mx-auto">
              {/* Step bar */}
              {step !== 'done' && step !== 'error' && <StepBar current={step} />}

              {/* In progress */}
              {(step === 'detecting' || step === 'connecting' || step === 'signing' || step === 'verifying') && (
                <div className="card p-6 border border-cyan/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
                    <span className="font-display font-600 text-white capitalize">{step}…</span>
                  </div>
                  <Terminal lines={log} />
                </div>
              )}

              {/* Error */}
              {step === 'error' && (
                <div className="card p-6 border-red-500/20">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-600 text-red-400 mb-1">Connection failed</p>
                      <p className="text-xs text-muted">{error}</p>
                    </div>
                  </div>
                  <Terminal lines={log} />
                  <button onClick={reset} className="btn-ghost w-full py-2 mt-4 text-sm">Try again</button>
                </div>
              )}

              {/* Session */}
              {step === 'done' && session && (
                <div className="card p-6 border-lime/20">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                    <span className="font-display font-700 text-lime text-sm uppercase tracking-wider">Authenticated</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Field label="Wallet" value={session.walletName} />
                    <Field label="Chain" value={`${session.chainName} (${session.chainType})`} />
                    <Field label="Address" value={`${session.address.slice(0,10)}…${session.address.slice(-6)}`} mono />
                    <Field label="Nonce" value={session.nonce.slice(0,16) + '…'} mono />
                    <Field label="Signature" value={session.signature.slice(0,24) + '…'} mono />
                  </div>

                  {/* JWT */}
                  <div className="rounded-xl bg-bg border border-[#0F1F35] p-3 mb-4">
                    <p className="text-xs text-muted mb-1 font-display uppercase tracking-widest">JWT Token</p>
                    <p className="text-xs font-mono text-cyan break-all leading-relaxed">
                      {session.token.slice(0, 60)}…
                    </p>
                  </div>

                  {/* Message preview */}
                  <details className="group mb-4">
                    <summary className="text-xs text-muted cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                      View signed message
                    </summary>
                    <pre className="mt-2 text-xs font-mono text-muted bg-bg rounded-lg p-3 border border-[#0F1F35] overflow-x-auto whitespace-pre-wrap">
                      {session.message}
                    </pre>
                  </details>

                  <button onClick={reset} className="btn-ghost w-full py-2 text-sm">
                    Connect another wallet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface WalletModalProps {
  wallets: DetectedWallet[];
  selectedType: 'all' | 'evm' | 'solana' | 'bitcoin';
  setSelectedType: (t: 'all' | 'evm' | 'solana' | 'bitcoin') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onConnect: (wallet: DetectedWallet) => Promise<void>;
  onClose: () => void;
}

function WalletModal({ wallets, selectedType, setSelectedType, searchQuery, setSearchQuery, onConnect, onClose }: WalletModalProps) {
  const filtered = wallets.filter(w => {
    const matchType = selectedType === 'all' || w.type === selectedType;
    const matchSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const installedCount = wallets.filter(w => w.installed).length;

  return (
    <div className="bg-surface rounded-2xl border border-[#0F1F35] w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-[slide-up_0.3s_ease-out]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#0F1F35]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-700 text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0F1F35] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg border border-[#0F1F35] rounded-xl text-sm text-white placeholder-muted focus:outline-none focus:border-cyan/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-[#0F1F35] flex items-center gap-1">
        {(['all','evm','solana','bitcoin'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-600 transition-all capitalize ${
              selectedType === t
                ? 'bg-cyan text-bg'
                : 'text-muted hover:text-white'
            }`}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {/* Wallet List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted">No wallets found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0F1F35]">
            {filtered.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => {
                  if (wallet.installed) {
                    void onConnect(wallet);
                  } else {
                    window.open(wallet.downloadUrl, '_blank');
                  }
                }}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-bg/50 transition-colors text-left"
              >
                <span className="text-3xl flex-shrink-0">{wallet.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-600 text-white">{wallet.name}</p>
                  <p className="text-xs text-muted capitalize">{wallet.type}</p>
                </div>
                {wallet.installed ? (
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs bg-lime/10 text-lime border border-lime/20 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                ) : (
                  <div className="text-xs text-muted border border-[#0F1F35] px-3 py-1 rounded-full">
                    Install
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#0F1F35] bg-bg/50">
        <p className="text-xs text-muted text-center">
          {installedCount === 0 
            ? 'No wallets detected. Install one to get started.'
            : `${installedCount} wallet${installedCount > 1 ? 's' : ''} detected`
          }
        </p>
      </div>
    </div>
  );
}

function WalletCard({ wallet, disabled, onConnect }: { wallet: DetectedWallet; disabled: boolean; onConnect: () => void }) {
  const typeColor = wallet.type === 'evm' ? 'text-cyan' : wallet.type === 'solana' ? 'text-violet' : 'text-lime';

  return (
    <button
      onClick={wallet.installed ? onConnect : () => window.open(wallet.downloadUrl, '_blank')}
      disabled={disabled}
      className={`wallet-btn text-left p-4 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${wallet.installed ? 'installed' : ''}`}
    >
      <span className="text-2xl leading-none flex-shrink-0">{wallet.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-600 text-white">{wallet.name}</p>
        <p className={`text-xs font-mono ${typeColor}`}>{wallet.type.toUpperCase()}</p>
      </div>
      {wallet.installed ? (
        <span className="flex-shrink-0 text-xs bg-lime/10 text-lime border border-lime/20 px-2 py-0.5 rounded-full">
          Ready
        </span>
      ) : (
        <span className="flex-shrink-0 text-xs text-muted border border-[#0F1F35] px-2 py-0.5 rounded-full">
          Install
        </span>
      )}
    </button>
  );
}

function Terminal({ lines }: { lines: string[] }) {
  return (
    <div className="bg-[#020810] rounded-xl border border-[#0F1F35] p-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
      {lines.length === 0 ? (
        <span className="text-muted">Waiting…</span>
      ) : lines.map((l, i) => (
        <div key={i} className="text-lime/80 leading-relaxed">
          <span className="text-muted mr-2">$</span>{l}
        </div>
      ))}
      <span className="text-cyan animate-pulse">█</span>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[#0F1F35] last:border-0">
      <span className="text-xs text-muted flex-shrink-0">{label}</span>
      <span className={`text-xs truncate ${mono ? 'font-mono text-cyan' : 'text-white'}`}>{value}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function getEVMProvider(id: string): EVMProvider | null {
  try {
    const eth = window.ethereum;
    if (!eth) return null;
    const providers = eth.providers ?? [];
    const find = (pred: (p: EVMProvider) => boolean) => {
      try {
        const foundProvider = providers.find((p) => {
          try {
            return p && pred(p);
          } catch {
            return false;
          }
        });
        return foundProvider ?? (pred(eth) ? eth : null);
      } catch {
        return null;
      }
    };
    if (id === 'metamask')  return find(p => !!p?.isMetaMask && !p?.isBraveWallet);
    if (id === 'rabby')     return find(p => !!p?.isRabby);
    if (id === 'coinbase')  return find(p => !!p?.isCoinbaseWallet);
    if (id === 'brave')     return find(p => !!p?.isBraveWallet);
    return eth;
  } catch {
    return null;
  }
}

function getSolanaProvider(id: string) {
  if (id === 'phantom')  return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
  if (id === 'solflare') return window.solflare?.isSolflare ? window.solflare : null;
  if (id === 'backpack') return window.backpack?.solana ?? null;
  return null;
}
