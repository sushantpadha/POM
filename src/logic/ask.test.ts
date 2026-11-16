import { describe, expect, it } from 'vitest';
import { ASK_SPECS, LOW_CONFIDENCE_QUESTION } from '../data/ask';
import { PREDEFINED_SUMMARIES } from '../data/files';
import { sampleFiles, SAMPLE_RESPONSES } from '../data/sampleProfile';
import { answer, detectDimensions } from './ask';

describe('ask (no-AI fallback)', () => {
  it('resolves every pre-written reading against the sample profile', () => {
    const files = sampleFiles();
    for (const spec of ASK_SPECS) {
      const res = answer(spec.question, files, SAMPLE_RESPONSES, true);
      expect(res.predefined, spec.id).toBe(true);
      expect(res.interpretation, spec.id).toHaveLength(spec.interpretation.length);
      expect(res.missingSources, spec.id).toBe(0);
    }
  });

  it('drops a reading when a note it cites is deleted', () => {
    const files = sampleFiles();
    files['moral/family-duty'].current.entries = files['moral/family-duty'].current.entries.filter((e) => e.id !== 'fd4');
    const res = answer(ASK_SPECS[0].question, files, SAMPLE_RESPONSES, true);
    expect(res.interpretation.map((i) => i.text).some((t) => t.includes('limit you named'))).toBe(false);
  });

  it('finds the answers marked unsure', () => {
    const res = answer(LOW_CONFIDENCE_QUESTION, sampleFiles(), SAMPLE_RESPONSES, true);
    expect(res.reported.map((x) => x.entry.sourceItemId)).toEqual(['M5']);
  });

  it('detects the five branches and check-ins from the question', () => {
    expect(detectDimensions('What do I owe my parents?')).toEqual(['moral']);
    expect(detectDimensions('Who am I, really?')).toEqual(['identity']);
    expect(detectDimensions('What happened this month?')).toEqual(['check-ins']);
    expect(detectDimensions('xyz')).toEqual(['worldview', 'moral', 'priorities', 'identity', 'goals']);
  });

  it('writes pre-written summaries against sample versions that exist', () => {
    const files = sampleFiles();
    for (const [fileId, s] of Object.entries(PREDEFINED_SUMMARIES)) expect(files[fileId].current.versionId, fileId).toBe(s.forVersion);
  });
});
