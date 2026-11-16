import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  AnswerValue,
  Response,
  Entry,
  EntryKind,
  FileMode,
  Profile,
  Tab,
} from '../types';
import { NODE_BY_ID } from '../data/nodes';
import { PREDEFINED_SUMMARIES } from '../data/files';
import {
  emptyFiles,
  sampleFiles,
  SAMPLE_ONBOARDED_AT,
  SAMPLE_PROGRESS,
  SAMPLE_RESPONSES,
  SAMPLE_SEEN,
} from '../data/sampleProfile';
import { activeTags, availableIds } from '../logic/graph';
import { applyAnswer, commitVersion, nowIso, regenerate, summarize, summarizeBranch, uid } from '../logic/notes';
import { MODEL, nodesForFile, questionsForFile } from './model';
import { buildExport, type ExportFile, type PortableData } from '../logic/transfer';

/** Tabs of the right-hand dock. */
export type DockTab = 'details' | 'ask' | 'tensions' | 'revisit';
export type Dialog = { kind: 'reset' | 'erase'; fileId: string } | { kind: 'about' } | { kind: 'import' } | null;

export interface Toast {
  id: string;
  text: string;
  tone?: 'info' | 'unlock' | 'warn';
  action?: { label: string; run: () => void };
}

type Data = PortableData;

interface Ui {
  tabs: Tab[];
  activeTab: number;
  selectedNodeId: string | null;
  fileModes: Record<string, FileMode>;
  /** Version currently inspected in the history view, per file. */
  inspectVersion: Record<string, string | undefined>;
  highlight: { fileId: string; entryId: string; at: number } | null;
  selectedEntry: { fileId: string; entryId: string } | null;
  focusQuestion: { nodeId: string; questionId: string } | null;
  dock: DockTab;
  /** When set, the Tensions tab shows only tensions related to this node. */
  tensionFocus: string | null;
  dialog: Dialog;
  toasts: Toast[];
  graphResetCounter: number;
  /** Manual-edit versions created during this browser session, so edits coalesce into one version. */
  manualVersions: Record<string, string>;
}

interface Actions {
  chooseProfile: (p: Profile) => void;
  completeOnboarding: (name: string) => void;
  setUserName: (name: string) => void;
  exportData: () => ExportFile;
  importData: (data: PortableData) => void;
  /** Saves an answer and writes its note line at once. Returns the areas it opened and the files it changed. */
  setResponse: (qid: string, value: AnswerValue, confidence?: number) => { opened: string[]; files: string[] };
  setConfidence: (qid: string, confidence: number) => void;
  /** "Add a note": the user's own one-line words under the generated line. */
  setAnswerNote: (qid: string, note: string) => string[];
  /** "Still true" on a retake: keeps the value, refreshes the date. */
  confirmResponse: (qid: string) => string[];
  clearResponse: (qid: string) => string[];
  /** Marks a questionnaire run as finished (its Done screen). */
  finishQuestionnaire: (nodeId: string) => void;
  addEntry: (fileId: string, afterId: string | null, text: string, kind?: EntryKind) => string;
  updateEntry: (fileId: string, entryId: string, text: string, kind?: EntryKind) => void;
  deleteEntry: (fileId: string, entryId: string) => void;
  toggleLock: (fileId: string, entryId: string) => void;
  commitProposal: (fileId: string) => void;
  cancelProposal: (fileId: string) => void;
  proposeSummary: (fileId: string) => boolean;
  restoreVersion: (fileId: string, versionId: string) => void;
  resetTopic: (fileId: string, retainResponses: boolean) => void;
  eraseTopic: (fileId: string) => void;
  dismissTension: (id: string) => void;
  restoreTension: (id: string) => void;
  addTensionContext: (id: string, fileId: string, text: string) => void;
  deferRetake: (nodeId: string, days: number) => void;
  undeferRetake: (nodeId: string) => void;
  // UI
  selectNode: (id: string | null) => void;
  selectEntry: (fileId: string, entryId: string | null) => void;
  openTab: (tab: Tab) => void;
  closeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  openFile: (fileId: string, opts?: { entryId?: string; mode?: FileMode }) => void;
  openQuestionnaire: (nodeId: string, questionId?: string) => void;
  setFileMode: (fileId: string, mode: FileMode) => void;
  setInspectVersion: (fileId: string, versionId: string | undefined) => void;
  setDock: (tab: DockTab, tensionFocus?: string | null) => void;
  setDialog: (d: Dialog) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  resetGraphView: () => void;
}

