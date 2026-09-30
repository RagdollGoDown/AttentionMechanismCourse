import type { ComponentType } from 'react';
import type { MissionId } from '@/content/missions';
import type { MissionViewProps } from '@/components/missions/types';
import { Mission0Embeddings } from '@/components/missions/Mission0Embeddings';
import { Mission4FreePlay } from '@/components/missions/Mission4FreePlay';

/** Missions present here are playable; Lesson skips the others. */
export const MISSION_VIEWS: Partial<Record<MissionId, ComponentType<MissionViewProps>>> = {
  embeddings: Mission0Embeddings,
  free: Mission4FreePlay,
};
