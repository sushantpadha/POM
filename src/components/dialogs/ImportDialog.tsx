import { useRef, useState } from 'react';
import { useStore } from '../../store/store';
import { parseExport, type ParseResult } from '../../logic/transfer';
import { fmtDateTime } from '../../logic/format';

export function ImportDialog() {
  const setDialog = useStore((s) => s.setDialog);
  const importData = useStore((s) => s.importData);
  const currentAnswers = useStore((s) => Object.keys(s.responses).length);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
    setResult(parseExport(await f.text()));
  };

  return (
    <div className="scrim" onClick={() => setDialog(null)}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="import-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="import-title">Import</h2>
        <p>Choose a file made with Export. It replaces everything in this browser.</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => onFile(e.target.files?.[0])}
          aria-label="Export file"
        />
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn small" onClick={() => inputRef.current?.click()}>
            Choose file
          </button>
          <span className="faint small">{fileName}</span>
        </div>
        {result && !result.ok && <div className="callout danger">{result.error}</div>}
        {result?.ok && (
          <div className="callout">
            Ready to import{result.summary.userName ? ` for ${result.summary.userName}` : ''}
            {result.summary.exportedAt ? `, from ${fmtDateTime(result.summary.exportedAt)}` : ''}: {result.summary.answers} answers and{' '}
            {result.summary.lines} note lines.{currentAnswers > 0 && ` Your current ${currentAnswers} answers will be replaced.`}
          </div>
        )}
        <div className="foot">
          <button className="btn" onClick={() => setDialog(null)}>
            Cancel
          </button>
          <button className="btn primary" disabled={!result?.ok} onClick={() => result?.ok && importData(result.data)}>
            Replace and import
          </button>
        </div>
      </div>
    </div>
  );
}
