import { cosineSimilarity, embed, embedMany } from 'ai';

export const EMBEDDING_MODEL = 'google/gemini-embedding-001';
const TTL_MS = 1000 * 60 * 60 * 6;

export type Chunk = { page: number; text: string; embedding: number[] };
export type StoredDoc = { id: string; name: string; pages: number; chunks: Chunk[]; createdAt: number };

const g = globalThis as unknown as { __ehDocs?: Map<string, StoredDoc> };
const docs = (g.__ehDocs ??= new Map());

function prune() {
  const now = Date.now();
  for (const [id, d] of docs) if (now - d.createdAt > TTL_MS) docs.delete(id);
}

export function chunkPages(pages: string[], size = 1200, overlap = 200) {
  const out: { page: number; text: string }[] = [];
  pages.forEach((raw, i) => {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return;
    for (let start = 0; start < text.length; start += size - overlap) {
      out.push({ page: i + 1, text: text.slice(start, start + size) });
      if (start + size >= text.length) break;
    }
  });
  return out;
}

export async function storeDoc(name: string, pages: string[]) {
  prune();
  const pieces = chunkPages(pages).slice(0, 400);
  if (pieces.length === 0) throw new Error('No readable text found. Scanned PDFs are not supported yet.');

  const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: pieces.map((p) => p.text) });
  const doc: StoredDoc = {
    id: crypto.randomUUID(),
    name,
    pages: pages.length,
    createdAt: Date.now(),
    chunks: pieces.map((p, i) => ({ ...p, embedding: embeddings[i] })),
  };
  docs.set(doc.id, doc);
  return doc;
}

export function getDocs(ids: string[]) {
  return ids.map((id) => docs.get(id)).filter((d): d is StoredDoc => Boolean(d));
}

export async function retrieve(ids: string[], query: string, k = 6) {
  const found = getDocs(ids);
  if (found.length === 0) return { found, hits: [] as { doc: string; page: number; text: string; score: number }[] };

  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: query });
  const hits = found
    .flatMap((d) =>
      d.chunks.map((c) => ({ doc: d.name, page: c.page, text: c.text, score: cosineSimilarity(embedding, c.embedding) })),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  return { found, hits };
}
