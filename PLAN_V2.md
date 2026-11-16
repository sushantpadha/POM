# POM v2 — implementation plan

Three goals: (A) five-branch question set of ~65 items, (B) calmer, more readable UI, (C) real local AI through
Ollama. Decisions already made by the owner are marked **Decided**. Work the phases in order; each phase ends with
`npm run typecheck`, `npm test` and `node scripts/e2e-journey.cjs` green.

## 0. Decisions and constraints

- **Decided:** keep the force-directed, Obsidian-like graph and its feel. Do not replace it with a static layout.
- **Decided:** do not go minimal. Commit `2a9278b` (journal-first UI) was reverted because it stripped too much. Keep
  the three-pane shell, the file tree, tabs and the graph. Declutter means removing duplicates and noise, not features.
- **Decided:** new colour template: more readable, and colour used to direct attention.
- **Decided:** desktop only (keep `min-width: 1100px`). No mobile work.
- **Decided:** AI runs on the user's own Ollama. No hosted API, no in-browser model.
- **Decided:** saved data may be broken. Bump the storage version and discard old data on load.
- **Decided:** every answer is applied to the notes immediately. No draft/commit step for answers.
- Core features that must survive: file tree, readable and editable notes, focused questionnaire, Ask, tensions,
  retakes, version history, locks, provenance, export/import, reset/erase topic.
- Items are our own wording. "Adapted" = paraphrase of a published item; "informed" = our wording on a published
  construct. No instrument is given in full and nothing is scored. Do not copy item text from VIA, MFQ, PVQ or MLQ.

## 1. Principles for questions (from a real goal-setting session)

These came from a human journalling session and override "completeness" whenever they conflict.

1. **Ask the priority question first.** "When two goals clash, which gives way?" settled most later trade-offs.
2. **The user sets the depth.** Before follow-ups in an area, ask: settled, simple, or worth exploring. Only
   "worth exploring" shows the follow-ups.
3. **Confirm stored facts before reusing them.** On a retake, show the previous answer with "Still true".
4. **Ask for conditions, not only rankings.** "B beats A only if X, Y, Z" was the most useful output.
5. **Other people's choices create scenarios.** Let the user list them in plain text.
6. **Interpretation is opt-in.** State what the user said. Never volunteer readings of their psychology.
7. **Fewer, sharper questions.** Prefer a question that changes a decision over one that completes a picture.
8. **Optional areas are one checklist with a "none" option**, not a series of open prompts.

## 2. Phase 1 — data model and question set

### 2.1 Type changes (`src/types.ts`)

- `Branch = 'root' | 'worldview' | 'moral' | 'priorities' | 'identity' | 'goals'`.
- `NoteFile.dir = 'worldview' | 'moral' | 'priorities' | 'identity' | 'goals'`.
- `QuestionType` gains `'multi'` (multi-select, optional `max`, optional "None of these"). Answer value: `string[]`.
- `Question.showIf?: (responses) => boolean` — hidden questions are skipped by the runner and by progress counts.
- `Question.tagsFor?: (value) => string[]` — value-dependent tags. When present it replaces `selfTags` for
  activation; `selfTags` stays the static superset used to derive graph edges and DAG validation.
- Update `logic/graph.ts` (activation, progress, exploration) and its tests for both additions.
- Bump the persisted-store version in `store/store.ts`; on mismatch, start empty.

### 2.2 Branch test (keeps branches distinct)

| Branch | An item belongs here if it reads as | Folder |
| --- | --- | --- |
| Worldview & Beliefs | "The world / people are…" (what is true) | `worldview/` |
| Moral Principles | "One should…" (right and wrong) | `moral/` |
| Personal Priorities | "X matters more to me than Y" | `priorities/` |
| Identity & Self-concept | "I am…" | `identity/` |
| Goals & Aspirations | "I want to… by…" (concrete, dated) | `goals/` |

### 2.3 Nodes and files

Each branch node opens from `#onboarded`. Deeper nodes use OR on parent tags, as today.

