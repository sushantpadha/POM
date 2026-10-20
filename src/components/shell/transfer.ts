import { useStore } from '../../store/store';

/** Downloads everything the user owns as one JSON file. */
export function downloadExport() {
  const s = useStore.getState();
  const file = s.exportData();
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `personal-operating-model-${file.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  s.toast({ text: 'Exported your data. The file contains your answers in plain text — store it somewhere private.' });
}
