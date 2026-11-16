# Personal Operating Model — web prototype

A place to put five things into words you can read, edit and come back to: what you believe, what you think is right,
what matters most to you, who you are, and what you want. Short sets of questions open on a map; every answer becomes a
plain sentence in your notes; a one-minute monthly check-in shows what changed and what stayed the same.

It is a prototype from the group's writeups. [`PLAN_V2.md`](PLAN_V2.md) is the plan this version follows;
[`SPEC_REVIEW.md`](SPEC_REVIEW.md) lists how it differs from the original writeups and what is still open.

- No backend, no accounts. Everything is stored in the browser's `localStorage`.
- AI is **off** by default. When turned on, it only uses a model on your own computer through Ollama.
- Nothing is scored. Items are our own wording; none is a validated instrument.

## Running it

```bash
npm install
npm run dev                          # http://localhost:5173
npm test                             # unit tests
npm run typecheck
npm run contrast                     # colour contrast check of the palette
node scripts/e2e-journey.cjs         # with the dev server running; needs Playwright
node scripts/ai-eval.mjs qwen3:1.7b  # with Ollama running: AI eval, see below
node scripts/experiment-summary.mjs <logs…>   # summary of exported experiment logs
npm run build                        # type-check + production build into dist/
```

On first load, choose **Start fresh** (consent, then your own answers) or **Look at a sample**. The sample is Priya, a
fictional MSc student in Pune weighing a PhD offer in Zurich against family commitments, eight months in, with three
monthly check-ins. You can switch from the menu at the top right.

The layout is for desktop and needs a width of 1100 px or more.

## Deploying to GitHub Pages

1. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** (one time).
2. Run **Actions → Deploy to GitHub Pages → Run workflow**. It only runs when started by hand. It tests, builds and
   publishes `dist/`.

Each visitor's data stays in their own browser. Data saved by an earlier build is discarded on first load (storage
version 5), because the old question ids do not map onto the new items.

## The five branches

A first visit shows only the five entry areas (25 items, about two minutes each). The rest opens from answers: an area
opens when **any** of its parent tags is active.

| Branch | Area | Items | Opened by | Notes file |
| --- | --- | --- | --- | --- |
| Personal Priorities (start here) | Personal Priorities | P1–P5 | consent | `priorities/main` |
| | What I'd Trade | PT1–PT3 | P3 or P4 | `priorities/trade-offs` |
| | When Priorities Clash | PC1–PC2 | P1, MD3 or GC5 | `priorities/trade-offs` |
| Goals & Aspirations | Goals & Aspirations | G1–G6 | consent | `goals/main` |
| | Work & Study Path | GC1–GC5 (GC2–GC4 only if “worth exploring”) | G1 or G3 | `goals/work-and-study` |
| | Relationships & Home | GH1–GH3 (GH2–GH3 only if “worth exploring”) | G2 or G4 | `goals/relationships-and-home` |
| | Other Areas | GM1–GM4, one per area picked in G6 | G6 (any pick) | `goals/main` |
| Identity & Self-concept | Identity & Self-concept | I1–I4 | consent | `identity/main` |
| | How I Tend to Be | IT1–IT5 | I1 or I4 | `identity/tendencies` |
| | Who I Want to Be | IB1–IB3 | I2 or I3 | `identity/becoming` |
| Worldview & Beliefs | Worldview & Beliefs | W1–W5 | consent | `worldview/main` |
| | Control & Change | WC1–WC3 | W1 or W4 | `worldview/control-and-change` |
| | People & Belief | WS1–WS5 | W2 or W3 | `worldview/people-and-belief` |
| Moral Principles | Moral Principles | M1–M5 | consent | `moral/main` |
| | Rules & Exceptions | MR1–MR3 | M2, M3 or M4 | `moral/rules-and-exceptions` |
| | Fairness & Loyalty | MF1–MF3 | M1 | `moral/fairness-and-loyalty` |
| | Family Duty | MD1–MD3 | M5 or G4 | `moral/family-duty` |
| (none) | Monthly Check-in | C1–C4, logged with the date | P2 | `check-ins/log` |

63 branch items, 4 opt-in one-liners (GM1–GM4) and the 4-item check-in. Items marked *Adapted* paraphrase a published
item; *Informed* items are our wording on a published construct (Schwartz values, self-concept clarity, IPIP, generalised
trust, primal world beliefs, implicit theories, locus of control, EPQ-5, moral foundations, dual filial piety, Personal
Projects Analysis, Best Possible Self). No instrument is given in full.

Formats: agree/disagree, pick one, pick several (with a maximum or “None of these”), rank, 0–10 slider, one line of text.
Every question can be skipped, and every question has an optional **Add a note** for one line in your own words.

## How it works

