# Personal Operating Model — web prototype

An interactive frontend prototype of a research-informed self-assessment system. It builds an evolving,
user-editable knowledge base of a person’s **ethics**, **worldview / beliefs** and **long-term goals**.

The prototype is frontend-only. AI summarisation, potential-tension detection and “Ask the model” are **simulated**
with predefined outputs and simple rules. There is no backend and no authentication. State is kept in the browser’s
`localStorage`.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: graph logic (DAG, OR-unlocking, progress) and notes logic (versions, locks, diff, tensions)
npm run build      # type-check + production build into dist/
node scripts/e2e-journey.cjs   # with the dev server running; needs Playwright — walks the full journey
```

On first load you choose a demo:

- **Start fresh** begins at *Who am I?* with onboarding and consent, then an empty knowledge base.
- **Explore a sample profile** loads *Priya*, an MSc student seven months in, weighing a PhD offer in Zurich against
  family commitments. It includes file history, potential tensions and retake suggestions.

You can switch demos or reset one from the profile menu in the top-right corner.

## Suggested walkthrough

1. **Start fresh.** Click *Who am I?*, go through the four onboarding steps and give preliminary consent. The three
   branches appear.
2. Double-click **Ethics** (or select it and click *Take questionnaire*). Answer the first question. Its `#idealism`
   tag unlocks *Harm & Consequences* straight away. Answer the family question to unlock *Obligations to Elders &
   Family*. Skip anything you like, then submit.
3. Click **Review update** to see the generated note update as a proposal, then **Commit** it.
4. Edit a line by clicking it; the edited line becomes human-written (hand icon). Add your own note, and lock a line.
5. Retake the questionnaire with a different answer. The new proposal keeps the locked line unchanged.
6. Try **Summarise**, **Version history** and **Changes over time** on the file.
7. Load the **sample profile** and open the floating **!** (potential tensions), **★** (suggested retakes) and **?** (ask the
   model) controls. In *Personal Agency*, answer “A lot” to the luck question. This unlocks *Meaning & Purpose* through
   its second parent, and a new potential tension appears once the generated note is committed.

## How it works

### Question graph (`src/data/nodes.ts`, `src/data/questions.ts`, `src/logic/graph.ts`)

- Each **question** has a unique ID (e.g. `ETH-03`), one or more **self-tags**, a node, a **stable/flexible** label and
  a **source label**: *research-informed*, *adapted item* (e.g. paraphrased from the Ethics Position Questionnaire,
  Forsyth 1980) or *exploratory* (newly designed).
- Each **node** has one or more **parent-tags**. A node is available when **any** of its parent-tags is active (OR
  semantics). Answering a question activates its self-tags.
- **Edges are derived** rather than hand-written: `P → C` whenever a question in `P` emits a tag in `C`’s parent-tags.
  The graph is validated as a **DAG** at startup with Kahn’s algorithm, and the app refuses to build a cyclic graph.
  Nodes are keyed by ID, so a node reachable from several parents is created only once. Examples are *Care vs Ambition
  Trade-offs* (from family obligations and career), *Obligations to Others* (from worldview and harm) and *Meaning &
  Purpose* (from agency and goals ↔ values).
- Unlock state is a pure function of the stored responses. It is never stored separately.
- **Current progress** is the number of answered questions divided by the questions currently available in the node’s
  discovered descendant subgraph. **Exploration** counts the nodes and questions discovered through answers. The UI
  never shows a fixed total or “100% self-understanding”.

### Notes, provenance and versions (`src/logic/notes.ts`, `src/store/store.ts`)

- Every line has an ID, created and updated timestamps, a provenance (✋ human-written, ✏️ automatically generated,
  🤖 AI-summarised), an optional source assessment-item ID and a lock flag.
- **Versioning is per file**: one current version plus the five most recent prior versions.
- Submitting a questionnaire creates a **proposal** (generated update). *Commit* moves the current version into
  history and makes the proposal current. *Cancel* discards the proposal. Locked lines are never changed by
  generated updates, summaries or topic resets, and human-written lines are never touched by generated updates.
- **Reset topic** clears generated and AI lines, keeps human-written and locked lines, and optionally keeps the
  underlying answers and regenerates notes from them. **Erase topic data** removes the file’s lines, history and the
  linked answers, after a typed confirmation.

### Maintenance views

- **Potential tensions** (`src/data/tensions.ts`) compare the *current* versions of different files. A tension is
  shown only when both sides are backed by notes that exist now, in at least two files. Each tension links to the
  questionnaires that contain its tags.
- **Changes over time** compares an earlier version of *one* file with its current version.
- **Suggested retakes** come from four sources: human notes reporting a change, flexible answers older than 120 days,
  low-confidence answers, and answers that feed an open tension.
- **Ask the model** runs a staged simulation: dimensions, then `main` files, then topic files, then a generated
  answer with citations. The answer keeps user-reported statements separate from AI-generated interpretation.
  Citations open the cited line, and item chips open the assessment item.

## Simplifications

- No real AI. Predefined summaries and *Ask the model* interpretations exist only for the sample profile, tied to the
  exact file versions they were written for. In every other case the prototype falls back to a rule-based
  condensation or to quoting the retrieved notes.
- Potential tensions come from a fixed set of rules over answers and notes, not from semantic analysis.
- Manual edits made in one browser session are coalesced into a single new file version. Locking or unlocking a line
  is metadata and does not create a version.
- “Erase” only deletes this browser’s demo data. Nothing is stored securely or on a server.
- The questionnaires are short demonstration sets, not validated instruments. Items labelled *adapted* are
  paraphrases, not the original wording.
- The interface is desktop-first, designed for widths of 1100 px and up.
