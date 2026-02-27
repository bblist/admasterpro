/**
 * JWT Token Utilities
 *
 * Edge-runtime compatible JWT signing and verification using `jose`.
 * Used as a fallback auth mechanism alongside httpOnly cookies.
 * Tokens are stored in localStorage on the client and sent via
 * the Authorization header on API requests.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getJwtSecret(): Uint8Array {
    const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT secret is not configured. Set NEXTAUTH_SECRET or JWT_SECRET.");
    }
    return new TextEncoder().encode(jwtSecret);
}

export interface TokenPayload extends JWTPayload {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    method: "google" | "email";
    hasAdsAccess: boolean;
    adsTokenPresent?: boolean;
}

/**
 * Sign a JWT token with user session data.
 * Token expires in 30 days (longer than cookie to survive ITP).
 */
export async function signToken(payload: Omit<TokenPayload, "iat" | "exp" | "iss">): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("admasterpro")
        .setExpirationTime("30d")
        .sign(secret);
}

/**
 * Verify and decode a JWT token.
 * Returns the payload or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const secret = getJwtSecret();
        const { payload } = await jwtVerify(token, secret, {
            issuer: "admasterpro",
        });
        return payload as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Extract bearer token from Authorization header.
 * Accepts "Bearer <token>" format.
 */
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.slice(7).trim() || null;
}

/**
 * Sign a short-lived magic link token (15 minutes).
 * Used for passwordless email authentication.
 */
export async function signMagicLinkToken(email: string): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({ email, purpose: "magic-link" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("admasterpro")
        .setExpirationTime("15m")
        .sign(secret);
}

/**
 * Verify a magic link token. Returns the email or null.
 */
export async function verifyMagicLinkToken(token: string): Promise<string | null> {
    try {
        const secret = getJwtSecret();
        const { payload } = await jwtVerify(token, secret, { issuer: "admasterpro" });
        if (payload.purpose !== "magic-link") return null;
        return (payload.email as string) || null;
    } catch {
        return null;
    }
}
