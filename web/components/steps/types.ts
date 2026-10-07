import type { Condition } from '@/lib/condition';

export interface StepProps {
  condition: Condition;
  onDone: () => void;
  /** Developer tools on (`?debug`). Steps with inner navigation (the lab) add their own controls. */
  debug?: boolean;
  /** False while the step is kept mounted but hidden (the learner went back, or has not returned yet). */
  visible?: boolean;
  /** Pre-test only: false when the link had no ?condition=, so the experimenter assigns it with `onAssign`. */
  assigned?: boolean;
  onAssign?: (c: Condition) => void;
}
