"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useProgram } from "../hooks/useProgram";
import * as anchor from "@coral-xyz/anchor";
import toast from "react-hot-toast";
import { BN } from "@coral-xyz/anchor";

const LandingPage = () => {
  const wallet = useWallet();
  const program = useProgram();
  const { connection } = useConnection();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>();
  const [showNewPollModal, setNewPollShowModal] = useState(false);
  const [showPollModal, setPollShowModal] = useState(false);
  //@ts-ignore
  const [currentPoll, setCurrentPoll] = useState<any>({});
  const [newPollTitle, setnewPollTitle] = useState("");
  const [newPollCreated, setNewPollCreated] = useState(false);
  const [newPollAccount, setNewPollAccount] = useState<{
    title: string;
    candidateCount: BN;
    creatorPubkey: PublicKey;
    totalVoteCount: BN;
  }>();
  const [options, setOptions] = useState<{ added: boolean; title: string }[]>(
    [],
  );
  const [hasCurrentUserVoted, setHasCurrentUserVoted] = useState(false);
  const [allPolls, setAllPolls] = useState<any>([]);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function getAllPolls() {
      if (!wallet.publicKey) return;
      const polls = await program.account.poll.all();
      if (polls) setAllPolls(polls);
    }
    getAllPolls();
  }, [wallet.publicKey]);

  useEffect(() => {
    async function fetchBalance() {
      if (!wallet.publicKey) return;
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    }
    fetchBalance();
  }, [wallet.publicKey, connection]);

  async function handlePollCreation() {
    if (!program || !wallet.publicKey) return;

    if (newPollTitle === "") {
      toast.error("Invalid fields");
      return;
    }

    try {
      setLoading(true);
      const tx = await program.methods
        .initPoll(newPollTitle)
        .accounts({
          user: wallet.publicKey,
        })
        .rpc();
      await connection.confirmTransaction(tx, "confirmed");
      toast.success("Poll created");
      setNewPollCreated(true);
    } catch (error) {
      toast.error("Error creating poll");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVoteClick(
    candidatePubKey: PublicKey,
    pollPubkey: PublicKey,
  ) {
    if (!wallet.publicKey) return;
    try {
      const tx = await program.methods
        .vote()
        .accounts({
          candidate: candidatePubKey,
          poll: pollPubkey,
          user: wallet.publicKey,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      toast.success("Voted");
      setHasCurrentUserVoted(true);
      setPollShowModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setHasCurrentUserVoted(false);
    }
  }

  useEffect(() => {
    async function getPollData() {
      if (!wallet.publicKey || !program) return;
      const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll"),
          Buffer.from(newPollTitle),
          wallet.publicKey.toBuffer(),
        ],
        program.programId,
      );
      const poll = await program.account.poll.fetch(pollPda);
      setNewPollAccount(poll);
    }
    if (newPollCreated) getPollData();
  }, [newPollCreated]);

  function handleAddOption() {
    setOptions([...options, { added: false, title: "" }]);
  }

  function handleOptionChange(index: number, value: string) {
    const updated = [...options];
    updated[index] = { added: false, title: value };
    setOptions(updated);
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }
  console.log(allPolls);

  async function handlePollClick(pollPubKey: PublicKey) {
    if (!wallet.publicKey) return;
    const poll = await program.account.poll.fetch(pollPubKey);
    const candidates = [];
    for (let i = 0; i < poll.candidateCount.toNumber(); i++) {
      const [candidatePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("candidate"),
          pollPubKey.toBuffer(),
          new BN(i).toArrayLike(Buffer, "le", 8),
        ],
        program.programId,
      );

      const candidate = await program.account.candidate.fetch(candidatePda);
      candidates.push({ candidate, candidatePda });
    }

    setCurrentPoll({
      poll,
      candidates,
      pollPubKey,
    });
    try {
      const [currentUserVotePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          currentPoll.pollPubKey.toBuffer(),
          wallet.publicKey?.toBuffer(),
        ],
        program.programId,
      );
      const currentUserVoteAccount =
        await program.account.vote.fetch(currentUserVotePda);
      if (currentUserVoteAccount) setHasCurrentUserVoted(true);
    } catch (error) {
      console.log(error);
    }
    setPollShowModal(true);
  }
  console.log(currentPoll);
  async function handleOptionAdd(index: number) {
    if (!wallet.publicKey) return;
    const [newPollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("poll"),
        Buffer.from(newPollTitle),
        wallet.publicKey?.toBuffer(),
      ],
      program.programId,
    );
    try {
      const tx = await program.methods
        .initCandidate(options[index].title)
        .accounts({
          poll: newPollPda,
          user: wallet.publicKey,
        })
        .rpc();
      await connection.confirmTransaction(tx, "confirmed");
      setOptions((prev) =>
        prev.map((opt, i) => (i === index ? { ...opt, added: true } : opt)),
      );

      toast.success("Option Added");
    } catch (error) {
      console.log(error);
    }
  }

  console.log(newPollAccount);
  if (!mounted) return <></>;
  return (
    <div className="flex flex-col py-2 relative">
      <div className="flex border-b border-neutral-800 py-2 px-10 justify-between items-center">
        <span className="flex gap-3">
          <span className="text-3xl font-extrabold">vote</span>
          <span className="text-xs text-amber-500">devent</span>
        </span>

        <div className="flex gap-4">
          <div className="flex items-center gap-4">
            <p className="text-neutral-500 text-sm">
              Balance : {balance?.toFixed(2)} SOL
            </p>

            <button
              className="bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 cursor-pointer"
              onClick={() => setNewPollShowModal(true)}
            >
              + New Poll
            </button>
          </div>

          <WalletMultiButton />
        </div>
      </div>

      <div className="p-8">
        <div className="mx-auto flex flex-col gap-8 max-w-7xl">
          <div>
            <h1 className="text-neutral-500 font-extrabold text-6xl">
              On-chain voting <br /> fully transparent.
            </h1>

            <p className="text-xs text-neutral-700">
              Every vote recorded on Solana. No middlemen, no manipulation.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              {allPolls.map((poll: any) => (
                <div
                  onClick={() => handlePollClick(poll.publicKey)}
                  className="p-6 border flex flex-col gap-4 rounded-lg border-neutral-600 hover:cursor-pointer hover:bg-neutral-900"
                  key={poll.publicKey.toString()}
                >
                  <h1>{poll.account.title}</h1>
                  <p className=" text-neutral-600 text-sm">
                    Poll Public Key : {poll.publicKey.toString().slice(0, 6)}
                    ...
                    {poll.publicKey.toString().slice(-6)}
                  </p>

                  <div className="border-t  border-neutral-600  flex justify-between pt-1 text-neutral-600 text-sm">
                    <p>
                      Creator :{" "}
                      {poll.account.creatorPubkey.toString().slice(0, 6)}...
                      {poll.account.creatorPubkey.toString().slice(-6)}
                    </p>
                    <p>Total Votes : {Number(poll.account.totalVoteCount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewPollModal && (
        <div className="absolute h-full w-full backdrop-blur-xl">
          <div className="flex justify-center items-center h-full">
            <div className="p-6 border border-neutral-800 rounded-lg flex flex-col gap-4 bg-black w-[420px]">
              <div className="flex justify-between border-b border-neutral-700">
                <h1 className="text-xl font-extrabold pb-2">Create a Poll</h1>

                <p
                  className="cursor-pointer hover:scale-105"
                  onClick={() => setNewPollShowModal(false)}
                >
                  X
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-xs text-neutral-400">
                  Initialize a Poll first, options will be added later.
                </p>

                <input
                  type="text"
                  disabled={newPollCreated}
                  value={newPollTitle}
                  placeholder="Poll Title"
                  onChange={(e) => setnewPollTitle(e.target.value)}
                  className="py-2 px-3 text-neutral-500 placeholder:text-neutral-600 outline-none border border-neutral-800 rounded-lg"
                />

                {!newPollCreated && (
                  <button
                    className="bg-neutral-700 py-2 rounded-xl hover:scale-105 cursor-pointer transition-transform"
                    onClick={handlePollCreation}
                    disabled={loading}
                  >
                    {loading ? "Loading.." : "Create"}
                  </button>
                )}

                {newPollCreated && (
                  <button className="bg-green-700 py-2 rounded-md">
                    Poll Created : {newPollAccount?.title}
                  </button>
                )}

                {newPollCreated && (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between items-center">
                      <h1 className="font-semibold">Options</h1>

                      <button
                        onClick={handleAddOption}
                        className="bg-neutral-600 py-1 px-2 rounded-md text-sm
                         hover:bg-neutral-500 hover:cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>

                    {options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option.title}
                          placeholder={`Option ${index + 1}`}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          disabled={option.added}
                          className={`flex-1 py-2 px-3 text-neutral-500 placeholder:text-neutral-600      outline-none border border-neutral-800 rounded-lg
                            ${option.added ? "bg-neutral-800" : ""}
                              `}
                        />
                        {!option.added && (
                          <button
                            onClick={() => removeOption(index)}
                            className="text-red-500 px-2 cursor-pointer hover:scale-105"
                          >
                            X
                          </button>
                        )}

                        <button
                          className={`px-2 rounded-md text-xs transition
                  ${
                    option.added
                      ? "bg-green-500 cursor-not-allowed"
                      : "bg-neutral-700 hover:cursor-pointer hover:scale-105"
                  }`}
                          onClick={() => handleOptionAdd(index)}
                          disabled={option.added}
                        >
                          {option.added ? "Added" : "Add Option"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {newPollCreated && (
                <button
                  className="px-2 py-2 bg-amber-800 rounded-lg"
                  onClick={() => {
                    setNewPollShowModal(false);
                    setnewPollTitle("");
                    setOptions([]);
                    setNewPollCreated(false);
                  }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showPollModal && (
        <div className="absolute h-full w-full backdrop-blur-xl flex justify-center items-center">
          <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-6 w-[420px] flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-white">
                {currentPoll.poll.title}
              </h1>

              <button
                className="text-neutral-500 hover:text-white"
                onClick={() => {
                  setPollShowModal(false);
                  setHasCurrentUserVoted(false);
                }}
              >
                ✕
              </button>
            </div>

            {/* Poll info */}
            <div className="text-sm text-neutral-500 flex justify-between border-b border-neutral-800 pb-3">
              <p>
                Creator :{" "}
                {currentPoll.poll.creatorPubkey.toString().slice(0, 6)}...
                {currentPoll.poll.creatorPubkey.toString().slice(-6)}
              </p>

              <p>Total Votes : {Number(currentPoll.poll.totalVoteCount)}</p>
            </div>

            {/* Candidates */}
            {hasCurrentUserVoted ? (
              <p>You have voted</p>
            ) : (
              <div className="flex flex-col gap-3">
                {currentPoll.candidates?.map(
                  (candidate: any, index: number) => (
                    <div
                      key={index}
                      className="border border-neutral-800 rounded-lg p-3 flex justify-between items-center hover:bg-neutral-900 transition"
                    >
                      <div className="flex flex-col">
                        <p className="text-white font-medium">
                          {candidate.title}
                        </p>

                        <p className="text-xs text-neutral-500">
                          Votes : {Number(candidate.candidateVote)}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleVoteClick(
                            candidate.candidatePda,
                            new PublicKey(currentPoll.pollPubKey),
                          )
                        }
                        className="bg-emerald-600 hover:bg-emerald-500 text-sm px-3 py-1 rounded-md transition cursor-pointer"
                      >
                        Vote
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