export type Store = Data & Ui & Actions;

function freshData(): Data {
  return {
    profile: 'fresh',
    // Explicit undefined so switching from the sample profile clears these.
    userName: undefined,
    onboardedAt: undefined,
    responses: {},
    progress: {},
    files: emptyFiles(),
    seen: [],
    dismissedTensions: [],
    tensionContext: {},
    deferred: {},
  };
}

function sampleData(): Data {
  return {
    profile: 'sample',
    userName: 'Priya',
    onboardedAt: SAMPLE_ONBOARDED_AT,
    responses: structuredClone(SAMPLE_RESPONSES),
    progress: structuredClone(SAMPLE_PROGRESS),
    files: sampleFiles(),
    seen: [...SAMPLE_SEEN],
    dismissedTensions: [],
    tensionContext: {},
    deferred: {},
  };
}

const initialUi = (): Omit<Ui, 'toasts' | 'manualVersions'> => ({
  tabs: [{ kind: 'graph' }],
  activeTab: 0,
  selectedNodeId: null,
  fileModes: {},
  inspectVersion: {},
  highlight: null,
  selectedEntry: null,
  focusQuestion: null,
  dock: 'details',
  tensionFocus: null,
  dialog: null,
  graphResetCounter: 0,
});

/**
 * A changed (or reconfirmed) answer keeps the previous one in its history, but only once per
 * questionnaire run: answers given since the last completion are just being edited.
 */
function historyWith(prev: Response, lastCompleted: string | undefined): Response['history'] {
  const history = [...(prev.history ?? [])];
  if (lastCompleted && prev.answeredAt <= lastCompleted) {
    history.push({ value: prev.value, confidence: prev.confidence, answeredAt: prev.answeredAt });
  }
  return history.length ? history.slice(-5) : undefined;
}

/** Forget completion dates for nodes that no longer have any answers. */
function clearEmptyProgress(s: Data, nodeIds: string[]) {
  for (const id of nodeIds) {
    if (!MODEL.questionsByNode[id].some((q) => s.responses[q.id])) delete s.progress[id];
  }
}

function sameTab(a: Tab, b: Tab): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'file' && b.kind === 'file') return a.fileId === b.fileId;
  if (a.kind === 'questionnaire' && b.kind === 'questionnaire') return a.nodeId === b.nodeId;
  return true;
}

function available(d: Pick<Data, 'responses' | 'onboardedAt'>) {
  return availableIds(MODEL, activeTags(MODEL, d.responses, !!d.onboardedAt));
}

