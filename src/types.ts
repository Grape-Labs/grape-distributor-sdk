import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BigintIsh } from "./bytes";

export interface DistributorAccount {
  version: number;
  authority: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  merkleRoot: Uint8Array;
  startTs: bigint;
  endTs: bigint;
  bump: number;
  vaultAuthorityBump: number;
}

export interface ClaimStatusAccount {
  distributor: PublicKey;
  claimant: PublicKey;
  index: bigint;
  amount: bigint;
  claimed: boolean;
  bump: number;
}

export interface InitializeDistributorParams {
  authority: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  merkleRoot: Uint8Array;
  startTs: BigintIsh;
  endTs: BigintIsh;
  distributor?: PublicKey;
  vaultAuthority?: PublicKey;
}

export interface SetRootParams {
  authority: PublicKey;
  distributor: PublicKey;
  newRoot: Uint8Array;
}

export interface ClaimParams {
  claimant: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  index: BigintIsh;
  amount: BigintIsh;
  proof: Uint8Array[];
  distributor?: PublicKey;
  vaultAuthority?: PublicKey;
  claimantAta?: PublicKey;
  claimStatus?: PublicKey;
}

export interface ClaimBuildResult {
  instructions: TransactionInstruction[];
  distributor: PublicKey;
  vaultAuthority: PublicKey;
  claimantAta: PublicKey;
  claimStatus: PublicKey;
}

export interface CloseClaimStatusParams {
  claimant: PublicKey;
  distributor: PublicKey;
  claimStatus?: PublicKey;
}
