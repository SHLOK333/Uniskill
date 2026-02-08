// Enhanced Uniswap v4 integration with swap execution
import { ethers } from 'ethers';
import { getProvider } from './ethereum';

import { TOKENS, POOL_CONFIG } from './agent-config';

// Contract addresses on Sepolia
const POOL_MANAGER_ADDRESS = process.env.POOL_MANAGER_ADDRESS || '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
const UNIVERSAL_ROUTER_ADDRESS = process.env.UNIVERSAL_ROUTER_ADDRESS || '0xf13D190e9117920c703d79B5F33732e10049b115';
const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS || '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4';
const QUOTER_ADDRESS = process.env.QUOTER_ADDRESS || '0x61b3f2011a92d183c7dbadbda940a7555ccf9227';

// Token Addresses from Config
export const TEST_USDC_ADDRESS = TOKENS.USDC;
export const WETH_ADDRESS = TOKENS.WETH;

// ERC20// ABI configuration
const ERC20_ABI = [
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function allowance(address owner, address spender) public view returns (uint256)',
    'function balanceOf(address account) public view returns (uint256)',
    'function decimals() public view returns (uint8)',
    'function mint(address to, uint256 amount) external'
];

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const PERMIT2_ABI = [
    'function approve(address token, address spender, uint160 amount, uint48 expiration) external'
];

// Minimal ABIs for Uniswap v4 contracts
const QUOTER_ABI = [
    'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

const SWAP_ROUTER_ABI = [
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, bool zeroForOne, (address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bytes hookData, address receiver, uint256 deadline) external payable returns (int256 amount0, int256 amount1)',
];

const POOL_MANAGER_ABI = [
    'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint24 lpFee)',
    'function getLiquidity(bytes32 poolId) external view returns (uint128 liquidity)',
];

const POSITION_MANAGER_ABI = [
    'function modifyLiquidity((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes hookData)) external payable returns (int256 delta0, int256 delta1)',
    'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
    'function balanceOf(address owner) external view returns (uint256 balance)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
];

export interface SwapQuoteParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    fee?: number;
}

export interface SwapQuote {
    amountIn: string;
    amountOut: string;
    priceImpact: string;
    gasEstimate: string;
    route: string[];
}

export interface SwapExecutionParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOutMinimum: string;
    fee?: number;
    recipient: string;
    deadline?: number;
    hookData?: string;
}

export interface PoolInfo {
    token0: string;
    token1: string;
    fee: number;
    sqrtPriceX96: string;
    tick: number;
    liquidity: string;
}

export interface Position {
    tokenId: string;
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    liquidity: string;
    tokensOwed0: string;
    tokensOwed1: string;
}

export interface AddLiquidityParams {
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
    deadline?: number;
}

// Get swap quote from Quoter contract
export async function getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const provider = getProvider();
    const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);

    const fee = params.fee || 3000;
    const amountIn = ethers.parseUnits(params.amountIn, 18);

    try {
        const quoteParams = {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: amountIn,
            fee: fee,
            sqrtPriceLimitX96: 0,
        };

        const result = await quoter.quoteExactInputSingle(quoteParams);

        const amountOut = ethers.formatUnits(result.amountOut, 18);
        const priceImpact = calculatePriceImpact(params.amountIn, amountOut);

        return {
            amountIn: params.amountIn,
            amountOut: amountOut,
            priceImpact: priceImpact,
            gasEstimate: result.gasEstimate.toString(),
            route: [params.tokenIn, params.tokenOut],
        };
    } catch (error) {
        console.error('Quote error:', error);
        throw new Error('Failed to get swap quote');
    }
}

function calculatePriceImpact(amountIn: string, amountOut: string): string {
    return '0.01';
}

// Check and approve token if needed
// Ensure token approval (Router + Permit2)
export async function ensureTokenApproval(
    wallet: ethers.Wallet,
    tokenAddress: string,
    routerAddress: string,
    amount: bigint
) {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const permit2 = new ethers.Contract(PERMIT2_ADDRESS, PERMIT2_ABI, wallet);

    // 1. Approve Permit2 on Token
    const allowancePermit2 = await token.allowance(wallet.address, PERMIT2_ADDRESS);
    if (allowancePermit2 < amount) {
        console.log(`Approving Permit2 (${PERMIT2_ADDRESS}) for Token...`);
        const tx1 = await token.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
        await tx1.wait();
        console.log('Permit2 Approved on Token.');
    } else {
        console.log('Permit2 already approved on Token.');
    }

    // 2. Approve Router on Permit2
    // We'd ideally check Permit2 allowance here too but let's just do it for now
    // Actually Permit2.allowance(owner, token, spender)
    console.log(`Approving Router (${routerAddress}) on Permit2...`);
    const expiration = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    // Permit2 uses uint160 for amount
    const maxUint160 = BigInt("1461501637330902918203684832716283019655932542975"); // 2^160 - 1
    const tx2 = await permit2.approve(tokenAddress, routerAddress, maxUint160, expiration);
    await tx2.wait();
    console.log('Router Approved on Permit2.');

    // Legacy approval just in case (Router direct)
    const allowanceRouter = await token.allowance(wallet.address, routerAddress);
    if (allowanceRouter < amount) {
        console.log(`Approving Router (${routerAddress}) directly on Token (Legacy)...`);
        const tx3 = await token.approve(routerAddress, ethers.MaxUint256);
        await tx3.wait();
        console.log('Direct Router Approval confirmed.');
    } else {
        console.log('Router already approved on Token.');
    }
}

