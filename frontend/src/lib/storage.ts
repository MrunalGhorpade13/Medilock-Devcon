import { uint8ToBase64, base64ToUint8 } from "./crypto";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;
const PINATA_GATEWAY =
  (import.meta.env.VITE_PINATA_GATEWAY as string | undefined) ||
  "https://gateway.pinata.cloud/ipfs/";

// ─── IPFS via Pinata ─────────────────────────────────────────────────────────

/**
 * Upload a Uint8Array blob to IPFS via Pinata.
 * @returns IPFS CID string (e.g. "QmXyz...")
 * @throws if Pinata JWT is not set
 */
export async function uploadToPinata(blob: Uint8Array): Promise<string> {
  if (!PINATA_JWT) throw new Error("VITE_PINATA_JWT not set");

  const formData = new FormData();
  const file = new File([blob], "medilock-record.bin", {
    type: "application/octet-stream",
  });
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: "MediLock Encrypted Record" })
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Pinata upload failed: ${res.statusText}`);
  const json = await res.json();
  return json.IpfsHash as string;
}

/**
 * Fetch encrypted blob from IPFS via the configured gateway.
 */
export async function fetchFromIPFS(cid: string): Promise<Uint8Array> {
  const res = await fetch(`${PINATA_GATEWAY}${cid}`);
  if (!res.ok) throw new Error(`IPFS fetch failed: ${res.statusText}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// ─── On-chain fallback ───────────────────────────────────────────────────────

/**
 * Encode encrypted blob as a hex string suitable for on-chain storage.
 * (Used when IPFS / Pinata is unavailable.)
 */
export function encodeForChain(blob: Uint8Array): `0x${string}` {
  return `0x${Array.from(blob)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

/**
 * Decode hex bytes returned from the contract back to a Uint8Array.
 */
export function decodeFromChain(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const result = new Uint8Array(clean.length / 2);
  for (let i = 0; i < result.length; i++) {
    result[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
}

// ─── Unified fetch (IPFS first, chain fallback) ───────────────────────────────

/**
 * Fetch encrypted blob — tries IPFS first, falls back to on-chain hex.
 * @param cid   IPFS CID (empty string means on-chain fallback)
 * @param onChainHex  Hex from encryptedData mapping (pass if cid is empty)
 */
export async function fetchRecord(
  cid: string,
  onChainHex?: string
): Promise<Uint8Array> {
  if (cid) {
    return fetchFromIPFS(cid);
  }
  if (onChainHex && onChainHex !== "0x") {
    return decodeFromChain(onChainHex);
  }
  throw new Error("No CID and no on-chain data available");
}
