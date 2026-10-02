'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

const CITATION = /\[(?:([^\]\[]*?)\s)?p\.\s?(\d+)\]/g;

function linkCitations(text: string) {
  return text.replace(CITATION, (_m, doc: string | undefined, page: string) => {
    const label = doc ? `${doc} p. ${page}` : `p. ${page}`;
    return `[${label}](#cite-${page}-${encodeURIComponent(doc ?? '')})`;
  });
}

export const Markdown = memo(function Markdown({
  text,
  onCite,
}: {
  text: string;
  onCite?: (page: number, doc?: string) => void;
}) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          a({ href, children }) {
            const cite = href?.match(/^#cite-(\d+)-(.*)$/);
            if (cite) {
              return (
                <button
                  type="button"
                  onClick={() => onCite?.(Number(cite[1]), decodeURIComponent(cite[2]) || undefined)}
                  className="mx-0.5 inline-flex items-center rounded-md border border-accent/40 bg-accent/10 px-1.5 py-0.5 align-baseline font-mono text-[0.7rem] text-accent no-underline transition-colors hover:bg-accent/20"
                >
                  {children}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {onCite ? linkCitations(text) : text}
      </ReactMarkdown>
    </div>
  );
});
