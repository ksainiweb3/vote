use anchor_lang::prelude::*;
declare_id!("6v6FoEK4h2aVJEDWZXo5zb4j5pyvYLqeVJNSYvZbVLgE");

#[program]
pub mod contract_vote {
    use super::*;
    pub fn init_poll(
        ctx:Context<InitializePoll>, 
        title:String, 
       
    )
    ->Result<()>{
        let poll = &mut ctx.accounts.poll;
        poll.title = title;
        poll.total_vote_count = 0;
        poll.creator_pubkey = ctx.accounts.user.key();

        Ok(())
    }
    pub fn init_candidate(
        ctx:Context<InitializeCandidate>, 
        title:String, 
    )
    ->Result<()>{
        let poll = &mut ctx.accounts.poll;
        let user = &ctx.accounts.user;
        let candidate = &mut ctx.accounts.candidate;
        require!(*user.key==poll.creator_pubkey, CustomError::Unauthorized);

        candidate.title = title;
        candidate.candidate_vote = 0;
        candidate.poll_pubkey = poll.key();
        poll.candidate_count += 1;

       
        Ok(())
    }
    pub fn vote(
        ctx:Context<InitVote>, 
      
    )->Result<()>{
        let candidate = &mut ctx.accounts.candidate;
        let vote = &mut ctx.accounts.vote;
        let poll = &mut ctx.accounts.poll;
        vote.candidate_pubkey = candidate.key();
        vote.poll_pubkey = candidate.poll_pubkey;
        candidate.candidate_vote = candidate.candidate_vote.saturating_add(1);
        poll.total_vote_count = poll.total_vote_count.saturating_add(1);
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    #[max_len(50)]
    pub title: String,
   
    pub candidate_count:u64, 
    pub creator_pubkey :Pubkey, 
    pub total_vote_count:u64
}
#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(30)]
    pub title: String,
    pub candidate_vote: u64,
    pub poll_pubkey: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Vote {
    pub poll_pubkey: Pubkey,
    pub candidate_pubkey: Pubkey,
}

#[derive(Accounts)]
#[instruction(title:String)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub user : Signer<'info>, 
    #[account(
        init, 
        payer = user, 
        seeds = [b"poll", title.as_bytes(), user.key().as_ref()], 
        bump, 
        space = 8 + Poll::INIT_SPACE
    )]
    pub poll : Account<'info, Poll>, 
    pub system_program:Program<'info, System>
}


#[derive(Accounts)]
pub struct InitializeCandidate<'info>{
    #[account(mut)]
    pub user : Signer<'info>, 
    #[account(mut)]
    pub poll: Account<'info, Poll>, 
    #[account(
        init, 
        payer = user, 
        seeds = [b"candidate", poll.key().as_ref(), &poll.candidate_count.to_le_bytes()], 
        bump, 
        space = 8 + Candidate::INIT_SPACE
    )]
    pub candidate : Account<'info, Candidate>, 
    pub system_program:Program<'info, System>
}

#[derive(Accounts)]
pub struct InitVote<'info>{
    #[account(mut)]
    pub user : Signer<'info>, 
    #[account(mut)]
    pub candidate : Account<'info, Candidate>, 
    #[account(mut)]
    pub poll : Account<'info, Poll>, 
    #[account(
        init, 
        payer = user, 
        space  = 8 + Vote::INIT_SPACE, 
        seeds = [b"vote", poll.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub vote : Account<'info, Vote>, 
    pub system_program:Program<'info, System>
}

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized")]
    Unauthorized,
   
}