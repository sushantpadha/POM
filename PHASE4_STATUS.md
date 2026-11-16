# Phase 4 status (work in progress)

Paused mid-Phase 4 at the user's request. Phases 1–3 are done and committed.

Done in Phase 4:
- `src/ai/`: provider, Ollama client, prompts (as in PLAN_V2 5.5), guards, retrieval, tasks, fake provider, eval fixtures.
- `scripts/ai-eval.mjs`: runs the 15 fixtures against a live Ollama, prints a table per model.
- App: AI settings with second consent in the "Your data" dialog; onboarding "Your data & AI" step;
  AI summaries (still drafts), AI-worded tensions, "Show a reading" in Ask. Fallback to rules when AI is off or fails.
- Unit tests (56 pass) and an e2e block using the fake provider (passed before the last guard change).

Live eval (Ollama 0.40.16, CPU only), qwen3:4b, one run: 10/15 (67%), below the 90% target.
One of the 5 failures was a false positive in the phrase guard ("diagnostics" in the user's own notes);
the guard now exempts words that appear in the input. The other 4 were real (6/10 turned into "60%",
a 31-word tension sentence, "You should consider…", not setting not_in_notes on an unanswerable question).
The comparison run (qwen3:4b, qwen3:1.7b, gemma3:4b, phi4-mini) was stopped before it finished.

Left to do in Phase 4:
1. Re-run `node scripts/ai-eval.mjs qwen3:4b qwen3:1.7b gemma3:4b phi4-mini` and record the table.
2. Re-run typecheck, unit tests and `node scripts/e2e-journey.cjs` after the guard change.
3. README section: `ollama pull qwen3:4b`; for the hosted Pages build set `OLLAMA_ORIGINS=https://<user>.github.io`.
4. Final Phase 4 commit; delete this file.

Then Phase 5 (experiment mode) and Phase 6 (docs).
