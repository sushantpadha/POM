import { beforeEach, describe, expect, it } from 'vitest';
import { deleteLog, disable, enable, EVENT_CAP, EXPERIMENT_KEY, isOn, log, readLog, setStorage } from './experiment';
import { useStore } from '../store/store';

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), map: m };
}

describe('experiment mode', () => {
  let store: ReturnType<typeof memory>;
  beforeEach(() => {
    store = memory();
    setStorage(store);
    useStore.getState().chooseProfile('fresh');
    useStore.getState().completeOnboarding('Sam');
  });

  it('logs nothing while the mode is off', () => {
    expect(log('answered', { qid: 'P1' })).toBe(false);
    useStore.getState().setResponse('P1', 'family');
    expect(store.map.has(EXPERIMENT_KEY)).toBe(false);
  });

  it('logs store events with timestamp and participant id once on, under its own key', () => {
    const { participantId } = enable();
    useStore.getState().setResponse('P1', 'family');
    useStore.getState().setAnswerNote('P1', 'Unless I am ill.');
    useStore.getState().setDock('tensions');
    const events = readLog()!.events;
    expect(events.map((e) => e.type)).toEqual(['answered', 'area_opened', 'note_added', 'dock_tab']);
    expect(events[0]).toMatchObject({ pid: participantId, qid: 'P1', value: 'family', retake: false });
    expect(events.every((e) => typeof e.t === 'string')).toBe(true);
    expect(JSON.parse(store.map.get(EXPERIMENT_KEY)!).events).toHaveLength(4);
    expect(JSON.stringify(events)).not.toContain('Sam'); // the display name is never logged
  });

  it('never logs the sample profile', () => {
    enable();
    useStore.getState().chooseProfile('sample');
    useStore.getState().setResponse('PC1', 'take');
    expect(readLog()!.events).toHaveLength(0);
  });

  it('stops at the cap and says so', () => {
    enable();
    for (let i = 0; i < EVENT_CAP; i++) log('x');
    expect(readLog()!.events).toHaveLength(EVENT_CAP);
    expect(log('one-too-many')).toBe(false);
    expect(readLog()!.cappedAt).toBeTruthy();
    expect(readLog()!.events).toHaveLength(EVENT_CAP);
  });

  it('turning off stops logging; delete empties the key', () => {
    enable();
    log('a');
    disable(true);
    expect(isOn()).toBe(false);
    expect(log('b')).toBe(false);
    expect(readLog()!.events).toHaveLength(1);
    deleteLog();
    expect(store.map.has(EXPERIMENT_KEY)).toBe(false);
    enable();
    disable(false);
    expect(store.map.has(EXPERIMENT_KEY)).toBe(false);
  });
});
