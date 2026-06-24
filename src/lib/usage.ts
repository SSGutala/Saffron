import { getSession } from "./auth";

import prisma from "./prisma";

const FREE_POINTS = 5;
const PRO_POINTS = 100;
const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;

/** User brought their own AI key — bill Groq directly, skip app credit limits. */
export function hasOwnAIKey(): boolean {
  return !!(
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );
}

export async function getUsageTracker() {
  const session = await getSession();
  const hasProAccess = session?.plan === "PRO";

  const { RateLimiterPrisma } = await import("rate-limiter-flexible");

  return new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: hasProAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });
}

export async function consumeCredits() {
  if (hasOwnAIKey()) return;

  const session = await getSession();
  if (!session?.userId) {
    throw new Error("User not authenticated");
  }

  const usageTracker = await getUsageTracker();
  return usageTracker.consume(session.userId, GENERATION_COST);
}

export async function getUsageStatus() {
  if (hasOwnAIKey()) {
    return {
      remainingPoints: 9999,
      msBeforeNext: 0,
      consumedPoints: 0,
      isFirstInDuration: false,
    };
  }

  const session = await getSession();
  if (!session?.userId) {
    throw new Error("User not authenticated");
  }

  const usageTracker = await getUsageTracker();
  return usageTracker.get(session.userId);
}
