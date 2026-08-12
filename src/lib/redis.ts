import "server-only";

import { Redis } from "@upstash/redis";

// ── Target Patch for Next.js ISR compilation and Upstash Redis ───────────────
// Upstash's client sets cache: 'no-store' by default. This causes Next.js
// static prerendering to drop to dynamic routing. We patch global fetch to
// strip 'no-store' only for Upstash Redis queries during static build phases.
if (typeof globalThis.fetch === "function") {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (init && init.cache === "no-store") {
      const urlStr =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : input.toString();
      if (urlStr.includes("upstash.io") || urlStr.includes("upstash.co")) {
        const cleanInit = { ...init };
        delete cleanInit.cache;
        return originalFetch(input, cleanInit);
      }
    }
    return originalFetch(input, init);
  };
}

// ── Singleton client (HTTP-based, safe in Vercel serverless) ──────────────────
let _client: Redis | null = null;

function getClient(): Redis | null {
  // During static page prerendering (next build), bypass Redis completely.
  // Next.js intercepts POST requests to Redis REST endpoint and drops routes to dynamic.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null; // Redis not configured → all helpers return null/false/void
  }
  if (!_client) {
    _client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _client;
}

// ── Circuit breaker ────────────────────────────────────────────────────────────
// After 3 consecutive Redis failures, bypasses Redis for 60 s automatically.
// Prevents hammering a rate-limited or unreachable Redis instance.
let _failures = 0;
let _openUntil = 0;
const MAX_FAILURES = 3;
const OPEN_MS = 60_000;

function isOpen(): boolean {
  if (Date.now() < _openUntil) return true;
  if (_openUntil > 0 && Date.now() >= _openUntil) {
    _failures = 0;
    _openUntil = 0;
  }
  return false;
}

function onSuccess() {
  _failures = 0;
}

function onFailure(err: unknown, ctx: string) {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[redis] ${ctx} — ${msg}`);
  _failures++;
  if (_failures >= MAX_FAILURES) {
    _openUntil = Date.now() + OPEN_MS;
    console.warn("[redis] Circuit breaker OPEN — bypassing Redis for 60 s");
  }
}

// ── Safe public helpers (never throw) ─────────────────────────────────────────

export async function rGet<T>(key: string): Promise<T | null> {
  const c = getClient();
  if (!c || isOpen()) return null;
  try {
    const v = await c.get<T>(key);
    onSuccess();
    return v;
  } catch (e) {
    onFailure(e, `GET ${key}`);
    return null;
  }
}

export async function rSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const c = getClient();
  if (!c || isOpen() || value === undefined || value === null) return;
  try {
    await c.set(key, value, { ex: ttlSeconds });
    onSuccess();
  } catch (e) {
    onFailure(e, `SET ${key}`);
  }
}

/**
 * Batch GET — executes as a single MGET command (counts as 1 toward the daily limit).
 * Returns an array matching the input keys order; null for misses or on error.
 */
export async function rMGet<T>(keys: string[]): Promise<(T | null)[]> {
  const c = getClient();
  if (!c || isOpen() || keys.length === 0) return keys.map(() => null);
  try {
    const results = await c.mget<(T | null)[]>(...keys);
    onSuccess();
    return results;
  } catch (e) {
    onFailure(e, `MGET [${keys.join(", ")}]`);
    return keys.map(() => null);
  }
}

/** Delete one or more keys in a single DEL command (counts as 1). */
export async function rDel(...keys: string[]): Promise<void> {
  const c = getClient();
  if (!c || isOpen() || keys.length === 0) return;
  try {
    await c.del(...keys);
    onSuccess();
  } catch (e) {
    onFailure(e, `DEL ${keys.join(", ")}`);
  }
}

/** Redis SET membership check — O(1), sub-millisecond. */
export async function rSIsMember(
  key: string,
  member: string,
): Promise<boolean> {
  const c = getClient();
  if (!c || isOpen()) return false;
  try {
    const r = await c.sismember(key, member);
    onSuccess();
    return r === 1;
  } catch (e) {
    onFailure(e, `SISMEMBER ${key}`);
    return false;
  }
}

/** Add one or more members to a Redis SET and (re)set its TTL. */
export async function rSAdd(
  key: string,
  ttlSeconds: number,
  ...members: string[]
): Promise<void> {
  const c = getClient();
  if (!c || isOpen() || members.length === 0) return;
  try {
    await c.sadd(key, ...members as [string, ...string[]]);
    await c.expire(key, ttlSeconds);
    onSuccess();
  } catch (e) {
    onFailure(e, `SADD ${key}`);
  }
}
