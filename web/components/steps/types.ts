import type { Condition } from '@/lib/condition';

export interface StepProps {
  condition: Condition;
  onDone: () => void;
}
