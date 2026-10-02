import type { Condition } from '@/lib/condition';

export interface StepProps {
  condition: Condition;
  onDone: () => void;
  /** Developer tools on (`?debug`). Steps with inner navigation (the lab) add their own controls. */
  debug?: boolean;
}
