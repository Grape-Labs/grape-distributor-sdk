# grape-distributor-sdk

TypeScript SDK for the `grape_merkle_distributor` Anchor program at:

`GCLMhBGsDMHbxYyayzZyDY85cF89XNGgEhss4GXd9cHk`

## Install

```bash
npm install grape-distributor-sdk
```

## What this SDK includes

- PDA helpers for distributor, vault authority, and claim status
- Instruction builders for:
  - `initialize_distributor`
  - `set_root`
  - `claim`
  - `close_claim_status` (requires program upgrade)
  - `clawback`
- Merkle helpers matching on-chain logic:
  - leaf hashing with `LEAF_TAG`
  - sorted-pair proof verification
- Account decoders for `Distributor` and `ClaimStatus`
- High-level client that builds claim instructions (including idempotent ATA create)
- Optional claim + SPL Governance deposit flow for realm voting power

## Basic usage

```ts
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  GrapeDistributorClient,
  computeLeaf,
  verifyMerkleProofSorted,
} from "grape-distributor-sdk";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const client = new GrapeDistributorClient(connection);

const mint = new PublicKey("MINT_PUBKEY_HERE");
const claimant = new PublicKey("CLAIMANT_PUBKEY_HERE");
const vault = new PublicKey("VAULT_TOKEN_ACCOUNT_HERE");

const index = 0n;
const amount = 1_000_000n;
const proof: Uint8Array[] = []; // fill with 32-byte siblings

const root = new Uint8Array(32); // distributor merkle root
const distributor = client.findDistributorPda(mint)[0];
const leaf = computeLeaf(distributor, claimant, index, amount);
const isValid = verifyMerkleProofSorted(leaf, proof, root);

if (!isValid) {
  throw new Error("Invalid local merkle proof");
}

const { instructions } = await client.buildClaimInstructions({
  claimant,
  mint,
  vault,
  index,
  amount,
  proof,
});

const tx = new Transaction().add(...instructions);
```

## Claim directly into SPL Governance deposit

If the realm’s governing token mint is the same mint you are distributing, you can atomically:

1. claim from distributor to claimant ATA
2. deposit into the realm’s governing token holding account

```ts
const { instructions, tokenOwnerRecord } =
  await client.buildClaimAndDepositToRealmInstructions({
    claimant,
    mint,
    vault,
    index,
    amount,
    proof,
    realm: new PublicKey("REALM_PUBKEY_HERE"),
    governanceProgramId: new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"),
  });

const tx = new Transaction().add(...instructions);
```

Optional:
- pass `governanceProgramVersion` to skip version lookup RPC
- pass `depositAmount` if you do not want to deposit the entire claimed amount

## Claw back unclaimed vault tokens

```ts
const { instruction: clawbackIx } = client.buildClawbackInstruction({
  authority,
  mint,
  distributor,
  vault,
  amount: 5_000_000n,
});
```

## Close claim status (rent reclaim)

`claim_status` rent can only be reclaimed if your on-chain program exposes a close instruction.

SDK usage after that instruction exists:

```ts
const { instruction: closeIx } = client.buildCloseClaimStatusInstruction({
  claimant,
  distributor,
  index,
});

const closeTx = new Transaction().add(closeIx);
```

If you already computed the PDA externally, you can pass `claimStatus` directly instead of `index`.

## Allocation indexing

For the updated program, `claim_status` is derived with:

- `distributor`
- `claimant`
- `index` (u64 little-endian)

This means each wallet must use a unique `index` for each distribution round.  
Do not reuse the same `(claimant, index)` pair across rounds, or claims will collide on the same PDA.

## Notes

- `claim_status` PDA is derived by `(distributor, claimant, index)`.
- All roots/proof nodes must be exactly 32 bytes.
