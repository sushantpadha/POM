import { useStore } from './store/store';
import { TopBar } from './components/shell/TopBar';
import { TabBar } from './components/shell/TabBar';
import { AboutDialog, DemoChooser, Toasts } from './components/shell/Overlays';
import { Sidebar } from './components/sidebar/Sidebar';
import { GraphView } from './components/graph/GraphView';
import { Onboarding } from './components/onboarding/Onboarding';
import { Questionnaire } from './components/questionnaire/Questionnaire';
import { FileEditor } from './components/notes/FileEditor';
import { NodePanel } from './components/panels/NodePanel';
import { FilePanel } from './components/panels/FilePanel';
import { FloatingControls } from './components/floating/FloatingControls';
import { EraseDialog, ResetDialog } from './components/dialogs/TopicDialogs';
import { ImportDialog } from './components/dialogs/ImportDialog';

export default function App() {
  const profile = useStore((s) => s.profile);
  const tabs = useStore((s) => s.tabs);
  const activeTab = useStore((s) => s.activeTab);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const dialog = useStore((s) => s.dialog);
  const tab = tabs[activeTab] ?? tabs[0];

  let content;
  let panel = null;
  switch (tab.kind) {
    case 'graph':
      content = <GraphView />;
      if (selectedNodeId) panel = <NodePanel key={selectedNodeId} nodeId={selectedNodeId} />;
      break;
    case 'onboarding':
      content = <Onboarding />;
      break;
    case 'questionnaire':
      content = <Questionnaire key={tab.nodeId} nodeId={tab.nodeId} />;
      panel = <NodePanel nodeId={tab.nodeId} closable={false} />;
      break;
    case 'file':
      content = <FileEditor key={tab.fileId} fileId={tab.fileId} />;
      panel = <FilePanel fileId={tab.fileId} />;
      break;
  }

  return (
    <div className={`app ${panel ? 'with-panel' : ''}`}>
      <TopBar />
      <div className="body">
        <Sidebar />
        <main className="workspace">
          <TabBar />
          <div className="workspace-content">{content}</div>
        </main>
        {panel}
      </div>
      <FloatingControls />
      {dialog?.kind === 'about' && <AboutDialog />}
      {dialog?.kind === 'reset' && <ResetDialog fileId={dialog.fileId} />}
      {dialog?.kind === 'erase' && <EraseDialog fileId={dialog.fileId} />}
      {dialog?.kind === 'import' && <ImportDialog />}
      <Toasts />
      {profile === null && dialog?.kind !== 'import' && <DemoChooser />}
    </div>
  );
}
