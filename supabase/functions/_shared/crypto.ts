// supabase/functions/_shared/crypto.ts

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96-bit IV per NIST recommendation

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Use standard base64 for DB storage
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get("ENCRYPTION_KEY");
  if (!keyHex) throw new Error("ENCRYPTION_KEY not set");
  if (keyHex.length !== 64) throw new Error("ENCRYPTION_KEY must be 64 hex chars (256 bits)");
  return crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: ALGORITHM },
    false,          // not extractable
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt plaintext. Returns base64 string of (IV || ciphertext || tag).
 * AES-GCM appends the 16-byte auth tag to the ciphertext automatically.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded),
  );
  // Prepend IV to ciphertext for storage
  const combined = new Uint8Array(IV_LENGTH + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, IV_LENGTH);
  return bytesToBase64(combined);
}

/**
 * Decrypt base64 string of (IV || ciphertext || tag) back to plaintext.
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const combined = base64ToBytes(ciphertext);
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
}
