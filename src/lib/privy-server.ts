import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy server client
export const privyServer = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// Verify user token from request
export async function verifyPrivyToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const claims = await privyServer.verifyAuthToken(token);
    return claims;
  } catch (error) {
    console.error('Privy token verification failed:', error);
    return null;
  }
}

// Get user by ID
export async function getPrivyUser(userId: string) {
  try {
    const user = await privyServer.getUser(userId);
    return user;
  } catch (error) {
    console.error('Failed to get Privy user:', error);
    return null;
  }
}

// Get user's embedded wallet
export async function getUserWallet(userId: string) {
  try {
    const user = await privyServer.getUser(userId);
    const wallet = user.linkedAccounts.find(
      (account) => account.type === 'wallet' && account.walletClientType === 'privy'
    );
    return wallet || null;
  } catch (error) {
    console.error('Failed to get user wallet:', error);
    return null;
  }
}
