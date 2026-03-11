# On-Chain Voting dApp (Solana + Anchor + Next.js)

A decentralized voting application built on **Solana** using **Anchor** for the smart contract and **Next.js** for the frontend.

Users can:

- Create polls
- Add candidates/options
- Vote on-chain
- View poll results transparently

All votes are recorded **directly on the Solana blockchain**, ensuring transparency and immutability.

---

# Features

- Create polls on-chain
- Add multiple candidates to a poll
- Vote for a candidate
- Prevent double voting per poll
- View total votes and poll details
- Wallet integration using Solana Wallet Adapter
- Fully decentralized data storage on Solana accounts

---

# Tech Stack

Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- Solana Wallet Adapter
- Anchor Web3.js

Smart Contract

- Rust
- Anchor Framework
- Solana Program

---

# Solana Account Architecture

The application uses the following account structure:

Poll PDA

```
["poll", poll_title, creator_pubkey]
```

Candidate PDA

```
["candidate", poll_pubkey, candidate_index]
```

Vote PDA

```
["vote", poll_pubkey, voter_pubkey]
```

This structure ensures:

- Unlimited candidates per poll
- One vote per user per poll
- Efficient querying of poll data

---

# Project Structure

```
frontend
 ├─ app
 │   └─ page.tsx        # main UI
 │
 ├─ hooks
 │   └─ useProgram.ts   # Anchor program connection
 │
 ├─ components
 │   └─ wallet provider
 │
 └─ styles

program
 ├─ programs/voting
 │   ├─ instructions
 │   │   ├─ init_poll.rs
 │   │   ├─ init_candidate.rs
 │   │   └─ vote.rs
 │   │
 │   └─ state
 │       ├─ poll.rs
 │       ├─ candidate.rs
 │       └─ vote.rs
```

---

# Getting Started

## 1 Install dependencies

```
npm install
```

---

## 2 Run Solana local validator

```
solana-test-validator
```

---

## 3 Deploy the program

```
anchor build
anchor deploy
```

Update the program ID in the frontend if needed.

---

## 4 Run the frontend

```
npm run dev
```

Open:

```
http://localhost:3000
```

---

# How the App Works

### Creating a Poll

User creates a poll by submitting a title.

Transaction:

```
init_poll(title)
```

Creates a **Poll PDA**.

---

### Adding Candidates

After creating a poll, users can add candidates.

Transaction:

```
init_candidate(title)
```

Creates a **Candidate PDA** linked to the poll.

---

### Voting

When a user votes:

1. Vote PDA is created
2. Candidate vote count increments
3. Poll total vote count increments

Transaction:

```
init_vote()
```

Vote PDA prevents double voting.

---

# Security

The program prevents:

- Double voting using Vote PDA
- Voting for candidates from another poll
- Unauthorized poll mutation

---

# Future Improvements

- Live vote updates using account subscriptions
- Poll expiration time
- DAO-style governance voting
- Indexing using Helius or Triton
- Mobile responsive UI

---

# Screenshots

Add screenshots of:

- Poll creation
- Candidate list
- Voting modal
- Results view

---

# License

MIT License
