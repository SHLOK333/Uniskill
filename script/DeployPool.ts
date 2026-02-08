import 'dotenv/config';
import { ethers } from 'ethers';
import { TOKENS, POOL_CONFIG, HOOK_ADDRESS, POSITION_MANAGER } from '../src/lib/agent-config';
import { getProvider, getWallet } from '../src/lib/ethereum';

const POSITION_MANAGER_ABI = [
    'function initializePool((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks), uint160 sqrtPriceX96, bytes hookData) external payable returns (int24 tick)',
    'function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable',
];

const POOL_KEY_ABI = [
    'tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks)'
];

const MINT_PARAMS_ABI = [
    'tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks)', // PoolKey
    'int24', // tickLower
    'int24', // tickUpper
    'uint256', // liquidity
    'uint128', // amount0Max
    'uint128', // amount1Max
    'address', // recipient
    'bytes' // hookData
];

async function main() {
    console.log('🏊 Deploying Pool & Adding Liquidity...');
    const provider = getProvider();
    const wallet = getWallet(provider);

    console.log(`User: ${wallet.address}`);
    console.log(`Using Hook: ${HOOK_ADDRESS}`);

    const pm = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, wallet);

    // Sort Tokens
    const tokenA = TOKENS.USDC;
    const tokenB = TOKENS.WETH;
    const isZeroForOne = tokenA.toLowerCase() < tokenB.toLowerCase();
    const currency0 = isZeroForOne ? tokenA : tokenB;
    const currency1 = isZeroForOne ? tokenB : tokenA;

    console.log(`Pool: ${currency0} / ${currency1}`);

    const token0Contract = new ethers.Contract(currency0, ['function approve(address,uint256) public returns (bool)'], wallet);
    const token1Contract = new ethers.Contract(currency1, ['function approve(address,uint256) public returns (bool)'], wallet);

    const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
    const permit2 = new ethers.Contract(PERMIT2_ADDRESS, ['function approve(address token, address spender, uint160 amount, uint48 expiration) external'], wallet);

    console.log('Approving Permit2...');
    try {
        // 1. Approve Permit2 on Token
        const tx0 = await token0Contract.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
        await tx0.wait();
        console.log(`Approved Permit2 for ${currency0}`);

        const tx1 = await token1Contract.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
        await tx1.wait();
        console.log(`Approved Permit2 for ${currency1}`);

        // 2. Approve PositionManager on Permit2
        console.log('Permit2: Approving PositionManager...');
        const expiration = Math.floor(Date.now() / 1000) + 3600 * 24 * 30; // 30 days
        const amount = ethers.MaxUint256; // uint160 max?
        // simple max uint160: 2^160 - 1
        const maxUint160 = "1461501637330902918203684832716283019655932542975";

        const txP0 = await permit2.approve(currency0, POSITION_MANAGER, maxUint160, expiration);
        await txP0.wait();
        const txP1 = await permit2.approve(currency1, POSITION_MANAGER, maxUint160, expiration);
        await txP1.wait();
        console.log('Permit2 approvals done.');

    } catch (e) {
        console.log('Permit2 Approval failed:', e);
    }

    const poolKey = {
        currency0: currency0,
        currency1: currency1,
        fee: POOL_CONFIG.fee,
        tickSpacing: POOL_CONFIG.tickSpacing,
        hooks: HOOK_ADDRESS
    };

    const poolKeyTuple = [
        currency0,
        currency1,
        POOL_CONFIG.fee,
        POOL_CONFIG.tickSpacing,
        HOOK_ADDRESS
    ];

    // 1. Initialize Pool
    // Price 1:1 for simplicity (sqrt(1) * 2^96 = 79228162514264337593543950336)
    // Actually, ETH = 3000 USDC.
    // If currency0 is USDC (address starts with 0x60..), currency1 is WETH (0x7b..).
    // Price = USDC/ETH = 3000.
    // SqrtPrice = sqrt(3000) * 2^96.
    // sqrt(3000) approx 54.77.
    // 54.77 * 2^96 = 4339506636730000000000000000000 (approx)

    // Let's calculate precise SqrtPrice.
    // Price0 = amount1/amount0? No. Price is token1/token0.
    // If 0 is USDC, 1 is WETH.
    // 1 WETH = 3000 USDC.
    // Price = WETH/USDC = 1/3000? No. 
    // Usually Price is Amount1/Amount0.
    // If we want 1 ETH = 3000 USDC.
    // 1 unit of token1 worth 3000 units of token0? No.

    // Let's stick to SQRT_PRICE_1_1 for simplicity in test net.
    // Or just use a valid number. 
    const SQRT_PRICE_1_1 = BigInt("79228162514264337593543950336");

    console.log('Initializing Pool...');
    try {
        // Try passing tuple
        const tx = await pm.initializePool(poolKeyTuple, SQRT_PRICE_1_1, '0x');
        console.log(`Init Tx: ${tx.hash}`);
        await tx.wait();
        console.log('✅ Pool Initialized.');
    } catch (e: any) {
        console.log('⚠️ Pool Initialization Failed:', e.message);
        if (e.data) console.log('Init Revert Data:', e.data);
        // If error is "Pool already initialized", it usually reverts with empty data or specific error?
        // PoolManager doesn't have "PoolAlreadyInitialized". It uses "PoolAlreadyInitialized()"?
        // V4 Manager: initialize -> if already init -> reverts with ...?
        // Actually, PositionManager might check it.
    }

    // 2. Add Liquidity (Mint)
    console.log('Adding Liquidity...');

    // Full Range: Min to Max tick?
    // TickSpacing 60.
    // Max Tick: 887272. Min Tick: -887272.
    // Nearest divisible by 60.
    const tickLower = -887220;
    const tickUpper = 887220;

    const liquidity = ethers.parseEther("0.01"); // Arbitrary liquidity amount
    const amount0Max = ethers.parseEther("100"); // Slippage limits
    const amount1Max = ethers.parseEther("100"); // Slippage limits

    // Encode Mint Params
    // ABI: (PoolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, recipient, hookData)
    const mintParams = ethers.AbiCoder.defaultAbiCoder().encode(
        MINT_PARAMS_ABI,
        [
            poolKey,
            tickLower,
            tickUpper,
            liquidity,
            amount0Max,
            amount1Max,
            wallet.address,
            '0x' // hookData for modifyLiquidity
        ]
    );

    // Encode Actions
    // MINT_POSITION = 0x02
    // SETTLE_PAIR = 0x0d
    const actions = '0x020d';
    const mintParamsEncoded = ethers.AbiCoder.defaultAbiCoder().encode(MINT_PARAMS_ABI, [poolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, wallet.address, '0x']);
    const settlePairParams = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'address'], [currency0, currency1]);

    const unlockData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes', 'bytes[]'],
        [actions, [mintParamsEncoded, settlePairParams]]
    );

    try {
        console.log("Simulating modifyLiquidities...");
        await pm.modifyLiquidities.staticCall(unlockData, Math.floor(Date.now() / 1000) + 600, {
            value: ethers.parseEther("0.1")
        });
        console.log("Simulation succeeded!");

        const tx = await pm.modifyLiquidities(unlockData, Math.floor(Date.now() / 1000) + 600, {
            gasLimit: 5000000,
            value: ethers.parseEther("0.1") // Send some ETH just in case? Or WETH needed?
            // If tokens are ERC20, we need approval.
            // We ran ApproveRouter. Does PositionManager use same Router allowance? 
            // PositionManager is separate.
            // We need to Approve PositionManager too!
        });
        console.log(`Liquidity Tx: ${tx.hash}`);
        await tx.wait();
        console.log('✅ Liquidity Added.');
    } catch (e: any) {
        console.error('❌ Failed to add liquidity:', e);
        if (e.data) {
            console.error('Revert Data:', e.data);
            const selector = e.data.slice(0, 10);
            const errors = [
                'NotApproved(address)',
                'DeadlinePassed(uint256)',
                'PoolManagerMustBeLocked()',
                'PoolNotInitialized()',
                'TickSpacingTooLarge(int24)',
                'TickSpacingTooSmall(int24)',
                'CurrenciesOutOfOrderOrEqual(address,address)',
                'UnauthorizedDynamicLPFeeUpdate()',
                'SwapAmountCannotBeZero()',
                'NonzeroNativeValue()',
                'MustClearExactPositiveDelta()',
                'ManagerLocked()',
                'AlreadyUnlocked()',
                'CurrencyNotSettled()',
                // Periphery
                'InvalidHookResponse()',
                'HookNotImplemented()',
                'HookAddressNotValid(address)',
            ];
            for (const err of errors) {
                const s = ethers.id(err).slice(0, 10);
                if (s === selector) {
                    console.error('DECODED ERROR:', err);
                }
            }
        }
        if (e.reason) console.error('Revert Reason:', e.reason);
    }
}

main().catch(console.error);
