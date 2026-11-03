import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AnswerValue, Entry, EntryKind, Profile, View } from '../types';
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
import { commitVersion, generateUpdate, nowIso, summarize, summarizeBranch, uid } from '../logic/notes';
import { MODEL, nodesForFile, questionsForFile } from './model';
import { buildExport, type ExportFile, type PortableData } from '../logic/transfer';

export type Dialog = { kind: 'reset' | 'erase'; fileId: string } | { kind: 'import' } | null;

export interface Toast {
  id: string;
  text: string;
  tone?: 'info' | 'unlock' | 'warn';
  action?: { label: string; run: () => void };
}

type Data = PortableData;

interface Ui {
  view: View;
  highlight: { fileId: string; entryId: string } | null;
  focusQuestion: { nodeId: string; questionId: string } | null;
  dialog: Dialog;
  toasts: Toast[];
  /** Manual-edit versions created during this browser session, so edits coalesce into one version. */
  manualVersions: Record<string, string>;
}

interface Actions {
  chooseProfile: (p: Profile) => void;
  completeOnboarding: (name: string, aiEnabled: boolean) => void;
  setAiEnabled: (on: boolean) => void;
  ackMilestone: (n: number) => void;
  acceptEntry: (fileId: string, entryId: string) => void;
  setUserName: (name: string) => void;
  exportData: () => ExportFile;
  importData: (data: PortableData) => void;
  setResponse: (qid: string, value: AnswerValue, confidence?: number) => string[];
  setConfidence: (qid: string, confidence: number) => void;
  clearResponse: (qid: string) => void;
  submitQuestionnaire: (nodeId: string) => { proposalFileIds: string[] };
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
  go: (view: View) => void;
  openFile: (fileId: string, opts?: { entryId?: string; mode?: 'read' | 'edit' | 'history' }) => void;
  openReflection: (nodeId: string, questionId?: string) => void;
  showTopic: (nodeId: string) => void;
  setDialog: (d: Dialog) => void;
  toast: (text: string) => void;
  dismissToast: (id: string) => void;
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
    aiEnabled: false,
    milestonesAck: [],
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
    aiEnabled: true,
    milestonesAck: [],
  };
}

const initialUi = (): Omit<Ui, 'toasts' | 'manualVersions'> => ({
  view: { name: 'journal' },
  highlight: null,
  focusQuestion: null,
  dialog: null,
});

/** Pause before the 10th, 20th, … topic: no celebration, just a chance to stop. */
export const MILESTONE_EVERY = 10;

/** Forget completion dates for nodes that no longer have any answers. */
function clearEmptyProgress(s: Data, nodeIds: string[]) {
  for (const id of nodeIds) {
    if (!MODEL.questionsByNode[id].some((q) => s.responses[q.id])) delete s.progress[id];
  }
}

function available(d: Pick<Data, 'responses' | 'onboardedAt'>) {
  return availableIds(MODEL, activeTags(MODEL, d.responses, !!d.onboardedAt));
}

