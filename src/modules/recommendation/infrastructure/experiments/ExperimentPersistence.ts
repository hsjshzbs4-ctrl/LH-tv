// modules/recommendation/infrastructure/experiments/ExperimentPersistence.ts — CE9-D

import type { IExperimentRepository, AssignmentRecord } from '../repositories/ExperimentRepository'
import type { Experiment } from '../../runtime/experiments/ExperimentEngine'

export class ExperimentPersistence {
  constructor(private repo: IExperimentRepository) {}

  async saveAssignment(userId: string, experimentId: string, variantId: string): Promise<void> {
    await this.repo.saveAssignment({ userId, experimentId, variantId, assignedAt: Date.now() })
  }

  async getAssignment(userId: string, experimentId: string): Promise<AssignmentRecord | null> {
    return this.repo.getAssignment(userId, experimentId)
  }

  async saveExperiment(experiment: Experiment): Promise<void> {
    await this.repo.saveExperiment(experiment)
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return this.repo.getAllExperiments()
  }
}
