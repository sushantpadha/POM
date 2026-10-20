# Personal Operating Model — build plan

Frontend-only prototype (Vite + React + TypeScript, Zustand store persisted to
`localStorage`). No backend, no auth, no real AI: every "AI" output is
predefined or rule-based and labelled as simulated.

## Foundational data model (built first)

| Concept | Shape | Notes |
| --- | --- | --- |
| Question | `id`, `nodeId`, `selfTags[]`, `stability` (stable/flexible), `source` (research-informed / adapted / exploratory), `type`, optional confidence, note template | Answering a question activates its `selfTags`. |
| Node | `id`, `name`, `tag`, `parentTags[]`, `fileId`, `branch` | Node is **available** iff any `parentTag` is active (OR semantics). Root is always available. |
| Edge | derived: `P → C` iff some question in `P` emits a tag in `C.parentTags` | Graph validated as a DAG at startup (Kahn's algorithm); nodes are keyed by id so multiple parents instantiate a node once. |
| Response | `value`, `confidence?`, `answeredAt`, history of prior values | Unlock state is *derived* from responses — never stored separately. |
| File | `current` version + `history` (max 5) + optional `proposal` | Versioning is per file. |
| Entry | `id`, `createdAt`, `updatedAt`, `provenance` (human/auto/ai), `sourceItemId?`, `locked` | Locked entries are preserved by every automatic update and summary. |

## Task list

### Pass 0 — plan
- [x] Data model + task list (this file)

### Pass 1 — foundation
- [x] Project scaffold, dark design tokens, app shell (top bar, explorer, workspace tabs, context panel)
- [x] Question bank for Ethics / Worldview / Long-term goals + deeper nodes, with tags, stability, source labels
- [x] Graph logic: derived edges, DAG validation, OR-tag unlocking, depth, descendants, progress + exploration metrics
- [x] Unit tests for graph logic
- [x] Interactive SVG graph (d3-force layout): pan, zoom, drag, select, hover-highlight, reset view, node states, legend
- [x] Node context panel (description, dates, progress, notes link, take/retake, changes, tensions)
- [x] Onboarding + preliminary consent on the root node → reveals three branches
- [x] Questionnaire runner: agreement scales, choice, ranking, text, goal entry; confidence; skip; live unlock feedback; submit summary
- [x] File explorer + note editor (rich-text-like lines, add/edit human notes, wikilinks)
- [x] Demo chooser: fresh start vs. sample profile ("Priya", ~7 months of use)

### Pass 2 — maintenance layer
- [ ] Provenance icons (hand / pencil / robot), per-line lock, entry metadata
- [ ] File versioning (current + 5), history viewer, compare with current
- [ ] Generated-update proposals after a questionnaire (preview → Commit / Cancel), locked lines protected
- [ ] Simulated summarisation proposal (locked lines kept verbatim)
- [ ] Changes over time (single file, vs. current)
- [ ] Potential tensions (across files): inspect, add context, dismiss, linked retakes by tag
- [ ] Suggested retakes (★): open / retake / defer
- [ ] Ask the model (?): staged retrieval simulation, citations to files/entries/assessment items, disclaimer
- [ ] Reset topic vs. Erase topic data dialogs
- [ ] Unit tests for notes logic; end-to-end journey check in a headless browser
