import { useState } from 'react';
import { useStore } from '../../store/store';

/** Four calm steps. Nothing else is shown, and nothing opens, until consent is given. */
export function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ai, setAi] = useState<boolean | null>(null);
  const [agree, setAgree] = useState(false);

  const canContinue = step === 0 ? !!name.trim() : step === 1 ? ai !== null : true;

  return (
    <div className="page onb">
      <div className="steps" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 0 && (
        <>
          <h1>Who am I?</h1>
          <p className="lead">A journal for putting your ethics, your beliefs and your long-term goals into words.</p>
          <p className="muted" style={{ marginBottom: 28 }}>No score, label or diagnosis.</p>
          <label className="muted small" htmlFor="name">
            What should we call you?
          </label>
          <input id="name" className="input" style={{ maxWidth: 320, marginTop: 6, display: 'block' }} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />
        </>
      )}

      {step === 1 && (
        <>
          <h1>Your data and AI</h1>
          <ul>
            <li>Your answers and notes stay in this browser. There is no account or server.</li>
            <li>You can reset any topic, erase it completely, or export everything to a file.</li>
            <li>
              AI is optional. If you turn it on, you can ask questions about your notes and draft summaries. In this
              prototype nothing is sent anywhere: answers are pre-written or made by simple rules.
            </li>
          </ul>
          <div className="choice-cards" role="radiogroup">
            <button role="radio" aria-checked={ai === true} style={ai === true ? { borderColor: 'var(--accent)' } : undefined} onClick={() => setAi(true)}>
              <b>AI on</b>
              <span>Ask about your notes and draft summaries. AI text is always labelled.</span>
            </button>
            <button role="radio" aria-checked={ai === false} style={ai === false ? { borderColor: 'var(--accent)' } : undefined} onClick={() => setAi(false)}>
              <b>AI off</b>
              <span>Only your own words and notes made from your answers. You can change this later.</span>
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1>Two kinds of question</h1>
          <div className="cards" style={{ marginTop: 24 }}>
            <div>
              <h3>Stable</h3>
              <p>Can harming an innocent person ever be justified? A change here is worth noticing.</p>
            </div>
            <div>
              <h3>Flexible</h3>
              <p>Does a goal require moving abroad? These answers can be revisited over time.</p>
            </div>
          </div>
          <p className="muted">Skip any question, edit or lock any note, reset a topic, or erase it completely.</p>
        </>
      )}

      {step === 3 && (
        <>
          <h1>Before you start</h1>
          <ul>
            <li>Every question is optional.</li>
            <li>Your answers and notes are stored in this browser and used only to make your notes.</li>
            <li>You would be asked again before anything else, such as sending text to an AI service.</li>
          </ul>
          <p className="small">
            <button className="link" onClick={() => setStep(1)}>
              Read about your data again
            </button>
          </p>
          <label className="toggle">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I agree, and I understand this is not a clinical tool.</span>
          </label>
        </>
      )}

      <div className="onb-nav">
        {step === 0 ? (
          <button className="link small" style={{ color: 'var(--faint)' }} onClick={() => useStore.setState({ profile: null })}>
            Leave
          </button>
        ) : (
          <button className="link small" style={{ color: 'var(--faint)' }} onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="btn primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <div className="row">
            <button className="btn" onClick={() => useStore.setState({ profile: null })}>
              Leave
            </button>
            <button className="btn primary" disabled={!agree} onClick={() => completeOnboarding(name, !!ai)}>
              Agree
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