export const useStore = create<Store>()(
  persist(
    immer((set, get) => {
      /** Manual edits coalesce into one new version per file per browser session. */
      const editableCurrent = (s: Store, fileId: string) => {
        const file = s.files[fileId];
        if (s.manualVersions[fileId] !== file.current.versionId) {
          const next = {
            versionId: uid('v'),
            createdAt: nowIso(),
            reason: 'Manual edit',
            entries: file.current.entries.map((e) => ({ ...e })),
          };
          s.files[fileId] = commitVersion(file, next);
          s.files[fileId].proposal = file.proposal; // a pending proposal survives a manual edit
          s.manualVersions[fileId] = next.versionId;
        }
        return s.files[fileId].current;
      };

      const pushToast = (s: Store, t: Omit<Toast, 'id'>) => {
        s.toasts = [{ ...t, id: uid('t') }]; // one message at a time
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
        aiEnabled: false,
        milestonesAck: [],
        ...initialUi(),
        toasts: [],
        manualVersions: {},

        chooseProfile: (p) =>
          set((s) => {
            Object.assign(s, p === 'sample' ? sampleData() : freshData(), initialUi());
            s.manualVersions = {};
            s.toasts = [];
          }),

        completeOnboarding: (name, aiEnabled) =>
          set((s) => {
            s.userName = name.trim().slice(0, 60);
            s.aiEnabled = aiEnabled;
            s.onboardedAt = nowIso();
            s.view = { name: 'journal' };
          }),

        setAiEnabled: (on) => set((s) => void (s.aiEnabled = on)),
        ackMilestone: (n) =>
          set((s) => {
            if (!s.milestonesAck.includes(n)) s.milestonesAck.push(n);
          }),
        acceptEntry: (fileId, entryId) =>
          set((s) => {
            // Keeping a summary line is metadata (like a lock): it stays labelled as AI text.
            const e = s.files[fileId].current.entries.find((x) => x.id === entryId);
            if (e) e.accepted = true;
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
            aiEnabled: s.aiEnabled,
            milestonesAck: s.milestonesAck,
          });
        },

        importData: (data) =>
          set((s) => {
            Object.assign(s, structuredClone(data), initialUi());
            s.manualVersions = {};
            s.toasts = [];
            pushToast(s, { text: 'Imported.' });
          }),

        setResponse: (qid, value, confidence) => {
          const before = available(get());
          set((s) => {
            const prev = s.responses[qid];
            const history = prev ? [...(prev.history ?? [])] : [];
            if (prev && JSON.stringify(prev.value) !== JSON.stringify(value)) {
              // Keep earlier answers from previous submissions only (not every keystroke).
              const nodeId = MODEL.questions.find((q) => q.id === qid)!.nodeId;
              const lastSubmit = s.progress[nodeId]?.completedAt;
              if (lastSubmit && prev.answeredAt <= lastSubmit) {
                history.push({ value: prev.value, confidence: prev.confidence, answeredAt: prev.answeredAt });
              }
            }
            s.responses[qid] = {
              value,
              confidence: confidence ?? prev?.confidence,
              answeredAt: nowIso(),
              history: history.length ? history.slice(-5) : undefined,
            };
            const nodeId = MODEL.questions.find((q) => q.id === qid)!.nodeId;
            s.progress[nodeId] ??= { submissions: [] };
            s.progress[nodeId].startedAt ??= nowIso();
          });
          const after = available(get());
          return [...after].filter((id) => !before.has(id));
        },

        setConfidence: (qid, confidence) =>
          set((s) => {
            if (s.responses[qid]) s.responses[qid].confidence = confidence;
          }),

        clearResponse: (qid) =>
          set((s) => {
            delete s.responses[qid];
          }),

        submitQuestionnaire: (nodeId) => {
          const proposalFileIds: string[] = [];
          set((s) => {
            const now = nowIso();
            s.progress[nodeId] ??= { submissions: [] };
            const p = s.progress[nodeId];
            p.completedAt = now;
            p.submissions.push(now);
            const node = NODE_BY_ID[nodeId];
            const qs = MODEL.questionsByNode[nodeId];
            // Each answer updates the file(s) its question names, so one submission can touch several files.
            const fileIds = [...new Set(qs.flatMap((q) => q.fileIds))];
            for (const fileId of fileIds) {
              const proposal = generateUpdate(
                s.files[fileId],
                qs.filter((q) => q.fileIds.includes(fileId)),
                s.responses,
                `Answers in ${node.name}${p.submissions.length > 1 ? ' (retake)' : ''}`,
                now,
              );
              if (proposal) {
                s.files[fileId].proposal = proposal;
                proposalFileIds.push(fileId);
              }
            }
          });
          return { proposalFileIds };
        },

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
            const { kind: _k, protectedIds: _p, ...version } = file.proposal;
            s.files[fileId] = commitVersion(file, version);
            delete s.manualVersions[fileId];
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
            s.view = { name: 'note', fileId };
          }),

        resetTopic: (fileId, retainResponses) =>
          set((s) => {
            const file = s.files[fileId];
            const now = nowIso();
            const kept = file.current.entries.filter((e) => e.locked || e.provenance === 'human');
            const qs = questionsForFile(fileId);
            if (!retainResponses) {
              qs.forEach((q) => delete s.responses[q.id]);
              clearEmptyProgress(s, nodesForFile(fileId));
            }
            let next = { versionId: uid('v'), createdAt: now, reason: 'Topic reset', entries: kept };
            if (retainResponses) {
              const regen = generateUpdate({ ...file, current: next }, qs, s.responses, 'Topic reset (regenerated from retained responses)', now);
              if (regen) next = { versionId: regen.versionId, createdAt: now, reason: regen.reason, entries: regen.entries };
            }
            s.files[fileId] = commitVersion(file, next);
            delete s.manualVersions[fileId];
            s.dialog = null;
            pushToast(s, { text: 'Topic reset. The previous version is in its history.' });
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
            pushToast(s, { text: 'Topic erased.' });
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
        go: (view) =>
          set((s) => {
            s.view = view;
            s.highlight = null;
          }),

        openFile: (fileId, opts) =>
          set((s) => {
            s.view = { name: 'note', fileId, mode: opts?.mode ?? 'read' };
            s.highlight = opts?.entryId ? { fileId, entryId: opts.entryId } : null;
          }),

        openReflection: (nodeId, questionId) =>
          set((s) => {
            s.focusQuestion = questionId ? { nodeId, questionId } : null;
            // Before starting the 10th, 20th… new topic, pause instead.
            const done = Object.entries(s.progress).filter(([id, p]) => id !== nodeId && p.completedAt).length;
            const n = done + 1;
            const isNew = !s.progress[nodeId]?.completedAt;
            if (isNew && n % MILESTONE_EVERY === 0 && !s.milestonesAck.includes(n)) {
              s.view = { name: 'pause', nodeId, count: done };
              return;
            }
            s.view = { name: 'reflect', nodeId };
          }),

        showTopic: (nodeId) => set((s) => void (s.view = { name: 'map', nodeId })),
        setDialog: (d) => set((s) => void (s.dialog = d)),
        toast: (text) => set((s) => pushToast(s, { text })),
        dismissToast: (id) =>
          set((s) => {
            s.toasts = s.toasts.filter((t) => t.id !== id);
          }),
      };
    }),
    {
      name: 'pom-prototype-v1',
      // v2 replaced the question set with the writeup's items; older saved state can't be mapped onto it.
      // v3 replaced tabs with a single view.
      version: 3,
      migrate: (old, version) => {
        if (version < 2) return {} as Partial<Store>;
        const o = old as Partial<Store>;
        return { ...o, view: { name: 'journal' }, aiEnabled: o.aiEnabled ?? true, milestonesAck: o.milestonesAck ?? [] } as Partial<Store>;
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
        aiEnabled: s.aiEnabled,
        milestonesAck: s.milestonesAck,
        view: s.view,
      }),
    },
  ),
);
