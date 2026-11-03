import { useStore } from '../../store/store';

/** First visit only: start your own journal or look at the sample. */
export function Welcome() {
  const chooseProfile = useStore((s) => s.chooseProfile);
  const setDialog = useStore((s) => s.setDialog);
  return (
    <div className="page onb">
      <h1>Personal Operating Model</h1>
      <p className="lead">A prototype journal for your ethics, beliefs and long-term goals.</p>
      <div className="choice-cards">
        <button onClick={() => chooseProfile('fresh')}>
          <b>Start your own</b>
          <span>A few short steps, then your first questions.</span>
        </button>
        <button onClick={() => chooseProfile('sample')}>
          <b>Look at a sample</b>
          <span>A fictional student, seven months in.</span>
        </button>
      </div>
      <p className="small" style={{ marginTop: 22 }}>
        <button className="link" style={{ color: 'var(--faint)' }} onClick={() => setDialog({ kind: 'import' })}>
          Import an export file
        </button>
      </p>
    </div>
  );
}
