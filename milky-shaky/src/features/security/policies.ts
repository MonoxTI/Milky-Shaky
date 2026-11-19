// Limits per action. Each one is a fixed window that starts with the first attempt.
export const POLICIES = {
  loginAccount: { limit: 8, windowSeconds: 15 * 60, label: "login attempts for this account" },
  loginIp: { limit: 30, windowSeconds: 15 * 60, label: "login attempts from this network" },
  signupIp: { limit: 5, windowSeconds: 60 * 60, label: "sign-up attempts from this network" },
  orderUser: { limit: 10, windowSeconds: 10 * 60, label: "order attempts" },
  paymentUser: { limit: 10, windowSeconds: 10 * 60, label: "payment attempts" },
  staffCreateUser: { limit: 20, windowSeconds: 60 * 60, label: "account creations" },
  exportUser: { limit: 20, windowSeconds: 60 * 60, label: "report exports" },
} as const;

export type PolicyName = keyof typeof POLICIES;

export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function retryAfterSeconds(windowStart: Date, windowSeconds: number, now: Date): number {
  const end = windowStart.getTime() + windowSeconds * 1000;
  return Math.max(1, Math.ceil((end - now.getTime()) / 1000));
}

export function limitMessage(policy: PolicyName, retrySeconds: number): string {
  return `Too many ${POLICIES[policy].label}. Please try again in ${formatWait(retrySeconds)}.`;
}

/**
 * Takes the last address in X-Forwarded-For. The hosting proxy appends the address it actually
 * saw, so a visitor can't fake it by adding their own header. Returns null when running locally.
 */
export function parseClientIp(forwardedFor: string | null, realIp: string | null): string | null {
  const last = forwardedFor
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .pop();
  return last || realIp?.trim() || null;
}