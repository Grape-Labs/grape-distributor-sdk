import { PublicKey } from "@solana/web3.js";
import {
  CLAIM_STATUS_SEED,
  DISTRIBUTOR_SEED,
  GRAPE_DISTRIBUTOR_PROGRAM_ID,
  VAULT_AUTHORITY_SEED,
} from "./constants";

export function findDistributorPda(
  mint: PublicKey,
  programId: PublicKey = GRAPE_DISTRIBUTOR_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DISTRIBUTOR_SEED, mint.toBuffer()],
    programId,
  );
}

export function findVaultAuthorityPda(
  distributor: PublicKey,
  programId: PublicKey = GRAPE_DISTRIBUTOR_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_AUTHORITY_SEED, distributor.toBuffer()],
    programId,
  );
}

export function findClaimStatusPda(
  distributor: PublicKey,
  claimant: PublicKey,
  programId: PublicKey = GRAPE_DISTRIBUTOR_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CLAIM_STATUS_SEED, distributor.toBuffer(), claimant.toBuffer()],
    programId,
  );
}
