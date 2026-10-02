'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedDoc } from '@/lib/types';

export function PdfUploader({
  docs,
  onAdd,
  onRemove,
  activeId,
  onSelect,
}: {
  docs: UploadedDoc[];
  onAdd: (doc: UploadedDoc) => void;
  onRemove: (id: string) => void;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error(`${file.name} is not a PDF.`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 20 MB.`);
        continue;
      }
      setUploading(file.name);
      try {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/pdf/upload', { method: 'POST', body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Upload failed.');
        onAdd({ id: data.id, name: data.name, pages: data.pages, url: URL.createObjectURL(file) });
        toast.success(`${data.name} is ready (${data.pages} pages).`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setUploading(null);
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        disabled={Boolean(uploading)}
        className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors ${
          dragging ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent/50 hover:text-foreground'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="truncate">Reading {uploading}</span>
          </>
        ) : (
          <>
            <Upload className="size-4" aria-hidden="true" />
            Drop PDFs or click to upload
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        aria-label="Upload PDF"
        onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = '';
        }}
      />
      {docs.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Uploaded documents">
          {docs.map((d) => (
            <li
              key={d.id}
              className={`flex items-center gap-1.5 rounded-lg border py-1 pl-2.5 pr-1 text-xs ${
                d.id === activeId ? 'border-accent/50 bg-accent/10' : 'border-border'
              }`}
            >
              <button type="button" onClick={() => onSelect(d.id)} className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary-2" aria-hidden="true" />
                <span className="max-w-40 truncate">{d.name}</span>
                <span className="text-muted">{d.pages}p</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(d.id)}
                aria-label={`Remove ${d.name}`}
                className="rounded p-0.5 text-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PdfViewer({ doc, page, onClose }: { doc?: UploadedDoc; page: number; onClose: () => void }) {
  if (!doc) return null;
  return (
    <aside aria-label="PDF viewer" className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <div className="flex items-center gap-2">
          <span className="hud text-muted">Page {page}</span>
          <button type="button" onClick={onClose} aria-label="Close viewer" className="rounded p-1 text-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      </div>
      {doc.url ? (
        <iframe key={`${doc.id}-${page}`} src={`${doc.url}#page=${page}`} title={doc.name} className="min-h-0 flex-1 bg-white" />
      ) : (
        <p className="p-6 text-sm leading-relaxed text-muted">
          The preview for this file is no longer available after a reload. Re-upload it to view pages.
        </p>
      )}
    </aside>
  );
}
