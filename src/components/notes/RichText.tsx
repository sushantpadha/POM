import { Fragment, type ReactNode } from 'react';
import { useStore } from '../../store/store';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g;

/** Minimal inline markup: **bold**, *italic*, [[wikilink]] to another notes file. */
export function RichText({ text }: { text: string }) {
  const files = useStore((s) => s.files);
  const openFile = useStore((s) => s.openFile);
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((p, i): ReactNode => {
        if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('[[')) {
          const target = p.slice(2, -2);
          const exists = !!files[target];
          return exists ? (
            <a
              key={i}
              className="wikilink"
              onClick={(e) => {
                e.stopPropagation();
                openFile(target);
              }}
            >
              {target}
            </a>
          ) : (
            <span key={i} className="faint">{target}</span>
          );
        }
        if (p.startsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