export const useStore = create<Store>()(
  persist(
    immer((set, get) => {
      /**
       * Answers and manual edits coalesce into one new version per file per browser session:
       * the first change copies the current version into history, later ones edit the copy.
       */
      const editableCurrent = (s: Store, fileId: string, reason = 'Manual edit') => {
        const file = s.files[fileId];
        if (s.manualVersions[fileId] !== file.current.versionId) {
          const next = {
            versionId: uid('v'),
            createdAt: nowIso(),
            reason,
            entries: file.current.entries.map((e) => ({ ...e })),
          };
          s.files[fileId] = commitVersion(file, next);
          s.files[fileId].proposal = file.proposal; // a pending proposal survives a manual edit
          s.manualVersions[fileId] = next.versionId;
        } else if (file.current.reason !== reason) {
          const both = [file.current.reason, reason];
          file.current.reason = both.every((r) => r.startsWith('Answers')) ? 'Answers' : 'Answers and edits';
        }
        return s.files[fileId].current;
      };

      /** Writes the current answer to `qid` into each file it names. Returns the files that changed. */
      const applyToFiles = (s: Store, qid: string): string[] => {
        const q = MODEL.questions.find((x) => x.id === qid)!;
        const runStart = s.progress[q.nodeId]?.completedAt;
        const now = nowIso();
        const changed: string[] = [];
        for (const fileId of q.fileIds) {
          const entries = s.files[fileId].current.entries.map((e) => ({ ...e }));
          const r = applyAnswer(entries, q, s.responses[qid], now, runStart);
          if (!r.changed) continue;
          const cur = editableCurrent(s, fileId, `Answers in ${NODE_BY_ID[q.nodeId].name}`);
          cur.entries = entries;
          changed.push(fileId);
          if (s.files[fileId].proposal) {
            // A draft made from the old lines would undo this answer if accepted.
            s.files[fileId].proposal = undefined;
            pushToast(s, { text: `The draft for ${fileId} was dropped because your answer changed the note.` });
          }
          if (r.protectedIds.length) {
            pushToast(s, { text: `Kept your locked line in ${s.files[fileId].title}. The new answer is on the line after it.` });
          }
        }
        return changed;
      };

      const pushToast = (s: Store, t: Omit<Toast, 'id'>) => {
        s.toasts.push({ ...t, id: uid('t') });
        if (s.toasts.length > 3) s.toasts.shift();
      };

      return {
        profile: null,
        responses: {},
        progress: {},
        files: emptyFiles(),
        seen: [],
        dismissedTensions: [],
        tensionContext: {},
        deferred: {},
        ...initialUi(),
        toasts: [],
        manualVersions: {},

        chooseProfile: (p) =>
          set((s) => {
            Object.assign(s, p === 'sample' ? sampleData() : freshData(), initialUi());
            s.manualVersions = {};
            s.toasts = [];
            s.selectedNodeId = p === 'fresh' ? 'root' : null;
          }),

        completeOnboarding: (name) =>
          set((s) => {
            s.userName = name.trim().slice(0, 60);
            s.onboardedAt = nowIso();
            if (!s.seen.includes('root')) s.seen.push('root');
            s.tabs = s.tabs.filter((t) => t.kind !== 'onboarding');
            s.activeTab = 0;
            s.selectedNodeId = 'root';
            pushToast(s, { text: `Welcome, ${s.userName}. Five areas are now open. Personal Priorities is a good place to start.`, tone: 'unlock' });
          }),

        setUserName: (name) =>
          set((s) => {
            if (name.trim()) s.userName = name.trim().slice(0, 60);
          }),

        exportData: () => {
          const s = get();
          return buildExport({
            profile: s.profile,
            userName: s.userName,
            onboardedAt: s.onboardedAt,
            responses: s.responses,
            progress: s.progress,
            files: s.files,
            seen: s.seen,
            dismissedTensions: s.dismissedTensions,
            tensionContext: s.tensionContext,
            deferred: s.deferred,
          });
        },

        importData: (data) =>
          set((s) => {
            Object.assign(s, structuredClone(data), initialUi());
            s.manualVersions = {};
            s.toasts = [];
            pushToast(s, { text: `Imported data${data.userName ? ` for ${data.userName}` : ''}. The previous browser data was replaced.` });
          }),

        setResponse: (qid, value, confidence) => {
          const before = available(get());
          let files: string[] = [];
          set((s) => {
            const prev = s.responses[qid];
            const q = MODEL.questions.find((x) => x.id === qid)!;
            const lastCompleted = s.progress[q.nodeId]?.completedAt;
            const changed = !prev || JSON.stringify(prev.value) !== JSON.stringify(value);
            const newRun = !!prev && !!lastCompleted && prev.answeredAt <= lastCompleted;
            s.responses[qid] = {
              value,
              confidence: confidence ?? prev?.confidence,
              answeredAt: nowIso(),
              // A check-in note belongs to that month; other notes stay with the question.
              note: q.log && newRun ? undefined : prev?.note,
              history: prev && changed ? historyWith(prev, lastCompleted) : prev?.history,
            };
            files = applyToFiles(s, qid);
            s.progress[q.nodeId] ??= { submissions: [] };
            s.progress[q.nodeId].startedAt ??= nowIso();
          });
          const after = available(get());
          return { opened: [...after].filter((id) => !before.has(id)), files };
        },

        setAnswerNote: (qid, note) => {
          let files: string[] = [];
          set((s) => {
            const r = s.responses[qid];
            if (!r) return;
            const t = note.trim().slice(0, 300);
            if ((r.note ?? '') === t) return;
            if (t) r.note = t;
            else delete r.note;
            files = applyToFiles(s, qid);
          });
          return files;
        },

        confirmResponse: (qid) => {
          let files: string[] = [];
          set((s) => {
            const prev = s.responses[qid];
            if (!prev) return;
            const nodeId = MODEL.questions.find((q) => q.id === qid)!.nodeId;
            prev.history = historyWith(prev, s.progress[nodeId]?.completedAt);
            prev.answeredAt = nowIso();
            // A check-in answer that is still true is logged again with this month's date.
            files = applyToFiles(s, qid);
          });
          return files;
        },

        setConfidence: (qid, confidence) =>
          set((s) => {
            if (s.responses[qid]) s.responses[qid].confidence = confidence;
          }),

        clearResponse: (qid) => {
          let files: string[] = [];
          set((s) => {
            if (!s.responses[qid]) return;
            delete s.responses[qid];
            files = applyToFiles(s, qid); // removes the line if it is unlocked and unedited
          });
          return files;
        },

        finishQuestionnaire: (nodeId) =>
          set((s) => {
            const now = nowIso();
            s.progress[nodeId] ??= { submissions: [] };
            s.progress[nodeId].startedAt ??= now;
            s.progress[nodeId].completedAt = now;
            s.progress[nodeId].submissions.push(now);
          }),

        addEntry: (fileId, afterId, text, kind = 'li') => {
          const id = uid('e');
          set((s) => {
            const cur = editableCurrent(s, fileId);
            const now = nowIso();
            const entry: Entry = { id, kind, text, createdAt: now, updatedAt: now, provenance: 'human', locked: false };
            const idx = afterId ? cur.entries.findIndex((e) => e.id === afterId) : -1;
            if (idx >= 0) cur.entries.splice(idx + 1, 0, entry);
            else cur.entries.push(entry);
          });
          return id;
        },

        updateEntry: (fileId, entryId, text, kind) =>
          set((s) => {
            const old = s.files[fileId].current.entries.find((e) => e.id === entryId);
            if (!old || old.locked) return;
            if (old.text === text && (!kind || kind === old.kind)) return;
            const cur = editableCurrent(s, fileId);
            const e = cur.entries.find((x) => x.id === entryId)!;
            e.text = text;
            if (kind) e.kind = kind;
            e.updatedAt = nowIso();
            e.provenance = 'human'; // any user edit makes the line human-written
          }),

        deleteEntry: (fileId, entryId) =>
          set((s) => {
            const old = s.files[fileId].current.entries.find((e) => e.id === entryId);
            if (!old || old.locked) return;
            const cur = editableCurrent(s, fileId);
            cur.entries = cur.entries.filter((e) => e.id !== entryId);
          }),

        toggleLock: (fileId, entryId) =>
          set((s) => {
            // Lock state is line metadata; it does not create a new file version.
            const e = s.files[fileId].current.entries.find((x) => x.id === entryId);
            if (e) e.locked = !e.locked;
          }),

        commitProposal: (fileId) =>
          set((s) => {
            const file = s.files[fileId];
            if (!file.proposal) return;
            const { kind, protectedIds: _p, clearsAnswers, ...version } = file.proposal;
            if (clearsAnswers?.length) {
              clearsAnswers.forEach((qid) => delete s.responses[qid]);
              clearEmptyProgress(s, nodesForFile(fileId));
            }
            s.files[fileId] = commitVersion(file, version);
            delete s.manualVersions[fileId];
            pushToast(s, { text: kind === 'reset' ? `Reset ${fileId}. The previous version is still in history.` : `Saved a new version of ${fileId}.` });
          }),

        cancelProposal: (fileId) =>
          set((s) => {
            s.files[fileId].proposal = undefined;
          }),

        proposeSummary: (fileId) => {
          const files = get().files;
          const file = files[fileId];
          let proposal;
          if (file.name === 'main') {
            const topics = Object.values(files).filter((f) => f.dir === file.dir && f.name !== 'main');
            proposal = summarizeBranch(file, topics);
          } else {
            const predefined = PREDEFINED_SUMMARIES[fileId];
            proposal = summarize(file, predefined?.forVersion === file.current.versionId ? predefined.lines : undefined);
          }
          if (!proposal) return false;
          set((s) => {
            s.files[fileId].proposal = proposal;
            s.fileModes[fileId] = 'notes';
          });
          return true;
        },

        restoreVersion: (fileId, versionId) =>
          set((s) => {
            const file = s.files[fileId];
            const old = file.history.find((v) => v.versionId === versionId);
            if (!old) return;
            s.files[fileId] = commitVersion(file, {
              versionId: uid('v'),
              createdAt: nowIso(),
              reason: `Restored version from ${new Date(old.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
              entries: old.entries.map((e) => ({ ...e })),
            });
            s.files[fileId].proposal = file.proposal;
            delete s.manualVersions[fileId];
            s.inspectVersion[fileId] = undefined;
            s.fileModes[fileId] = 'notes';
          }),

        resetTopic: (fileId, retainResponses) =>
          set((s) => {
            // A preview: nothing changes (and no answer is deleted) until the reset is accepted.
            const file = s.files[fileId];
            const now = nowIso();
            const kept = file.current.entries.filter((e) => e.locked || e.provenance === 'human');
            const qs = questionsForFile(fileId);
            let entries = kept;
            let reason = 'Topic reset';
            if (retainResponses) {
              const regen = regenerate({ ...file, current: { ...file.current, entries: kept.map((e) => ({ ...e })) } }, qs, s.responses, now);
              if (regen) entries = regen.entries;
              reason = 'Topic reset (rewritten from your answers)';
            }
            s.files[fileId].proposal = {
              versionId: uid('v'),
              createdAt: now,
              reason,
              entries,
              kind: 'reset',
              protectedIds: kept.map((e) => e.id),
              clearsAnswers: retainResponses ? undefined : qs.filter((q) => s.responses[q.id]).map((q) => q.id),
            };
            s.fileModes[fileId] = 'notes';
            s.dialog = null;
          }),

        eraseTopic: (fileId) =>
          set((s) => {
            const file = s.files[fileId];
            questionsForFile(fileId).forEach((q) => delete s.responses[q.id]);
            clearEmptyProgress(s, nodesForFile(fileId));
            s.files[fileId] = {
              ...file,
              history: [],
              proposal: undefined,
              current: { versionId: uid('v'), createdAt: nowIso(), reason: 'Topic data erased', entries: [] },
            };
            delete s.manualVersions[fileId];
            for (const [tid, ctx] of Object.entries(s.tensionContext)) if (ctx.fileId === fileId) delete s.tensionContext[tid];
            s.dialog = null;
            pushToast(s, { text: `Erased ${fileId}: notes, history and linked responses removed.`, tone: 'warn' });
          }),

        dismissTension: (id) =>
          set((s) => {
            if (!s.dismissedTensions.includes(id)) s.dismissedTensions.push(id);
          }),
        restoreTension: (id) =>
          set((s) => {
            s.dismissedTensions = s.dismissedTensions.filter((x) => x !== id);
          }),
        addTensionContext: (id, fileId, text) => {
          const entryId = get().addEntry(fileId, null, `Context: ${text}`, 'li');
          set((s) => {
            s.tensionContext[id] = { fileId, entryId };
            pushToast(s, { text: `Context added to ${fileId} as a human-written note.` });
          });
        },

        deferRetake: (nodeId, days) =>
          set((s) => {
            s.deferred[nodeId] = new Date(Date.now() + days * 86400000).toISOString();
          }),
        undeferRetake: (nodeId) =>
          set((s) => {
            delete s.deferred[nodeId];
          }),

        // ── UI ────────────────────────────────────────────────
        selectNode: (id) =>
          set((s) => {
            s.selectedNodeId = id;
            if (id) s.dock = 'details';
            if (id && !s.seen.includes(id)) s.seen.push(id);
          }),

        selectEntry: (fileId, entryId) =>
          set((s) => {
            s.selectedEntry = entryId ? { fileId, entryId } : null;
          }),

        openTab: (tab) =>
          set((s) => {
            const i = s.tabs.findIndex((t) => sameTab(t, tab));
            if (i >= 0) s.activeTab = i;
            else {
              s.tabs.push(tab);
              s.activeTab = s.tabs.length - 1;
            }
          }),

        closeTab: (index) =>
          set((s) => {
            if (index === 0) return; // the graph tab is permanent
            s.tabs.splice(index, 1);
            if (s.activeTab >= index) s.activeTab = Math.max(0, s.activeTab - 1);
          }),

        setActiveTab: (index) => set((s) => void (s.activeTab = index)),

        openFile: (fileId, opts) => {
          get().openTab({ kind: 'file', fileId });
          set((s) => {
            if (opts?.mode) s.fileModes[fileId] = opts.mode;
            else if (opts?.entryId) s.fileModes[fileId] = 'notes';
            s.highlight = opts?.entryId ? { fileId, entryId: opts.entryId, at: Date.now() } : null;
            if (opts?.entryId) s.selectedEntry = { fileId, entryId: opts.entryId };
          });
        },

        openQuestionnaire: (nodeId, questionId) => {
          if (nodeId === 'root') {
            get().openTab({ kind: 'onboarding' });
            return;
          }
          get().openTab({ kind: 'questionnaire', nodeId });
          set((s) => {
            if (!s.seen.includes(nodeId)) s.seen.push(nodeId);
            s.selectedNodeId = nodeId;
            s.focusQuestion = questionId ? { nodeId, questionId } : null;
          });
        },

        setFileMode: (fileId, mode) => set((s) => void (s.fileModes[fileId] = mode)),
        setInspectVersion: (fileId, versionId) => set((s) => void (s.inspectVersion[fileId] = versionId)),
        setDock: (tab, tensionFocus = null) =>
          set((s) => {
            s.dock = tab;
            s.tensionFocus = tensionFocus;
          }),
        setDialog: (d) => set((s) => void (s.dialog = d)),
        toast: (t) => set((s) => pushToast(s, t)),
        dismissToast: (id) =>
          set((s) => {
            s.toasts = s.toasts.filter((t) => t.id !== id);
          }),
        resetGraphView: () => set((s) => void (s.graphResetCounter += 1)),
      };
    }),
    {
      name: 'pom-prototype-v1',
      // v5 is the five-branch question set (PLAN_V2). Older saved data can't be mapped onto it
      // and is discarded on load.
      version: 5,
      migrate: (old, version) => {
        if (version < 5) return {} as Partial<Store>;
        const o = old as Partial<Store>;
        return {
          profile: o.profile,
          userName: o.userName,
          onboardedAt: o.onboardedAt,
          responses: o.responses,
          progress: o.progress,
          files: o.files,
          seen: o.seen ?? [],
          dismissedTensions: o.dismissedTensions ?? [],
          tensionContext: o.tensionContext ?? {},
          deferred: o.deferred ?? {},
        } as Partial<Store>;
      },
      partialize: (s) => ({
        profile: s.profile,
        userName: s.userName,
        onboardedAt: s.onboardedAt,
        responses: s.responses,
        progress: s.progress,
        files: s.files,
        seen: s.seen,
        dismissedTensions: s.dismissedTensions,
        tensionContext: s.tensionContext,
        deferred: s.deferred,
        tabs: s.tabs,
        activeTab: s.activeTab,
        selectedNodeId: s.selectedNodeId,
        fileModes: s.fileModes,
      }),
    },
  ),
);
