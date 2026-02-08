/**
 * DecisionProofEngine - Generates cryptographic proofs of AI reasoning
 */

import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';

export interface DecisionNode {
    action: string;
    reasoning: string;
    confidence: number;
    parameters: any;
}

export interface DecisionTree {
    rootCause: string;
    marketAnalysis: any;
    riskAssessment: any;
    possibleActions: DecisionNode[];
    chosenAction: DecisionNode;
    timestamp: number;
}

export class DecisionProofEngine {

    private agentWallet: ethers.Wallet;

    constructor(agentPrivateKey: string) {
        this.agentWallet = new ethers.Wallet(agentPrivateKey);
    }

    /**
     * Generate complete proof of agent decision
     */
    async generateDecisionProof(
        decisionTree: DecisionTree,
        chosenAction: DecisionNode
    ): Promise<{
        merkleRoot: string;
        merkleProof: string[];
        actionHash: string;
        signature: string;
        reasoning: string;
    }> {

        // 1. Hash all possible actions using Solidity-compatible hashing
        // Parameters: (currency0, currency1, amount, zeroForOne)
        const actionHashes = decisionTree.possibleActions.map(action => {
            const p = action.parameters;
            return ethers.solidityPackedKeccak256(
                ['address', 'address', 'int256', 'bool'],
                [p.currency0, p.currency1, BigInt(p.amount), p.zeroForOne]
            );
        });

        // 2. Build Merkle tree of all decisions
        const merkleTree = new MerkleTree(actionHashes, ethers.keccak256, {
            sortPairs: true
        });

        const merkleRoot = merkleTree.getHexRoot();

        // 3. Get proof for chosen action
        const p = chosenAction.parameters;
        const chosenActionHash = ethers.solidityPackedKeccak256(
            ['address', 'address', 'int256', 'bool'],
            [p.currency0, p.currency1, BigInt(p.amount), p.zeroForOne]
        );

        const merkleProof = merkleTree.getHexProof(chosenActionHash);

        // 4. Create message hash (Matching Solidity abi.encodePacked)
        // bytes32 messageHash = keccak256(abi.encodePacked(merkleRoot, actionHash, timestamp))
        const messageHash = ethers.solidityPackedKeccak256(
            ['bytes32', 'bytes32', 'uint256'],
            [merkleRoot, chosenActionHash, BigInt(decisionTree.timestamp)]
        );

        // 5. Agent signs the decision
        // Wallet.signMessage(messageHash) adds the prefix and signs
        const signature = await this.agentWallet.signMessage(ethers.getBytes(messageHash));

        // 6. Create human-readable reasoning
        const reasoning = this.generateReasoningExplanation(decisionTree, chosenAction);

        return {
            merkleRoot,
            merkleProof,
            actionHash: chosenActionHash,
            signature,
            reasoning
        };
    }

    /**
     * Generate human-readable explanation of AI reasoning
     */
    private generateReasoningExplanation(
        tree: DecisionTree,
        chosen: DecisionNode
    ): string {
        return `
AGENT DECISION REASONING (Verified On-Chain)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROOT CAUSE: ${tree.rootCause}

MARKET ANALYSIS:
${JSON.stringify(tree.marketAnalysis, null, 2)}

CONSIDERED ACTIONS: ${tree.possibleActions.length}
${tree.possibleActions.map((a, i) =>
            `  ${i + 1}. ${a.action} (confidence: ${a.confidence}%)`
        ).join('\n')}

CHOSEN ACTION: ${chosen.action}
CONFIDENCE: ${chosen.confidence}%
REASON: ${chosen.reasoning}

TIMESTAMP: ${new Date(tree.timestamp * 1000).toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    }

    /**
     * Verify a decision proof (can be done off-chain before submitting)
     */
    verifyProof(
        merkleRoot: string,
        merkleProof: string[],
        actionHash: string
    ): boolean {
        let computedHash = actionHash;

        for (const proofElement of merkleProof) {
            if (computedHash <= proofElement) {
                computedHash = ethers.solidityPackedKeccak256(['bytes32', 'bytes32'], [computedHash, proofElement]);
            } else {
                computedHash = ethers.solidityPackedKeccak256(['bytes32', 'bytes32'], [proofElement, computedHash]);
            }
        }

        return computedHash === merkleRoot;
    }
}
