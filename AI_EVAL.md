# AI eval results (PLAN_V2 5.7)

`node scripts/ai-eval.mjs <models…>` runs 15 fixtures built from the sample profile (5 summaries, 4 tension wordings,
6 Ask readings, the last of which the notes cannot answer) against a live Ollama. Each raw output is checked for: valid
JSON matching the schema, valid citations, length caps, no filtered phrase, and no number or date absent from the input.
A fixture passes only if every check passes. Target: at least 90% on the default model.

## Current result and default model

With the final checks (the plan's phrase list, plus advice given as a command, e.g. “Consider…”, “Explore…”), passes
out of 15 per run:

| model      | runs              | mean | note |
| ---------- | ----------------- | ---- | ---- |
| qwen3:1.7b | 12                | 12   | also 12 in both earlier runs; fastest (~100 s per round on CPU) |
| gemma3:4b  | 12                | 12   | most invented numbers and phrases across runs |
| qwen3:4b   | 11, 10/13*        | ~11  | the plan's starting default |
| phi4-mini  | 11, 9, 10, 11     | 10.3 | 14 and 13 in earlier runs with looser checks: high variance |

\* stopped part-way.

**No model meets the 90% target. Default: `qwen3:1.7b`**, the most consistent and the fastest; the model name is a
setting. Every failure listed below is caught by the guards in the app (the line is dropped, or the rule-based output is
used with “No AI reading for this one”), so a weaker model costs coverage, not safety. One run of 15 fixtures moves by
two or three passes between runs; use `RUNS=3` when comparing models.

## Second run, with the stricter advice check (current)

After the first run, a live walk-through in the app showed phi4-mini answering “What should I think about before
deciding on the Zurich offer?” with three commands (“Consider…”, “Reflect on…”, “Think about…”). PLAN_V2's phrase list
(“you should”, “you need to”, …) does not catch advice given as a command, so the guard now also rejects lines that
start with one (`ADVICE_START` in `src/ai/validate.ts`). The eval uses the same checks, so it was re-run:

| model      | all checks  | json  | citations | length | phrases | facts | time |
| ---------- | ----------- | ----- | --------- | ------ | ------- | ----- | ---- |
| phi4-mini  | 13/15 (87%) | 15/15 | 15/15     | 15/15  | 13/15   | 15/15 | 182s |
| qwen3:4b   | 11/15 (73%) | 14/15 | 15/15     | 14/15  | 13/15   | 14/15 | 252s |
| qwen3:1.7b | 12/15 (80%) | 14/15 | 15/15     | 14/15  | 15/15   | 14/15 | 105s |
| gemma3:4b  | 12/15 (80%) | 14/15 | 14/15     | 14/15  | 13/15   | 12/15 | 239s |

**No model meets the 90% target under the stricter check.** phi4-mini still passes the most fixtures and stays the
default. Its two failures: a summary that turned “I want to give most attention to work or studies…” into “Prioritize
work/studies…”, and the Zurich reading above. In the app both are dropped by the guard (the summary falls back to the
rule-based one; the reading shows only lines that pass, or “No AI reading for this one”). This time phi4-mini handled
the unanswerable question correctly, which shows how much one run varies.

The Zurich question is one of the sample's example questions in Ask, carried over from v1, and it asks for advice. It
was kept as a fixture on purpose: it is the case where small models are most likely to give advice.

## First run (before the advice check)

Ollama 0.40.16, CPU only (4 cores, no GPU), one run per model, `temperature 0.2`, thinking off. Times include model
loading for the first fixture.

| model      | all checks  | json  | citations | length | phrases | facts | time |
| ---------- | ----------- | ----- | --------- | ------ | ------- | ----- | ---- |
| qwen3:4b   | 11/15 (73%) | 14/15 | 15/15     | 14/15  | 15/15   | 13/15 | 422s |
| qwen3:1.7b | 12/15 (80%) | 14/15 | 15/15     | 14/15  | 15/15   | 14/15 | 160s |
| gemma3:4b  | 11/15 (73%) | 13/15 | 13/15     | 13/15  | 12/15   | 11/15 | 386s |
| phi4-mini  | 14/15 (93%) | 14/15 | 14/15     | 14/15  | 14/15   | 14/15 | 264s |

In this run phi4-mini was the only one of the four that met the 90% target. The plan's starting default,
`qwen3:4b`, did not (73%; an earlier run gave 67%, one failure of which was a false positive in our phrase filter, since
fixed). `qwen3:1.7b` stays as the low-memory option.

What failed:

- **The unanswerable question** (“Which city do I want to retire in…”) failed on every model. The qwen3 and gemma3
  models answered it with readings drawn from nearby notes instead of setting `not_in_notes`. phi4-mini did set
  `not_in_notes: true` but also sent one uncited line, which the prompt forbids; the app shows “Your notes do not answer
  this question” in that case. Readings only appear when the user clicks “Show a reading”, and each must cite real lines.
- qwen3 (both sizes): turned “6 out of 10” into “60%” in a summary (an invented number).
- qwen3:4b: a 31-word tension sentence (cap 30); a reading that worked out “6 to luck” from “4 out of 10” (a number not
  in the notes).
- qwen3:1.7b: an over-length reading.
- gemma3:4b: one summary cut off mid-JSON; “you should” in a reading; “8/10” and “7/10” added to a tension sentence
  whose notes had no numbers.

Caveats: 15 fixtures and one run per model is a small sample; results moved by one fixture between two runs of
`qwen3:4b`. All failures above are caught by the guards in the app (the line is dropped, or the rule-based output is
used), so a weaker model costs coverage, not safety. Re-run the eval on the machine and models you will actually use.
