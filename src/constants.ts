import { PublicKey, SystemProgram } from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";

export const GRAPE_DISTRIBUTOR_PROGRAM_ID = new PublicKey(
  "GCLMhBGsDMHbxYyayzZyDY85cF89XNGgEhss4GXd9cHk",
);

export const LEAF_TAG = new TextEncoder().encode("GRAPE_MERKLE_DISTRIBUTOR_V1");

export const DISTRIBUTOR_SEED = Buffer.from("distributor");
export const VAULT_AUTHORITY_SEED = Buffer.from("vault_authority");
export const CLAIM_STATUS_SEED = Buffer.from("claim");

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

export const SYSTEM_PROGRAM_ID = SystemProgram.programId;

function anchorDiscriminator(namespace: "global" | "account", name: string): Buffer {
  const preimage = `${namespace}:${name}`;
  const digest = sha256(new TextEncoder().encode(preimage));
  return Buffer.from(digest.slice(0, 8));
}

export const IX_DISCRIMINATORS = {
  initializeDistributor: anchorDiscriminator("global", "initialize_distributor"),
  setRoot: anchorDiscriminator("global", "set_root"),
  claim: anchorDiscriminator("global", "claim"),
  closeClaimStatus: anchorDiscriminator("global", "close_claim_status"),
} as const;

export const ACCOUNT_DISCRIMINATORS = {
  distributor: anchorDiscriminator("account", "Distributor"),
  claimStatus: anchorDiscriminator("account", "ClaimStatus"),
} as const;
