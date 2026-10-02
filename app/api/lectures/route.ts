import { generateText, Output } from 'ai';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { RANKING_MODEL } from '@/lib/prompts';
import type { Lecture } from '@/lib/types';

export const maxDuration = 60;

const bodySchema = z.object({
  topic: z.string().trim().min(2).max(200),
  language: z.string().trim().max(5).default('en'),
  duration: z.enum(['any', 'short', 'medium', 'long']).default('any'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

function parseIsoDuration(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

const rankingSchema = z.object({
  lectures: z.array(
    z.object({
      id: z.string(),
      note: z.string().describe('One sentence on why this video is useful for the topic'),
      order: z.number().int().describe('Recommended learning order, starting at 1'),
    }),
  ),
});

export async function POST(req: Request) {
  const limited = rateLimit(req, 'lectures', 10);
  if (limited) return limited;

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'Lecture search is offline right now. Add a YouTube API key in Vars to enable it.' },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Enter a topic between 2 and 200 characters.' }, { status: 400 });
  const { topic, language, duration, level } = parsed.data;

  const search = new URL('https://www.googleapis.com/youtube/v3/search');
  search.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '15',
    q: `${topic} ${level} lecture`,
    relevanceLanguage: language,
    videoEmbeddable: 'true',
    safeSearch: 'strict',
    key,
    ...(duration !== 'any' && { videoDuration: duration }),
  }).toString();

  const searchRes = await fetch(search);
  if (!searchRes.ok) return Response.json({ error: 'YouTube search failed.' }, { status: 502 });
  const searchData = (await searchRes.json()) as { items?: { id: { videoId: string } }[] };
  const ids = (searchData.items ?? []).map((i) => i.id.videoId).filter(Boolean);
  if (ids.length === 0) return Response.json({ lectures: [] });

  const details = new URL('https://www.googleapis.com/youtube/v3/videos');
  details.search = new URLSearchParams({ part: 'snippet,contentDetails,statistics', id: ids.join(','), key }).toString();
  const detailsRes = await fetch(details);
  if (!detailsRes.ok) return Response.json({ error: 'YouTube lookup failed.' }, { status: 502 });

  type Item = {
    id: string;
    snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: Record<string, { url: string }> };
    contentDetails: { duration: string };
    statistics: { viewCount?: string };
  };
  const items = ((await detailsRes.json()) as { items?: Item[] }).items ?? [];

  const lectures: Lecture[] = items.map((v) => ({
    id: v.id,
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    publishedAt: v.snippet.publishedAt,
    thumbnail: (v.snippet.thumbnails.high ?? v.snippet.thumbnails.medium ?? v.snippet.thumbnails.default).url,
    durationSec: parseIsoDuration(v.contentDetails.duration),
    views: Number(v.statistics.viewCount ?? 0),
    url: `https://www.youtube.com/watch?v=${v.id}`,
  }));

  try {
    const { output } = await generateText({
      model: RANKING_MODEL,
      output: Output.object({ schema: rankingSchema }),
      prompt: `A ${level} student wants to learn "${topic}". Pick the 8 most useful videos below, ordered as a learning path. Use only the given ids.

${lectures.map((l) => `id=${l.id} | ${l.title} | ${l.channel} | ${Math.round(l.durationSec / 60)} min | ${l.views} views`).join('\n')}`,
    });
    const byId = new Map(lectures.map((l) => [l.id, l]));
    const ranked = output.lectures
      .filter((r) => byId.has(r.id))
      .sort((a, b) => a.order - b.order)
      .map((r, i) => ({ ...byId.get(r.id)!, note: r.note, order: i + 1 }));
    if (ranked.length > 0) return Response.json({ lectures: ranked });
  } catch {
    // Ranking is an enhancement; fall back to YouTube's relevance order.
  }

  return Response.json({ lectures: lectures.slice(0, 8).map((l, i) => ({ ...l, order: i + 1 })) });
}
