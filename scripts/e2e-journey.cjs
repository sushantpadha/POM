// End-to-end journey check (headless Chromium via Playwright).
// Usage: npm run dev, then: node scripts/e2e-journey.cjs  (requires the 'playwright' package)
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const { chromium } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
const clickNode = (page, id) => page.click(`[data-node="${id}"] circle >> nth=-1`, { force: true });
const nodeClass = (page, id) => page.getAttribute(`[data-node="${id}"]`, 'class');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // ── Fresh journey ──
  await page.click('text=Start fresh');
  assert(await page.$$eval('[data-node]', (n) => n.length) === 4, 'only root + 3 undiscovered placeholders before onboarding');
  await page.click('button:has-text("Begin onboarding")');
  await page.fill('.name-field input', 'Sam');
  for (let i = 0; i < 3; i++) await page.click('.onb-nav button.primary');
  assert(await page.isDisabled('text=Agree and reveal the map'), 'continue disabled without consent');
  await page.click('text=I consent to my answers');
  await page.click('text=I understand this is not a clinical tool');
  await page.click('text=Agree and reveal the map');
  await page.waitForTimeout(800);
  assert((await page.textContent('.profile-pill')).includes('Sam'), 'onboarding name shown in the top bar');
  for (const id of ['ethics', 'worldview', 'goals']) assert((await nodeClass(page, id)).includes('available'), `${id} revealed`);
  assert((await nodeClass(page, 'eth-family')).includes('locked'), 'eth-family still undiscovered');

  await clickNode(page, 'ethics');
  await page.click('button:has-text("Take questionnaire")');
  await page.click('.likert button >> nth=4'); // ETH-01 = 5
  assert(await page.isVisible('.unlock-callout:has-text("Harm & Consequences")'), 'answering ETH-01 discovers Harm & Consequences');
  await page.click('.qn-nav-item >> nth=4'); // ETH-05
  await page.click('.choice:has-text("The family obligation")');
  assert(await page.isVisible('.unlock-callout:has-text("Obligations to Elders & Family")'), 'ETH-05 discovers Obligations to Elders & Family');
  await page.click('.qn-nav-item:has-text("Review & submit")');
  await page.click('.qn-foot button.primary');
  await page.waitForTimeout(200);
  
  await page.click('button:has-text("Review update")');
  await page.waitForTimeout(200);
  assert(await page.isVisible('.proposal-bar'), 'generated update shown as a proposal');
  
  await page.click('.proposal-bar button:has-text("Commit")');
  const lines = await page.$$eval('.entries .entry', (n) => n.length);
  assert(lines >= 3, `proposal committed: ${lines} lines in ethics/main`);
  assert(await page.isVisible('.version-list, .seg >> text=Version history (1)'), 'previous version moved to history');

  // Edit a generated line -> human
  await page.click('.entries .entry >> nth=1 >> .entry-text');
  await page.fill('.entry-edit textarea', '- Avoiding harm is close to absolute for me — but I make exceptions for white lies.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entries .entry >> nth=1 >> .prov.human'), 'edited line becomes human-written');
  await page.fill('.add-line input', 'I want to understand why family comes first for me.');
  await page.keyboard.press('Enter');
  assert(await page.isVisible('.entry-text:has-text("why family comes first")'), 'new human note added');
  // lock the ETH-05 line
  const eth05 = page.locator('.entries .entry', { hasText: 'family usually guides me' });
  await eth05.hover();
  await eth05.locator('.lock-btn').click();
  assert(await eth05.evaluate((n) => n.classList.contains('locked')), 'line locked');
  

  // Retake: change ETH-05; locked line must be protected
  await page.click('.tab:has-text("Ethics")');
  await page.click('button:has-text("Review answers")').catch(() => {});
  await page.click('.qn-nav-item >> nth=4');
  await page.click('.choice:has-text("It depends on the situation")');
  await page.click('.qn-nav-item:has-text("Review & submit")');
  await page.click('.qn-foot button.primary');
  await page.click('button:has-text("Review update")');
  assert(await page.isVisible('.diff-tag:has-text("locked — kept unchanged")'), 'locked line protected in generated update');
  await page.click('.proposal-bar button:has-text("Cancel")');
  assert(!(await page.isVisible('.proposal-bar')), 'cancel discards proposal');

  // Summarise -> preview -> commit
  await page.click('.file-toolbar button:has-text("Summarise")');
  assert(await page.isVisible('.proposal-bar:has-text("AI summary")'), 'summary proposal shown');
  
  await page.click('.proposal-bar button:has-text("Commit")');
  assert(await page.isVisible('.entry.locked:has-text("family usually guides me")'), 'locked line survived summary commit');
  await page.click('.seg button:has-text("Version history")');
  
  await page.click('.seg button:has-text("Changes over time")');
  

  // Graph after
  await page.click('.tab:has-text("Graph")');
  await page.waitForTimeout(900);
  assert((await nodeClass(page, 'eth-harm')).includes('available'), 'Harm & Consequences available on graph');
  assert((await nodeClass(page, 'eth-family')).includes('available'), 'Obligations to Elders & Family available on graph');
  assert((await nodeClass(page, 'ethics')).includes('answered'), 'Ethics answered');
  

  // ── Sample profile ──
  await page.click('.profile-pill');
  await page.click('text=Load sample profile');
  await page.waitForTimeout(900);
  await page.click('.fab[aria-label="Potential tensions"]');
  const tensions = await page.$$eval('[data-tension]', (n) => n.length);
  assert(tensions === 4, `4 potential tensions in sample (${tensions})`);
  
  await page.click('[data-tension="family-vs-relocation"] button:has-text("Dismiss")');
  assert(await page.$$eval('[data-tension]', (n) => n.length) === 3, 'dismiss hides tension');
  await page.click('.fab[aria-label="Suggested retakes"]');
  
  const nRetakes = await page.$$eval('[data-retake]', (n) => n.length);
  assert(nRetakes >= 3, `retake suggestions (${nRetakes})`);
  await page.click('.fab[aria-label="Ask the model"]');
  await page.click('.example >> nth=0');
  await page.waitForTimeout(3500);
  
  assert(await page.isVisible('.answer-block.interp'), 'ask produced interpretation');
  await page.click('.answer-block.reported .cite >> nth=0');
  await page.waitForTimeout(300);
  assert(await page.isVisible('.entry.flash'), 'citation opens file and highlights entry');
  await page.click('.fab[aria-label="Ask the model"]');

  // Answer AGY-02 in sample -> unlock Meaning & Purpose
  await page.click('.tab:has-text("Graph")');
  await page.waitForTimeout(500);
  assert((await nodeClass(page, 'wv-meaning')).includes('locked'), 'Meaning & Purpose undiscovered');
  await clickNode(page, 'wv-agency');
  await page.click('button:has-text("Continue questionnaire")');
  await page.click('.qn-nav-item >> nth=1');
  await page.click('.choice:has-text("A lot")');
  assert(await page.isVisible('.unlock-callout:has-text("Meaning & Purpose")'), 'AGY-02 discovers Meaning & Purpose (second parent path)');

  await page.click('.qn-nav-item:has-text("Review & submit")');
  await page.click('.qn-foot button.primary');
  await page.click('button:has-text("Review update")');
  await page.click('.proposal-bar button:has-text("Commit")');
  await page.click('.fab[aria-label="Potential tensions"]');
  assert(await page.isVisible('[data-tension="agency-vs-luck"]'), 'committing the AGY-02 note surfaces the agency-vs-luck tension');
  await page.click('.fab[aria-label="Potential tensions"]');

  // Reset + erase dialogs
  await page.click('[data-file="long-term-goals/career"]');
  await page.click('button:has-text("Reset topic…")');
  
  await page.click('.dialog button:has-text("Reset topic")');
  assert(await page.isVisible('.entry-text:has-text("Offer deadline")'), 'reset keeps human lines');
  await page.click('button:has-text("Erase topic data…")');
  assert(await page.isDisabled('.dialog button:has-text("Erase topic data")'), 'erase requires confirmation');
  await page.fill('.dialog input', 'career');
  
  await page.click('.dialog button:has-text("Erase topic data")');
  assert(await page.isVisible('.empty:has-text("No notes yet")'), 'erase removes notes');
  // ── Export / import ──
  const answersBefore = await page.textContent('.topbar-stat b');
  await page.click('.profile-pill');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('text=Export data (.json)')]);
  const exportPath = await download.path();
  assert(/personal-operating-model-.*\.json/.test(download.suggestedFilename()), 'export downloads a JSON file');
  await page.click('.profile-pill');
  await page.click('text=Fresh start — from onboarding');
  assert((await page.textContent('.topbar-stat b')) === '0', 'switched to an empty fresh start');
  await page.click('.profile-pill');
  await page.click('text=Import data…');
  await page.setInputFiles('.dialog input[type=file]', exportPath);
  assert(await page.waitForSelector('.callout:has-text("Ready to import")'), 'import previews the file');
  await page.click('button:has-text("Replace and import")');
  assert((await page.textContent('.topbar-stat b')) === answersBefore, `import restores answers (${answersBefore})`);
  assert((await page.textContent('.profile-pill')).includes('Priya'), 'import restores the name');
  await page.click('.profile-pill');
  await page.click('text=Import data…');
  await page.setInputFiles('.dialog input[type=file]', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
  assert(await page.waitForSelector('.callout.danger'), 'invalid file is rejected');
  assert(await page.isDisabled('button:has-text("Replace and import")'), 'cannot import an invalid file');
  console.log('errors:', errors);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