// Execute swap using V4 Swap Router
export async function executeSwapV4(
    wallet: ethers.Wallet,
    params: SwapExecutionParams
): Promise<ethers.TransactionReceipt> {
    const router = new ethers.Contract(UNIVERSAL_ROUTER_ADDRESS, SWAP_ROUTER_ABI, wallet);

    const deadline = params.deadline || Math.floor(Date.now() / 1000) + 60 * 20;
    const amountIn = ethers.parseUnits(params.amountIn, 18);
    const amountOutMin = ethers.parseUnits(params.amountOutMinimum, 18);

    // Determine correct pool key and zeroForOne
    // We assume the pool exists in AGENT_CONFIG or we derive it
    // For this specific deployed pool: TestUSDC/WETH 3000

    // Sort tokens to determine 0 and 1
    const tokenA = params.tokenIn;
    const tokenB = params.tokenOut;

    // Simple sort
    const isZeroForOne = tokenA.toLowerCase() < tokenB.toLowerCase();

    const token0 = isZeroForOne ? tokenA : tokenB;
    const token1 = isZeroForOne ? tokenB : tokenA;

    // Pool Configuration (hardcoded to deployed pool specs for now)
    const fee = params.fee || 3000;
    const tickSpacing = 60;

    // Check if input token is ETH/WETH for value (Native ETH support depends on Router)
    // For this router, standard ERC20 approval is needed.
    const isETH = params.tokenIn === ethers.ZeroAddress; // Only if actual ETH

    if (!isETH) {
        await ensureTokenApproval(wallet, params.tokenIn, UNIVERSAL_ROUTER_ADDRESS, amountIn);
    }

    const value = isETH ? amountIn : BigInt(0);
    // Use user-provided hookData or empty
    const hookData = params.hookData || '0x';

    // Use configured Hook Address
    const hooks = POOL_CONFIG.hooks || ethers.ZeroAddress;

    const poolKey = {
        currency0: token0,
        currency1: token1,
        fee: fee,
        tickSpacing: tickSpacing,
        hooks: hooks
    };

    console.log(`Executing V4 Swap: ${isZeroForOne ? '0 -> 1' : '1 -> 0'}`);
    console.log(`Pool: ${token0} / ${token1} (Fee: ${fee})`);
    console.log(`Hooks: ${hooks}`);
    console.log(`HookData Length: ${hookData.length}`);

    // Simulate first to check for reverts
    try {
        await router.swapExactTokensForTokens.staticCall(
            amountIn,
            amountOutMin,
            isZeroForOne,
            poolKey,
            hookData,
            params.recipient,
            deadline,
            { value }
        );
        console.log('✅ Simulation Successful');
    } catch (error) {
        console.error('❌ Simulation Failed:', error);
        throw error;
    }

    const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        isZeroForOne,
        poolKey,
        hookData,
        params.recipient,
        deadline,
        {
            value,
            gasLimit: 500000 // Force gas limit
        }
    );
    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Swap confirmed: ${receipt.hash}`);

    return receipt;
}

// Add liquidity to a pool
export async function addLiquidity(
    wallet: ethers.Wallet,
    params: AddLiquidityParams
): Promise<ethers.TransactionReceipt> {
    const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        wallet
    );

    const amount0 = ethers.parseUnits(params.amount0Desired, 18);
    const amount1 = ethers.parseUnits(params.amount1Desired, 18);
    const amount0Min = ethers.parseUnits(params.amount0Min, 18);
    const amount1Min = ethers.parseUnits(params.amount1Min, 18);

    // Approve both tokens
    await ensureTokenApproval(wallet, params.token0, POSITION_MANAGER_ADDRESS, amount0);
    await ensureTokenApproval(wallet, params.token1, POSITION_MANAGER_ADDRESS, amount1);

    // Calculate liquidity delta (positive for adding)
    const liquidityDelta = calculateLiquidityDelta(amount0, amount1, params.tickLower, params.tickUpper);

    const modifyParams = {
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        liquidityDelta: liquidityDelta,
        hookData: '0x',
    };

    console.log('Adding liquidity...');
    const tx = await positionManager.modifyLiquidity(modifyParams);
    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Liquidity added: ${receipt.hash}`);

    return receipt;
}

