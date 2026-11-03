# Personal Operating Model — web prototype

A prototype for putting your **ethics**, **worldview / beliefs** and **long-term goals** into words you can read,
edit and question. It follows the group's *Prototype and Flow Development* writeup (Doc 2). Where the prototype differs
from that writeup, or from the original project idea (Doc 1), the difference is listed in
[`SPEC_REVIEW.md`](SPEC_REVIEW.md).

The prototype has no backend, no accounts and **no AI service**:
- Summaries and "Ask your model" answers are pre-written for the sample profile. For anything else they are made by simple rules.
- Potential tensions and retake suggestions are fixed rules applied to your actual answers.
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
- Each topic file has **Reset topic**, which clears generated lines and keeps your own and locked lines. You can choose
  whether to keep the answers. It also has **Erase topic data**, which removes the notes, their history and the linked
  answers after you type the file name to confirm.

## Questions

The 15 branch items are Doc 2's E1–E5, W1–W5 and G1–G5, with the wording, format, tag, Stable/Flexible type and source
unchanged, except that W5 is tagged `#purpose` (see `SPEC_REVIEW.md`). Each question lists the notes file(s) it writes to,
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

## How it works

- **Graph:** a node opens when **any** of its parent-tags is active, and answering a question activates its tags.
  Edges are derived from tags, and the graph is checked for cycles at startup. A node with several parents still
  appears once. Unlock state is recalculated from your answers, never stored separately.
- **Notes:** every line records who made it: you (hand icon), generated from an answer (pencil) or a summary (robot). It
  also has a unique ID, timestamps, the question it came from and a lock. Saving answers produces a **draft** for each
  file they write to. Nothing changes until you commit it.
- **Versions:** each file keeps its current version and the five before it, with a compare view and a restore option.
- **Summarise:** a draft that shortens the generated lines and keeps your own and locked lines word for word. On a
  `main` file, it summarises that folder's topic files.
- **Potential tensions:** four fixed rules (in `src/data/tensions.ts`). A rule only shows when both sides are backed
  by current notes in two different files. Each tension links to the questionnaires behind it.
- **Changes over time:** compares an earlier version of a single file with its current version.
- **Suggested retakes:** flexible answers older than 120 days, answers marked unsure, and your own notes that say
  something changed.
- **Ask your model:** quotes your notes with citations, kept separate from any interpretation. Interpretations exist
  only for the sample profile's example questions, and one is dropped if any note it cites is gone.

## Simplifications

- Manual edits made in one browser session are grouped into a single new file version. Locking a line does not
  create a version.
- The question sets are short demonstration sets, not validated instruments.
- The layout is desktop-first and needs a width of 1100 px or more.
