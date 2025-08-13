#!/usr/bin/env node

/**
 * Deploy ONU Token on Solana Mainnet
 * This script creates the production ONU token
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

// Configuration - MAINNET
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const TOKEN_DECIMALS = 6;
const INITIAL_SUPPLY = 1000000000; // 1 billion ONU tokens

async function deployONUTokenMainnet() {
  console.log('🚀 Deploying ONU Token on Solana Mainnet...');
  
  try {
    // Connect to mainnet
    const connection = new Connection(MAINNET_RPC, 'confirmed');
    console.log('✅ Connected to Solana Mainnet');
    
    // Load treasury keypair from environment or generate new one
    let treasuryKeypair;
    if (process.env.TREASURY_PRIVATE_KEY) {
      const privateKeyBytes = Buffer.from(process.env.TREASURY_PRIVATE_KEY, 'base64');
      treasuryKeypair = Keypair.fromSecretKey(privateKeyBytes);
      console.log('✅ Loaded existing treasury wallet');
    } else {
      treasuryKeypair = Keypair.generate();
      console.log('⚠️  Generated new treasury wallet (save this!)');
    }
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate();
    
    console.log('🔑 Generated keypairs:');
    console.log(`   Mint Address: ${mintKeypair.publicKey.toString()}`);
    console.log(`   Treasury Address: ${treasuryKeypair.publicKey.toString()}`);
    
    // Check treasury SOL balance
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    const requiredSOL = 0.05; // 0.05 SOL for deployment
    
    if (treasuryBalance < requiredSOL * 1e9) {
      console.log(`❌ Treasury needs at least ${requiredSOL} SOL for deployment`);
      console.log(`   Current balance: ${treasuryBalance / 1e9} SOL`);
      console.log(`   Send ${requiredSOL} SOL to: ${treasuryKeypair.publicKey.toString()}`);
      return;
    }
    
    console.log('✅ Treasury has sufficient SOL for deployment');
    
    // Create the mint
    console.log('🏗️ Creating ONU token mint...');
    const mint = await createMint(
      connection,
      treasuryKeypair,
      treasuryKeypair.publicKey,
      treasuryKeypair.publicKey,
      TOKEN_DECIMALS,
      mintKeypair
    );
    console.log('✅ ONU token mint created:', mint.toString());
    
    // Create treasury token account
    console.log('🏦 Creating treasury token account...');
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      mint,
      treasuryKeypair.publicKey
    );
    console.log('✅ Treasury token account created:', treasuryTokenAccount.address.toString());
    
    // Mint initial supply to treasury
    console.log(`💎 Minting ${INITIAL_SUPPLY.toLocaleString()} ONU tokens to treasury...`);
    const mintToSignature = await mintTo(
      connection,
      treasuryKeypair,
      mint,
      treasuryTokenAccount.address,
      treasuryKeypair,
      INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS)
    );
    await connection.confirmTransaction(mintToSignature);
    console.log('✅ Initial supply minted to treasury');
    
    // Save deployment info
    const deploymentInfo = {
      network: 'mainnet',
      mintAddress: mint.toString(),
      treasuryAddress: treasuryKeypair.publicKey.toString(),
      treasuryTokenAccount: treasuryTokenAccount.address.toString(),
      initialSupply: INITIAL_SUPPLY,
      decimals: TOKEN_DECIMALS,
      deployedAt: new Date().toISOString(),
      rpcUrl: MAINNET_RPC,
      deploymentTx: mintToSignature
    };
    
    // Save to file
    const outputPath = path.join(__dirname, '../onu-token-mainnet-deployment.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to:', outputPath);
    
    // Display environment variables to copy
    console.log('\n📋 Environment Variables to add to Render:');
    console.log('```');
    console.log(`ONU_TOKEN_MINT="${mint.toString()}"`);
    console.log(`TREASURY_ADDRESS="${treasuryKeypair.publicKey.toString()}"`);
    console.log(`SOLANA_RPC_URL="${MAINNET_RPC}"`);
    console.log('```');
    
    // Display private key (SAVE THIS SECURELY!)
    if (!process.env.TREASURY_PRIVATE_KEY) {
      console.log('\n🚨 CRITICAL: Save this treasury private key securely:');
      console.log('```');
      console.log(`TREASURY_PRIVATE_KEY="${treasuryKeypair.secretKey.toString('base64')}"`);
      console.log('```');
      console.log('⚠️  This key controls your treasury - keep it safe!');
    }
    
    console.log('\n🎉 ONU Token deployment completed successfully!');
    console.log('\n📊 Token Details:');
    console.log(`   Name: ONU Token`);
    console.log(`   Symbol: ONU`);
    console.log(`   Decimals: ${TOKEN_DECIMALS}`);
    console.log(`   Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} ONU`);
    console.log(`   Network: Mainnet`);
    console.log(`   Treasury: ${treasuryKeypair.publicKey.toString()}`);
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployONUTokenMainnet()
    .then(() => {
      console.log('\n✨ Ready to launch ONU token economics!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployONUTokenMainnet };
