import type { NodeProgress, NoteFile, Profile, Response } from '../types';
import { FILE_DEFS } from '../data/files';
import { QUESTION_BY_ID } from '../data/questions';

export const EXPORT_FORMAT = 'personal-operating-model';
export const EXPORT_VERSION = 1;

/** Everything that belongs to the user. UI state (tabs, panels) is not exported. */
export interface PortableData {
  profile: Profile | null;
  userName?: string;
  onboardedAt?: string;
  responses: Record<string, Response>;
  progress: Record<string, NodeProgress>;
  files: Record<string, NoteFile>;
  seen: string[];
  dismissedTensions: string[];
  tensionContext: Record<string, { fileId: string; entryId: string }>;
  deferred: Record<string, string>;
}

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  data: PortableData;
}

export function buildExport(data: PortableData, now = new Date().toISOString()): ExportFile {
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now, data: structuredClone(data) };
}

export interface ImportSummary {
  exportedAt: string;
  userName?: string;
  answers: number;
  lines: number;
  versions: number;
}

export type ParseResult =
  | { ok: true; data: PortableData; summary: ImportSummary }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

function validVersion(v: unknown): boolean {
  return (
    isObj(v) &&
    typeof v.versionId === 'string' &&
    typeof v.createdAt === 'string' &&
    Array.isArray(v.entries) &&
    v.entries.every(
      (e) =>
        isObj(e) &&
        typeof e.id === 'string' &&
        typeof e.text === 'string' &&
        ['h', 'p', 'li', 'quote'].includes(e.kind as string) &&
        ['human', 'auto', 'ai'].includes(e.provenance as string) &&
        typeof e.locked === 'boolean',
    )
  );
}

/** Validates an export before anything in the app is replaced. */
export function parseExport(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  if (!isObj(raw) || raw.format !== EXPORT_FORMAT) {
    return { ok: false, error: 'This is not a Personal Operating Model export.' };
  }
  if (typeof raw.version !== 'number' || raw.version > EXPORT_VERSION) {
    return { ok: false, error: `Unsupported export version (${String(raw.version)}). This app reads version ${EXPORT_VERSION}.` };
  }
  const d = raw.data;
  if (!isObj(d)) return { ok: false, error: 'The export has no data section.' };
  if (!isObj(d.responses) || !isObj(d.progress) || !isObj(d.files)) {
    return { ok: false, error: 'The export is missing answers, progress or notes.' };
  }
  for (const [qid, r] of Object.entries(d.responses)) {
    if (!QUESTION_BY_ID[qid]) return { ok: false, error: `Unknown question ID “${qid}”.` };
    if (!isObj(r) || !('value' in r) || typeof r.answeredAt !== 'string') {
      return { ok: false, error: `Answer ${qid} is malformed.` };
    }
  }
  for (const def of FILE_DEFS) {
    const f = d.files[def.id];
    if (!isObj(f) || !validVersion(f.current) || !Array.isArray(f.history) || !f.history.every(validVersion)) {
      return { ok: false, error: `Notes file “${def.id}” is missing or malformed.` };
    }
  }
  if (!isStrArray(d.seen ?? []) || !isStrArray(d.dismissedTensions ?? [])) {
    return { ok: false, error: 'The export has malformed lists.' };
  }

  const files = Object.fromEntries(
    FILE_DEFS.map((def) => {
      const f = (d.files as Record<string, NoteFile>)[def.id];
      // Keep at most 5 prior versions, matching the app's versioning rule.
      return [def.id, { ...def, current: f.current, history: f.history.slice(-5), proposal: f.proposal }];
    }),
  );
  const data: PortableData = {
    profile: d.profile === 'sample' ? 'sample' : 'fresh',
    userName: typeof d.userName === 'string' ? d.userName.slice(0, 60) : undefined,
    onboardedAt: typeof d.onboardedAt === 'string' ? d.onboardedAt : undefined,
    responses: d.responses as Record<string, Response>,
    progress: d.progress as Record<string, NodeProgress>,
    files,
    seen: (d.seen as string[] | undefined) ?? [],
    dismissedTensions: (d.dismissedTensions as string[] | undefined) ?? [],
    tensionContext: isObj(d.tensionContext) ? (d.tensionContext as PortableData['tensionContext']) : {},
    deferred: isObj(d.deferred) ? (d.deferred as Record<string, string>) : {},
  };
  return {
    ok: true,
    data,
    summary: {
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      userName: data.userName,
      answers: Object.keys(data.responses).length,
      lines: Object.values(files).reduce((s, f) => s + f.current.entries.length, 0),
      versions: Object.values(files).reduce((s, f) => s + f.history.length, 0),
    },
  };
}
