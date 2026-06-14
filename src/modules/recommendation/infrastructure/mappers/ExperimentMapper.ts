// modules/recommendation/infrastructure/mappers/ExperimentMapper.ts — CE9-D

import type { Experiment, ExperimentVariant } from '../../runtime/experiments/ExperimentEngine'

export interface StoredExperiment {
  readonly id: string
  readonly name: string
  readonly variants: string   // JSON
  readonly trafficAllocation: number
  readonly status: string
}

export class ExperimentMapper {
  static toStorage(experiment: Experiment): StoredExperiment {
    return {
      id: experiment.id,
      name: experiment.name,
      variants: JSON.stringify(experiment.variants),
      trafficAllocation: experiment.trafficAllocation,
      status: experiment.status,
    }
  }

  static fromStorage(stored: StoredExperiment): Experiment | null {
    try {
      return {
        id: stored.id,
        name: stored.name,
        variants: JSON.parse(stored.variants) as ExperimentVariant[],
        trafficAllocation: stored.trafficAllocation,
        status: stored.status as Experiment['status'],
      }
    } catch { return null }
  }
}