| Node id | Name | Opened by | Writes to |
| --- | --- | --- | --- |
| `worldview` | Worldview & Beliefs | onboarded | `worldview/main`, topic files below |
| `agency` | Control & Luck | `agency` | `worldview/control-and-luck` |
| `society` | People & Society | `trust`, `world` | `worldview/people-and-society` |
| `moral` | Moral Principles | onboarded | `moral/main`, topic files below |
| `harm` | Harm & Rules | `harm`, `relativism` | `moral/harm-and-rules` |
| `fairness` | Fairness & Loyalty | `honesty`, `judging` | `moral/fairness-and-loyalty` |
| `family` | Family Duty | `family-duty` (M5) **or** `relationships` (G2, G4) | `moral/family-duty` |
| `priorities` | Personal Priorities | onboarded | `priorities/main` |
| `values` | What I Value | `values` | `priorities/values` |
| `clashes` | When Priorities Clash | `priority` (P1) **or** `filial-limits` (MD3) **or** `work-cost` (GC4) | `priorities/trade-offs` |
| `identity` | Identity & Self-concept | onboarded | `identity/main` |
| `tendencies` | How I Tend to Be | `self-image`, `clarity` | `identity/tendencies` |
| `becoming` | Who I Want to Be | `ideal-self`, `strengths` | `identity/becoming` |
| `goals` | Goals & Aspirations | onboarded | `goals/main` |
| `career` | Career Path | `career` | `goals/career` |
| `home` | Relationships & Home | `relationships` | `goals/relationships-and-home` |
| `more` | Other Areas | `more-areas` (G5, any pick) | `goals/main` |

`W4` also needs `worldview/knowledge`. 16 files in total: one `main` per branch plus the topic files above.

### 2.4 Items (65 core + 4 opt-in)

Formats: L = 5-point agree/disagree, C = pick one, M = pick several, R = rank, S = 0–10 slider, T = short text.
St/Fl = stable/flexible. `+c` = also ask confidence. Existing items keep their wording; old id in brackets.

**Worldview & Beliefs (13)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| W1 | worldview | My own choices matter more than luck or circumstances in shaping my life. [W1] | L | agency | St | adapted, locus of control |
| W2 | worldview | Most people can be trusted. | L | trust | St | informed, generalised trust |
| W3 | worldview | On the whole, the world is more good than dangerous. | L | world | St | informed, primal world beliefs |
| W4 | worldview | When I need to decide what is true, I mostly rely on: experts, my own experience, family or tradition, intuition, texts. [W2] | R | knowledge | St | new |
| W5 | worldview | Name one belief you've changed in the last two years. [W4] | T | worldview | Fl | new |
| WA1 | agency | Which is closer to what you believe? (pair) [PA1] | C | agency-belief | St | adapted, Rotter |
| WA2 | agency | Which is closer to what you believe? (pair) [PA2] | C | agency-belief | St | adapted, Rotter |
| WA3 | agency | People can change who they are in important ways. | L | agency-belief | St | informed, mindset |
| WA4 | agency | Think of something that went well recently. How much was you, and how much was luck or help? [PA3] | S | agency-belief | Fl | new |
| WS1 | society | In the long run, people get what they deserve. | L | society | St | informed, just-world belief |
| WS2 | society | People are mostly shaped by: their upbringing and surroundings / their own choices / what they are born with. | C | society | St | new |
| WS3 | society | Relationships last because people work at them, not because of luck or fate. | L | society | St | new |
| WS4 | society | Religion or spirituality in how I understand the world: central / some part / little or none. | C | society | St | new |

**Moral Principles (15)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | moral | If an action could harm an innocent other, then it should not be done. [E1] | L | harm | St | adapted, EPQ-5 |
| M2 | moral | What is ethical depends on the situation and culture; no rule applies everywhere. [E2] | L | relativism | St | adapted, EPQ-5 |
| M3 | moral | What matters most when you judge whether an action was right: its consequences, a rule or principle, the intentions behind it, or fairness to everyone? [E5] | R | judging | St | new |
| M4 | moral | Honesty matters even when the truth hurts someone. | L | honesty | St | new |
| M5 | moral | How much do you feel you owe your elders in time, money or career decisions? [E4] | S +c | family-duty | Fl | new |
| MH1 | harm | It is never acceptable to risk harming another person, however small the risk. [MP1] | L | harm-rules | St | adapted, EPQ-5 |
| MH2 | harm | Whether a lie is wrong depends on the circumstances around it. [MP3] | L | harm-rules | St | adapted, EPQ-5 |
| MH3 | harm | Would you break a promise to prevent minor harm to a stranger? Why or why not? [E3] | T | harm-rules | St | new |
| MF1 | fairness | A fair split is: equal for everyone / by effort / by need. | C | fairness | St | informed, moral foundations |
| MF2 | fairness | I should stand by my family or group even when they are in the wrong. | L | fairness | St | informed, moral foundations |
| MF3 | fairness | Rules and people in authority should be respected even when I disagree. | L | fairness | St | informed, moral foundations |
| MF4 | fairness | How much responsibility do you have toward people outside your family or community? [W3] | S | fairness | St | new |
| MD1 | family | I want to support my parents later in life because of what they have given me. [FR1] | L | filial | St | informed, dual filial piety |
| MD2 | family | Children should go along with their parents' wishes on major life decisions, even when they disagree. [FR2] | L | filial | St | informed, dual filial piety |
| MD3 | family | Is there a limit to what you owe your family? Where would you draw it? [FR3] | T | filial-limits | Fl | new |

