/**
 * Encryption Utilities
 *
 * AES-256-GCM encryption for sensitive data at rest (e.g., OAuth refresh tokens).
 * Uses a server-side key derived from NEXTAUTH_SECRET or ENCRYPTION_KEY env var.
 *
 * Format: base64(iv:authTag:ciphertext)
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

function getEncryptionKey(): Buffer {
    const keySource = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
    if (!keySource) {
        throw new Error("Encryption key not configured. Set ENCRYPTION_KEY or NEXTAUTH_SECRET.");
    }
    // Derive a 256-bit key from the secret using SHA-256
    return crypto.createHash("sha256").update(keySource).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    // Pack iv + authTag + ciphertext, then base64 encode
    const packed = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    return Buffer.from(packed).toString("base64");
}

/**
 * Decrypt an encrypted string produced by encrypt().
 * Returns the original plaintext.
 */
export function decrypt(encryptedBase64: string): string {
    const key = getEncryptionKey();
    const packed = Buffer.from(encryptedBase64, "base64").toString("utf8");
    const [ivHex, authTagHex, ciphertext] = packed.split(":");

    if (!ivHex || !authTagHex || !ciphertext) {
        throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

/**
 * Check if a string looks like it was encrypted by us (base64-encoded, has the right structure).
 */
export function isEncrypted(value: string): boolean {
    try {
        const packed = Buffer.from(value, "base64").toString("utf8");
        const parts = packed.split(":");
        return parts.length === 3 && parts[0].length === IV_LENGTH * 2 && parts[1].length === AUTH_TAG_LENGTH * 2;
    } catch {
        return false;
    }
}
