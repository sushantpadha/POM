import { useState } from 'react';
import { useStore } from '../../store/store';
import { fmtDateTime } from '../../logic/format';

const STEPS = ['About', 'Your data', 'Question types', 'Consent'];

export function Onboarding() {
  const onboardedAt = useStore((s) => s.onboardedAt);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const storedName = useStore((s) => s.userName);
  const setUserName = useStore((s) => s.setUserName);
  const [name, setName] = useState(storedName ?? '');
  const [step, setStep] = useState(onboardedAt ? 3 : 0);
  const [consent, setConsent] = useState(!!onboardedAt);
  const [understands, setUnderstands] = useState(!!onboardedAt);

  return (
    <div className="doc-scroll">
      <div className="onb">
        <div className="onb-steps" role="tablist">
          {STEPS.map((s, i) => (
            <button
              key={s}
              role="tab"
              aria-selected={i === step}
              className={`onb-step ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`}
              onClick={() => setStep(i)}
            >
              <span className="bar" />
              {s}
            </button>
          ))}
        </div>

        {step === 0 && (
          <>
            <h1>Who am I?</h1>
            <p className="lead">
              This is a place to put your ethics, your worldview and your long-term goals into words you can read, edit and
              question.
            </p>
            <label className="name-field">
              <span>What should we call you?</span>
              <div className="row">
                <input
                  className="input"
                  value={name}
                  maxLength={60}
                  placeholder="First name or nickname"
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Your name"
                  autoFocus={!onboardedAt}
                />
                {onboardedAt && (
                  <button className="btn" disabled={!name.trim() || name.trim() === storedName} onClick={() => setUserName(name)}>
                    Save
                  </button>
                )}
              </div>
              <small className="faint">Only used to address you. There is no account or password.</small>
            </label>
            <ul className="onb-points">
              <li>You answer short sets of questions, in any order. Every question can be skipped.</li>
              <li>Answers open further questions on a map. There is no score and no finish line.</li>
              <li>Your answers become notes that you can edit, lock, or delete.</li>
              <li>
                This is an exploratory prototype, not a validated test. It gives no diagnosis, score or personality type.
              </li>
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <h1>Your data</h1>
            <ul className="onb-points">
              <li>
                <b>What is stored:</b> your answers (with dates and how sure you were), the notes made from them, notes you
                write, and up to five earlier versions of each notes file. Answers about family, beliefs and goals can be
                personal.
              </li>
              <li>
                <b>Where:</b> only in this browser. There is no server and no encryption, so anyone using this browser
                profile could read it. You can export it to a file or erase it at any time.
              </li>
              <li>
                <b>AI:</b> this prototype does not send anything to an AI service. Summaries, tensions and answers in “Ask
                your model” are pre-written or made by simple rules. In a full version an AI would do this, and its text
                would stay labelled and separate from your own words. It can be wrong.
              </li>
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Stable and flexible questions</h1>
            <p className="lead">Each question says which kind it is.</p>
            <div className="onb-compare">
              <div className="onb-card">
                <h3>Stable</h3>
                <p>Lasting principles and beliefs, such as whether harm to others can be justified. Expected to change slowly.</p>
              </div>
              <div className="onb-card">
                <h3>Flexible</h3>
                <p>Current circumstances and priorities, such as a project you are working on. These are suggested for retakes.</p>
              </div>
            </div>
            <p className="muted">
              Each question also says where it comes from: <b>Adapted</b> means paraphrased from a published questionnaire;{' '}
              <b>New</b> means our own.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Consent</h1>
            <p className="lead">
              This covers storing your answers and notes in this browser and making notes from them. You would be asked again
              before anything else, such as sending data to an AI service.
            </p>
            {onboardedAt && (
              <p className="muted">
                You agreed on {fmtDateTime(onboardedAt)}. You can erase any topic from its file menu.
              </p>
            )}
            <label className="check">
              <input type="checkbox" checked={consent} disabled={!!onboardedAt} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to my answers and notes being stored in this browser and used to make notes.</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={understands} disabled={!!onboardedAt} onChange={(e) => setUnderstands(e.target.checked)} />
              <span>I understand this is not a clinical tool, and that interpretations can be wrong.</span>
            </label>
          </>
        )}

        <div className="onb-nav">
          <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </button>
          {step < 3 ? (
            <button className="btn primary" onClick={() => setStep(step + 1)}>
              Continue
            </button>
          ) : onboardedAt ? (
            <span className="faint" style={{ fontSize: 12.5 }}>Done</span>
          ) : (
            <div className="row">
              {!name.trim() && (
                <button className="btn ghost" onClick={() => setStep(0)}>
                  Add your name first
                </button>
              )}
              <button className="btn primary" disabled={!consent || !understands || !name.trim()} onClick={() => completeOnboarding(name)}>
                Agree and continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