**Personal Priorities (12)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | priorities | When two things you want clash, which usually wins? relationships / career / where I live / family / money / it depends | C | priority | St | new |
| P2 | priorities | Rate how important each is to you: financial success, close relationships, personal growth, recognition, community. [G3] | 5×S | values | St | adapted, Aspiration Index |
| P3 | priorities | Rank these areas by how much attention you want to give them over the next ten years. [G5] | R | life-areas | Fl | new |
| P4 | priorities | Pick the two things you most want from work: fun problems, growth, money, prestige, impact, stability, flexibility. | M (2) | work-values | Fl | new |
| P5 | priorities | What is money mainly for? comfort / security / a scoreboard / freedom to change paths later / providing for others | C | money | St | new |
| PV1 | values | Which of these matter most to you? Pick up to three: choosing my own way, achievement, security, close relationships, helping others, creativity, tradition, enjoyment, influence, adventure. | M (3) | value-pick | St | informed, Schwartz values |
| PV2 | values | Which of the same list matters least? | C | value-pick | St | informed, Schwartz values |
| PV3 | values | I would rather have: more money and less free time / less money and more free time. | C | value-pick | Fl | new |
| PC1 | clashes | If an important opportunity meant seeing your family much less for several years, you would most likely… [CA1] | C | tradeoff | Fl | new |
| PC2 | clashes | Would you take a better role if it cost time with the people closest to you? yes / only for a while / no | C | tradeoff | St | new |
| PC3 | clashes | Is there an option you rank lower that would win under certain conditions? Which conditions? | T | tradeoff | Fl | new |
| PC4 | clashes | This past month, how well did your time match your priorities? | S +c | tradeoff | Fl | new |

**Identity & Self-concept (13)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| I1 | identity | Describe yourself in three words. | T | self-image | St | new |
| I2 | identity | I have a clear sense of who I am. | L | clarity | St | informed, self-concept clarity |
| I3 | identity | Which roles matter most to who you are? Pick up to three: student, professional, son or daughter, sibling, partner, parent, friend, builder or creator, member of a community or faith. | M (3) | roles | Fl | new |
| I4 | identity | Pick three strengths: curiosity, persistence, kindness, honesty, humour, leadership, creativity, calm under pressure, fairness, discipline, courage, good with people. | M (3) | strengths | St | new |
| I5 | identity | One thing about yourself you would like to change. | T | ideal-self | Fl | new |
| IT1 | tendencies | I get energy from being around people. | L | tendency | St | informed, IPIP |
| IT2 | tendencies | I like trying new and unfamiliar things. | L | tendency | St | informed, IPIP |
| IT3 | tendencies | I plan ahead and finish what I start. | L | tendency | St | informed, IPIP |
| IT4 | tendencies | I worry about things a lot. | L | tendency | St | informed, IPIP |
| IT5 | tendencies | I would rather keep the peace than win an argument. | L | tendency | St | informed, IPIP |
| IB1 | becoming | How close are you today to the person you want to be? | S +c | becoming | Fl | informed, self-discrepancy |
| IB2 | becoming | What does that person do that you don't yet? | T | becoming | Fl | new |
| IB3 | becoming | People close to me see me the way I see myself. | L | becoming | St | new |

