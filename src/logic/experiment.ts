// Experiment mode (PLAN_V2 section 6): an opt-in, append-only event log kept in this browser
// under its own localStorage key, separate from the profile. The tester exports it as a file;
// nothing is sent anywhere. The display name is never logged, and nothing is logged for the
// sample profile (the store decides that before calling log()).

export const EXPERIMENT_KEY = 'pom-experiment-log';
export const EVENT_CAP = 5000;
export const LOG_FORMAT = 'pom-experiment-log';

export interface ExperimentEvent {
  /** Order within this log. */
  n: number;
  t: string;
  /** Random participant id made when the mode was turned on. */
  pid: string;
  type: string;
  [key: string]: unknown;
}

export interface ExperimentLog {
  format: typeof LOG_FORMAT;
  participantId: string;
  enabled: boolean;
  startedAt: string;
  /** Set when the cap was reached; logging stops. */
  cappedAt?: string;
  events: ExperimentEvent[];
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

let storage: Store | null = (() => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
})();

/** For tests: use an in-memory storage. */
export function setStorage(s: Store | null) {
  storage = s;
  cache = undefined;
}

let cache: ExperimentLog | null | undefined;

export function readLog(): ExperimentLog | null {
  if (cache !== undefined) return cache;
  try {
    const raw = storage?.getItem(EXPERIMENT_KEY);
    cache = raw ? (JSON.parse(raw) as ExperimentLog) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(log: ExperimentLog | null) {
  cache = log;
  try {
    if (log) storage?.setItem(EXPERIMENT_KEY, JSON.stringify(log));
    else storage?.removeItem(EXPERIMENT_KEY);
  } catch {
    /* storage full or blocked: the log simply stops growing */
  }
  listeners.forEach((l) => l());
}

const listeners = new Set<() => void>();
/** Re-render hook for the settings UI. */
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const isOn = () => !!readLog()?.enabled;

function randomId(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (bytes.every((b) => b === 0)) for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
  return 'p-' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Turns the mode on. Keeps an existing log (and its participant id) if there is one. */
export function enable(now = new Date().toISOString()): ExperimentLog {
  const old = readLog();
  const log: ExperimentLog = old
    ? { ...old, enabled: true }
    : { format: LOG_FORMAT, participantId: randomId(), enabled: true, startedAt: now, events: [] };
  write(log);
  return log;
}

/** Stops logging at once. `keep: false` deletes the log as well. */
export function disable(keep: boolean) {
  const log = readLog();
  if (!log) return;
  if (!keep) write(null);
  else write({ ...log, enabled: false });
}

export function deleteLog() {
  write(null);
}

/** Appends one event when the mode is on and the cap is not reached. Returns whether it was logged. */
export function log(type: string, data: Record<string, unknown> = {}, now = new Date().toISOString()): boolean {
  const cur = readLog();
  if (!cur?.enabled || cur.cappedAt) return false;
  if (cur.events.length >= EVENT_CAP) {
    write({ ...cur, cappedAt: now });
    return false;
  }
  const ev: ExperimentEvent = { ...data, n: cur.events.length + 1, t: now, pid: cur.participantId, type };
  write({ ...cur, events: [...cur.events, ev] });
  return true;
}

// ── Timing: milliseconds from "question shown" to "answered" ──

const shownAt = new Map<string, number>();
export function markShown(qid: string, at = Date.now()) {
  shownAt.set(qid, at);
}
export function msSinceShown(qid: string, at = Date.now()): number | undefined {
  const s = shownAt.get(qid);
  return s === undefined ? undefined : at - s;
}

/** The whole log as one JSON file's text. */
export function exportText(): string | null {
  const l = readLog();
  return l ? JSON.stringify({ ...l, exportedAt: new Date().toISOString() }, null, 2) : null;
}
