import { ethers } from 'ethers';
import { TOKENS } from '../src/lib/agent-config';

async function main() {
    const currency0 = TOKENS.USDC;
    const currency1 = TOKENS.WETH;
    const amount = ethers.parseUnits('0.0001', 18);
    const zeroForOne = false;

    console.log('--- DEBUG HASH CALCULATION ---');
    console.log('Currency0:', currency0);
    console.log('Currency1:', currency1);
    console.log('Amount:', amount.toString());
    console.log('ZeroForOne:', zeroForOne);

    // Solidity: keccak256(abi.encodePacked(currency0, currency1, amountSpecified, zeroForOne))
    const hash = ethers.solidityPackedKeccak256(
        ['address', 'address', 'int256', 'bool'],
        [currency0, currency1, amount, zeroForOne]
    );

    console.log('Calculated actionHash:', hash);
}

main().catch(console.error);
