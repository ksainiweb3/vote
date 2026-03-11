"use client";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../../contract-vote/target/idl/contract_vote.json";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { ContractVote } from "../../contract-vote/target/types/contract_vote";

export function useProgram() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, wallet as AnchorWallet);
  const program: Program<ContractVote> = new Program(idl, provider);
  return program;
}
