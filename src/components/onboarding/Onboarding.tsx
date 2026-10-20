import { useState } from 'react';
import {
  Anchor,
  Bot,
  Database,
  FileLock2,
  Map as MapIcon,
  ShieldAlert,
  Stethoscope,
  Trash2,
  Waves,
} from 'lucide-react';
import { useStore } from '../../store/store';
import { fmtDateTime } from '../../logic/format';

const STEPS = ['Purpose', 'Your data & AI', 'Question types', 'Consent'];

export function Onboarding() {
  const onboardedAt = useStore((s) => s.onboardedAt);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const storedName = useStore((s) => s.userName);
  const setUserName = useStore((s) => s.setUserName);
  const [name, setName] = useState(storedName ?? '');
  const [step, setStep] = useState(onboardedAt ? 3 : 0);
  const [consent, setConsent] = useState(!!onboardedAt);
  const [understandsAi, setUnderstandsAi] = useState(!!onboardedAt);

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
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {step === 0 && (
          <>
            <h1>Who am I?</h1>
            <label className="name-field">
              <span>What should we call you?</span>
              <div className="row">
                <input
                  className="input"
                  value={name}
                  maxLength={60}
                  placeholder="Your first name or a nickname"
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
              <small className="faint">
                Only used to address you in this browser. It is not an account and there is no password.
              </small>
            </label>
            <p className="lead">
              The Personal Operating Model helps you build an evolving, editable record of your ethics, your worldview and
              your long-term goals — so you can see how they fit together and how they change.
            </p>
            <ul className="onb-list">
              <li>
                <span className="ic"><MapIcon size={15} /></span>
                <div>
                  <b>A map that grows as you answer</b>
                  <span>
                    Short, optional questionnaires sit on a graph. Answers reveal deeper questions — there is no finish
                    line and no score for “knowing yourself”.
                  </span>
                </div>
              </li>
              <li>
                <span className="ic"><FileLock2 size={15} /></span>
                <div>
                  <b>Notes you own</b>
                  <span>
                    Answers become concise notes in a small knowledge base. You can edit them, write your own, lock lines
                    and roll back to earlier versions.
                  </span>
                </div>
              </li>
              <li>
                <span className="ic"><Stethoscope size={15} /></span>
                <div>
                  <b>Not a clinical or diagnostic tool</b>
                  <span>
                    Nothing here assesses mental health or personality disorders, and nothing replaces professional
                    advice. Some items are research-informed; many are new, exploratory prompts — each is labelled.
                  </span>
                </div>
              </li>
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <h1>What is collected, and how AI is used</h1>
            <p className="lead">Please read this before deciding whether to continue.</p>
            <ul className="onb-list">
              <li>
                <span className="ic"><Database size={15} /></span>
                <div>
                  <b>What is stored</b>
                  <span>
                    Your questionnaire answers (including optional confidence ratings and dates), the notes generated from
                    them, notes you write yourself, and up to five earlier versions of each notes file. Answers about
                    family, beliefs and goals can be sensitive.
                  </span>
                </div>
              </li>
              <li>
                <span className="ic"><ShieldAlert size={15} /></span>
                <div>
                  <b>Where it is stored (this prototype)</b>
                  <span>
                    Only in this browser’s local storage. There is no server, account or encryption — anyone with access
                    to this browser profile could read it. Do not enter real sensitive information in this demo.
                  </span>
                </div>
              </li>
              <li>
                <span className="ic"><Bot size={15} /></span>
                <div>
                  <b>AI can make mistakes</b>
                  <span>
                    Summaries, potential tensions and answers to your questions are AI-style interpretations (simulated in
                    this prototype). They can be wrong or miss context. They are always labelled and never overwrite lines
                    you lock.
                  </span>
                </div>
              </li>
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Stable and flexible questions</h1>
            <p className="lead">Every question is labelled, so you know how to read changes over time.</p>
            <div className="onb-compare">
              <div className="onb-card">
                <span className="chip stable"><Anchor size={11} /> Stable</span>
                <h3>Expected to change slowly</h3>
                <p>
                  Core principles — e.g. whether harming an innocent person can ever be justified. A change here is worth
                  noticing.
                </p>
              </div>
              <div className="onb-card">
                <span className="chip flexible"><Waves size={11} /> Flexible</span>
                <h3>Expected to move with your life</h3>
                <p>
                  Situational views and plans — e.g. whether a goal requires moving abroad. These are suggested for retakes
                  over time.
                </p>
              </div>
            </div>
            <ul className="onb-list">
              <li>
                <span className="ic"><Trash2 size={15} /></span>
                <div>
                  <b>You stay in control</b>
                  <span>
                    Skip any question. Edit, lock or delete any note. Reset a topic to regenerate its notes, or erase a
                    topic’s notes, answers and history entirely.
                  </span>
                </div>
              </li>
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Preliminary consent</h1>
            <p className="lead">
              This covers storing your answers and notes in this browser and generating notes from them. It is a starting
              point, not a blanket agreement: you will be asked again before any new kind of processing (for example,
              sharing data or using a real AI service).
            </p>
            {onboardedAt && (
              <div className="callout info" style={{ marginBottom: 14 }}>
                <span>
                  You gave preliminary consent on <b>{fmtDateTime(onboardedAt)}</b>. You can erase any topic’s data from
                  the file explorer at any time.
                </span>
              </div>
            )}
            <label className="check">
              <input type="checkbox" checked={consent} disabled={!!onboardedAt} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                <b>I consent to my answers and notes being stored locally and used to generate notes.</b> I understand
                questions are optional and I can edit or erase this data.
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={understandsAi}
                disabled={!!onboardedAt}
                onChange={(e) => setUnderstandsAi(e.target.checked)}
              />
              <span>
                <b>I understand this is not a clinical tool and that AI-generated interpretations may be incorrect.</b>
              </span>
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
            <span className="faint" style={{ fontSize: 12.5 }}>Onboarding complete</span>
          ) : (
            <div className="row">
              {!name.trim() && (
                <button className="btn ghost" onClick={() => setStep(0)}>
                  Add your name first
                </button>
              )}
              <button
                className="btn primary"
                disabled={!consent || !understandsAi || !name.trim()}
                onClick={() => completeOnboarding(name)}
              >
                Agree and reveal the map
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
