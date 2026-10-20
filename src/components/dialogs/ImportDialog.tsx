import { useRef, useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
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
        <div className="dialog-head">
          <h2 id="import-title"><Upload size={16} /> Import data</h2>
        </div>
        <div className="dialog-body">
          <p>Load a file previously created with <b>Export data</b>. It replaces everything stored in this browser.</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => onFile(e.target.files?.[0])}
            aria-label="Export file"
          />
          <div className="row">
            <button className="btn" onClick={() => inputRef.current?.click()}>
              <FileUp size={13} /> Choose file…
            </button>
            <span className="faint mono" style={{ fontSize: 12 }}>{fileName}</span>
          </div>
          {result && !result.ok && <div className="callout danger">{result.error}</div>}
          {result?.ok && (
            <div className="callout warn">
              <div>
                <b>Ready to import</b>
                {result.summary.userName && <> for <b>{result.summary.userName}</b></>}
                {result.summary.exportedAt && <>, exported {fmtDateTime(result.summary.exportedAt)}</>}:
                <ul style={{ marginTop: 6 }}>
                  <li>{result.summary.answers} answers</li>
                  <li>{result.summary.lines} note lines and {result.summary.versions} earlier file versions</li>
                </ul>
                <div style={{ marginTop: 6 }}>
                  This will replace the current data in this browser ({currentAnswers} answers). Export it first if you
                  want to keep it.
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="dialog-foot">
          <button className="btn" onClick={() => setDialog(null)}>Cancel</button>
          <button
            className="btn primary"
            disabled={!result?.ok}
            onClick={() => {
              if (result?.ok) importData(result.data);
            }}
          >
            Replace and import
          </button>
        </div>
      </div>
    </div>
  );
}
