import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

if (!process.env.MASTER_ENCRYPTION_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  if (!process.env.MASTER_ENCRYPTION_KEY) {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  }
}

const MASTER_ENCRYPTION_KEY = process.env.MASTER_ENCRYPTION_KEY;

if (!MASTER_ENCRYPTION_KEY || !/^[0-9a-fA-F]{64}$/.test(MASTER_ENCRYPTION_KEY)) {
  throw new Error(
    "Invalid or missing MASTER_ENCRYPTION_KEY environment variable. Expected a 64-character hex string representing 32 bytes."
  );
}

const masterKeyBuffer = Buffer.from(MASTER_ENCRYPTION_KEY, "hex");

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface ApiKeyResult {
  rawKey: string;
  hashedKey: string;
  prefix: string;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext The plaintext string to encrypt.
 * @returns An object containing the ciphertext, iv, and authTag in hex.
 */
export function encryptSecret(plaintext: string): EncryptedSecret {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", masterKeyBuffer, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return {
      ciphertext,
      iv: iv.toString("hex"),
      authTag,
    };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to encrypt secret: ${err}`);
  }
}

/**
 * Decrypts an AES-256-GCM encrypted secret.
 *
 * @param ciphertext The encrypted ciphertext in hex.
 * @param iv The 16-byte initialization vector in hex.
 * @param authTag The GCM authentication tag in hex.
 * @returns The decrypted plaintext string.
 */
export function decryptSecret(
  ciphertext: string,
  iv: string,
  authTag: string
): string {
  try {
    const ivBuffer = Buffer.from(iv, "hex");
    const authTagBuffer = Buffer.from(authTag, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", masterKeyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to decrypt secret: Authentication tag verification failed or key is incorrect (${err})`
    );
  }
}

/**
 * Computes the SHA-256 hash of an API key.
 *
 * @param key The raw API key string.
 * @returns The SHA-256 hex digest.
 */
export function hashApiKey(key: string): string {
  try {
    return crypto.createHash("sha256").update(key, "utf8").digest("hex");
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to hash API key: ${err}`);
  }
}

/**
 * Generates a cryptographically secure API key.
 *
 * @param prefix Prefix for the key (e.g., 'neb_live', 'neb_test').
 * @returns Object with the raw key (shown once), hashed key (stored in DB), and prefix.
 */
export function generateApiKey(prefix: string): ApiKeyResult {
  try {
    const randomBytes = crypto.randomBytes(32);
    const token = randomBytes.toString("base64url");
    const rawKey = `${prefix}_${token}`;
    const hashedKey = hashApiKey(rawKey);

    return {
      rawKey,
      hashedKey,
      prefix,
    };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate API key: ${err}`);
  }
}

/**
 * Generates an 8-character user code formatted as XXXX-XXXX for Device Flow approval.
 * Excludes confusing characters (0, O, 1, I, L) for better usability.
 *
 * @returns Formatted user code (e.g., 'ABCD-EFGH').
 */
export function generateUserCode(): string {
  const CHARACTERS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const length = 8;
  const chars: string[] = [];

  for (let i = 0; i < length; i++) {
    const index = crypto.randomInt(0, CHARACTERS.length);
    chars.push(CHARACTERS[index]);
  }

  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}`;
}
