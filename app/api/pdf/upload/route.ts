import { extractText, getDocumentProxy } from 'unpdf';
import { rateLimit } from '@/lib/rate-limit';
import { storeDoc } from '@/lib/pdf-store';

export const maxDuration = 60;
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const limited = rateLimit(req, 'upload', 10);
  if (limited) return limited;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'No file provided.' }, { status: 400 });
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return Response.json({ error: 'Only PDF files are supported.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: 'File is larger than 20 MB.' }, { status: 413 });

  try {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: false });
    const doc = await storeDoc(file.name.slice(0, 120), text);
    return Response.json({ id: doc.id, name: doc.name, pages: doc.pages, chunks: doc.chunks.length });
  } catch (err) {
    const message = err instanceof Error && err.message.startsWith('No readable') ? err.message : 'Could not read this PDF.';
    return Response.json({ error: message }, { status: 422 });
  }
}
