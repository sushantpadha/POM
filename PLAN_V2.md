# POM v2 — implementation plan

Four goals: (A) a five-branch question set of 63 items plus a monthly check-in, (B) a calmer, more readable UI,
(C) real local AI through Ollama, (D) an opt-in experiment mode for testing the questions on real people.
Decisions already made by the owner are marked **Decided**.

How to work:

- Do the phases in order. Each phase ends with `npm run typecheck`, `npm test` and `node scripts/e2e-journey.cjs`
  green (update the tests and the e2e script as behaviour changes), then one commit.
- After any UI change, screenshot the affected screens at 1440×900 with Playwright and look at them.
- Section 2.4 is the heart of the app. Use the item wording as written. If an item fails a rule in 1.3 when you
  implement it, flag it in your report instead of silently rewriting it.
- If Ollama cannot be installed or a model cannot be pulled where you run, build Phase 4 against the fake provider,
  say plainly that the live eval was not run, and leave the eval script ready. Do not invent eval results.

## 0. Decisions and constraints

- **Decided:** keep the force-directed, Obsidian-like graph and its feel. Do not replace it with a static layout.
- **Decided:** do not go minimal. Commit `2a9278b` (journal-first UI) was reverted because it stripped too much. Keep
  the three-pane shell, the file tree, tabs and the graph. Declutter means removing duplicates and noise, not features.
- **Decided:** new colour template: more readable, and colour used to direct attention.
- **Decided:** desktop only (keep `min-width: 1100px`). No mobile work.
- **Decided:** AI runs on the user's own Ollama. No hosted API, no in-browser model.
- **Decided:** saved data may be broken. Bump the storage version and discard old data on load.
- **Decided:** every answer is applied to the notes immediately. No draft/commit step for answers.
- **Decided:** experiment mode keeps its log in the browser and the tester exports a file. No collection server.
- Core features that must survive: file tree, readable and editable notes, focused questionnaire, Ask, tensions,
  retakes, version history, locks, provenance, export/import, reset/erase topic.
- Items are our own wording. "Adapted" = paraphrase of a published item; "informed" = our wording on a published
  construct. No instrument is given in full and nothing is scored. Do not copy item text from VIA, MFQ, PVQ or MLQ.

## 1. Who the questions are for

A user is a tuple: (temperament, position in life, appetite for writing). Three characteristic users were walked
through the first draft of the item set. These are simulated walk-throughs, not user tests; see 1.4.

### 1.1 Three users

| | A — the decider | B — the reflector | C — the re-evaluator |
| --- | --- | --- | --- |
| Temperament | Pragmatic, steady, impatient with depth ("it ain't that deep") | Introspective, unsure, sensitive to being judged | Steady, slightly adrift, time-poor |
| Position | ~20, student with a first job in sight; choices about path, city, partner | ~17, still at home; few decisions are theirs yet | ~29, some years into work; a change is coming (move, marriage, ageing parents) |
| Writing | Taps freely; writes one line when it bears on a decision | Already journals; will write a paragraph if invited | Taps; a minute a month at most |
| Needs | Which goal wins, under what conditions, in which scenarios, and when to look again | Words for what they think versus what family thinks; to see themselves change | To check whether life matches what they said matters; to see what stayed the same |
| Turned off by | Abstract statements, "why" probes, being asked the same thing three ways | Work and money vocabulary, anything that reads like a verdict | Long text boxes, a quiz with no follow-through |

**Primary user: A and C.** Someone near a decision or a change who will tap readily and write one line when it
matters. Design every item for them. B is served by the same items plus room to write more (1.3).

### 1.2 What the walk-throughs found in the first draft

1. **Statements nobody disagrees with.** "If an action could harm an innocent other, it should not be done" and
   "I want to support my parents later in life" get the same answer from almost everyone. They say nothing and
   never change. Replaced by choices where a sensible person could pick either side.
2. **Abstract where it should be concrete.** Worldview and Moral read like a psychology test. A shrugged; C tapped
   through without thinking. Moral items are now small situations (a friend doing wrong, an honest opinion).
3. **One life stage's vocabulary.** "Role", "career", "project" lost B. Now "work or studies", "opportunity",
   "the main thing you are working toward".
4. **The same thing asked three ways.** Importance sliders, a values pick and a ranking all asked "what matters".
   Two near-identical family-versus-opportunity items. Cut to one each.
5. **Ten years is too far.** B cannot picture it and A would not commit. Now "an ordinary good day five years from now".
6. **Nothing to come back to.** The draft was answer-once. C needs a one-minute check-in and a plain
   "same as last time / changed" on every retake. This is what makes the record a constant to measure against.
7. **Notes that read like data.** "Most people can be trusted: Agree" is not worth re-reading. Every `note()` must
   produce a sentence the person could have written: "I mostly trust people."

### 1.3 Rules every item must pass

1. Answered in under ten seconds by a tap, or in one line of text.
2. A sensible person could sit at either end.
3. The note it writes is worth re-reading in a year.
4. It makes sense at 17, 21 and 30, or it sits behind a gate.
5. It belongs to exactly one branch (table in 2.2).
6. At most two text items in a node outside a gate, and every item can be skipped.

Design rules from the goal-setting session, kept:

- Ask the priority question first; it settles most later trade-offs. Priorities is marked "Start here" on the map.
- The user sets the depth: "settled / simple / worth exploring" gates the follow-ups in an area.
- Ask for conditions, not only rankings. Let the user list scenarios when someone else's choice decides.
- Optional areas are one checklist with "none of these".
- No item asks "why" about motives. Interpretation is opt-in.

Two features serve all three users and replace extra questions:

- **"Add a note" on every question** (collapsed link). A one-line answer in the user's own words, saved under the
  generated line as their own. B writes; A uses it for "it depends"; C ignores it.
- **Then and now.** A retake shows "Last time: … [Still true]". The Done screen lists "Same as last time: N" and each
  change as old → new. Rule-based, no AI.

### 1.4 Before selling

Have three to five real people matching A, B and C do the full set while thinking aloud, and cut or reword any item
that gets a shrug, a "what does this mean" or a skipped text box. Psychologist review is still recommended.

## 2. Phase 1 — data model and question set

### 2.1 Type changes (`src/types.ts`)

- `Branch = 'root' | 'worldview' | 'moral' | 'priorities' | 'identity' | 'goals'`.
- `NoteFile.dir = 'worldview' | 'moral' | 'priorities' | 'identity' | 'goals' | 'check-ins'`.
- `QuestionType` gains `'multi'` (multi-select, optional `max`, optional "None of these"). Answer value: `string[]`.
- `Question.showIf?: (responses) => boolean` — hidden questions are skipped by the runner and by progress counts.
- `Question.tagsFor?: (value) => string[]` — value-dependent tags. When present it replaces `selfTags` for
  activation; `selfTags` stays the static superset used to derive graph edges and DAG validation.
- `Question.log?: boolean` — each answer appends a dated line instead of replacing the previous one (check-in).
- `G1` keeps the existing `project` type with a single rating (control).
- The `checkin` node uses `branch: 'root'` (neutral colour). Export a `QUESTION_SET_VERSION` constant.
- `Response.note?: string` — the optional "Add a note" text; written as a human-provenance line under the answer.
- Update `logic/graph.ts` (activation, progress, exploration) and its tests for these additions.
- Bump the persisted-store version in `store/store.ts`; on mismatch, start empty.
- Update onboarding copy, toasts and any other text that names the old three branches.

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
| `priorities` | Personal Priorities (Start here) | onboarded | `priorities/main` |
| `trades` | What I'd Trade | `values`, `money` | `priorities/trade-offs` |
| `clashes` | When Priorities Clash | `priority` (P1) **or** `filial-limits` (MD3) **or** `work-cost` (GC5) | `priorities/trade-offs` |
| `checkin` | Monthly Check-in | `life-areas` (P2) | `check-ins/log` |
| `goals` | Goals & Aspirations | onboarded | `goals/main` |
| `career` | Work & Study Path | `career` | `goals/work-and-study` |
| `home` | Relationships & Home | `relationships`, `future` | `goals/relationships-and-home` |
| `more` | Other Areas | `more-areas` (G6, any pick) | `goals/main` |
| `identity` | Identity & Self-concept | onboarded | `identity/main` |
| `tendencies` | How I Tend to Be | `self-image`, `clarity` | `identity/tendencies` |
| `becoming` | Who I Want to Be | `strengths`, `roles` | `identity/becoming` |
| `worldview` | Worldview & Beliefs | onboarded | `worldview/main` |
| `control` | Control & Change | `agency` | `worldview/control-and-change` |
| `society` | People & Belief | `trust`, `world` | `worldview/people-and-belief` |
| `moral` | Moral Principles | onboarded | `moral/main` |
| `rules` | Rules & Exceptions | `honesty`, `judging`, `relativism` | `moral/rules-and-exceptions` |
| `fairness` | Fairness & Loyalty | `loyalty` | `moral/fairness-and-loyalty` |
| `family` | Family Duty | `family-duty` (M5) **or** `relationships` (G4) | `moral/family-duty` |

`checkin` is not part of any branch: neutral colour, and its file sits at the top of the tree. Folder order in the
tree: check-ins, worldview, moral, priorities, identity, goals.

### 2.4 Items

63 branch items, a 4-item monthly check-in and 4 opt-in one-liners. A first visit shows only the five entry nodes
(25 items, about two minutes per node); the rest opens from answers.

Formats: L = 5-point agree/disagree, C = pick one, M = pick several, R = rank, S = 0–10 slider, T = one line of text.
St/Fl = stable/flexible. `+c` = also ask confidence. Old id in brackets where the item is carried over.

**Personal Priorities (10)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | priorities | When two things you want clash, which usually wins? partner or close relationships / family / work or studies / where I live / money / it depends | C | priority | St | new |
| P2 | priorities | Rank these by the attention you want to give them over the next few years: work or studies, family, partner, friends, health, learning and hobbies. [G5] | R | life-areas | Fl | new |
| P3 | priorities | Pick up to three that matter most to you: choosing my own way, achievement, security, close relationships, helping others, creativity, tradition, enjoyment, influence, adventure. | M (3) | values | St | informed, Schwartz values |
| P4 | priorities | What is money mainly for? comfort / security / a scoreboard / freedom to change paths later / providing for others | C | money | St | new |
| P5 | priorities | Pick the two things you most want from work or studies: interesting problems, growth, money, prestige, impact, stability, flexibility. | M (2) | work-values | Fl | new |
| PT1 | trades | I would rather have: more money and less free time / less money and more free time. | C | trade | Fl | new |
| PT2 | trades | I would rather have: a stable, predictable life / an open, changing life. | C | trade | St | new |
| PT3 | trades | I would rather be: near the people I love / where the best opportunities are. | C | trade | Fl | new |
| PC1 | clashes | An important opportunity would mean seeing your family much less for several years. You would most likely: take it / take it for a limited time / turn it down. [CA1] | C | tradeoff | Fl | new |
| PC2 | clashes | Is there an option you rank lower that would win under certain conditions? Name it and the conditions. | T | tradeoff | Fl | new |

**Goals & Aspirations (14 + 4 opt-in)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | goals | What is the main thing you are working toward right now? How much of it is in your control? [G1] | T + S | career | Fl | adapted, Personal Projects Analysis |
| G2 | goals | Picture an ordinary good day five years from now. Where are you, who is around, what are you doing? [G2] | T | future | Fl | adapted, Best Possible Self |
| G3 | goals | Your work or study path right now: still choosing / narrowing down a few / settled. | C | career | Fl | new |
| G4 | goals | Which of these do you want in your life in five years? a partner I live with, marriage, children, living near my parents, close friends nearby, living abroad for a while, not sure yet. | M | relationships | Fl | new |
| G5 | goals | Is there an upcoming event that could change these answers (results, an offer, a move)? Optional. | T | goals | Fl | new |
| G6 | goals | Want to look at any of these? money goals, ageing parents, health, starting something of my own, none of these. | M | `more-areas` via `tagsFor` (not for "none") | Fl | new |
| GC1 | career | Is your work or study direction settled, simple (just needs doing), or worth exploring? | C | career-depth | Fl | new |
| GC2 | career | List the paths you are considering, one per line. Mark each: active, interested, untried or ruled out. | T | career-paths | Fl | new |
| GC3 | career | What is the honest reason your first choice is first? | T | career-paths | Fl | new |
| GC4 | career | For one untested path, what is the cheapest test you could run in the next six months? | T | career-paths | Fl | new |
| GC5 | career | How much time with the people close to you does your current work or study take away? [PP2] | S | work-cost | Fl | adapted, Personal Projects Analysis |
| GH1 | home | Is where and with whom you live settled, simple, or worth exploring? | C | home-depth | Fl | new |
| GH2 | home | If no one constrained you, where would you live? Would you try several places or pick one? | T | home | Fl | new |
| GH3 | home | If this depends on someone else's decision, list the realistic scenarios and what triggers each. | T | home | Fl | new |
| GM1 | more | Money: what amount or state would feel like "enough"? (shown if picked) | T | more | Fl | new |
| GM2 | more | Ageing parents: what do you expect to do, and from where? (shown if picked) | T | more | Fl | new |
| GM3 | more | Health: one thing you want to be true in five years. (shown if picked) | T | more | Fl | new |
| GM4 | more | Something of your own: what would it be, and what would have to be true to start? (shown if picked) | T | more | Fl | new |

Depth gates: `GC2`–`GC4` use `showIf(GC1 === 'explore')`; `GH2`–`GH3` use `showIf(GH1 === 'explore')`. `GC5` always
shows. A G5 answer is listed in the Revisit tab as a reminder to retake Goals.

**Identity & Self-concept (12)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| I1 | identity | Describe yourself in three words. | T | self-image | St | new |
| I2 | identity | Pick three strengths: curiosity, persistence, kindness, honesty, humour, leadership, creativity, calm under pressure, fairness, discipline, courage, good with people. | M (3) | strengths | St | new |
| I3 | identity | Which roles matter most to who you are? Pick up to three: student, working professional, son or daughter, sibling, partner, parent, friend, builder or creator, member of a community or faith. | M (3) | roles | Fl | new |
| I4 | identity | I have a clear sense of who I am. | L | clarity | St | informed, self-concept clarity |
| IT1 | tendencies | I get energy from being around people. | L | tendency | St | informed, IPIP |
| IT2 | tendencies | I like trying new and unfamiliar things. | L | tendency | St | informed, IPIP |
| IT3 | tendencies | I plan ahead and finish what I start. | L | tendency | St | informed, IPIP |
| IT4 | tendencies | I worry about things a lot. | L | tendency | St | informed, IPIP |
| IT5 | tendencies | I would rather keep the peace than win an argument. | L | tendency | St | informed, IPIP |
| IB1 | becoming | When do you feel most like yourself? | T | becoming | St | new |
| IB2 | becoming | One thing about yourself you struggle with or want to get better at. | T | becoming | Fl | new |
| IB3 | becoming | People close to me see me the way I see myself. | L | becoming | St | new |

**Worldview & Beliefs (13)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| W1 | worldview | My own choices matter more than luck or circumstances in shaping my life. [W1] | L | agency | St | adapted, locus of control |
| W2 | worldview | Most people can be trusted. | L | trust | St | informed, generalised trust |
| W3 | worldview | On the whole, the world is more good than dangerous. | L | world | St | informed, primal world beliefs |
| W4 | worldview | Hard work usually pays off. | L | agency | St | new |
| W5 | worldview | Name one belief you've changed in the last two years. [W4] | T | worldview | Fl | new |
| WC1 | control | Which is closer to what you believe? (one forced-choice pair) [PA1] | C | agency-belief | St | adapted, Rotter |
| WC2 | control | People can change who they are in important ways. | L | agency-belief | St | informed, mindset |
| WC3 | control | Think of something that went well recently. How much was you, and how much was luck or help? [PA3] | S | agency-belief | Fl | new |
| WS1 | society | People are mostly shaped by: their upbringing and surroundings / their own choices / what they are born with. | C | society | St | new |
| WS2 | society | A lasting relationship is mostly: finding the right person / building it together. | C | society | St | new |
| WS3 | society | Religion or spirituality in how I understand the world: central / some part / little or none. | C | society | St | new |
| WS4 | society | When you need to decide what is true, what do you trust most? experts / my own experience / family or tradition / intuition / texts [W2] | C | society | St | new |
| WS5 | society | Something I believe that my family or most people around me don't. | T | society | Fl | new |

**Moral Principles (14)**

| Id | Node | Item | Fmt | Tag | Type | Source |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | moral | A close friend is doing something clearly wrong, such as cheating or lying to someone. You: stay out of it / talk to them / tell someone who can stop it. | C | loyalty | St | new |
| M2 | moral | A friend shows you work they are proud of, and it isn't good. You: say so plainly / soften it / say it's good. | C | honesty | St | new |
| M3 | moral | When you judge whether something was right, what counts most? what it led to / whether a rule or promise was kept / what the person meant / whether it was fair to everyone [E5] | C | judging | St | new |
| M4 | moral | What is ethical depends on the situation and culture; no rule applies everywhere. [E2] | L | relativism | St | adapted, EPQ-5 |
| M5 | moral | How much do you feel you owe your parents or elders in time, money or big decisions? [E4] | S +c | family-duty | Fl | new |
| MR1 | rules | Doing the right thing sometimes means accepting that someone will be hurt. [MP2] | L | rules | St | adapted, EPQ-5 |
| MR2 | rules | Would you break a promise to prevent a small harm to a stranger? yes / no / depends on the promise [E3] | C | rules | St | new |
| MR3 | rules | Is there something you would never do, whatever the reason? | T | rules | St | new |
| MF1 | fairness | A fair split is: equal for everyone / by effort / by need. | C | fairness | St | informed, moral foundations |
| MF2 | fairness | I should stand by my family or group even when they are in the wrong. | L | fairness | St | informed, moral foundations |
| MF3 | fairness | How much responsibility do you have toward people outside your family or community? [W3] | S | fairness | St | new |
| MD1 | family | What I do for my parents comes mostly from: love / gratitude / duty / what others expect. | C | filial | St | informed, dual filial piety |
| MD2 | family | Children should go along with their parents' wishes on major life decisions, even when they disagree. [FR2] | L | filial | St | informed, dual filial piety |
| MD3 | family | Is there a limit to what you owe your family? Where would you draw it? [FR3] | T | filial-limits | Fl | new |

**Monthly check-in (4)** — `log: true`, suggested again after 30 days, about one minute.

| Id | Item | Fmt |
| --- | --- | --- |
| C1 | Which area got most of your time this month? (the six areas from P2) | C |
| C2 | How well did your time match your priorities? | S |
| C3 | How close do you feel to the person you want to be? | S |
| C4 | Did anything change this month? Optional. | T |

Dropped from v1: E1, MP1, MP3, MP4, FR1, CA2, G3 (importance sliders), G4 (text form), PP1, AS1, AS2, ML1–ML3,
old W5, PA2. Reasons: no real disagreement, overlap, or licence risk.

Each item needs a one-line `why`, `help` only where the wording is not self-evident, an example placeholder on text
items, its `fileIds`, and a `note()` that writes a natural first-person sentence (rule 3 in 1.3).

### 2.5 Dependent data

- **Tension rules** (`data/tensions.ts`), same two-sided shape:
  1. `M5 ≥ 7` and `GC5 ≥ 6` — what I owe family, and what work costs in time with them.
  2. `P2` ranks work or studies first and `M5 ≥ 7`.
  3. `P2`'s first-ranked area differs from `C1` in the latest check-in — where I want my attention, and where the
     time went.
  4. `PC1 = take` and `P1` is family, or partner or close relationships.
  5. `P1 = partner or close relationships` and `PT3 = where the best opportunities are`.
  6. `P3` includes security and `PT2 = an open, changing life`.
  7. `W1 ≥ 4` (agree) and `WC3 ≤ 3` — choices matter, yet a recent success credited to luck.
  8. `I4 ≥ 4` and latest `C3 ≤ 4` — clear sense of self, far from the person I want to be.
- **Retakes** (`logic/retakes.ts`): existing rules, plus the check-in after 30 days and any G5 event note. In a
  retake, each question shows the previous answer with "Still true" (keeps the value, refreshes `answeredAt`).
