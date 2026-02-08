// Transaction simulation utility using Tenderly
import { ethers } from 'ethers';

const TENDERLY_API_KEY = process.env.TENDERLY_API_KEY || '';
const TENDERLY_USER = process.env.TENDERLY_USER || '';
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || '';

export interface SimulationResult {
    success: boolean;
    gasUsed?: string;
    gasEstimate?: string;
    error?: string;
    revertReason?: string;
    stateChanges?: any[];
    logs?: any[];
}

// Simulate transaction using Tenderly API
export async function simulateTransaction(
    tx: ethers.TransactionRequest,
    from: string,
    chainId: number = 11155111 // Sepolia
): Promise<SimulationResult> {
    // If Tenderly is not configured, use basic gas estimation
    if (!TENDERLY_API_KEY || !TENDERLY_USER || !TENDERLY_PROJECT) {
        console.warn('Tenderly not configured, using basic gas estimation');
        return simulateWithBasicEstimation(tx, from);
    }

    try {
        const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`;

        const simulationPayload = {
            network_id: chainId.toString(),
            from: from,
            to: tx.to,
            input: tx.data,
            value: tx.value ? tx.value.toString() : '0',
            gas: tx.gasLimit ? tx.gasLimit.toString() : '8000000',
            gas_price: tx.gasPrice ? tx.gasPrice.toString() : '0',
            save: false,
            save_if_fails: false,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': TENDERLY_API_KEY,
            },
            body: JSON.stringify(simulationPayload),
        });

        if (!response.ok) {
            const error = await response.text();
            return {
                success: false,
                error: `Tenderly simulation failed: ${error}`,
            };
        }

        const result = await response.json();

        if (result.transaction.status === false) {
            return {
                success: false,
                error: 'Transaction would revert',
                revertReason: result.transaction.error_message || 'Unknown revert reason',
                gasUsed: result.transaction.gas_used,
            };
        }

        return {
            success: true,
            gasUsed: result.transaction.gas_used,
            gasEstimate: result.transaction.gas_used,
            stateChanges: result.transaction.state_changes,
            logs: result.transaction.logs,
        };
    } catch (error: any) {
        console.error('Tenderly simulation error:', error);
        return {
            success: false,
            error: error.message || 'Simulation failed',
        };
    }
}

// Fallback: Basic gas estimation without Tenderly
async function simulateWithBasicEstimation(
    tx: ethers.TransactionRequest,
    from: string
): Promise<SimulationResult> {
    try {
        const provider = new ethers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY'
        );

        // Try to estimate gas
        const gasEstimate = await provider.estimateGas({
            ...tx,
            from,
        });

        return {
            success: true,
            gasEstimate: gasEstimate.toString(),
            gasUsed: gasEstimate.toString(),
        };
    } catch (error: any) {
        // If gas estimation fails, the transaction would likely revert
        return {
            success: false,
            error: 'Transaction would likely revert',
            revertReason: error.message || 'Gas estimation failed',
        };
    }
}

// Simulate swap transaction
export async function simulateSwap(
    routerAddress: string,
    calldata: string,
    value: bigint,
    from: string
): Promise<SimulationResult> {
    const tx: ethers.TransactionRequest = {
        to: routerAddress,
        data: calldata,
        value: value,
        from: from,
    };

    return simulateTransaction(tx, from);
}

// Simulate liquidity operation
export async function simulateLiquidityOperation(
    positionManagerAddress: string,
    calldata: string,
    value: bigint,
    from: string
): Promise<SimulationResult> {
    const tx: ethers.TransactionRequest = {
        to: positionManagerAddress,
        data: calldata,
        value: value,
        from: from,
    };

    return simulateTransaction(tx, from);
}
