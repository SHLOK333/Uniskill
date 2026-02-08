// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ProofOfAgentHook} from "../src/ProofOfAgentHook.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {console} from "forge-std/console.sol";

contract HookFactory {
    function deploy(address poolManager, bytes32 salt) external returns (address) {
        return address(new ProofOfAgentHook{salt: salt}(IPoolManager(poolManager)));
    }
}

contract DeployHook is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerEOA = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        address poolManager = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

        // 1. Deploy Factory
        HookFactory factory = new HookFactory();
        console.log("Factory Deployed at:", address(factory));

        // Permissions
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
        );
        console.log("Expected Flags:", vm.toString(bytes32(uint256(flags))));
        console.log("Hook Mask:", vm.toString(bytes32(uint256(Hooks.ALL_HOOK_MASK))));
        
        // 2. Mine Salt using Factory Address
        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(factory), 
            flags,
            type(ProofOfAgentHook).creationCode,
            abi.encode(poolManager)
        );

        console.log("Mined Hook Address:", hookAddress);
        console.log("Mined Address & Mask:", vm.toString(bytes32(uint256(uint160(hookAddress) & Hooks.ALL_HOOK_MASK))));
        console.log("Salt:", vm.toString(salt));

        // 3. Deploy Hook via Factory
        address deployedHook = factory.deploy(poolManager, salt);
        
        require(deployedHook == hookAddress, "Hook address mismatch");
        console.log("Hook Successfully Deployed at:", deployedHook);
        
        vm.stopBroadcast();
    }
}
