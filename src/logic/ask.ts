import type { Entry, NoteFile, Response } from '../types';
import { ASK_SPECS, LOW_CONFIDENCE_QUESTION, type AskSpec, type Ref } from '../data/ask';
import { MODEL } from '../store/model';

export interface Citation {
  n: number;
  fileId: string;
  entry: Entry;
}

export interface AskResult {
  dimensions: string[];
  mainFiles: string[];
  topicFiles: string[];
  reported: { entry: Entry; fileId: string; cite: number }[];
  interpretation: { text: string; cites: number[] }[];
  citations: Citation[];
  predefined: boolean;
  missingSources: number;
}

const DIM_LABEL: Record<string, string> = {
  ethics: 'Ethics',
  worldview: 'Worldview / Beliefs',
  'long-term-goals': 'Long-term goals',
};

function resolve(ref: Ref, files: Record<string, NoteFile>): { fileId: string; entry: Entry } | null {
  if ('entryId' in ref) {
    const entry = files[ref.fileId]?.current.entries.find((e) => e.id === ref.entryId);
    return entry ? { fileId: ref.fileId, entry } : null;
  }
  // Prefer the line generated from the answer; fall back to an AI line citing the same item.
  let fallback: { fileId: string; entry: Entry } | null = null;
  for (const f of Object.values(files)) {
    for (const e of f.current.entries) {
      if (e.sourceItemId !== ref.qid) continue;
      if (e.provenance !== 'ai') return { fileId: f.id, entry: e };
      fallback ??= { fileId: f.id, entry: e };
    }
  }
  return fallback;
}

function detectDimensions(q: string): AskSpec['dimensions'] {
  const dims: AskSpec['dimensions'] = [];
  if (/ethic|moral|harm|right|wrong|family|obligat|duty/i.test(q)) dims.push('ethics');
  if (/believ|worldview|agency|knowledge|truth|control|strang/i.test(q)) dims.push('worldview');
  if (/goal|career|future|plan|relationship|work|ambition/i.test(q)) dims.push('long-term-goals');
  return dims.length ? dims : ['ethics', 'worldview', 'long-term-goals'];
}

export function answer(
  question: string,
  files: Record<string, NoteFile>,
  responses: Record<string, Response>,
  /** Predefined interpretations were written for the sample profile only. */
  usePredefined: boolean,
): AskResult {
  const citations: Citation[] = [];
  const cite = (fileId: string, entry: Entry) => {
    const found = citations.find((c) => c.entry.id === entry.id);
    if (found) return found.n;
    const n = citations.length + 1;
    citations.push({ n, fileId, entry });
    return n;
  };

  const spec = ASK_SPECS.find((s) => s.question === question) ?? ASK_SPECS.find((s) => s.match.test(question));
  const lowConfidence = question === LOW_CONFIDENCE_QUESTION || /low.confidence|unsure|uncertain answers/i.test(question);

  if (lowConfidence) {
    const qids = Object.entries(responses).filter(([, r]) => (r.confidence ?? 5) <= 2).map(([id]) => id);
    const hits = qids.map((qid) => resolve({ qid }, files)).filter((x): x is NonNullable<typeof x> => !!x);
    const reported = hits.map((h) => ({ ...h, cite: cite(h.fileId, h.entry) }));
    const nodes = [...new Set(qids.map((id) => MODEL.questions.find((q) => q.id === id)!.nodeId))];
    const dims = [...new Set(hits.map((h) => h.fileId.split('/')[0]))];
    return {
      dimensions: dims.map((d) => DIM_LABEL[d]),
      mainFiles: dims.map((d) => `${d}/main`),
      topicFiles: [...new Set(hits.map((h) => h.fileId))].filter((f) => !f.endsWith('/main')),
      reported,
      interpretation: [
        {
          text: hits.length
            ? `${hits.length} note${hits.length > 1 ? 's come' : ' comes'} from answers you rated “unsure” or “very unsure”. They may describe you less reliably than the rest — retaking ${nodes.map((n) => MODEL.nodes.find((x) => x.id === n)!.name).join(' and ')} could firm them up or show they have changed.`
            : 'None of your current notes come from answers you marked as low-confidence.',
          cites: reported.map((r) => r.cite),
        },
      ],
      citations,
      predefined: false,
      missingSources: qids.length - hits.length,
    };
  }

  if (spec && usePredefined) {
    const resolved = spec.reported.map((r) => resolve(r, files));
    const reported = resolved
      .filter((x): x is NonNullable<typeof x> => !!x && x.entry.provenance !== 'ai')
      .map((h) => ({ ...h, cite: cite(h.fileId, h.entry) }));
    const interpretation = spec.interpretation
      .map((p) => {
        const hits = p.refs.map((r) => resolve(r, files)).filter((x): x is NonNullable<typeof x> => !!x);
        // Drop an interpretation once most of what it was based on is gone.
        if (hits.length * 2 < p.refs.length || hits.length === 0) return null;
        return { text: p.text, cites: hits.map((h) => cite(h.fileId, h.entry)) };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    if (interpretation.length) {
      return {
        dimensions: spec.dimensions.map((d) => DIM_LABEL[d]),
        mainFiles: spec.dimensions.map((d) => `${d}/main`),
        topicFiles: spec.topicFiles,
        reported,
        interpretation,
        citations,
        predefined: true,
        missingSources: resolved.filter((x) => !x).length,
      };
    }
  }

  // Generic retrieval: relevant main files, then topic files, quoting user-reported lines.
  const dims = spec?.dimensions ?? detectDimensions(question);
  const mainFiles = dims.map((d) => `${d}/main`);
  const topicFiles = Object.keys(files).filter(
    (id) => dims.some((d) => id.startsWith(`${d}/`)) && !id.endsWith('/main') && files[id].current.entries.length,
  );
  const reported: AskResult['reported'] = [];
  for (const fileId of [...mainFiles, ...topicFiles]) {
    const lines = files[fileId].current.entries.filter((e) => e.kind !== 'h' && e.provenance !== 'ai').slice(0, 2);
    for (const e of lines) reported.push({ fileId, entry: e, cite: cite(fileId, e) });
    if (reported.length >= 6) break;
  }
  return {
    dimensions: dims.map((d) => DIM_LABEL[d]),
    mainFiles,
    topicFiles: topicFiles.slice(0, 4),
    reported,
    interpretation: [
      {
        text: reported.length
          ? `I retrieved ${reported.length} relevant line${reported.length > 1 ? 's' : ''} from ${dims.map((d) => DIM_LABEL[d]).join(', ')}. This prototype only has predefined interpretations for the example questions, so this answer just collects what your notes say rather than interpreting them.`
          : 'There are no notes in these areas yet. Answer some questions first, then ask again.',
        cites: reported.slice(0, 3).map((r) => r.cite),
      },
    ],
    citations,
    predefined: false,
    missingSources: 0,
  };
}
