import { keccak256, concatHex, toHex } from "viem";

// ─── Key generation ───────────────────────────────────────────────────────────

/** Generate a new AES-256-GCM key. */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Export a CryptoKey to a base64url string (safe for URL fragments). */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Import a base64url string back to a CryptoKey. */
export async function importKey(b64url: string): Promise<CryptoKey> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

export interface EncryptResult {
  /** AES-GCM ciphertext bytes */
  ciphertext: Uint8Array;
  /** 12-byte IV */
  iv: Uint8Array;
  /** Combined blob: [12-byte IV][ciphertext] — ready for IPFS/on-chain */
  blob: Uint8Array;
}

/** Encrypt a JSON-serialisable object. Returns ciphertext + IV + combined blob. */
export async function encrypt(
  data: unknown,
  key: CryptoKey
): Promise<EncryptResult> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );
  const ciphertext = new Uint8Array(ciphertextBuf);
  const blob = new Uint8Array(iv.length + ciphertext.length);
  blob.set(iv, 0);
  blob.set(ciphertext, iv.length);
  return { ciphertext, iv, blob };
}

/** Decrypt a combined blob ([12-byte IV][ciphertext]) back to an object. */
export async function decrypt<T = unknown>(
  blob: Uint8Array,
  key: CryptoKey
): Promise<T> {
  const iv = blob.slice(0, 12);
  const ciphertext = blob.slice(12);
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintextBuf)) as T;
}

// ─── Commitment ───────────────────────────────────────────────────────────────

/**
 * Compute keccak256(ciphertext || salt) using viem.
 * This is stored on-chain as the integrity proof — it does NOT reveal data.
 */
export function computeCommitment(blob: Uint8Array): `0x${string}` {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const combined = new Uint8Array(blob.length + salt.length);
  combined.set(blob, 0);
  combined.set(salt, blob.length);
  return keccak256(toHex(combined));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Uint8Array to a base64 string (for API transport). */
export function uint8ToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

/** Convert a base64 string back to Uint8Array. */
export function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
