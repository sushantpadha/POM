import { useState } from 'react';
import { useStore } from '../../store/store';
import { DIRS, FILE_DEFS } from '../../data/files';
import { fmtDateTime } from '../../logic/format';
import { BRANCH_LABEL } from '../branding';
import { downloadExport } from '../shell/transfer';

/** Storage, AI, export, reset and erase in one simple page. */
export function DataPage() {
  const userName = useStore((s) => s.userName);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const aiEnabled = useStore((s) => s.aiEnabled);
  const files = useStore((s) => s.files);
  const profile = useStore((s) => s.profile);
  const setUserName = useStore((s) => s.setUserName);
  const setAiEnabled = useStore((s) => s.setAiEnabled);
  const setDialog = useStore((s) => s.setDialog);
  const chooseProfile = useStore((s) => s.chooseProfile);
  const [name, setName] = useState(userName ?? '');
  const [showTopics, setShowTopics] = useState(false);

  const switchTo = (p: 'fresh' | 'sample') => {
    if (window.confirm(`Replace everything in this browser with ${p === 'sample' ? 'the sample' : 'a fresh start'}?`)) chooseProfile(p);
  };
  const topics = FILE_DEFS.filter((f) => files[f.id].current.entries.length || files[f.id].history.length);

  return (
    <div className="page">
      <h1 className="page-title">Your data</h1>
      <p className="page-sub">Everything you write stays in this browser. There is no server and no account.</p>

      <section className="section">
        <h2>Name</h2>
        <div className="row">
          <input className="input" style={{ maxWidth: 280 }} value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
          <button className="btn" disabled={!name.trim() || name.trim() === userName} onClick={() => setUserName(name)}>
            Save
          </button>
        </div>
      </section>

      <section className="section">
        <h2>AI</h2>
        <p className="muted">
          When on, you can ask questions about your notes and draft summaries. In this prototype nothing is sent anywhere:
          the answers are pre-written or made by simple rules. AI text is always labelled and never replaces your words.
        </p>
        <label className="toggle">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
          <span>Show AI features</span>
        </label>
      </section>

      <section className="section">
        <h2>Export and import</h2>
        <p className="muted">One file with your notes, answers and history. It is not encrypted, so keep it private.</p>
        <div className="row">
          <button className="btn" onClick={downloadExport}>
            Export
          </button>
          <button className="btn" onClick={() => setDialog({ kind: 'import' })}>
            Import…
          </button>
        </div>
      </section>

      <section className="section">
        <h2>Reset or erase a topic</h2>
        <p className="muted">
          Reset clears the lines made from your answers and keeps your own. Erase removes a topic’s notes, answers and history.
        </p>
        {topics.length === 0 && <p className="faint small" style={{ marginTop: 10 }}>No notes yet.</p>}
        {topics.length > 0 && !showTopics && (
          <button className="link small" style={{ marginTop: 10 }} onClick={() => setShowTopics(true)}>
            Choose a topic
          </button>
        )}
        <div style={{ marginTop: 10, display: showTopics ? 'block' : 'none' }}>
          {topics.map((f) => (
            <div key={f.id} className="topic-line">
              <span className="t">
                {f.name === 'main' ? `${BRANCH_LABEL[DIRS.find((d) => d.id === f.dir)!.branch]} overview` : files[f.id].title}
              </span>
              <button className="link small" onClick={() => setDialog({ kind: 'reset', fileId: f.id })}>
                Reset
              </button>
              <button className="link small" style={{ color: 'var(--danger)' }} onClick={() => setDialog({ kind: 'erase', fileId: f.id })}>
                Erase
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Consent</h2>
        <p className="muted">
          {onboardedAt ? `You agreed on ${fmtDateTime(onboardedAt)}` : 'Not given yet'} to storing your answers and notes in
          this browser. Nothing here is a test, score or diagnosis.
        </p>
      </section>

      <section className="section">
        <h2>Demo</h2>
        <p className="muted">{profile === 'sample' ? 'You are looking at the sample (Priya).' : 'You are using your own data.'}</p>
        <div className="row">
          <button className="btn small" onClick={() => switchTo('sample')}>
            Load the sample
          </button>
          <button className="btn small" onClick={() => switchTo('fresh')}>
            Start fresh
          </button>
        </div>
      </section>
    </div>
  );
}
