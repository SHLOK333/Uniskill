// Simplified Uniswap v4 integration using test helper contracts
// These contracts have stable, verified ABIs on Sepolia testnet
import { ethers } from 'ethers';
import { getProvider } from './ethereum';

// Test Helper Contract Addresses on Sepolia
const POOL_SWAP_TEST = '0x9b6b46e2c869aa39918db7f52f5557fe577b6eee';
const POOL_MODIFY_LIQUIDITY_TEST = '0x0c478023803a644c94c4ce1c1e7b9a087e411b0a';
const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';

// Simplified ABIs for test contracts
// These are the core functions we need for testing
const POOL_SWAP_TEST_ABI = [
    'function swap(bytes32 poolId, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes hookData) external returns (int256 delta0, int256 delta1)',
];

const POOL_MODIFY_LIQUIDITY_TEST_ABI = [
    'function modifyLiquidity(bytes32 poolId, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes hookData) external returns (int256 delta0, int256 delta1)',
];

// ERC20 ABI for approvals and balances
const ERC20_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function transfer(address to, uint256 amount) returns (bool)',
];

export interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOutMinimum: string;
    recipient: string;
    fee?: number;
}

export interface SwapQuote {
    amountIn: string;
    amountOut: string;
    priceImpact: string;
    gasEstimate: string;
    route: string[];
}

// Calculate pool ID from token pair and fee
function calculatePoolId(token0: string, token1: string, fee: number = 3000): string {
    // Sort tokens
    const [sortedToken0, sortedToken1] = token0.toLowerCase() < token1.toLowerCase()
        ? [token0, token1]
        : [token1, token0];

    // Encode pool key: token0, token1, fee, tickSpacing (60 for 0.3% fee), hooks (zero address)
    const poolKey = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [sortedToken0, sortedToken1, fee, 60, ethers.ZeroAddress]
    );

    // Hash to get pool ID
    return ethers.keccak256(poolKey);
}

// Get simple swap quote (estimated)
export async function getSwapQuote(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    fee?: number;
}): Promise<SwapQuote> {
    // For now, return a simple estimated quote
    // In production, you would call a quoter contract or use the SDK
    const fee = params.fee || 3000;

    // Simple estimation: assume 1 WETH = 2000 USDC for demo
    const amountInNum = parseFloat(params.amountIn);
    const estimatedOut = (amountInNum * 2000).toFixed(6);

    return {
        amountIn: params.amountIn,
        amountOut: estimatedOut,
        priceImpact: '0.01',
        gasEstimate: '150000',
        route: [params.tokenIn, params.tokenOut],
    };
}

// Ensure token approval
export async function ensureTokenApproval(
    wallet: ethers.Wallet,
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
): Promise<ethers.TransactionReceipt | null> {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);

    if (currentAllowance >= amount) {
        console.log(`Token ${tokenAddress} already approved for ${spenderAddress}`);
        return null;
    }

    console.log(`Approving ${tokenAddress} for ${spenderAddress}...`);
    const approveTx = await tokenContract.approve(spenderAddress, amount);
    const receipt = await approveTx.wait();
    console.log(`Approval confirmed: ${receipt.hash}`);

    return receipt;
}

// Execute swap using PoolSwapTest contract
export async function executeSwapV4(
    wallet: ethers.Wallet,
    params: SwapParams
): Promise<ethers.TransactionReceipt> {
    const swapTest = new ethers.Contract(POOL_SWAP_TEST, POOL_SWAP_TEST_ABI, wallet);

    const fee = params.fee || 3000;
    const amountIn = ethers.parseUnits(params.amountIn, 18);

    // Calculate pool ID
    const poolId = calculatePoolId(params.tokenIn, params.tokenOut, fee);

    // Determine swap direction (zeroForOne)
    const zeroForOne = params.tokenIn.toLowerCase() < params.tokenOut.toLowerCase();

    // Approve input token
    await ensureTokenApproval(wallet, params.tokenIn, POOL_SWAP_TEST, amountIn);

    console.log('Executing swap via PoolSwapTest...');
    console.log(`Pool ID: ${poolId}`);
    console.log(`Amount: ${params.amountIn}`);
    console.log(`Zero for One: ${zeroForOne}`);

    // Execute swap
    // amountSpecified is negative for exact input swaps
    const tx = await swapTest.swap(
        poolId,
        zeroForOne,
        -amountIn, // Negative for exact input
        0, // sqrtPriceLimitX96 (0 = no limit)
        '0x' // Empty hook data
    );

    console.log(`Swap transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Swap confirmed: ${receipt.hash}`);

    return receipt;
}

