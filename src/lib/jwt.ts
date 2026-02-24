/**
 * JWT Token Utilities
 *
 * Edge-runtime compatible JWT signing and verification using `jose`.
 * Used as a fallback auth mechanism alongside httpOnly cookies.
 * Tokens are stored in localStorage on the client and sent via
 * the Authorization header on API requests.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "admasterpro-fallback-secret-change-me";
const secret = new TextEncoder().encode(JWT_SECRET);

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
