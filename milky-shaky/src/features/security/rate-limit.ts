import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  POLICIES,
  limitMessage,
  parseClientIp,
  retryAfterSeconds,
  type PolicyName,
} from "./policies";

const CLEANUP_CHANCE = 0.01;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The visitor's address, or null when it isn't available (for example, on localhost). */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return parseClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}

/**
 * Counts one attempt. Returns a message if the limit has been passed, otherwise null.
 * Uses a single atomic upsert, so two simultaneous requests can't both slip under the limit.
 */
export async function consumeRateLimit(policy: PolicyName, identifier: string | null): Promise<string | null> {
  if (!identifier) return null;

  const { limit, windowSeconds } = POLICIES[policy];
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const key = `${policy}:${identifier}`;

  const [row] = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < ${windowStart} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < ${windowStart} THEN ${now} ELSE "RateLimit"."windowStart" END
    RETURNING "count", "windowStart"
  `;

  if (Math.random() < CLEANUP_CHANCE) void cleanupOldWindows(now);

  if (row.count > limit) {
    return limitMessage(policy, retryAfterSeconds(row.windowStart, windowSeconds, now));
  }
  return null;
}

/** Checks the limit without counting an attempt. Used to show a clear message before signing in. */
export async function peekRateLimit(policy: PolicyName, identifier: string | null): Promise<string | null> {
  if (!identifier) return null;

  const { limit, windowSeconds } = POLICIES[policy];
  const now = new Date();
  const row = await db.rateLimit.findUnique({ where: { key: `${policy}:${identifier}` } });
  if (!row) return null;

  const windowEnded = row.windowStart.getTime() + windowSeconds * 1000 <= now.getTime();
  if (windowEnded || row.count <= limit) return null;

  return limitMessage(policy, retryAfterSeconds(row.windowStart, windowSeconds, now));
}

async function cleanupOldWindows(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - DAY_MS);
  await db.rateLimit
    .deleteMany({ where: { windowStart: { lt: cutoff } } })
    .catch((error) => console.error("Rate limit cleanup failed", error));
}