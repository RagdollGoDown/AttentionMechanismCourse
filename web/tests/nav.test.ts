import { describe, expect, it } from 'vitest';
import { STEP_ORDER } from '@/content/steps';
import { canGoBack, warnsBeforeLeaving } from '@/lib/nav';

const at = (id: (typeof STEP_ORDER)[number]) => STEP_ORDER.indexOf(id);

describe('canGoBack', () => {
  it('goes back from the lab to the warm-up and from the formula to the lab', () => {
    expect(canGoBack(at('lab'))).toBe(true);
    expect(STEP_ORDER[at('lab') - 1]).toBe('vectors');
    expect(canGoBack(at('formula'))).toBe(true);
    expect(STEP_ORDER[at('formula') - 1]).toBe('lab');
  });

  it('goes back from the compute step to the formula, to look at it again', () => {
    expect(canGoBack(at('compute'))).toBe(true);
    expect(STEP_ORDER[at('compute') - 1]).toBe('formula');
  });

  it('has no Back at the start', () => {
    expect(canGoBack(at('welcome'))).toBe(false);
    expect(canGoBack(at('hook'))).toBe(false);
    expect(canGoBack(at('why'))).toBe(false);
  });

  it('never goes back into or out of a test', () => {
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

describe('warnsBeforeLeaving', () => {
  it('is off on the welcome and consent screens', () => {
    expect(warnsBeforeLeaving(at('welcome'))).toBe(false);
    expect(warnsBeforeLeaving(at('consent'))).toBe(false);
  });

  it('is on at every step from the pre-test through the post-test', () => {
    for (const id of STEP_ORDER.slice(at('pretest'))) expect(warnsBeforeLeaving(at(id))).toBe(true);
  });

  it('is off on the end screen', () => {
    expect(warnsBeforeLeaving(STEP_ORDER.length)).toBe(false);
  });
});
