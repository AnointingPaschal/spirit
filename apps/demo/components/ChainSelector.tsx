'use client';

import { useState } from 'react';
import type { Chain } from '@spirit-protocol/react';

interface ChainSelectorProps {
  selectedChain: Chain;
  chains: Chain[];
  onSelect: (chain: Chain) => void;
}

export function ChainSelector({ selectedChain, chains, onSelect }: ChainSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3 rounded-xl
                   bg-white/5 border border-white/10 hover:border-white/20
                   transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Chain:</span>
          <span className="text-white font-medium">{selectedChain.name}</span>
          <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
            {selectedChain.type.toUpperCase()}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10
                        glass-card overflow-hidden shadow-xl">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => { onSelect(chain); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                          hover:bg-white/10 transition-colors text-sm
                          ${selectedChain.id === chain.id ? 'bg-sky-500/10 text-sky-400' : 'text-gray-300'}`}
            >
              <span className="font-medium">{chain.name}</span>
              {chain.chainId && (
                <span className="text-xs text-gray-500 ml-auto">#{chain.chainId}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
