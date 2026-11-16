# AI eval results (PLAN_V2 5.7)

`node scripts/ai-eval.mjs <models…>` runs 15 fixtures built from the sample profile (5 summaries, 4 tension wordings,
6 Ask readings, the last of which the notes cannot answer) against a live Ollama. Each raw output is checked for: valid
JSON matching the schema, valid citations, length caps, no filtered phrase, and no number or date absent from the input.
A fixture passes only if every check passes. Target: at least 90% on the default model.

## Run of 16 Nov 2026

Ollama 0.40.16, CPU only (4 cores, no GPU), one run per model, `temperature 0.2`, thinking off. Times include model
loading for the first fixture.

| model      | all checks  | json  | citations | length | phrases | facts | time |
| ---------- | ----------- | ----- | --------- | ------ | ------- | ----- | ---- |
| qwen3:4b   | 11/15 (73%) | 14/15 | 15/15     | 14/15  | 15/15   | 13/15 | 422s |
| qwen3:1.7b | 12/15 (80%) | 14/15 | 15/15     | 14/15  | 15/15   | 14/15 | 160s |
| gemma3:4b  | 11/15 (73%) | 13/15 | 13/15     | 13/15  | 12/15   | 11/15 | 386s |
| phi4-mini  | 14/15 (93%) | 14/15 | 14/15     | 14/15  | 14/15   | 14/15 | 264s |

**Default model: `phi4-mini`**, the only one of the four that met the 90% target. The plan's starting default,
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