**Goals & Aspirations (12 + 4 opt-in)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | goals | Describe one project you are working on. How important is it? How much control do you have over it? [G1] | T + 2×S | career | Fl | adapted, Personal Projects Analysis |
| G2 | goals | Picture yourself in 10 years, with things having gone well. What are you doing? [G2] | T | career, relationships | Fl | adapted, Best Possible Self |
| G3 | goals | Your career path right now: still choosing / narrowing down a few / settled. | C | career | Fl | new |
| G4 | goals | What kind of family or relationship life do you want in the future? [G4] | T | relationships | Fl | new |
| G5 | goals | Want to look at any of these? Money goals, ageing parents, health, starting something of my own, none of these. | M | `more-areas` via `tagsFor` (not for "none") | Fl | new |
| GC1 | career | Is your career direction settled, simple (just needs doing), or worth exploring? | C | career-depth | Fl | new |
| GC2 | career | List the paths you are considering, one per line. Mark each: active, interested, untried or ruled out. | T | career-paths | Fl | new |
| GC3 | career | For one untested path, what is the cheapest test you could run in the next six months? | T | career-paths | Fl | new |
| GC4 | career | How much time with family or close people does your current work ask you to give up? [PP2] | S | work-cost | Fl | adapted, Personal Projects Analysis |
| GH1 | home | Is where and with whom you live settled, simple, or worth exploring? | C | home-depth | Fl | new |
| GH2 | home | If no one constrained you, where would you live? Would you try several places or pick one? | T | home | Fl | new |
| GH3 | home | If this depends on someone else's decision, list the realistic scenarios and what triggers each. | T | home | Fl | new |
| GM1 | more | Money: what amount or state would feel like "enough"? (shown if picked) | T | more | Fl | new |
| GM2 | more | Ageing parents: what do you expect to do, and from where? (shown if picked) | T | more | Fl | new |
| GM3 | more | Health: one thing you want to be true in five years. (shown if picked) | T | more | Fl | new |
| GM4 | more | Something of your own: what would it be, and what would have to be true to start? (shown if picked) | T | more | Fl | new |

Depth gates: `GC2`–`GC3` use `showIf(GC1 === 'explore')`; `GH2`–`GH3` use `showIf(GH1 === 'explore')`. `GC4` always shows.
Dropped from v1: MP2, MP4, CA2, PP1, AS1, AS2, ML1–ML3, old W5 (overlap or licence risk).

Each item needs `help` only where the wording is not self-evident, a one-line `why`, a `note()` generator that writes
the answer as a first-person line, and its `fileIds`.

### 2.5 Dependent data

- **Tension rules** (`data/tensions.ts`), same two-sided shape:
  1. `M5 ≥ 7` and `GC4 ≥ 6` — family duty and what work costs in family time.
  2. `P3` ranks career first and `M5 ≥ 7`.
  3. `MF4 ≥ 7` and `P2.community ≤ 3`.
  4. `PC1 = take` and `P2.relationships ≥ 8`.
  5. `P1 = relationships` and `PC2 = yes`.
  6. `PC4 ≤ 4` and `P1` answered — time does not match the stated priority.
  7. `W1 ≥ 4` (agree) and `WA4 ≤ 3` — choices matter, yet a recent success credited to luck.
  8. `I2 ≥ 4` and `IB1 ≤ 4` — clear sense of self, far from the person I want to be.
- **Retakes** (`logic/retakes.ts`): unchanged rules. In a retake, each question shows the previous answer with a
  "Still true" button (keeps the value, refreshes `answeredAt`) next to the normal input.
- **Sample profile** (`data/sampleProfile.ts`), **Ask specs** (`data/ask.ts`), **predefined summaries**
  (`data/files.ts`): rewrite for Priya against the new ids and files. Keep them as the no-AI fallback.
- `logic/ask.ts` `detectDimensions` and `DIM_LABEL`: five branches.
- Update all unit tests and `scripts/e2e-journey.cjs`.

## 3. Phase 2 — auto-apply

- `setResponse` writes the note line straight into `file.current` (insert, or replace the unlocked line with the
  same `sourceItemId`). `clearResponse` removes that line if it is unlocked and unedited.
- A locked line is never changed: keep it, add the new line after it, toast "Kept your locked line".
- Versioning: reuse the session grouping used for manual edits. One new version per file per browser session.
- Remove the answer draft flow: `submitQuestionnaire` proposals, `ProposalView` for `generated-update`, the "Review
  and save" step. The questionnaire's last step becomes a short "Done" screen listing the notes that changed.
- Keep proposals only for AI summaries and Reset topic (preview, then accept or cancel).
- Toast per answer is too noisy: show the existing unlock callout only when a new area opens.

