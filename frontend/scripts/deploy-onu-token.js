#!/usr/bin/env node

/**
 * Deploy ONU Token on Solana Devnet
 * This script creates a test ONU token for development and testing
 */

const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';
const TOKEN_DECIMALS = 6;
const INITIAL_SUPPLY = 1000000; // 1 million ONU tokens

async function deployONUToken() {
  console.log('🚀 Deploying ONU Token on Solana Devnet...');
  
  try {
    // Connect to devnet
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    console.log('✅ Connected to Solana Devnet');
    
    // Generate keypairs
    const mintKeypair = Keypair.generate();
    const payerKeypair = Keypair.generate();
    
    console.log('🔑 Generated keypairs:');
    console.log(`   Mint Address: ${mintKeypair.publicKey.toString()}`);
    console.log(`   Payer Address: ${payerKeypair.publicKey.toString()}`);
    
    // Request airdrop for payer
    console.log('💰 Requesting SOL airdrop for payer...');
    const airdropSignature = await connection.requestAirdrop(
      payerKeypair.publicKey,
      2 * 1e9 // 2 SOL
    );
    await connection.confirmTransaction(airdropSignature);
    console.log('✅ SOL airdrop received');
    
    // Create the mint
    console.log('🏗️ Creating ONU token mint...');
    const mint = await createMint(
      connection,
      payerKeypair,
      payerKeypair.publicKey,
      payerKeypair.publicKey,
      TOKEN_DECIMALS,
      mintKeypair
    );
    console.log('✅ ONU token mint created:', mint.toString());
    
    // Create associated token account for payer
    console.log('🏦 Creating payer token account...');
    const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payerKeypair,
      mint,
      payerKeypair.publicKey
    );
    console.log('✅ Payer token account created:', payerTokenAccount.address.toString());
    
    // Mint initial supply to payer
    console.log(`💎 Minting ${INITIAL_SUPPLY} ONU tokens to payer...`);
    const mintToSignature = await mintTo(
      connection,
      payerKeypair,
      mint,
      payerTokenAccount.address,
      payerKeypair,
      INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS)
    );
    await connection.confirmTransaction(mintToSignature);
    console.log('✅ Initial supply minted');
    
    // Create treasury account
    console.log('🏛️ Creating treasury account...');
    const treasuryKeypair = Keypair.generate();
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payerKeypair,
      mint,
      treasuryKeypair.publicKey
    );
    console.log('✅ Treasury token account created:', treasuryTokenAccount.address.toString());
    
    // Save deployment info
    const deploymentInfo = {
      network: 'devnet',
      mintAddress: mint.toString(),
      payerAddress: payerKeypair.publicKey.toString(),
      treasuryAddress: treasuryKeypair.publicKey.toString(),
      treasuryTokenAccount: treasuryTokenAccount.address.toString(),
      payerTokenAccount: payerTokenAccount.address.toString(),
      initialSupply: INITIAL_SUPPLY,
      decimals: TOKEN_DECIMALS,
      deployedAt: new Date().toISOString(),
      rpcUrl: DEVNET_RPC
    };
    
    // Save to file
    const outputPath = path.join(__dirname, '../onu-token-deployment.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to:', outputPath);
    
    // Display environment variables to copy
    console.log('\n📋 Environment Variables to add to .env.local:');
    console.log('```');
    console.log(`NEXT_PUBLIC_TOKEN_MINT="${mint.toString()}"`);
    console.log(`NEXT_PUBLIC_TREASURY_ADDRESS="${treasuryKeypair.publicKey.toString()}"`);
    console.log(`NEXT_PUBLIC_SOLANA_RPC_URL="${DEVNET_RPC}"`);
    console.log('```');
    
    console.log('\n🎉 ONU Token deployment completed successfully!');
    console.log('\n📊 Token Details:');
    console.log(`   Name: ONU Token`);
    console.log(`   Symbol: ONU`);
    console.log(`   Decimals: ${TOKEN_DECIMALS}`);
    console.log(`   Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} ONU`);
    console.log(`   Network: Devnet`);
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployONUToken()
    .then(() => {
      console.log('\n✨ Ready to test staking functionality!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployONUToken };
