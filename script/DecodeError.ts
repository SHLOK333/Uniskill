import { ethers } from 'ethers';

// Decodes Uniswap v4 WrappedError(address target, bytes4 selector, bytes reason, bytes details)
// Selector: 0x90bfb865

const revertData = process.argv[2];

if (!revertData) {
    console.error('Please provide revert data as argument');
    process.exit(1);
}

const abi = [
    'error WrappedError(address target, bytes4 selector, bytes reason, bytes details)'
];

const iface = new ethers.Interface(abi);

try {
    const error = iface.parseError(revertData);
    if (error) {
        console.log('--- WrappedError Decoded ---');
        console.log('Target:', error.args[0]);
        console.log('Selector:', error.args[1]);
        console.log('Reason (Hex):', error.args[2]);

        // Try to decode the internal reason
        const internalReason = error.args[2];
        if (internalReason && internalReason !== '0x') {
            console.log('Attempting to decode internal reason...');
            // Common V4 Errors
            const v4Errors = [
                'error AgentNotRegistered()', // POA
                'error InvalidAgentSignature()', // POA
                'error ActionNotInDecisionTree()', // POA
                'error DecisionTooOld()', // POA
                'error ActionMismatch()', // POA
                'error DecisionAlreadyUsed()', // POA
                'error PoolNotInitialized()',
                'error TickSpacingTooLarge(int24)',
                'error TickSpacingTooSmall(int24)',
                'error CurrenciesOutOfOrderOrEqual(address,address)',
                'error LockingPoolManagerFailed()',
                'error ManagerLocked()',
                'error CurrencyNotSettled()',
                'error SwapAmountCannotBeZero()',
                'error L()', // Liquidity error
            ];
            const poaIface = new ethers.Interface([
                'error AgentNotRegistered()',
                'error InvalidAgentSignature()',
                'error ActionNotInDecisionTree()',
                'error DecisionTooOld()',
                'error ActionMismatch()',
                'error DecisionAlreadyUsed()',
                'error POA_AgentNotRegistered()', // Variations
                'error POA_InvalidSignature()',
                'error POA_ActionMismatch()',
                'error POA_DecisionTooOld()',
                'error POA_DecisionAlreadyUsed()',
                'error POA_ActionNotInTree()'
            ]);

            try {
                // Check if it's a standard string revert
                if (internalReason.startsWith('0x08c379a0')) {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + internalReason.slice(10));
                    console.log('Internal Revert String:', decoded[0]);
                } else {
                    console.log('Internal Reason is a custom error or unknown selector:', internalReason.slice(0, 10));
                }
            } catch (e) {
                console.log('Could not decode as string revert.');
            }
        }
    }
} catch (e: any) {
    console.error('Failed to decode:', e.message);
}
