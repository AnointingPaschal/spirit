'use client';
import { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[#0F1F35] bg-[#020810]">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#0F1F35] bg-[#030C18]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          {filename && (
            <span className="ml-2 text-xs text-muted font-mono">{filename}</span>
          )}
        </div>
        <button
          onClick={copy}
          className="text-xs text-muted hover:text-white transition-colors flex items-center gap-1.5 px-2 py-1 rounded border border-[#0F1F35] hover:border-[#1A3050]"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        customStyle={{
          background: '#020810',
          padding: '20px',
          margin: 0,
          fontSize: '13px',
          lineHeight: '1.75',
          overflowX: 'auto',
        }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{ color: '#1A3050', minWidth: '2.5em', paddingRight: '1em' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
