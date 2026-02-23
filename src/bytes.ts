export type BigintIsh = bigint | number | string;

const MAX_U64 = (1n << 64n) - 1n;
const MAX_I64 = (1n << 63n) - 1n;
const MIN_I64 = -(1n << 63n);

export function toBigInt(value: BigintIsh): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error(`Expected integer number, got ${value}`);
    }
    return BigInt(value);
  }
  return BigInt(value);
}

export function u64ToLe(value: BigintIsh): Uint8Array {
  let n = toBigInt(value);
  if (n < 0n || n > MAX_U64) {
    throw new Error(`u64 out of range: ${value}`);
  }

  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
}

export function i64ToLe(value: BigintIsh): Uint8Array {
  let n = toBigInt(value);
  if (n < MIN_I64 || n > MAX_I64) {
    throw new Error(`i64 out of range: ${value}`);
  }

  if (n < 0n) {
    n = (1n << 64n) + n;
  }
  return u64ToLe(n);
}

export function leToU64(bytes: Uint8Array, offset: number): bigint {
  let out = 0n;
  for (let i = 7; i >= 0; i -= 1) {
    out <<= 8n;
    out |= BigInt(bytes[offset + i]);
  }
  return out;
}

export function leToI64(bytes: Uint8Array, offset: number): bigint {
  const raw = leToU64(bytes, offset);
  if (raw > MAX_I64) {
    return raw - (1n << 64n);
  }
  return raw;
}

export function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((acc, part) => acc + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function assertLength32(value: Uint8Array, name: string): void {
  if (value.length !== 32) {
    throw new Error(`${name} must be 32 bytes, got ${value.length}`);
  }
}