- **Answers go straight into the notes.** Taps apply at once, sliders on release, text on Enter or when you leave the
  box. Each answer writes one sentence you could have written (“When two things I want clash, family usually wins.”).
  A locked line is never changed: the new answer goes on the line after it.
- **Notes.** Each line records who made it (you, an answer, or a summary), with an id, timestamps, the question it came
  from and a lock. Answers and edits in one browser session make one new version per file; the current version and the
  five before it are kept, with a History view to compare and restore.
- **Then and now.** A retake shows “Last time: … [Still true]”. The Done screen lists “Same as last time: N” and each
  change as old → new.
- **Monthly check-in.** Four quick items, each logged with the date, suggested again 30 days after the last one.
- **Potential tensions.** Eight fixed rules (`src/data/tensions.ts`), shown only when both sides are backed by current
  notes in two different files. The check-in rules use the latest check-in.
- **Revisit.** The check-in when due, an upcoming event you named (G5), flexible answers older than 120 days, answers
  marked unsure, and notes of your own that say something changed.
- **Ask.** Quotes your notes with citations, kept separate from any reading. A reading disappears if a note it cites is
  deleted.
- **Summarise** shortens generated lines; your own and locked lines stay word for word. It is always a draft to accept
  or cancel.

## Local AI (optional)

AI is off by default. When on, it uses a model running on your own computer through [Ollama](https://ollama.com);
nothing leaves your machine.

**How to use it**

1. Install Ollama from <https://ollama.com/download> and start it (the desktop app, or `ollama serve`).
2. Download the default model (about 1.4 GB):

   ```bash
   ollama pull qwen3:1.7b
   ```

3. Open the app and click the **ⓘ** button at the top right (**Your data**).
4. Under **AI**, choose **Ollama** and agree to the consent (“Your notes are sent to the model running on this
   computer. Nothing leaves it.”).
5. Click **Test connection**. It should say the model is installed. To use another model, `ollama pull` it and type its
   name in **Model**.
6. Use it: **Summarise** on a note, the **Tensions** tab, or **Show a reading** under a question in **Ask**.

If you use the hosted GitHub Pages version instead of `npm run dev`, Ollama must allow that page. Quit Ollama, then
start it with:

```bash
OLLAMA_ORIGINS=https://<user>.github.io ollama serve
```

To turn AI off, choose **Off** in the same place.

| Job | With AI on | With AI off, or if the output fails a check |
| --- | --- | --- |
| Summarise a note | Code picks the unlocked generated lines; the model shortens them (a draft) | Pre-written (sample) or rule-based summary |
| Tensions | Rules pick the pairs; the model words one “You said …” sentence | The rule's own sentence |
| Ask | Code retrieves and quotes the notes; the model writes a reading only on **Show a reading** | Pre-written readings (sample) or quotes only |
| Retakes | Rules only | Rules only |

Every model output is checked: valid JSON, citations that point at lines that were sent, length caps, no advice or
diagnosis phrases (“you should”, “deep down” …) and no advice given as a command (“Consider…”), and no number or date that is not in the notes. A line that fails is
dropped; if nothing survives, the rule-based output is used and the app says “No AI reading for this one”.

`node scripts/ai-eval.mjs qwen3:1.7b phi4-mini …` runs 15 fixtures from the sample profile against a running Ollama and
prints the pass rate per model. The target is 90% of fixtures passing every check on the default model. No model reached
90% in our runs; the default, qwen3:1.7b, passed 12 of 15 every time. See
[`AI_EVAL.md`](AI_EVAL.md).

## Experiment mode

For testing the questions with real people (PLAN_V2 1.4). Off by default: **Your data → Advanced options → Experiment
mode**. It records every answer, note and click with timestamps in this browser under its own key, with a random
participant id (never the display name, and never for the sample profile), capped at 5,000 events. **Export experiment
log** downloads it as one JSON file; the normal data export is unchanged. Turning the mode off stops logging at once and
offers to delete or keep the log.

`node scripts/experiment-summary.mjs logs/*.json` prints, per item: times shown, answered and skipped, median seconds to
answer, the share that used “Add a note”, and the share changed on a retake.

## Your data

- Onboarding asks what to call you. This is a display name only; there is no account and no password.
- **Export** downloads one unencrypted JSON file with your name, answers, notes and file versions. **Import** checks the
  file and asks before replacing what is in the browser.
- Each note's **…** menu has **Reset topic** (a preview that clears generated lines and keeps your own and locked lines,
  with or without your answers) and **Erase topic data** (removes the notes, their history and the linked answers after
  you type the file name).

## Simplifications

- The item set comes from simulated walk-throughs, not user tests. Have three to five real people do the full set while
  thinking aloud, and have a psychologist review the items, before relying on it.
- Reminders happen only inside the app; there are no notifications.
- Desktop only.