// Add liquidity using PoolModifyLiquidityTest contract
export async function addLiquidity(
    wallet: ethers.Wallet,
    params: {
        token0: string;
        token1: string;
        fee: number;
        tickLower: number;
        tickUpper: number;
        amount0Desired: string;
        amount1Desired: string;
        amount0Min: string;
        amount1Min: string;
        recipient: string;
    }
): Promise<ethers.TransactionReceipt> {
    const liquidityTest = new ethers.Contract(
        POOL_MODIFY_LIQUIDITY_TEST,
        POOL_MODIFY_LIQUIDITY_TEST_ABI,
        wallet
    );

    const amount0 = ethers.parseUnits(params.amount0Desired, 18);
    const amount1 = ethers.parseUnits(params.amount1Desired, 18);

    // Calculate pool ID
    const poolId = calculatePoolId(params.token0, params.token1, params.fee);

    // Approve both tokens
    await ensureTokenApproval(wallet, params.token0, POOL_MODIFY_LIQUIDITY_TEST, amount0);
    await ensureTokenApproval(wallet, params.token1, POOL_MODIFY_LIQUIDITY_TEST, amount1);

    // Calculate liquidity delta (simplified - use average of amounts)
    const liquidityDelta = (amount0 + amount1) / BigInt(2);

    console.log('Adding liquidity via PoolModifyLiquidityTest...');
    console.log(`Pool ID: ${poolId}`);
    console.log(`Tick Range: [${params.tickLower}, ${params.tickUpper}]`);
    console.log(`Liquidity Delta: ${liquidityDelta}`);

    // Add liquidity
    const tx = await liquidityTest.modifyLiquidity(
        poolId,
        params.tickLower,
        params.tickUpper,
        liquidityDelta, // Positive for adding
        '0x' // Empty hook data
    );

    console.log(`Add liquidity transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Liquidity added: ${receipt.hash}`);

    return receipt;
}

// Remove liquidity
export async function removeLiquidity(
    wallet: ethers.Wallet,
    token0: string,
    token1: string,
    fee: number,
    tickLower: number,
    tickUpper: number,
    liquidityAmount: string
): Promise<ethers.TransactionReceipt> {
    const liquidityTest = new ethers.Contract(
        POOL_MODIFY_LIQUIDITY_TEST,
        POOL_MODIFY_LIQUIDITY_TEST_ABI,
        wallet
    );

    const liquidity = ethers.parseUnits(liquidityAmount, 18);
    const poolId = calculatePoolId(token0, token1, fee);

    console.log('Removing liquidity via PoolModifyLiquidityTest...');
    console.log(`Pool ID: ${poolId}`);
    console.log(`Liquidity to remove: ${liquidityAmount}`);

    // Remove liquidity (negative delta)
    const tx = await liquidityTest.modifyLiquidity(
        poolId,
        tickLower,
        tickUpper,
        -liquidity, // Negative for removing
        '0x'
    );

    console.log(`Remove liquidity transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Liquidity removed: ${receipt.hash}`);

    return receipt;
}

// Calculate optimal tick range
export function calculateTickRange(
    currentTick: number = 0,
    rangePercent: number = 10
): { tickLower: number; tickUpper: number } {
    const TICK_SPACING = 60; // For 0.3% fee tier

    const tickRange = Math.floor((rangePercent / 100) * 1000);

    let tickLower = currentTick - tickRange;
    let tickUpper = currentTick + tickRange;

    // Round to nearest tick spacing
    tickLower = Math.floor(tickLower / TICK_SPACING) * TICK_SPACING;
    tickUpper = Math.ceil(tickUpper / TICK_SPACING) * TICK_SPACING;

    return { tickLower, tickUpper };
}

// Get pool information (simplified)
export async function getPoolInfo(
    token0: string,
    token1: string,
    fee: number
): Promise<any> {
    // For now, return mock data
    // In production, query PoolManager or StateView contract
    return {
        token0,
        token1,
        fee,
        sqrtPriceX96: '0',
        tick: 0,
        liquidity: '0',
    };
}

// Search for pools
export async function searchPools(
    token0: string,
    token1: string
): Promise<any[]> {
    const feeTiers = [500, 3000, 10000];
    const pools = [];

    for (const fee of feeTiers) {
        const pool = await getPoolInfo(token0, token1, fee);
        pools.push(pool);
    }

    return pools;
}

// Get positions (mock for now)
export async function getPositions(walletAddress: string): Promise<any[]> {
    // In production, query position manager or use event logs
    return [];
}
