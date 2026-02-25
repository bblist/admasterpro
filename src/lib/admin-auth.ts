/**
 * Shared Admin Authentication
 *
 * Checks user.role from the database instead of relying on a fragile
 * ADMIN_EMAIL environment variable.
 *
 * Falls back to ADMIN_EMAIL for backward compatibility during migration.
 */

import { getSessionDual } from "@/lib/session";

export async function isAdmin(req: Request): Promise<boolean> {
    const session = await getSessionDual(req);
    if (!session?.id) return false;

    try {
        const { prisma } = await import("@/lib/db");
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { role: true, email: true },
        });
        if (!user) return false;

        // Primary check: DB role field
        if (user.role === "admin") return true;

        // Backward compatibility: ADMIN_EMAIL env var
        // (Allows admin access before role is set in DB)
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && user.email === adminEmail) {
            // Auto-promote: set the role in DB so future checks use the DB field
            try {
                await prisma.user.update({
                    where: { id: session.id },
                    data: { role: "admin" },
                });
            } catch { /* non-critical */ }
            return true;
        }

        return false;
    } catch {
        // DB unavailable — fall back to email check only
        const adminEmail = process.env.ADMIN_EMAIL;
        return !!(adminEmail && session.email === adminEmail);
    }
}
