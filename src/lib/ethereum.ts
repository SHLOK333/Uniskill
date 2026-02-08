// Ethereum wallet utilities for UniSkill
import { ethers } from 'ethers';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// RPC Configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
const ENCRYPTION_PASSWORD = process.env.WALLET_ENCRYPTION_PASSWORD || 'default-password-change-me';

// Ethereum provider and wallet setup
export function getProvider(): ethers.JsonRpcProvider {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url || url.includes('YOUR_KEY')) {
    console.error('❌ SEPOLIA_RPC_URL is missing or invalid in .env');
    throw new Error('Invalid RPC URL');
  }
  return new ethers.JsonRpcProvider(url);
}

// Generate new Ethereum wallet
export function generateWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

// Get wallet from environment variable
export function getWallet(provider: ethers.Provider): ethers.Wallet {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY is missing in .env');
  }
  return new ethers.Wallet(privateKey, provider);
}

// Encrypt private key with AES-256-GCM
export function encryptPrivateKey(privateKey: string): { encrypted: string; iv: string } {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(ENCRYPTION_PASSWORD.padEnd(32, '0').slice(0, 32));
  const iv = randomBytes(16);

  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex'),
  };
}

// Decrypt private key
export function decryptPrivateKey(encrypted: string, iv: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(ENCRYPTION_PASSWORD.padEnd(32, '0').slice(0, 32));

  // Extract auth tag (last 16 bytes = 32 hex chars)
  const authTag = Buffer.from(encrypted.slice(-32), 'hex');
  const encryptedData = encrypted.slice(0, -32);

  const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Get wallet from encrypted private key
export function getWalletFromEncrypted(encrypted: string, iv: string): ethers.Wallet {
  const privateKey = decryptPrivateKey(encrypted, iv);
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Validate Ethereum address
export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// Get ETH balance
export async function getEthBalance(address: string): Promise<string> {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Get ERC20 token balance
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  const provider = getProvider();
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const balance = await contract.balanceOf(walletAddress);
  const decimals = await contract.decimals();

  return ethers.formatUnits(balance, decimals);
}

// Get multiple token balances
export async function getTokenBalances(
  walletAddress: string,
  tokenAddresses: string[]
): Promise<{ [address: string]: string }> {
  const balances: { [address: string]: string } = {};

  for (const tokenAddress of tokenAddresses) {
    try {
      balances[tokenAddress] = await getTokenBalance(tokenAddress, walletAddress);
    } catch (error) {
      console.error(`Failed to get balance for ${tokenAddress}:`, error);
      balances[tokenAddress] = '0';
    }
  }

  return balances;
}

// Send ETH
export async function sendEth(
  wallet: ethers.Wallet,
  to: string,
  amount: string
): Promise<ethers.TransactionResponse> {
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amount),
  });

  return tx;
}

// Send ERC20 token
export async function sendToken(
  wallet: ethers.Wallet,
  tokenAddress: string,
  to: string,
  amount: string
): Promise<ethers.TransactionResponse> {
  const erc20Abi = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
  ];

  const contract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
  const decimals = await contract.decimals();
  const amountWei = ethers.parseUnits(amount, decimals);

  const tx = await contract.transfer(to, amountWei);
  return tx;
}

// Fetch with timeout helper
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Common token addresses on Sepolia
export const COMMON_TOKENS = {
  WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
  DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
};

// Get token symbol from address
export function getTokenSymbol(address: string): string {
  const tokens = Object.entries(COMMON_TOKENS);
  for (const [symbol, addr] of tokens) {
    if (addr.toLowerCase() === address.toLowerCase()) {
      return symbol;
    }
  }
  return 'UNKNOWN';
}

// Get token address from symbol
export function getTokenAddress(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase();
  return COMMON_TOKENS[upperSymbol as keyof typeof COMMON_TOKENS] || null;
}
