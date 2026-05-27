'use client';

import type { AuthSession } from '@spirit-protocol/react';

interface SessionCardProps {
  session: AuthSession;
  onLogout: () => void;
}

export function SessionCard({ session, onLogout }: SessionCardProps) {
  const expiresIn = Math.floor((session.expiresAt - Date.now()) / 1000 / 60);
  const shortAddress = `${session.address.slice(0, 6)}…${session.address.slice(-4)}`;

  return (
    <div className="space-y-3">
      {/* Authenticated badge */}
      <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <p className="text-sm text-green-400 font-medium">Authenticated</p>
      </div>

      {/* Session details */}
      <div className="space-y-2 rounded-xl bg-white/5 border border-white/10 p-4">
        <Row label="Address" value={shortAddress} mono />
        <Row label="Chain" value={`${session.chain.name} (${session.chain.type.toUpperCase()})`} />
        <Row label="Wallet" value={session.walletId} />
        <Row label="Session ID" value={session.id.slice(0, 8) + '…'} mono />
        <Row label="Expires in" value={`~${expiresIn} min`} />
      </div>

      {/* JWT token */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <p className="text-xs text-gray-500 mb-1">JWT Token</p>
        <p className="text-xs font-mono text-sky-400 truncate">{session.token.slice(0, 48)}…</p>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-2 rounded-xl border border-red-500/30 text-red-400
                   hover:border-red-500/50 hover:bg-red-500/10 text-sm transition-colors"
      >
        Disconnect & Sign Out
      </button>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-xs truncate ${mono ? 'font-mono text-sky-300' : 'text-gray-300'}`}>
        {value}
      </span>
    </div>
  );
}
