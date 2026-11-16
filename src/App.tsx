import { useStore } from './store/store';
import { TopBar } from './components/shell/TopBar';
import { TabBar } from './components/shell/TabBar';
import { AboutDialog, DemoChooser, Toasts } from './components/shell/Overlays';
import { Sidebar } from './components/sidebar/Sidebar';
import { GraphView } from './components/graph/GraphView';
import { Onboarding } from './components/onboarding/Onboarding';
import { Questionnaire } from './components/questionnaire/Questionnaire';
import { FileEditor } from './components/notes/FileEditor';
import { Dock } from './components/dock/Dock';
import { EraseDialog, ResetDialog } from './components/dialogs/TopicDialogs';
import { ImportDialog } from './components/dialogs/ImportDialog';

export default function App() {
  const profile = useStore((s) => s.profile);
  const tabs = useStore((s) => s.tabs);
  const activeTab = useStore((s) => s.activeTab);
  const dialog = useStore((s) => s.dialog);
  const tab = tabs[activeTab] ?? tabs[0];

  let content;
  switch (tab.kind) {
    case 'graph':
      content = <GraphView />;
      break;
    case 'onboarding':
      content = <Onboarding />;
      break;
    case 'questionnaire':
      content = <Questionnaire key={tab.nodeId} nodeId={tab.nodeId} />;
      break;
    case 'file':
      content = <FileEditor key={tab.fileId} fileId={tab.fileId} />;
      break;
  }
  // Focus mode: while answering, the tree and the dock are hidden; the question has the screen.
  const focus = tab.kind === 'questionnaire';

  return (
    <div className={`app ${focus ? 'focus' : ''}`}>
      <TopBar />
      <div className="body">
        {!focus && <Sidebar />}
        <main className="workspace">
          <TabBar />
          <div className="workspace-content">{content}</div>
        </main>
        {!focus && <Dock />}
      </div>
      {dialog?.kind === 'about' && <AboutDialog />}
      {dialog?.kind === 'reset' && <ResetDialog fileId={dialog.fileId} />}
      {dialog?.kind === 'erase' && <EraseDialog fileId={dialog.fileId} />}
      {dialog?.kind === 'import' && <ImportDialog />}
      <Toasts />
      {profile === null && dialog?.kind !== 'import' && <DemoChooser />}
    </div>
  );
}
