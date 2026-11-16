import type { Dir, Entry, NoteFile, Response } from '../types';
import { ASK_SPECS, LOW_CONFIDENCE_QUESTION, type Ref } from '../data/ask';
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

export const DIM_LABEL: Record<Dir, string> = {
  worldview: 'Worldview & Beliefs',
  moral: 'Moral Principles',
  priorities: 'Personal Priorities',
  identity: 'Identity & Self-concept',
  goals: 'Goals & Aspirations',
  'check-ins': 'Check-ins',
};

const BRANCH_DIRS: Dir[] = ['worldview', 'moral', 'priorities', 'identity', 'goals'];

/** The file that heads a folder: `main`, or the log for check-ins. */
export const headFile = (d: Dir) => (d === 'check-ins' ? 'check-ins/log' : `${d}/main`);

function resolve(ref: Ref, files: Record<string, NoteFile>): { fileId: string; entry: Entry } | null {
  if ('entryId' in ref) {
    const entry = files[ref.fileId]?.current.entries.find((e) => e.id === ref.entryId);
    return entry ? { fileId: ref.fileId, entry } : null;
  }
  // Prefer the line generated from the answer (the latest one, for check-ins);
  // fall back to an AI line citing the same item.
  let best: { fileId: string; entry: Entry } | null = null;
  let fallback: { fileId: string; entry: Entry } | null = null;
  for (const f of Object.values(files)) {
    for (const e of f.current.entries) {
      if (e.sourceItemId !== ref.qid || e.answerNote) continue;
      if (e.provenance !== 'ai') {
        if (!best || e.createdAt > best.entry.createdAt) best = { fileId: f.id, entry: e };
      } else fallback ??= { fileId: f.id, entry: e };
    }
  }
  return best ?? fallback;
}

export function detectDimensions(q: string): Dir[] {
  const dims: Dir[] = [];
  if (/believ|worldview|world|trust|luck|truth|control|faith|relig|people are/i.test(q)) dims.push('worldview');
  if (/ethic|moral|right|wrong|owe|duty|honest|loyal|fair|promise|parent|family/i.test(q)) dims.push('moral');
  if (/priorit|matter|value|trade|money|clash|attention|time/i.test(q)) dims.push('priorities');
  if (/who am i|myself|identity|strength|role|tend|self|person i want/i.test(q)) dims.push('identity');
  if (/goal|career|future|plan|work|stud|job|offer|home|live|relationship|partner|ambition/i.test(q)) dims.push('goals');
  if (/check.?in|month|lately|recent/i.test(q)) dims.push('check-ins');
  return dims.length ? dims : BRANCH_DIRS;
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
    const dims = [...new Set(hits.map((h) => h.fileId.split('/')[0] as Dir))];
    return {
      dimensions: dims.map((d) => DIM_LABEL[d]),
      mainFiles: dims.map(headFile),
      topicFiles: [...new Set(hits.map((h) => h.fileId))].filter((f) => !f.endsWith('/main')),
      reported,
      interpretation: [
        {
          text: hits.length
            ? `${hits.length} note${hits.length > 1 ? 's come' : ' comes'} from answers you marked as unsure. You might want to retake ${nodes.map((n) => MODEL.nodes.find((x) => x.id === n)!.name).join(' and ')}.`
            : 'None of your current notes come from answers you marked as unsure.',
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
        // A reading disappears as soon as any note it cites is gone.
        if (hits.length < p.refs.length) return null;
        return { text: p.text, cites: hits.map((h) => cite(h.fileId, h.entry)) };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    if (interpretation.length) {
      return {
        dimensions: spec.dimensions.map((d) => DIM_LABEL[d]),
        mainFiles: spec.dimensions.map(headFile),
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
  const mainFiles = dims.map(headFile);
  const topicFiles = Object.keys(files).filter(
    (id) => dims.some((d) => id.startsWith(`${d}/`)) && !mainFiles.includes(id) && files[id].current.entries.length,
  );
  const reported: AskResult['reported'] = [];
  for (const fileId of [...mainFiles, ...topicFiles]) {
    const lines = files[fileId].current.entries.filter((e) => e.kind !== 'h' && e.provenance !== 'ai').slice(-2);
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
          ? `These are the most relevant lines from ${dims.map((d) => DIM_LABEL[d]).join(', ')}. AI is off, so this only quotes your notes. Turn on AI under “Your data” to ask for a reading.`
          : 'There are no notes in these areas yet. Answer some questions first, then ask again.',
        cites: reported.slice(0, 3).map((r) => r.cite),
      },
    ],
    citations,
    predefined: false,
    missingSources: 0,
  };
}
