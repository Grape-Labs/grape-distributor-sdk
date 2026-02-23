import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { decodeClaimStatusAccount, decodeDistributorAccount } from "./accounts";
import { assertLength32 } from "./bytes";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  GRAPE_DISTRIBUTOR_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "./constants";
import {
  createClaimInstruction,
  createCloseClaimStatusInstruction,
  createInitializeDistributorInstruction,
  createSetRootInstruction,
} from "./instructions";
import { findClaimStatusPda, findDistributorPda, findVaultAuthorityPda } from "./pda";
import {
  ClaimBuildResult,
  ClaimParams,
  ClaimStatusAccount,
  CloseClaimStatusParams,
  DistributorAccount,
  InitializeDistributorParams,
  SetRootParams,
} from "./types";

export class GrapeDistributorClient {
  readonly connection: Connection;
  readonly programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey = GRAPE_DISTRIBUTOR_PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  findDistributorPda(mint: PublicKey): [PublicKey, number] {
    return findDistributorPda(mint, this.programId);
  }

  findVaultAuthorityPda(distributor: PublicKey): [PublicKey, number] {
    return findVaultAuthorityPda(distributor, this.programId);
  }

  findClaimStatusPda(distributor: PublicKey, claimant: PublicKey): [PublicKey, number] {
    return findClaimStatusPda(distributor, claimant, this.programId);
  }

  async fetchDistributor(distributor: PublicKey): Promise<DistributorAccount | null> {
    const info = await this.connection.getAccountInfo(distributor);
    if (!info) {
      return null;
    }
    if (!info.owner.equals(this.programId)) {
      throw new Error("Distributor account has unexpected owner");
    }
    return decodeDistributorAccount(info.data);
  }

  async fetchClaimStatus(claimStatus: PublicKey): Promise<ClaimStatusAccount | null> {
    const info = await this.connection.getAccountInfo(claimStatus);
    if (!info) {
      return null;
    }
    if (!info.owner.equals(this.programId)) {
      throw new Error("ClaimStatus account has unexpected owner");
    }
    return decodeClaimStatusAccount(info.data);
  }

  buildInitializeDistributorInstruction(
    params: InitializeDistributorParams,
  ): { instruction: TransactionInstruction; distributor: PublicKey; vaultAuthority: PublicKey } {
    assertLength32(params.merkleRoot, "merkleRoot");

    const distributor = params.distributor ?? this.findDistributorPda(params.mint)[0];
    const vaultAuthority = params.vaultAuthority ?? this.findVaultAuthorityPda(distributor)[0];

    const instruction = createInitializeDistributorInstruction({
      authority: params.authority,
      distributor,
      mint: params.mint,
      vault: params.vault,
      vaultAuthority,
      merkleRoot: params.merkleRoot,
      startTs: params.startTs,
      endTs: params.endTs,
      programId: this.programId,
    });

    return { instruction, distributor, vaultAuthority };
  }

  buildSetRootInstruction(params: SetRootParams): TransactionInstruction {
    assertLength32(params.newRoot, "newRoot");
    return createSetRootInstruction({
      authority: params.authority,
      distributor: params.distributor,
      newRoot: params.newRoot,
      programId: this.programId,
    });
  }

  async buildClaimInstructions(params: ClaimParams): Promise<ClaimBuildResult> {
    const distributor = params.distributor ?? this.findDistributorPda(params.mint)[0];
    const vaultAuthority = params.vaultAuthority ?? this.findVaultAuthorityPda(distributor)[0];
    const claimStatus = params.claimStatus ?? this.findClaimStatusPda(distributor, params.claimant)[0];

    const claimantAta =
      params.claimantAta ??
      getAssociatedTokenAddressSync(
        params.mint,
        params.claimant,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

    const ataIx = createAssociatedTokenAccountIdempotentInstruction(
      params.claimant,
      claimantAta,
      params.claimant,
      params.mint,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const claimIx = createClaimInstruction({
      claimant: params.claimant,
      distributor,
      vault: params.vault,
      vaultAuthority,
      claimantAta,
      mint: params.mint,
      claimStatus,
      index: params.index,
      amount: params.amount,
      proof: params.proof,
      programId: this.programId,
    });

    return {
      instructions: [ataIx, claimIx],
      distributor,
      vaultAuthority,
      claimantAta,
      claimStatus,
    };
  }

  buildCloseClaimStatusInstruction(
    params: CloseClaimStatusParams,
  ): { instruction: TransactionInstruction; claimStatus: PublicKey } {
    const claimStatus =
      params.claimStatus ?? this.findClaimStatusPda(params.distributor, params.claimant)[0];

    const instruction = createCloseClaimStatusInstruction({
      claimant: params.claimant,
      distributor: params.distributor,
      claimStatus,
      programId: this.programId,
    });

    return { instruction, claimStatus };
  }
}
