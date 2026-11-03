// End-to-end journey check (headless Chromium via Playwright).
// Usage: npm run dev, then: node scripts/e2e-journey.cjs  (requires the 'playwright' package)
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const { chromium } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
const clickNode = async (page, id) => {
  await page.click('button[title="Fit to screen"]');
  await page.waitForTimeout(150);
  await page.click(`[data-node="${id}"] circle >> nth=-1`, { force: true });
};
const nodeClass = (page, id) => page.getAttribute(`[data-node="${id}"]`, 'class');
const shot = (page, name) => process.env.SHOTS && page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await shot(page, '01-chooser');

  // ── Fresh journey ──
  await page.click('text=Start fresh');
  assert(await page.$$eval('[data-node]', (n) => n.length) === 4, 'only the root and three closed branches before consent');
  await page.click('.context-panel button:has-text("Start")');
  await page.fill('.name-field input', 'Sam');
  await shot(page, '02-onboarding');
  for (let i = 0; i < 3; i++) await page.click('.onb-nav button.primary');
  assert(await page.isDisabled('text=Agree and continue'), 'cannot continue without consent');
  await page.click('text=I agree to my answers');
  await page.click('text=I understand this is not a clinical tool');
  await page.click('text=Agree and continue');
  await page.waitForTimeout(800);
  assert((await page.textContent('.profile-pill')).includes('Sam'), 'name shown in the top bar');
  for (const id of ['ethics', 'worldview', 'goals']) assert((await nodeClass(page, id)).includes('available'), `${id} opened`);
  assert((await nodeClass(page, 'family')).includes('locked'), 'Family Relationships not open yet');

  await clickNode(page, 'ethics');
  await page.click('.context-panel button:has-text("Answer questions")');
  await page.click('.likert button >> nth=3'); // E1: Agree
  assert(await page.isVisible('.unlock-callout:has-text("Moral Principles")'), 'E1 (#idealism) opens Moral Principles');
  await shot(page, '03-question');
  await page.click('.qn-nav-item >> nth=1'); // E2: Neither
  await page.click('.likert button >> nth=2');
  await page.click('.qn-nav-item >> nth=3'); // E4 slider
  await page.locator('.q-input input[type=range]').fill('8');
  assert(await page.isVisible('.unlock-callout:has-text("Family Relationships")'), 'E4 (#family-duty) opens Family Relationships');
  await page.click('.qn-nav-item:has-text("Review and save")');
  await page.click('.qn-foot button.primary');
  const drafts = await page.$$eval('.done-section .link-row .mono', (n) => n.map((x) => x.textContent));
  assert(drafts.includes('ethics/moral-principles') && drafts.includes('ethics/family-obligations'), `answers write to the files Doc 2 names (${drafts.join(', ')})`);
  await page.click('.done-section .link-row:has-text("ethics/moral-principles")');
  assert(await page.isVisible('.proposal-bar'), 'note changes shown as a draft first');
  await shot(page, '04-draft');
  await page.click('.proposal-bar button:has-text("Commit")');
  assert((await page.$$eval('.entries .entry', (n) => n.length)) >= 2, 'draft committed into the file');

  await page.click('.entries .entry >> nth=1 >> .entry-text');
  await page.fill('.entry-edit textarea', '- Least harm overall is my main test, but not the only one.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entries .entry >> nth=1 >> .prov.human'), 'edited line becomes written-by-you');
  await page.fill('.add-line input', 'I want to understand where my limits are.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entry-text:has-text("where my limits are")'), 'own note added');
  await shot(page, '05-notes');

  // Retake E2 with a different answer after locking its line: the lock must hold.
  const e2line = page.locator('.entries .entry', { hasText: 'undecided on whether ethics' });
  await e2line.hover();
  await e2line.locator('.lock-btn').click();
  assert(await e2line.evaluate((n) => n.classList.contains('locked')), 'line locked');
  await page.click('.tab:has-text("Ethics")');
  await page.click('.qn-nav-item >> nth=1');
  await page.click('.likert button >> nth=4');
  await page.click('.qn-nav-item:has-text("Review and save")');
  await page.click('.qn-foot button.primary');
  await page.click('.done-section .link-row:has-text("ethics/moral-principles")');
  assert(await page.isVisible('.diff-tag:has-text("locked")'), 'locked line kept in the new draft');
  await page.click('.proposal-bar button:has-text("Cancel")');
  assert(!(await page.isVisible('.proposal-bar')), 'cancel discards the draft');

  await page.click('[data-file="ethics/main"]');
  await page.click('.file-toolbar button:has-text("Summarise")');
  assert(await page.isVisible('.proposal-bar:has-text("Draft summary")'), 'main file summary drafted from the topic files');
  await page.click('.proposal-bar button:has-text("Commit")');
  assert(await page.isVisible('.entry-text:has-text("Moral principles:")'), 'summary committed to ethics/main');
  await page.click('[data-file="ethics/moral-principles"]');
  await page.click('.seg button:has-text("History")');
  await shot(page, '06-history');
  await page.click('.seg button:has-text("Changes over time")');
  await shot(page, '07-changes');

  await page.click('.tab:has-text("Graph")');
  await page.waitForTimeout(900);
  assert((await nodeClass(page, 'moral')).includes('available'), 'Moral Principles open on the graph');
  assert((await nodeClass(page, 'family')).includes('available'), 'Family Relationships open on the graph');
  assert((await nodeClass(page, 'ethics')).includes('answered'), 'Ethics answered');
  await shot(page, '08-graph');

  // ── Sample profile ──
  await page.click('.profile-pill');
  await page.click('text=Load sample profile');
  await page.waitForTimeout(900);
  await shot(page, '09-sample-graph');
  await page.click('.fab[aria-label="Potential tensions"]');
  assert((await page.$$eval('[data-tension]', (n) => n.length)) === 3, '3 potential tensions in the sample');
  await shot(page, '10-tensions');
  await page.click('[data-tension="family-vs-project"] button:has-text("Dismiss")');
  assert((await page.$$eval('[data-tension]', (n) => n.length)) === 2, 'dismiss hides a tension');
  await page.click('.fab[aria-label="Suggested retakes"]');
  assert((await page.$$eval('[data-retake]', (n) => n.length)) >= 2, 'retake suggestions listed');
  await shot(page, '11-retakes');
  await page.click('.fab[aria-label="Ask your model"]');
  await page.click('.example >> nth=0');
  await page.waitForTimeout(3500);
  assert(await page.isVisible('.answer-block.interp'), 'ask shows an interpretation');
  await shot(page, '12-ask');
  await page.click('.answer-block.reported .cite >> nth=0');
  await page.waitForTimeout(300);
  assert(await page.isVisible('.entry.flash'), 'citation opens and highlights the note');
  await page.click('.fab[aria-label="Ask your model"]');

  await page.click('.tab:has-text("Graph")');
  await page.waitForTimeout(500);
  assert((await nodeClass(page, 'meaning')).includes('locked'), 'Meaning in Life not open yet');
  await clickNode(page, 'aspirations');
  await page.click('.context-panel button:has-text("Answer questions")');
  await page.click('.qn-nav-item >> nth=1');
  await page.click('.choice:has-text("Recognition")');
  assert(await page.isVisible('.unlock-callout:has-text("Meaning in Life")'), 'AS2 opens Meaning in Life (its second parent)');

  await page.click('.tab:has-text("Graph")');
  await clickNode(page, 'tradeoffs');
  await page.click('.context-panel button:has-text("Answer questions")');
  await page.click('.choice:has-text("Take it")');
  await page.click('.qn-nav-item:has-text("Review and save")');
  await page.click('.qn-foot button.primary');
  await page.click('.done-section .link-row:has-text("ethics/family-obligations")');
  await page.click('.proposal-bar button:has-text("Commit")');
  await page.click('.fab[aria-label="Potential tensions"]');
  assert(await page.isVisible('[data-tension="opportunity-vs-relationships"]'), 'committing the CA1 note surfaces a new tension');
  await page.click('.fab[aria-label="Potential tensions"]');

  await page.click('[data-file="long-term-goals/career"]');
  await page.click('button:has-text("Reset topic…")');
  await shot(page, '13-reset');
  await page.click('.dialog button:has-text("Reset topic")');
  assert(await page.isVisible('.entry-text:has-text("Offer deadline")'), 'reset keeps your own lines');
  await page.click('button:has-text("Erase topic data…")');
  assert(await page.isDisabled('.dialog button:has-text("Erase topic data")'), 'erase needs confirmation');
  await page.fill('.dialog input', 'career');
  await page.click('.dialog button:has-text("Erase topic data")');
  assert(await page.isVisible('.empty:has-text("No notes yet")'), 'erase removes the notes');

  // ── Export / import ──
  const answersBefore = await page.textContent('.topbar-stat b');
  await page.click('.profile-pill');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('text=Export (.json)')]);
  const exportPath = await download.path();
  assert(/personal-operating-model-.*\.json/.test(download.suggestedFilename()), 'export downloads a JSON file');
  await page.click('.profile-pill');
  await page.click('.menu >> text=Start fresh');
  assert((await page.textContent('.topbar-stat b')) === '0', 'fresh start is empty');
  await page.click('.profile-pill');
  await page.click('text=Import…');
  await page.setInputFiles('.dialog input[type=file]', exportPath);
  assert(await page.waitForSelector('.callout:has-text("Ready to import")'), 'import previews the file');
  await page.click('button:has-text("Replace and import")');
  assert((await page.textContent('.topbar-stat b')) === answersBefore, `import restores answers (${answersBefore})`);
  assert((await page.textContent('.profile-pill')).includes('Priya'), 'import restores the name');

  console.log('errors:', errors);
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
