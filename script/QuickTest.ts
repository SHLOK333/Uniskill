import { ethers } from 'ethers';

async function main() {
    const wallet = new ethers.Wallet("0xfdae3a4c1f16bc878780777b768a6db4e5c83fa201e1c8851e12105d4b1e8613");
    console.log('Wallet Address:', wallet.address);

    const merkleRoot = ethers.ZeroHash;
    const leafHash = ethers.ZeroHash;
    const timestamp = 12345678;

    const messageHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32', 'uint256'],
        [merkleRoot, leafHash, timestamp]
    );
    console.log('Message Hash (JS):', messageHash);

    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    console.log('Signature:', signature);

    const recovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
    console.log('Recovered Address:', recovered);

    if (recovered.toLowerCase() === wallet.address.toLowerCase()) {
        console.log('✅ JS Recovery Matches Wallet!');
    } else {
        console.log('❌ JS Recovery FAILED!');
    }

    // Check Solidity construction
    const prefix = "\x19Ethereum Signed Message:\n32";
    const ethSignedHash = ethers.keccak256(
        ethers.solidityPacked(['string', 'bytes32'], [prefix, messageHash])
    );
    console.log('Eth Signed Hash (Manual):', ethSignedHash);

    const recoveredManual = ethers.recoverAddress(ethSignedHash, signature);
    console.log('Recovered Manual:', recoveredManual);

    if (recoveredManual.toLowerCase() === wallet.address.toLowerCase()) {
        console.log('✅ Manual Recovery Matches Wallet!');
    }
}

main().catch(console.error);
