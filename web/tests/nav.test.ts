import { describe, expect, it } from 'vitest';
import { STEP_ORDER } from '@/content/steps';
import { canGoBack } from '@/lib/nav';

const at = (id: (typeof STEP_ORDER)[number]) => STEP_ORDER.indexOf(id);

describe('canGoBack', () => {
  it('goes back from the lab to the warm-up and from the formula to the lab', () => {
    expect(canGoBack(at('lab'))).toBe(true);
    expect(STEP_ORDER[at('lab') - 1]).toBe('vectors');
    expect(canGoBack(at('formula'))).toBe(true);
    expect(STEP_ORDER[at('formula') - 1]).toBe('lab');
  });

  it('has no Back at the start', () => {
    expect(canGoBack(at('welcome'))).toBe(false);
    expect(canGoBack(at('hook'))).toBe(false);
    expect(canGoBack(at('why'))).toBe(false);
  });

  it('never goes back into or out of a test', () => {
    expect(canGoBack(at('pretest'))).toBe(false);
    expect(canGoBack(at('vectors'))).toBe(false);
    expect(canGoBack(at('posttest'))).toBe(false);
  });

  it('never leaves the explain step backwards (the formula step would give the answer)', () => {
    expect(canGoBack(at('explain'))).toBe(false);
  });

  it('has nowhere to go from the end screen', () => {
    expect(canGoBack(STEP_ORDER.length)).toBe(false);
  });
});
