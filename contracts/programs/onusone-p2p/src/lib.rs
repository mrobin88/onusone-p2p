use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod onusone_p2p {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        _initial_supply: u64,
        decay_rate: u64,
        min_stake: u64,
        max_stake: u64,
        daily_user_limit: u64,
        total_user_limit: u64,
    ) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.authority = ctx.accounts.authority.key();
        program_state.onu_mint = ctx.accounts.onu_mint.key();
        program_state.treasury = ctx.accounts.treasury.key();
        program_state.decay_rate = decay_rate;
        program_state.min_stake = min_stake;
        program_state.max_stake = max_stake;
        program_state.daily_user_limit = daily_user_limit;
        program_state.total_user_limit = total_user_limit;
        program_state.total_staked = 0;
        program_state.total_rewards_paid = 0;
        program_state.emergency_controls_active = false;
        program_state.bump = ctx.bumps.program_state;

        Ok(())
    }

    pub fn stake_tokens(
        ctx: Context<StakeTokens>,
        amount: u64,
        content_id: String,
        content_type: String,
    ) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.user = ctx.accounts.user.key();
        stake_account.content_id = content_id;
        stake_account.content_type = content_type;
        stake_account.amount = amount;
        stake_account.staked_at = Clock::get()?.unix_timestamp;
        stake_account.is_active = true;
        stake_account.bump = ctx.bumps.stake_account;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = treasury,
    )]
    pub onu_mint: Account<'info, Mint>,
    
    /// CHECK: Treasury account that will hold ONU tokens and receive decay taxes
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = onu_mint,
        associated_token::authority = treasury,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub onu_mint: Pubkey,
    pub treasury: Pubkey,
    pub decay_rate: u64,
    pub min_stake: u64,
    pub max_stake: u64,
    pub daily_user_limit: u64,
    pub total_user_limit: u64,
    pub total_staked: u64,
    pub total_rewards_paid: u64,
    pub emergency_controls_active: bool,
    pub bump: u8,
}

impl ProgramState {
    pub const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct StakeAccount {
    pub user: Pubkey,
    pub content_id: String,
    pub content_type: String,
    pub amount: u64,
    pub staked_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl StakeAccount {
    pub const INIT_SPACE: usize = 32 + 200 + 50 + 8 + 8 + 1 + 1;
}
