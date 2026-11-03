# Personal Operating Model — web prototype

A prototype for putting your **ethics**, **worldview / beliefs** and **long-term goals** into words you can read,
edit and question. It follows the group's *Prototype and Flow Development* writeup (Doc 2). Where the prototype differs
from that writeup, or from the original project idea (Doc 1), the difference is listed in
[`SPEC_REVIEW.md`](SPEC_REVIEW.md).

The prototype has no backend, no accounts and **no AI service**:
- Summaries and "Ask your journal" answers are pre-written for the sample profile. For anything else they are made by simple rules.
- Possible tensions and retake suggestions are fixed rules applied to your actual answers.
- Everything is stored in the browser's `localStorage`.

## Running it

```bash
npm install
npm run dev                    # http://localhost:5173
npm test                       # unit tests: graph, notes/versions, tensions, export/import
npm run build                  # type-check + production build into dist/
node scripts/e2e-journey.cjs   # with the dev server running; needs Playwright
```

On first load, choose **Start fresh** (consent, then your own answers) or **Look at a sample**. The sample is
Priya, a fictional MSc student weighing a PhD offer abroad against family commitments. You can switch later from the
menu at the top right.

## Deploying to GitHub Pages

1. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** (one time).
2. Run **Actions → Deploy to GitHub Pages → Run workflow**. It only runs when started by hand. It tests, builds and
   publishes `dist/`.

Each visitor's data stays in their own browser. Data saved by an earlier build with the old question set is discarded
on first load, because the old question IDs don't map onto the new items.

## Your data

- Onboarding asks what to call you. This is a display name only; there is no account and no password.
- **Export** downloads one unencrypted JSON file with your name, answers, notes and file versions. **Import** checks
  the file and asks before replacing what is in the browser.
- Each note has **Reset**, which clears generated lines and keeps your own and locked lines. You can choose whether to
  keep the answers. It also has **Erase**, which removes the note, its history and the linked answers after you type
  "erase" to confirm.

## Questions

The 15 branch items are E1–E5, W1–W5 and G1–G5 as listed in the UI summary. They match Doc 2, except that E1 uses the
summary's EPQ wording and W5 is tagged `#purpose` (see `SPEC_REVIEW.md`). Each question lists the notes file(s) it writes to,
as in Doc 2:

| Answers | Write to |
| --- | --- |
| E1, E2, E3, E5 | `ethics/moral-principles` |
| E4 | `ethics/family-obligations` |
| W1 / W2 / W3 | `worldview/personal-agency` / `sources-of-knowledge` / `obligations-to-others` |
| W4, W5 | `worldview/main` |
| G1, G2 | `long-term-goals/career` (G2 also writes to `relationships`) |
| G4 | `long-term-goals/relationships` |
| G3, G5 | `long-term-goals/main` |

Deeper nodes open from these answers. Items marked *Adapted* are our paraphrases; no instrument is given in full and
nothing is scored.

| Node | Opened by | Items |
| --- | --- | --- |
| Moral Principles | `#idealism`, `#relativism`, `#moral-principles` | EPQ-5 idealism and relativism, paraphrased |
| Family Relationships | `#family-duty` (E4) **or** `#relationships` (G4…) | informed by the dual filial piety model, plus a limits question |
| Care vs Ambition | Family Relationships **or** Personal Projects | our own trade-off questions |
| Personal Agency | `#personal-agency` (W1) | Rotter-style forced-choice pairs |
| Meaning in Life | W5 **or** Aspirations | MLQ presence and search, paraphrased |
| Personal Projects | `#career` | Personal Projects Analysis rating dimensions |
| Aspirations | `#aspirations` (G3) | Aspiration Index likelihood ratings |

## Layout

The layout follows the *POM UI: Executive Summary* (Nov 2026). There are four places, and only one is shown at a time:

- **Journal** is the home screen. Notes are grouped under the three areas, with one suggested next step and no counters, badges or legends.
- **Map** is optional. It shows the current area as a list first and offers a full map second. Hidden topics are never drawn, state is shown in plain words (New, In progress, Reflected on), and a topic card gives one main action.
- **Revisit** is one list of retakes, possible tensions and recent changes, a few items at a time.
- **Ask** answers from your notes only. It is available when AI is turned on.

**Your data** (your name in the top bar) holds storage, the AI setting, export and import, reset and erase, and consent.

- **Onboarding:** four calm steps with nothing behind them. One of them is a choice to turn AI on or off.
- **Reflecting:** one question at a time. Skip sits next to Continue, and "Why we ask this" is optional. You end on the notes that would change, not on a result. A pause is offered before the 10th, 20th and later new topic.
- **A note:** opens as plain text. Edit, history, summarise, reset and erase sit in a small toolbar. Line locks and line details (who made the line, the source question, dates) appear only while editing. AI lines are labelled and have Keep and Remove.
- **Motion:** there are no animations or transitions. The map uses a fixed layout.

## How it works

- **Graph:** a topic opens when **any** of its parent-tags is active, and answering a question activates its tags.
  Edges come from the tags, and the graph is checked for cycles at startup. A topic with two parents appears once.
- **Notes:** each line records who made it (you, your answer, or an AI summary), a unique ID, timestamps, the
  question it came from and a lock. Saving answers produces a draft. Nothing changes until you save it.
- **Versions:** each note keeps its current version and the five before it, shown as a timeline you can restore from.
- **Summarise:** shortens only the lines made from answers. Your own lines and locked lines are kept word for word.
  On an overview, it summarises that area's other notes.
- **Possible tensions:** fixed rules in `src/data/tensions.ts`, shown only when both sides are backed by current notes
  in two different files.
- **Retakes:** suggested for flexible answers older than 120 days, answers you were unsure about, and your own notes
  that say something changed.

## Simplifications

- Manual edits made in one browser session are grouped into a single new file version. Locking a line does not
  create a version.
- The question sets are short demonstration sets, not validated instruments.
- The layout is desktop-first and needs a width of 1100 px or more.
