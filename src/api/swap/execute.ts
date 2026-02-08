/**
 * POST /api/swap/execute
 * 
 * Execute swap with FULL PROOF OF REASONING
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { DecisionProofEngine, DecisionNode, DecisionTree } from '../../services/agent/DecisionProofEngine';
import { executeSwapV4, ensureTokenApproval } from '../../lib/uniswap-v4';
import { getProvider, getWallet } from '../../lib/ethereum';
import { TOKENS } from '../../lib/agent-config';

interface Request {
    body: any;
}
interface Response {
    json: (data: any) => void;
    status: (code: number) => { json: (data: any) => void };
}

// -- Mock Market Analyzer --
class MarketAnalyzer {
    async analyze(fromToken: string, toToken: string) {
        return {
            price: '3000.00',
            volume: '1.2B',
            liquidity: 'Deep',
            volatility: 'Medium'
        };
    }
}

export async function executeSwapWithProof(req: Request, res: Response) {
    const { fromToken, toToken, amount } = req.body;

    try {
        console.log('📊 Agent starting market analysis...');
        const marketAnalyzer = new MarketAnalyzer();
        const marketData = await marketAnalyzer.analyze(fromToken, toToken);

        const amountSpecified = ethers.parseUnits(amount, 18);
        const zeroForOne = fromToken === TOKENS.USDC; // Correct V4 logic

        const possibleActions: DecisionNode[] = [
            {
                action: 'SWAP_DIRECT',
                reasoning: 'Direct swap in single pool',
                confidence: 85,
                parameters: {
                    currency0: TOKENS.USDC,
                    currency1: TOKENS.WETH,
                    amount: amountSpecified.toString(),
                    zeroForOne
                }
            },
            {
                action: 'SWAP_MULTIHOP',
                reasoning: 'Route through USDC for better price',
                confidence: 92,
                parameters: {
                    currency0: TOKENS.USDC,
                    currency1: TOKENS.WETH,
                    amount: amountSpecified.toString(),
                    zeroForOne
                }
            }
        ];

        const chosenAction = possibleActions[0]; // Direct swap for demo

        const decisionTree: DecisionTree = {
            rootCause: `Favorable ETH/USDC price detected: $${marketData.price}`,
            marketAnalysis: marketData,
            riskAssessment: {
                slippage: '0.5%',
                gasEstimate: '0.002 ETH',
                priceImpact: '0.1%',
                riskScore: 'LOW'
            },
            possibleActions,
            chosenAction,
            timestamp: Date.now()
        };

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: PREPARE AND APPROVE (BEFORE PROOF)
        // ═══════════════════════════════════════════════════════════════
        console.log('🔄 Preparing approvals (this may take a moment)...');
        const provider = getProvider();
        const wallet = getWallet(provider);
        const amountIn = ethers.parseUnits(amount, 18);
        const UNIVERSAL_ROUTER_ADDRESS = process.env.UNIVERSAL_ROUTER_ADDRESS || '0xf13D190e9117920c703d79B5F33732e10049b115';

        // This is now idempotent and fast if already approved
        await ensureTokenApproval(wallet, fromToken, UNIVERSAL_ROUTER_ADDRESS, amountIn);

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: GENERATE PROOF (LATE AS POSSIBLE)
        // ═══════════════════════════════════════════════════════════════
        console.log('🔐 Generating cryptographic proof of decision...');
        const privateKey = process.env.PRIVATE_KEY || '';
        const proofEngine = new DecisionProofEngine(privateKey);

        // Ensure timestamp is current Unix seconds
        decisionTree.timestamp = Math.floor(Date.now() / 1000);

        const proof = await proofEngine.generateDecisionProof(decisionTree, chosenAction);

        console.log('✅ Proof Generated:');
        console.log('   Merkle Root:', proof.merkleRoot);
        console.log('   Timestamp:', decisionTree.timestamp);

        // Encode for hook
        const hookData = ethers.AbiCoder.defaultAbiCoder().encode(
            ['tuple(bytes32,bytes32[],bytes32,uint256,bytes)', 'string'],
            [
                [
                    proof.merkleRoot,
                    proof.merkleProof,
                    proof.actionHash,
                    decisionTree.timestamp,
                    proof.signature
                ],
                proof.reasoning
            ]
        );

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: EXECUTE SWAP
        // ═══════════════════════════════════════════════════════════════
        console.log('🚀 Executing swap on Uniswap v4...');
        const txReceipt = await executeSwapV4(wallet, {
            tokenIn: fromToken,
            tokenOut: toToken,
            amountIn: amount,
            amountOutMinimum: '0',
            recipient: wallet.address,
            hookData: hookData
        });

        console.log('🎉 Swap Success!');
        console.log('   Hash:', txReceipt.hash);

        return res.json({
            success: true,
            hash: txReceipt.hash,
            proof: proof.merkleRoot
        });

    } catch (error: any) {
        console.error('❌ Failed:', error.message);
        if (error.data) {
            console.error('   FULL REVERT DATA:', error.data);
        }
        return res.status(500).json({ success: false, error: error.message });
    }
}

// Direct execution
if (require.main === module) {
    executeSwapWithProof({
        body: {
            fromToken: TOKENS.WETH,
            toToken: TOKENS.USDC,
            amount: '0.0001'
        }
    } as any, {
        json: (data) => console.log('Result:', data),
        status: (code) => ({ json: (data: any) => console.log('Error:', data) })
    } as any);
}
