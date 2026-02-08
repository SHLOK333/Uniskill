import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// RPC Connection (use env or fallback to public)
export const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  { commitment: 'confirmed' }
);

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Check length (32-44 chars for base58)
  if (address.length < 32 || address.length > 44) return false;
  
  // Check for valid base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) return false;
  
  // Try to create PublicKey
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Parse and validate PublicKey
export function parsePublicKey(address: string): PublicKey | null {
  if (!isValidSolanaAddress(address)) return null;
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

// Format SOL amount
export function formatSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(9);
}

// Parse SOL to lamports
export function parseSolToLamports(sol: string | number): number {
  const amount = typeof sol === 'string' ? parseFloat(sol) : sol;
  if (isNaN(amount) || amount < 0) return 0;
  return Math.floor(amount * LAMPORTS_PER_SOL);
}

// Validate amount (positive number)
export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0 && isFinite(num);
}

// Fetch with timeout
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
