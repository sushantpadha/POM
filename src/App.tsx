import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from './store/store';
import { Welcome } from './components/onboarding/Welcome';
import { Onboarding } from './components/onboarding/Onboarding';
import { Journal } from './components/journal/Journal';
import { NoteView } from './components/note/NoteView';
import { Reflection } from './components/reflect/Reflection';
import { Pause } from './components/reflect/Pause';
import { MapView } from './components/map/MapView';
import { Revisit } from './components/revisit/Revisit';
import { Ask } from './components/ask/Ask';
import { DataPage } from './components/data/DataPage';
import { EraseDialog, ResetDialog } from './components/dialogs/TopicDialogs';
import { ImportDialog } from './components/dialogs/ImportDialog';

const PLACES = [
  ['journal', 'Journal'],
  ['map', 'Map'],
  ['revisit', 'Revisit'],
  ['ask', 'Ask'],
] as const;

export default function App() {
  const profile = useStore((s) => s.profile);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const view = useStore((s) => s.view);
  const dialog = useStore((s) => s.dialog);
  const userName = useStore((s) => s.userName);
  const go = useStore((s) => s.go);

  // Each place starts at the top.
  useEffect(() => window.scrollTo(0, 0), [view.name, 'fileId' in view ? view.fileId : '', 'nodeId' in view ? view.nodeId : '']);

  let content;
  if (profile === null) content = <Welcome />;
  else if (!onboardedAt) content = <Onboarding />;
  else {
    switch (view.name) {
      case 'journal':
        content = <Journal />;
        break;
      case 'note':
        content = <NoteView key={view.fileId} fileId={view.fileId} mode={view.mode} />;
        break;
      case 'reflect':
        content = <Reflection key={view.nodeId} nodeId={view.nodeId} />;
        break;
      case 'pause':
        content = <Pause nodeId={view.nodeId} count={view.count} />;
        break;
      case 'map':
        content = <MapView nodeId={view.nodeId} full={view.full} />;
        break;
      case 'revisit':
        content = <Revisit />;
        break;
      case 'ask':
        content = <Ask />;
        break;
      case 'data':
        content = <DataPage />;
        break;
    }
  }

  const place = view.name === 'note' || view.name === 'reflect' || view.name === 'pause' ? 'journal' : view.name;
  const ready = profile !== null && !!onboardedAt;

  return (
    <div className="app">
      {ready && (
        <nav className="nav" aria-label="Main">
          <span className="name">POM</span>
          {PLACES.map(([id, label]) => (
            <button key={id} className={place === id ? 'on' : ''} aria-current={place === id ? 'page' : undefined} onClick={() => go({ name: id })}>
              {label}
            </button>
          ))}
          <span className="spacer" />
          <button className={place === 'data' ? 'on' : ''} onClick={() => go({ name: 'data' })}>
            {userName ?? 'Your data'}
          </button>
        </nav>
      )}
      <main>{content}</main>
      {dialog?.kind === 'reset' && <ResetDialog fileId={dialog.fileId} />}
      {dialog?.kind === 'erase' && <EraseDialog fileId={dialog.fileId} />}
      {dialog?.kind === 'import' && <ImportDialog />}
      <Toast />
    </div>
  );
}

function Toast() {
  const toast = useStore((s) => s.toasts[0]);
  const dismiss = useStore((s) => s.dismissToast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(id);
  }, [toast, dismiss]);
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast.text}
      <button className="icon-btn" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
        <X size={13} />
      </button>
    </div>
  );
}
