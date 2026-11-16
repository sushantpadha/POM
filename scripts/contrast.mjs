// Checks the colour tokens in src/styles.css against WCAG 2 contrast ratios (PLAN_V2 4.1):
// text ≥ 4.5:1, UI marks (accent ring, branch dots, graph strokes) ≥ 3:1.
// Usage: node scripts/contrast.mjs   (exits 1 if any pair fails)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const tokens = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const backgrounds = ['bg', 'bg-sunken', 'surface', 'surface-2'];
const checks = [];
// Body, secondary and metadata text on every background they appear on.
for (const fg of ['text', 'text-dim', 'text-faint']) for (const bg of backgrounds) checks.push([fg, bg, 4.5, 'text']);
for (const fg of ['text', 'text-dim']) checks.push([fg, 'surface-3', 4.5, 'text']);
// Text on filled colour.
checks.push(['on-accent', 'accent', 4.5, 'text']);
checks.push(['on-warn', 'warn', 4.5, 'text']);
// Coloured text: the AI label, "new" / "start here", destructive buttons, links in the accent.
for (const bg of ['bg', 'surface', 'surface-2']) {
  checks.push(['ai', bg, 4.5, 'text']);
  checks.push(['warn', bg, 4.5, 'text']);
  checks.push(['danger', bg, 4.5, 'text']);
  checks.push(['accent', bg, 4.5, 'text']);
}
// UI marks: focus ring, branch colours (dots, graph nodes, progress bars).
for (const fg of ['accent', 'worldview', 'moral', 'priorities', 'identity', 'goals', 'root']) {
  for (const bg of ['bg', 'bg-sunken', 'surface']) checks.push([fg, bg, 3, 'mark']);
}

let failed = 0;
const rows = checks.map(([fg, bg, min, kind]) => {
  if (!tokens[fg] || !tokens[bg]) throw new Error(`Missing token --${fg} or --${bg}`);
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  return `${ok ? 'ok  ' : 'FAIL'} ${kind.padEnd(4)} --${fg.padEnd(11)} on --${bg.padEnd(10)} ${r.toFixed(2).padStart(5)} (min ${min})`;
});
console.log(rows.join('\n'));
console.log(failed ? `\n${failed} pair(s) below the minimum.` : `\nAll ${checks.length} pairs pass.`);
process.exit(failed ? 1 : 0);
