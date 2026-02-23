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
- Merkle helpers matching on-chain logic:
  - leaf hashing with `LEAF_TAG`
  - sorted-pair proof verification
- Account decoders for `Distributor` and `ClaimStatus`
- High-level client that builds claim instructions (including idempotent ATA create)

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

## Notes

- `claim_status` PDA is derived by `(distributor, claimant)` and only allows one successful claim per claimant.
- All roots/proof nodes must be exactly 32 bytes.
