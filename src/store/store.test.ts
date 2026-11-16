import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './store';
import { QUESTION_BY_ID } from '../data/questions';

const S = () => useStore.getState();
const lines = (fileId: string) => S().files[fileId].current.entries;

describe('auto-apply (every answer goes straight into the notes)', () => {
  beforeEach(() => {
    S().chooseProfile('fresh');
    S().completeOnboarding('Sam');
  });

  it('writes the note line at once, and replaces it when the answer changes', () => {
    const { files } = S().setResponse('P1', 'family');
    expect(files).toEqual(['priorities/main']);
    expect(lines('priorities/main').map((e) => e.text)).toEqual([QUESTION_BY_ID.P1.note('family')]);
    S().setResponse('P1', 'work');
    expect(lines('priorities/main').map((e) => e.text)).toEqual([QUESTION_BY_ID.P1.note('work')]);
    expect(S().files['priorities/main'].proposal).toBeUndefined();
  });

  it('removes the line on clear if it is unlocked and unedited', () => {
    S().setResponse('P4', 'comfort');
    S().clearResponse('P4');
    expect(lines('priorities/main')).toHaveLength(0);
  });

  it('keeps a locked line, adds the new answer after it and says so', () => {
    S().setResponse('P1', 'family');
    const id = lines('priorities/main')[0].id;
    S().toggleLock('priorities/main', id);
    S().setResponse('P1', 'money');
    expect(lines('priorities/main').map((e) => e.text)).toEqual([QUESTION_BY_ID.P1.note('family'), QUESTION_BY_ID.P1.note('money')]);
    expect(S().toasts.some((t) => t.text.startsWith('Kept your locked line'))).toBe(true);
  });

  it('groups answers and edits into one new version per file per browser session', () => {
    S().setResponse('P1', 'family');
    S().setResponse('P4', 'comfort');
    S().addEntry('priorities/main', null, 'My own line');
    const f = S().files['priorities/main'];
    expect(f.history).toHaveLength(1);
    expect(f.current.reason).toBe('Answers and edits');
  });

  it('writes the “Add a note” text as the user’s own line', () => {
    S().setResponse('P1', 'depends');
    S().setAnswerNote('P1', 'Family wins if someone is ill.');
    const ls = lines('priorities/main');
    expect(ls[1]).toMatchObject({ provenance: 'human', answerNote: true });
  });

  it('previews a reset; answers are only cleared when it is accepted', () => {
    S().setResponse('P1', 'family');
    S().addEntry('priorities/main', null, 'Mine');
    S().resetTopic('priorities/main', false);
    expect(S().files['priorities/main'].proposal?.kind).toBe('reset');
    expect(S().responses.P1).toBeDefined();
    S().commitProposal('priorities/main');
    expect(S().responses.P1).toBeUndefined();
    expect(lines('priorities/main').map((e) => e.text)).toEqual(['Mine']);
  });

  it('logs a new dated check-in line after the previous check-in was finished', () => {
    S().setResponse('P2', ['work', 'family', 'partner', 'friends', 'health', 'learning']);
    S().setResponse('C2', 6);
    S().setResponse('C2', 7); // same run: replaced
    expect(lines('check-ins/log')).toHaveLength(1);
    S().finishQuestionnaire('checkin');
    S().confirmResponse('C2'); // next month, still true
    expect(lines('check-ins/log')).toHaveLength(2);
    expect(S().responses.C2.history).toHaveLength(1);
  });
});
