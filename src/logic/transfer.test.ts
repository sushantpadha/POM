import { describe, expect, it } from 'vitest';
import { sampleFiles, SAMPLE_PROGRESS, SAMPLE_RESPONSES } from '../data/sampleProfile';
import { buildExport, parseExport, type PortableData } from './transfer';

const data: PortableData = {
  profile: 'sample',
  userName: 'Priya',
  onboardedAt: '2026-03-12T10:00:00.000Z',
  responses: SAMPLE_RESPONSES,
  progress: SAMPLE_PROGRESS,
  files: sampleFiles(),
  seen: ['root'],
  dismissedTensions: ['harm-vs-outcomes'],
  tensionContext: {},
  deferred: {},
};

describe('export / import', () => {
  it('round-trips all user data', () => {
    const res = parseExport(JSON.stringify(buildExport(data)));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toEqual(data);
    expect(res.summary.answers).toBe(Object.keys(SAMPLE_RESPONSES).length);
  });

  it('rejects files that are not exports, are newer, or are corrupted', () => {
    expect(parseExport('not json')).toMatchObject({ ok: false });
    expect(parseExport('{"hello":1}')).toMatchObject({ ok: false });
    const newer = { ...buildExport(data), version: 99 };
    expect(parseExport(JSON.stringify(newer))).toMatchObject({ ok: false });
    const bad = buildExport(data);
    bad.data.responses['NOPE-1'] = bad.data.responses['ETH-01'];
    expect(parseExport(JSON.stringify(bad))).toMatchObject({ ok: false, error: expect.stringContaining('NOPE-1') });
    const missing = buildExport(data) as unknown as { data: { files: Record<string, unknown> } };
    delete missing.data.files['ethics/main'];
    expect(parseExport(JSON.stringify(missing))).toMatchObject({ ok: false });
  });
});
