// Runs the AI eval fixtures (src/ai/eval.ts) against a live Ollama and prints pass rates per model.
//
//   node scripts/ai-eval.mjs                         # default model phi4-mini
//   node scripts/ai-eval.mjs phi4-mini qwen3:4b      # compare several
//   OLLAMA_URL=http://localhost:11434 VERBOSE=1 node scripts/ai-eval.mjs
//
// Checks per output: valid JSON (matching the schema), citations valid, within length, no
// filtered phrase, and no number or date absent from the input. Target: >= 90% of fixtures pass
// every check on the default model (PLAN_V2 5.7).
import { createServer } from 'vite';

const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
const models = process.argv.slice(2).length ? process.argv.slice(2) : ['phi4-mini'];
const verbose = !!process.env.VERBOSE;

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
try {
  const { fixtures, runFixtures, CHECK_NAMES } = await vite.ssrLoadModule('/src/ai/eval.ts');
  const { OllamaProvider } = await vite.ssrLoadModule('/src/ai/ollama.ts');
  const list = fixtures();
  console.log(`${list.length} fixtures, Ollama at ${baseUrl}\n`);

  const summary = [];
  for (const model of models) {
    const provider = new OllamaProvider(baseUrl, model, fetch, 120_000);
    if (!(await provider.available())) {
      console.log(`${model}: not available (is Ollama running, and was the model pulled?)\n`);
      summary.push({ model, skipped: true });
      continue;
    }
    console.log(`── ${model}`);
    const results = await runFixtures(provider, list, (r) => {
      const failed = CHECK_NAMES.filter((k) => !r.checks[k]);
      console.log(`  ${r.pass ? 'pass' : 'FAIL'}  ${String(Math.round(r.ms / 100) / 10).padStart(5)}s  ${r.fixture}${failed.length ? `  [${failed.join(', ')}]` : ''}${r.error ? `  error: ${r.error}` : ''}`);
      if (verbose || !r.pass) console.log(`        ${JSON.stringify(r.raw ?? null).slice(0, 400)}`);
    });
    const per = Object.fromEntries(CHECK_NAMES.map((k) => [k, results.filter((r) => r.checks[k]).length]));
    const passed = results.filter((r) => r.pass).length;
    summary.push({ model, passed, total: results.length, per, seconds: results.reduce((s, r) => s + r.ms, 0) / 1000 });
    console.log('');
  }

  const head = ['model', 'all checks', ...CHECK_NAMES, 'time'];
  const rows = summary.map((s) =>
    s.skipped
      ? [s.model, 'not available', ...CHECK_NAMES.map(() => ''), '']
      : [s.model, `${s.passed}/${s.total} (${Math.round((100 * s.passed) / s.total)}%)`, ...CHECK_NAMES.map((k) => `${s.per[k]}/${s.total}`), `${Math.round(s.seconds)}s`],
  );
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (r) => '| ' + r.map((c, i) => String(c).padEnd(widths[i])).join(' | ') + ' |';
  console.log(line(head));
  console.log('| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |');
  rows.forEach((r) => console.log(line(r)));
  const def = summary[0];
  if (def && !def.skipped) {
    const pct = (100 * def.passed) / def.total;
    console.log(`\n${def.model}: ${pct >= 90 ? 'meets' : 'does NOT meet'} the 90% target (${Math.round(pct)}%).`);
  }
} finally {
  await vite.close();
}
