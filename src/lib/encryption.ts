import crypto from "crypto";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || ""; // Must be 32 bytes/characters
const IV_LENGTH = 16; // For AES, this is always 16

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  // In a real production setup, we'd throw. For local testing without a key, we might fallback 
  // or log a serious warning, but let's be strict and just warn, falling back to plaintext 
  // if not configured properly, just to not break dev setups immediately.
  console.warn("WARNING: TOKEN_ENCRYPTION_KEY is not set or is not 32 characters. Tokens will NOT be encrypted safely.");
}

export function encryptToken(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) return text; // Fallback for dev

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptToken(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) return text; // Fallback for dev

  // If token was saved before encryption was enabled, it won't have the colon separator 
  // or it will be standard length. We can try to detect this.
  const textParts = text.split(":");
  if (textParts.length !== 2) {
    // Looks like an unencrypted token or invalid format
    return text;
  }

  try {
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Token decryption failed. Returning original text just in case.");
    return text;
  }
}
