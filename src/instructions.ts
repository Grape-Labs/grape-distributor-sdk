import { PublicKey, TransactionInstruction, AccountMeta } from "@solana/web3.js";
import { assertLength32, BigintIsh, concatBytes, i64ToLe, u64ToLe } from "./bytes";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  GRAPE_DISTRIBUTOR_PROGRAM_ID,
  IX_DISCRIMINATORS,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "./constants";

interface InitializeDistributorInstructionParams {
  authority: PublicKey;
  distributor: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  vaultAuthority: PublicKey;
  merkleRoot: Uint8Array;
  startTs: BigintIsh;
  endTs: BigintIsh;
  programId?: PublicKey;
}

interface SetRootInstructionParams {
  authority: PublicKey;
  distributor: PublicKey;
  newRoot: Uint8Array;
  programId?: PublicKey;
}

interface ClaimInstructionParams {
  claimant: PublicKey;
  distributor: PublicKey;
  vault: PublicKey;
  vaultAuthority: PublicKey;
  claimantAta: PublicKey;
  mint: PublicKey;
  claimStatus: PublicKey;
  index: BigintIsh;
  amount: BigintIsh;
  proof: Uint8Array[];
  programId?: PublicKey;
}

interface CloseClaimStatusInstructionParams {
  claimant: PublicKey;
  distributor: PublicKey;
  claimStatus: PublicKey;
  programId?: PublicKey;
}

interface ClawbackInstructionParams {
  authority: PublicKey;
  mint: PublicKey;
  distributor: PublicKey;
  vault: PublicKey;
  vaultAuthority: PublicKey;
  authorityAta: PublicKey;
  amount: BigintIsh;
  programId?: PublicKey;
}

export function createInitializeDistributorInstruction(
  params: InitializeDistributorInstructionParams,
): TransactionInstruction {
  assertLength32(params.merkleRoot, "merkleRoot");
  const data = Buffer.from(
    concatBytes([
      IX_DISCRIMINATORS.initializeDistributor,
      params.merkleRoot,
      i64ToLe(params.startTs),
      i64ToLe(params.endTs),
    ]),
  );

  const keys: AccountMeta[] = [
    { pubkey: params.distributor, isSigner: false, isWritable: true },
    { pubkey: params.mint, isSigner: false, isWritable: false },
    { pubkey: params.vault, isSigner: false, isWritable: true },
    { pubkey: params.vaultAuthority, isSigner: false, isWritable: false },
    { pubkey: params.authority, isSigner: true, isWritable: true },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: params.programId ?? GRAPE_DISTRIBUTOR_PROGRAM_ID,
    keys,
    data,
  });
}

export function createSetRootInstruction(params: SetRootInstructionParams): TransactionInstruction {
  assertLength32(params.newRoot, "newRoot");
  const data = Buffer.from(
    concatBytes([IX_DISCRIMINATORS.setRoot, params.newRoot]),
  );

  const keys: AccountMeta[] = [
    { pubkey: params.distributor, isSigner: false, isWritable: true },
    { pubkey: params.authority, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: params.programId ?? GRAPE_DISTRIBUTOR_PROGRAM_ID,
    keys,
    data,
  });
}

export function createClaimInstruction(params: ClaimInstructionParams): TransactionInstruction {
  const serializedProof = serializeProof(params.proof);
  const data = Buffer.from(
    concatBytes([
      IX_DISCRIMINATORS.claim,
      u64ToLe(params.index),
      u64ToLe(params.amount),
      serializedProof,
    ]),
  );

  const keys: AccountMeta[] = [
    { pubkey: params.distributor, isSigner: false, isWritable: true },
    { pubkey: params.vault, isSigner: false, isWritable: true },
    { pubkey: params.vaultAuthority, isSigner: false, isWritable: false },
    { pubkey: params.claimant, isSigner: true, isWritable: true },
    { pubkey: params.claimantAta, isSigner: false, isWritable: true },
    { pubkey: params.mint, isSigner: false, isWritable: false },
    { pubkey: params.claimStatus, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: params.programId ?? GRAPE_DISTRIBUTOR_PROGRAM_ID,
    keys,
    data,
  });
}

export function createCloseClaimStatusInstruction(
  params: CloseClaimStatusInstructionParams,
): TransactionInstruction {
  const data = IX_DISCRIMINATORS.closeClaimStatus;

  const keys: AccountMeta[] = [
    { pubkey: params.distributor, isSigner: false, isWritable: false },
    { pubkey: params.claimStatus, isSigner: false, isWritable: true },
    { pubkey: params.claimant, isSigner: true, isWritable: true },
  ];

  return new TransactionInstruction({
    programId: params.programId ?? GRAPE_DISTRIBUTOR_PROGRAM_ID,
    keys,
    data,
  });
}

export function createClawbackInstruction(
  params: ClawbackInstructionParams,
): TransactionInstruction {
  const data = Buffer.from(
    concatBytes([
      IX_DISCRIMINATORS.clawback,
      u64ToLe(params.amount),
    ]),
  );

  const keys: AccountMeta[] = [
    { pubkey: params.distributor, isSigner: false, isWritable: true },
    { pubkey: params.vault, isSigner: false, isWritable: true },
    { pubkey: params.vaultAuthority, isSigner: false, isWritable: false },
    { pubkey: params.authority, isSigner: true, isWritable: true },
    { pubkey: params.authorityAta, isSigner: false, isWritable: true },
    { pubkey: params.mint, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: params.programId ?? GRAPE_DISTRIBUTOR_PROGRAM_ID,
    keys,
    data,
  });
}

function serializeProof(proof: Uint8Array[]): Uint8Array {
  const len = proof.length;
  const lenBytes = new Uint8Array(4);
  lenBytes[0] = len & 0xff;
  lenBytes[1] = (len >> 8) & 0xff;
  lenBytes[2] = (len >> 16) & 0xff;
  lenBytes[3] = (len >> 24) & 0xff;

  const nodes: Uint8Array[] = [lenBytes];
  for (const node of proof) {
    assertLength32(node, "proof element");
    nodes.push(node);
  }

  return concatBytes(nodes);
}
