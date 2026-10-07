import { STEP_ORDER, type StepId } from '@/content/steps';

/**
 * The only steps with a Back button, each going to the step before it: lab → warm-up, formula → lab,
 * compute → formula.
 * Not elsewhere: the start has nothing worth revisiting, going into or out of a test would contaminate
 * the pre/post measures, and leaving explain for the formula step would show the part texts to generate.
 */
export const BACK_STEPS: StepId[] = ['lab', 'formula', 'compute'];

/** Can the learner go back one step from `index` (an index into STEP_ORDER; its length is the end screen)? */
export function canGoBack(index: number): boolean {
  return index < STEP_ORDER.length && BACK_STEPS.includes(STEP_ORDER[index]);
}
