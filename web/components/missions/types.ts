import type { Condition } from '@/lib/condition';

export interface MissionViewProps {
  /** Mission number shown to the learner (index in MISSION_ORDER). */
  step: number;
  condition: Condition;
  onDone: () => void;
}
