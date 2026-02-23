import { sha256 } from "@noble/hashes/sha256";
import { PublicKey } from "@solana/web3.js";
import { assertLength32, BigintIsh, concatBytes, u64ToLe } from "./bytes";
import { LEAF_TAG } from "./constants";

export function hashSortedPair(left: Uint8Array, right: Uint8Array): Uint8Array {
  assertLength32(left, "left");
  assertLength32(right, "right");

  const pair = compareBytes(left, right) <= 0 ? [left, right] : [right, left];
  return sha256(concatBytes(pair));
}

export function computeLeaf(
  distributor: PublicKey,
  wallet: PublicKey,
  index: BigintIsh,
  amount: BigintIsh,
): Uint8Array {
  const preimage = concatBytes([
    LEAF_TAG,
    distributor.toBuffer(),
    u64ToLe(index),
    wallet.toBuffer(),
    u64ToLe(amount),
  ]);

  return sha256(preimage);
}

export function verifyMerkleProofSorted(
  leaf: Uint8Array,
  proof: Uint8Array[],
  root: Uint8Array,
): boolean {
  assertLength32(leaf, "leaf");
  assertLength32(root, "root");

  let computed = leaf;
  for (const sibling of proof) {
    assertLength32(sibling, "proof element");
    computed = hashSortedPair(computed, sibling);
  }

  return compareBytes(computed, root) === 0;
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}