// Remove liquidity from a pool
export async function removeLiquidity(
    wallet: ethers.Wallet,
    token0: string,
    token1: string,
    fee: number,
    tickLower: number,
    tickUpper: number,
    liquidityAmount: string
): Promise<ethers.TransactionReceipt> {
    const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        wallet
    );

    const liquidity = ethers.parseUnits(liquidityAmount, 18);

    const modifyParams = {
        token0,
        token1,
        fee,
        tickLower,
        tickUpper,
        liquidityDelta: -liquidity, // Negative for removing
        hookData: '0x',
    };

    console.log('Removing liquidity...');
    const tx = await positionManager.modifyLiquidity(modifyParams);
    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Liquidity removed: ${receipt.hash}`);

    return receipt;
}

// Calculate liquidity delta (simplified)
function calculateLiquidityDelta(
    amount0: bigint,
    amount1: bigint,
    tickLower: number,
    tickUpper: number
): bigint {
    // Simplified calculation - in production, use proper math
    // This is a placeholder that returns a reasonable value
    const avgAmount = (amount0 + amount1) / 2n;
    return avgAmount;
}

// Get pool information
export async function getPoolInfo(
    token0: string,
    token1: string,
    fee: number,
    tickSpacing: number = 60,
    hooks: string = ethers.ZeroAddress
): Promise<PoolInfo | null> {
    const provider = getProvider();
    const poolManager = new ethers.Contract(POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, provider);

    try {
        const poolId = calculatePoolId(token0, token1, fee, tickSpacing, hooks);
        console.log(`Checking Pool ID: ${poolId}`);

        const slot0 = await poolManager.getSlot0(poolId);
        const liquidity = await poolManager.getLiquidity(poolId);

        return {
            token0,
            token1,
            fee,
            sqrtPriceX96: slot0.sqrtPriceX96.toString(),
            tick: Number(slot0.tick),
            liquidity: liquidity.toString(),
        };
    } catch (error) {
        console.error('Failed to get pool info:', error);
        return null;
    }
}

// Calculate Pool ID for V4
export function calculatePoolId(token0: string, token1: string, fee: number, tickSpacing: number, hooks: string): string {
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'address', 'uint24', 'int24', 'address'],
            [token0, token1, fee, tickSpacing, hooks]
        )
    );
}

// Get positions for a wallet
export async function getPositions(walletAddress: string): Promise<Position[]> {
    const provider = getProvider();
    const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        provider
    );

    try {
        const balance = await positionManager.balanceOf(walletAddress);
        const positions: Position[] = [];

        for (let i = 0; i < Number(balance); i++) {
            const tokenId = await positionManager.tokenOfOwnerByIndex(walletAddress, i);
            const position = await positionManager.positions(tokenId);

            positions.push({
                tokenId: tokenId.toString(),
                token0: position.token0,
                token1: position.token1,
                fee: Number(position.fee),
                tickLower: Number(position.tickLower),
                tickUpper: Number(position.tickUpper),
                liquidity: position.liquidity.toString(),
                tokensOwed0: position.tokensOwed0.toString(),
                tokensOwed1: position.tokensOwed1.toString(),
            });
        }

        return positions;
    } catch (error) {
        console.error('Failed to get positions:', error);
        return [];
    }
}

// Search for pools by token pair
export async function searchPools(
    token0: string,
    token1: string
): Promise<PoolInfo[]> {
    const pools: PoolInfo[] = [];
    const feeTiers = [500, 3000, 10000];

    for (const fee of feeTiers) {
        const pool = await getPoolInfo(token0, token1, fee);
        if (pool && pool.liquidity !== '0') {
            pools.push(pool);
        }
    }

    return pools;
}

// Get best pool for a token pair
export async function getBestPool(
    token0: string,
    token1: string
): Promise<PoolInfo | null> {
    const pools = await searchPools(token0, token1);

    if (pools.length === 0) return null;

    return pools.reduce((best, current) => {
        return BigInt(current.liquidity) > BigInt(best.liquidity) ? current : best;
    });
}

// Calculate optimal tick range for liquidity provision
export function calculateTickRange(
    currentTick: number,
    rangePercent: number = 10
): { tickLower: number; tickUpper: number } {
    const TICK_SPACING = 60; // Common tick spacing for 0.3% fee tier

    // Calculate tick range based on percentage
    const tickRange = Math.floor((rangePercent / 100) * 1000);

    let tickLower = currentTick - tickRange;
    let tickUpper = currentTick + tickRange;

    // Round to nearest tick spacing
    tickLower = Math.floor(tickLower / TICK_SPACING) * TICK_SPACING;
    tickUpper = Math.ceil(tickUpper / TICK_SPACING) * TICK_SPACING;

    return { tickLower, tickUpper };
}
