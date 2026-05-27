import type { SIWEMessage, Chain } from '../types/index.js';

/**
 * Build a SIWE (Sign-In With Ethereum) message per EIP-4361.
 * Compatible with eth_sign, personal_sign, and most wallet implementations.
 */
export function buildSIWEMessage(opts: SIWEMessage): string {
  const lines: string[] = [];

  lines.push(`${opts.domain} wants you to sign in with your Ethereum account:`);
  lines.push(opts.address);
  lines.push('');

  if (opts.statement) {
    lines.push(opts.statement);
    lines.push('');
  }

  lines.push(`URI: ${opts.uri}`);
  lines.push(`Version: ${opts.version}`);

  if (opts.chainId !== undefined) {
    lines.push(`Chain ID: ${opts.chainId}`);
  }

  lines.push(`Nonce: ${opts.nonce}`);
  lines.push(`Issued At: ${opts.issuedAt}`);

  if (opts.expirationTime) {
    lines.push(`Expiration Time: ${opts.expirationTime}`);
  }

  if (opts.resources && opts.resources.length > 0) {
    lines.push('Resources:');
    opts.resources.forEach((r) => lines.push(`- ${r}`));
  }

  return lines.join('\n');
}

/**
 * Build a Solana sign-in message.
 * Follows the Solana Off-Chain Message format (domain + nonce).
 */
export function buildSolanaMessage(opts: {
  domain: string;
  address: string;
  statement: string;
  nonce: string;
  issuedAt: string;
  uri: string;
}): string {
  return [
    `${opts.domain} wants you to sign in with your Solana account:`,
    opts.address,
    '',
    opts.statement,
    '',
    `URI: ${opts.uri}`,
    `Nonce: ${opts.nonce}`,
    `Issued At: ${opts.issuedAt}`,
  ].join('\n');
}

/**
 * Build a Bitcoin sign-in message.
 */
export function buildBitcoinMessage(opts: {
  domain: string;
  address: string;
  statement: string;
  nonce: string;
  issuedAt: string;
}): string {
  return [
    `${opts.domain} wants you to sign in with your Bitcoin account:`,
    opts.address,
    '',
    opts.statement,
    '',
    `Nonce: ${opts.nonce}`,
    `Issued At: ${opts.issuedAt}`,
  ].join('\n');
}

/**
 * Build an auth message for any chain type.
 */
export function buildAuthMessage(opts: {
  chain: Chain;
  address: string;
  nonce: string;
  domain: string;
  uri: string;
  statement?: string;
  expiresIn?: number; // seconds
}): string {
  const { chain, address, nonce, domain, uri } = opts;
  const statement =
    opts.statement ?? 'Sign in with your wallet to authenticate with Spirit Protocol.';
  const issuedAt = new Date().toISOString();
  const expirationTime =
    opts.expiresIn !== undefined
      ? new Date(Date.now() + opts.expiresIn * 1000).toISOString()
      : undefined;

  if (chain.type === 'evm') {
    return buildSIWEMessage({
      domain,
      address,
      statement,
      uri,
      version: '1',
      chainId: chain.chainId,
      nonce,
      issuedAt,
      expirationTime,
    });
  }

  if (chain.type === 'solana') {
    return buildSolanaMessage({ domain, address, statement, nonce, issuedAt, uri });
  }

  if (chain.type === 'bitcoin') {
    return buildBitcoinMessage({ domain, address, statement, nonce, issuedAt });
  }

  throw new Error(`Unsupported chain type: ${chain.type}`);
}

/**
 * Parse a SIWE message back into fields.
 */
export function parseSIWEMessage(message: string): Partial<SIWEMessage> {
  const lines = message.split('\n');
  const result: Partial<SIWEMessage> = {};

  for (const line of lines) {
    if (line.startsWith('URI: ')) result.uri = line.slice(5);
    else if (line.startsWith('Version: ')) result.version = line.slice(9);
    else if (line.startsWith('Chain ID: ')) result.chainId = parseInt(line.slice(10), 10);
    else if (line.startsWith('Nonce: ')) result.nonce = line.slice(7);
    else if (line.startsWith('Issued At: ')) result.issuedAt = line.slice(11);
    else if (line.startsWith('Expiration Time: ')) result.expirationTime = line.slice(17);
  }

  // Address is line 2 (index 1)
  if (lines.length > 1) result.address = lines[1];

  return result;
}
