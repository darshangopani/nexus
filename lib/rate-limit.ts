const WINDOW_MS = 60_000;

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { __ehRateLimit?: Map<string, Bucket> };
const buckets = (globalStore.__ehRateLimit ??= new Map());

// In-memory and per-instance: good enough to blunt abuse in a single region.
// Swap for a shared store (e.g. Upstash Redis) before scaling out.
export function rateLimit(req: Request, scope: string, limit: number) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return Response.json(
      { error: `Too many requests. Try again in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
  bucket.count++;
  return null;
}
