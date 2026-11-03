import { describe, expect, it } from 'vitest';
import { useStore } from './store';

const done = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { completedAt: '2026-01-01T00:00:00Z', submissions: ['2026-01-01T00:00:00Z'] }]));

describe('milestone pause', () => {
  it('pauses before the 10th new topic, once', () => {
    useStore.getState().chooseProfile('fresh');
    useStore.setState({
      progress: done(['ethics', 'worldview', 'goals', 'moral', 'family', 'agency', 'projects', 'aspirations', 'meaning']),
    });
    useStore.getState().openReflection('tradeoffs');
    expect(useStore.getState().view).toEqual({ name: 'pause', nodeId: 'tradeoffs', count: 9 });
    useStore.getState().ackMilestone(10);
    useStore.getState().openReflection('tradeoffs');
    expect(useStore.getState().view).toEqual({ name: 'reflect', nodeId: 'tradeoffs' });
  });

  it('does not pause when revisiting a topic already reflected on', () => {
    useStore.getState().chooseProfile('fresh');
    useStore.setState({
      progress: done(['ethics', 'worldview', 'goals', 'moral', 'family', 'agency', 'projects', 'aspirations', 'meaning']),
    });
    useStore.getState().openReflection('ethics');
    expect(useStore.getState().view.name).toBe('reflect');
  });
});
