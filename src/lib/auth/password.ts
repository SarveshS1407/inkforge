import crypto from "node:crypto";

function scryptAsync(
  password: string,
  salt: string,
  keylen: number,
  options?: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options || {}, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS: crypto.ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

/**
 * Hash password using scrypt with cryptographically random salt.
 * Output format: scrypt:salt:derivedKey
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(
    password,
    salt,
    SCRYPT_KEYLEN,
    SCRYPT_PARAMS
  );

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify password against stored hash using timing-safe comparison.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }

    const salt = parts[1];
    const key = Buffer.from(parts[2], "hex");

    const derivedKey = await scryptAsync(
      password,
      salt,
      key.length,
      SCRYPT_PARAMS
    );

    return crypto.timingSafeEqual(key, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate cryptographically secure random token (e.g. for sessions or email verification).
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Compute SHA-256 hash of a token for safe database persistence.
 * Raw tokens are never stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