## 4. Phase 3 — UI: declutter, colour, graph

### 4.1 Colour and type (`src/styles.css`, `components/branding.tsx`)

Starting palette. Verify contrast with a small script (text ≥ 4.5:1, UI marks ≥ 3:1) and adjust if a pair fails.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` / `--bg-sunken` | `#111317` / `#0c0e11` | workspace / top bar and tree |
| `--surface` / `-2` / `-3` | `#181b20` / `#1f232a` / `#2a2f38` | cards, hover, pressed |
| `--border` | `#2e333d` | |
| `--text` / `--text-dim` / `--text-faint` | `#e8e9ec` / `#a9adb7` / `#7d828e` | body / secondary / metadata |
| `--accent` | `#9d8cf5` (text on it `#0e1016`) | the one primary button per screen, current selection, focus ring |
| `--warn` | `#f5a524` | only things that want attention: tension count, "new" |
| `--worldview` `--moral` `--priorities` `--identity` `--goals` | `#5cb8ab` `#e38d73` `#c9cf63` `#e07fb0` `#6fa8e8` | branch identity only |
| `--ai` | `#b9a6ff` | label and left rule on AI-written text |

Rules:
- One filled accent button per screen. Everything else is a quiet outline or text button.
- Colour means one of three things: branch, AI-written, needs attention. Provenance uses icons, not colour.
- Base font 15px. Note body 16px with 1.6 line height and a 68ch measure. Metadata never below 12px.

### 4.2 Shell

- Keep top bar, tree, tabs, centre, right panel.
- **Right panel becomes one dock** with four labelled tabs: Details, Ask, Tensions, Revisit (badges in `--warn`).
  Delete the three floating buttons and floating panels; move their content into the dock tabs.
- Details tab on a node: description, one progress line, primary action, "Leads to", linked note. Drop the second
  progress line.
- Details tab on a note: provenance of the selected line and the questions that write here. Remove the duplicate
  Summarise; move Reset topic and Erase topic data into the note's "…" menu.
- Tree: show titles ("Family duty"), not slugs; branch-coloured folder dot; empty files dimmed.
- Hide the tree and dock while a questionnaire is active (focus mode), with a visible "Exit" link.

### 4.3 Notes

- Line controls (lock, delete, source chip) show on hover or focus. A locked line keeps its lock icon visible.
- Provenance icon stays in the gutter, dimmed. AI lines get the `--ai` left rule and an "AI" label.
- Merge "History" and "Changes over time" into one History view: version list on the left, diff against current on
  the right, Restore button.

### 4.4 Questionnaire

- Keep the single centred card. Add: keys 1–5 for scales, Enter for next, auto-advance after a scale or pick-one
  answer, "2 of 5" text beside the step dots.
- New inputs: `multi` chips with a max and "None of these". Retake mode shows "Last time: …  [Still true]".
- Depth-gate answers "settled" or "simple" end the node early with the Done screen.

### 4.5 Graph (`GraphView.tsx`)

- Keep d3-force, drag, pan, zoom and the living motion.
- Add a sector force: each branch gets a 72° wedge around the root, so five branches stop crossing. Cross-branch
  nodes (`family`, `clashes`) sit between their parents' wedges.
- Hover a node: dim unrelated nodes and edges. Labels fade out below a zoom threshold except branch nodes.
- Nodes use branch colours; "new" marker in `--warn`. Shorten the legend to one line.

## 5. Phase 4 — local AI (Ollama)

### 5.1 Scope

| Job | Who does what |
| --- | --- |
| Summarise a note | Code picks the unlocked generated lines; the model shortens them. |
| Tensions | Rules decide which pairs show. The model only words the sentence from the user's actual lines. |
| Ask | Code retrieves and quotes the notes. The model writes a reading only when the user clicks "Show a reading". |
| Retakes | Rules only. No model. |

With AI off or unreachable, every job falls back to today's rule-based output. AI is off by default.

### 5.2 Files

```
src/ai/provider.ts     interface LLMProvider { available(): Promise<boolean>; json<T>(req): Promise<T> }
src/ai/ollama.ts       fetch client: GET /api/tags, POST /api/chat
src/ai/prompts.ts      the system prompt and three task prompts below
src/ai/tasks.ts        summarise(), wordTension(), reading() — build input, call, validate, fall back
src/ai/validate.ts     schema check, citation check, length and phrase filters
src/ai/retrieve.ts     note-line retrieval for Ask (token overlap + branch keywords, top 12 lines)
src/ai/fake.ts         deterministic provider for unit tests
scripts/ai-eval.mjs    runs fixtures against a live Ollama and prints pass rates per model
```

