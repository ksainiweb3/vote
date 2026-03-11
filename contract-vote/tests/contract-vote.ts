import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ContractVote } from "../target/types/contract_vote";

describe("contract-vote", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log(anchor.AnchorProvider.env());
  const program = anchor.workspace.contractVote as Program<ContractVote>;

  it("Is initialized!", async () => {
    const title = "New Poll Trial";
    const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("poll"),
        Buffer.from(title),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId,
    );
    let tx = await program.methods
      .initPoll(title, new anchor.BN(0), new anchor.BN(9999999999))
      .accounts({
        user: provider.publicKey,
      })
      .rpc();
    const data = await program.account.poll.fetch(pollPda);
    console.log(tx);
    console.log(data);
  });
});
