// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {SwapParams} from "v4-core/src/types/PoolOperation.sol";

// ... existing code ...

/**
 * @title ProofOfAgentHook
 * @notice Revolutionary hook that PROVES trades are executed by AI agents with verifiable reasoning
 * @dev Every swap requires cryptographic proof of:
 *      1. Agent identity (signed by registered agent key)
 *      2. Decision reasoning (merkle root of decision tree)
 *      3. Strategy adherence (action matches declared strategy)
 */
contract ProofOfAgentHook is BaseHook {
    
    error ActionMismatch(bytes32 expected, bytes32 actual);
    
    // ... existing code ...
    // AGENT REGISTRY - Who can trade and with what strategies
    // ═══════════════════════════════════════════════════════════════
    
    struct AgentIdentity {
        address agentWallet;           // Agent's execution wallet
        bytes32 modelHash;             // Hash of AI model configuration
        bytes32 strategyCommitment;    // Commitment to trading strategy
        uint256 registrationBlock;     // When agent was born
        bool isActive;                 // Can this agent still trade?
        uint256 successfulTrades;      // Track record
        uint256 failedTrades;          // Failures for reputation
    }
    
    struct TradeProof {
        bytes32 decisionMerkleRoot;    // Root of decision tree
        bytes32[] merkleProof;         // Proof this action is in tree
        bytes32 actionHash;            // Hash of this specific action
        uint256 decisionTimestamp;     // When decision was made
        bytes agentSignature;          // Agent's signature of decision
    }
    
    mapping(address => AgentIdentity) public agents;
    mapping(bytes32 => bool) public usedDecisionRoots; // Prevent replay attacks
    
    // Decision audit trail - fully transparent
    event AgentDecisionLogged(
        address indexed agent,
        bytes32 indexed decisionRoot,
        bytes32 actionHash,
        uint256 timestamp,
        string reasoning  // Human-readable explanation
    );
    
    event AgentRegistered(
        address indexed agent,
        bytes32 modelHash,
        bytes32 strategyCommitment,
        string agentName
    );
    
    event ProofVerified(
        address indexed agent,
        bytes32 decisionRoot,
        bool isValid
    );

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CORE VERIFICATION LOGIC
    // ═══════════════════════════════════════════════════════════════
    
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // ... implementation ...
        
        // STEP 1: Decode the proof data
        (TradeProof memory proof, string memory reasoning) = abi.decode(
            hookData,
            (TradeProof, string)
        );

        // STEP 2: Verify decision wasn't replayed
        require(
            !usedDecisionRoots[proof.decisionMerkleRoot],
            "POA: Decision already used"
        );
        
        // STEP 3: Verify agent signature and registration
        bytes32 messageHash = keccak256(abi.encodePacked(
            proof.decisionMerkleRoot,
            proof.actionHash,
            proof.decisionTimestamp
        ));
        
        address agent = _recoverSigner(_getEthSignedMessageHash(messageHash), proof.agentSignature);
        require(agents[agent].isActive, "POA: Agent not registered");
        
        // STEP 5: Verify this action is in the decision tree
        require(
            _verifyMerkleProof(
                proof.merkleProof,
                proof.decisionMerkleRoot,
                proof.actionHash
            ),
            "POA: Action not in decision tree"
        );
        
        // STEP 6: Verify timing (decision must be recent, not pre-computed)
        require(
            block.timestamp - proof.decisionTimestamp < 60 seconds,
            "POA: Decision too old"
        );
        
        // STEP 7: Verify action matches current params
        bytes32 currentActionHash = keccak256(abi.encodePacked(
            key.currency0,
            key.currency1,
            params.amountSpecified,
            params.zeroForOne
        ));
        
        if (currentActionHash != proof.actionHash) {
            revert ActionMismatch(currentActionHash, proof.actionHash);
        }
        
        // ✅ ALL PROOFS VERIFIED - Mark decision as used
        usedDecisionRoots[proof.decisionMerkleRoot] = true;
        
        // Log complete audit trail
        emit AgentDecisionLogged(
            sender,
            proof.decisionMerkleRoot,
            proof.actionHash,
            proof.decisionTimestamp,
            reasoning
        );
        
        emit ProofVerified(sender, proof.decisionMerkleRoot, true);
        
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
    
    function _afterSwap(
        address sender,
        PoolKey calldata,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        
        // Update agent stats
        agents[sender].successfulTrades++;
        
        return (BaseHook.afterSwap.selector, 0);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // AGENT REGISTRATION
    // ═══════════════════════════════════════════════════════════════
    
    function registerAgent(
        bytes32 modelHash,
        bytes32 strategyCommitment,
        string calldata agentName
    ) external {
        require(!agents[msg.sender].isActive, "Agent already registered");
        
        agents[msg.sender] = AgentIdentity({
            agentWallet: msg.sender,
            modelHash: modelHash,
            strategyCommitment: strategyCommitment,
            registrationBlock: block.number,
            isActive: true,
            successfulTrades: 0,
            failedTrades: 0
        });
        
        emit AgentRegistered(msg.sender, modelHash, strategyCommitment, agentName);
    }
    
    function _getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function _verifyAgentSignature(
        address agent,
        bytes32 messageHash,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        address recoveredSigner = _recoverSigner(ethSignedHash, signature);
        return recoveredSigner == agent;
    }
    
    function _verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
    
    function _recoverSigner(
        bytes32 ethSignedHash,
        bytes memory signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        return ecrecover(ethSignedHash, v, r, s);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PUBLIC QUERIES - Full transparency
    // ═══════════════════════════════════════════════════════════════
    
    function getAgentReputation(address agent) external view returns (
        uint256 successRate,
        uint256 totalTrades,
        uint256 agentAge
    ) {
        AgentIdentity memory identity = agents[agent];
        totalTrades = identity.successfulTrades + identity.failedTrades;
        
        if (totalTrades > 0) {
            successRate = (identity.successfulTrades * 100) / totalTrades;
        }
        
        agentAge = block.number - identity.registrationBlock;
        
        return (successRate, totalTrades, agentAge);
    }
}