- **Then and now:** the Done screen counts unchanged answers and lists changed ones as old → new, from
  `Response.history`.
- **Sample profile** (`data/sampleProfile.ts`), **Ask specs** (`data/ask.ts`), **predefined summaries**
  (`data/files.ts`): rewrite for Priya against the new ids and files, including three past check-ins. Keep them as
  the no-AI fallback.
- `logic/ask.ts` `detectDimensions` and `DIM_LABEL`: five branches.
- Update all unit tests and `scripts/e2e-journey.cjs`.

## 3. Phase 2 — auto-apply

- `setResponse` writes the note line straight into `file.current` (insert, or replace the unlocked line with the
  same `sourceItemId`). `clearResponse` removes that line if it is unlocked and unedited.
- Timing: taps apply at once, sliders on release, text on blur or Next (not per keystroke).
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
- Revisit tab lists the monthly check-in when due, and any "upcoming event" note from G5.
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
- Every question has a collapsed "Add a note" link for one line in the user's own words.
- The Done screen shows "Same as last time: N" and each changed answer as old → new.
- The map marks Personal Priorities "Start here" until it has an answer.
- Depth-gate answers "settled" or "simple" hide that area's follow-ups (`showIf`); items outside the gate still show.

### 4.5 Graph (`GraphView.tsx`)

- Keep d3-force, drag, pan, zoom and the living motion.
- Add a sector force: each branch gets a 72° wedge around the root, so five branches stop crossing. Cross-branch
  nodes (`family`, `clashes`) sit between their parents' wedges; `checkin` sits beside Priorities.
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
- Update the onboarding "Your data & AI" step to say the same.
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

## 6. Phase 5 — experiment mode

Purpose: learn from real testers which items work (section 1.4). Off by default. It does not depend on Phase 4;
AI events are logged only when AI exists.

- **Where:** data dialog → Advanced options → one checkbox, "Experiment mode".
- **The one line under it:** "Records every answer, note and click with timestamps in this browser, so you can
  export it and share it with the research team. Nothing is sent automatically."
- **Storage:** an append-only event log under its own `localStorage` key, separate from the profile. Cap at 5,000
  events; at the cap, stop logging and say so. No server (the app has none).
- **Identity:** a random participant id made when the mode is turned on. The display name is never logged.
- **Events** (`src/logic/experiment.ts`, one `log(event)` call from the store actions), each with timestamp and id:
  - session start and end, app version, question-set version, AI on or off and model name;
  - question shown, answered (value, confidence, milliseconds from shown to answered), changed, cleared, skipped;
  - "Add a note" used (the text), "Still true" used, depth-gate choice, questionnaire finished or abandoned (at which item);
  - area opened, note opened, line added, edited, locked or deleted (the text for added and edited lines);
  - dock tab opened, tension viewed or dismissed, retake accepted or deferred, check-in completed;
  - Ask question text, whether a reading was requested, AI output shown, and whether it was accepted, edited or rejected.
- **Export:** "Export experiment log" downloads one JSON file. The normal data export stays separate and unchanged.
- **Turning it off:** stops logging at once and offers "Delete the log" or "Keep it for export".
- **Sample profile:** never logged.
- **Summary script:** `scripts/experiment-summary.mjs` reads one or more exported logs and prints, per item: times
  shown, answered, skipped, median seconds to answer, share that used "Add a note", share changed on retake. This is
  the table that decides which items to cut.
- **Tests:** nothing is logged with the mode off; events are logged with it on; the cap holds; delete empties the key.


## 7. Phase 6 — docs and wrap-up

- Rewrite `README.md` (branches, item table, AI setup) and update `SPEC_REVIEW.md` (what Doc 1 gaps are now closed:
  values, self-concept, the monthly check-in, what stayed the same across retakes; what remains: reminders outside the app).
- Replace `PLAN.md` with a pointer to this file once all phases are done.
- Final check: fresh journey and sample journey in the e2e script, with AI off and with the fake provider.

## 8. Out of scope

Mobile layout, accounts or sync, hosted AI, a server that collects experiment logs, in-browser models, embeddings-based retrieval, scoring or norms,
psychologist review of items (still recommended before selling).