Request shape (check field names against the current Ollama API docs before relying on them):
`POST {baseUrl}/api/chat` with `model`, `messages`, `stream: false`, `format: <JSON schema>`, `think: false`,
`options: { temperature: 0.2, num_ctx: 4096, num_predict: 300 }`. Timeout 60 s, one retry, then fall back.

### 5.3 Settings and consent

- New "AI" section in the data dialog: Off / Ollama, base URL (default `http://localhost:11434`), model picker
  filled from `/api/tags`, "Test connection".
- Turning it on asks a second consent: "Your notes are sent to the model running on this computer. Nothing leaves it."
- README section: `ollama pull qwen3:4b`; for the hosted Pages build set `OLLAMA_ORIGINS=https://<user>.github.io`
  before starting Ollama. From `localhost` dev no setting is needed.

### 5.4 Model

- Default `qwen3:4b`. Low-memory option `qwen3:1.7b`. Compare against `gemma3:4b` and `phi4-mini` with
  `scripts/ai-eval.mjs` and keep whichever passes most checks; the model name is a setting, not a constant.
- Thinking mode off. It adds latency and nothing these tasks need.

### 5.5 Prompts

Shared system prompt:

```
You help a person read their own journal notes.
Use only the notes you are given. Keep numbers, dates and names exactly as written.
Do not guess motives, feelings or personality. Do not give advice or a verdict.
Write short, plain sentences addressed to "you". If the notes do not say, say so.
```

Summarise — input: note lines as `[id] text`. Output schema `{ lines: [{ text, cites: [id] }] }`.

```
Shorten these notes into at most 3 lines of at most 25 words each.
Restate what is written. Add nothing. Each line lists the ids it came from.
```

Word a tension — input: line A, line B. Output schema `{ sentence }`.

```
These two notes may pull in different directions. Write one sentence of at most 30 words that
states both, starting "You said". Do not say which is right or that they conflict for certain.
```

Reading (Ask) — input: the question and up to 12 lines as `[id] text`. Output schema
`{ readings: [{ text, cites: [id] }], not_in_notes: boolean }`.

```
Answer the question using only these notes. Give at most 3 readings of at most 30 words each.
Each reading cites the ids it rests on. If the notes do not answer the question, set not_in_notes to true
and give no readings.
```

Each task prompt carries one short worked example (input and output) built from the sample profile.

### 5.6 Guards (small models invent, moralise and garble citations; code catches it)

- Output must parse against the schema. Every `cites` id must be one that was sent, and must be non-empty.
- Drop a line that exceeds the word cap or matches the phrase filter: `you should`, `you need to`, `you seem`,
  `you are a`, `this suggests you`, `diagnos`, `personality type`, `deep down`.
- If nothing survives, use the rule-based output and say "No AI reading for this one".
- The "What your notes say" block in Ask is always assembled by code from the stored lines, never by the model.
- AI summaries stay proposals: preview, accept or cancel. AI text is labelled and can be edited, locked or deleted.
- A reading disappears if a line it cites is deleted (existing behaviour; keep it).

### 5.7 Tests and eval

- Unit tests with `fake.ts`: validation drops bad citations, over-length lines and filtered phrases; fallbacks fire.
- `ai-eval.mjs`: about 15 fixtures from the sample profile. Checks per output: valid JSON, citations valid, within
  length, no filtered phrase, and no number or date that is absent from the input. Print a table per model.
- Target before calling it done: ≥ 90% of fixtures pass every check on the default model. If not reached, say so.

## 6. Phase 5 — docs and wrap-up

- Rewrite `README.md` (branches, item table, AI setup) and update `SPEC_REVIEW.md` (what Doc 1 gaps are now closed:
  values, self-concept, a monthly time-vs-priority item; what remains: monthly check-in scheduling).
- Replace `PLAN.md` with a pointer to this file once all phases are done.
- Final check: fresh journey and sample journey in the e2e script, with AI off and with the fake provider.

## 7. Out of scope

Mobile layout, accounts or sync, hosted AI, in-browser models, embeddings-based retrieval, scoring or norms,
psychologist review of items (still recommended before selling).
