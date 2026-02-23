import { PublicKey } from "@solana/web3.js";
import { leToI64, leToU64 } from "./bytes";
import { ACCOUNT_DISCRIMINATORS } from "./constants";
import { ClaimStatusAccount, DistributorAccount } from "./types";

export const DISTRIBUTOR_ACCOUNT_SIZE = 8 + (1 + 32 + 32 + 32 + 32 + 8 + 8 + 1 + 1);
export const CLAIM_STATUS_ACCOUNT_SIZE = 8 + (32 + 32 + 8 + 8 + 1 + 1);

export function decodeDistributorAccount(data: Buffer | Uint8Array): DistributorAccount {
  const bytes = Uint8Array.from(data);
  if (bytes.length < DISTRIBUTOR_ACCOUNT_SIZE) {
    throw new Error(`Invalid distributor account size: ${bytes.length}`);
  }
  expectDiscriminator(bytes, ACCOUNT_DISCRIMINATORS.distributor, "Distributor");

  let offset = 8;
  const version = bytes[offset];
  offset += 1;

  const authority = new PublicKey(bytes.slice(offset, offset + 32));
  offset += 32;

  const mint = new PublicKey(bytes.slice(offset, offset + 32));
  offset += 32;

  const vault = new PublicKey(bytes.slice(offset, offset + 32));
  offset += 32;

  const merkleRoot = bytes.slice(offset, offset + 32);
  offset += 32;

  const startTs = leToI64(bytes, offset);
  offset += 8;

  const endTs = leToI64(bytes, offset);
  offset += 8;

  const bump = bytes[offset];
  offset += 1;

  const vaultAuthorityBump = bytes[offset];

  return {
    version,
    authority,
    mint,
    vault,
    merkleRoot,
    startTs,
    endTs,
    bump,
    vaultAuthorityBump,
  };
}

export function decodeClaimStatusAccount(data: Buffer | Uint8Array): ClaimStatusAccount {
  const bytes = Uint8Array.from(data);
  if (bytes.length < CLAIM_STATUS_ACCOUNT_SIZE) {
    throw new Error(`Invalid claim status account size: ${bytes.length}`);
  }
  expectDiscriminator(bytes, ACCOUNT_DISCRIMINATORS.claimStatus, "ClaimStatus");

  let offset = 8;
  const distributor = new PublicKey(bytes.slice(offset, offset + 32));
  offset += 32;

  const claimant = new PublicKey(bytes.slice(offset, offset + 32));
  offset += 32;

  const index = leToU64(bytes, offset);
  offset += 8;

  const amount = leToU64(bytes, offset);
  offset += 8;

  const claimed = bytes[offset] !== 0;
  offset += 1;

  const bump = bytes[offset];

  return {
    distributor,
    claimant,
    index,
    amount,
    claimed,
    bump,
  };
}

function expectDiscriminator(data: Uint8Array, expected: Buffer, label: string): void {
  for (let i = 0; i < 8; i += 1) {
    if (data[i] !== expected[i]) {
      throw new Error(`Invalid ${label} discriminator`);
    }
  }
}
