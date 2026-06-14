// modules/recommendation/infrastructure/repositories/ExperimentRepository.ts — CE9-D

import type { IStorageAdapter } from '../storage/IStorageAdapter'
import type { Experiment, ExperimentAssignment } from '../../runtime/experiments/ExperimentEngine'

export interface AssignmentRecord {
  readonly userId: string
  readonly experimentId: string
  readonly variantId: string
  readonly assignedAt: number
}

export interface IExperimentRepository {
  saveAssignment(record: AssignmentRecord): Promise<void>
  getAssignment(userId: string, experimentId: string): Promise<AssignmentRecord | null>
  getAssignmentsByExperiment(experimentId: string): Promise<AssignmentRecord[]>
  saveExperiment(experiment: Experiment): Promise<void>
  getExperiment(id: string): Promise<Experiment | null>
  getAllExperiments(): Promise<Experiment[]>
}

export class ExperimentRepository implements IExperimentRepository {
  constructor(
    private assignmentStorage: IStorageAdapter<AssignmentRecord[]>,
    private experimentStorage: IStorageAdapter<Experiment[]>,
  ) {}

  private async _ensureAssignments(): Promise<AssignmentRecord[]> {
    return (await this.assignmentStorage.load()) ?? []
  }

  private async _ensureExperiments(): Promise<Experiment[]> {
    return (await this.experimentStorage.load()) ?? []
  }

  async saveAssignment(record: AssignmentRecord): Promise<void> {
    const data = await this._ensureAssignments()
    const idx = data.findIndex(r => r.userId === record.userId && r.experimentId === record.experimentId)
    if (idx >= 0) data[idx] = record
    else data.push(record)
    await this.assignmentStorage.save(data)
  }

  async getAssignment(userId: string, experimentId: string): Promise<AssignmentRecord | null> {
    return (await this._ensureAssignments()).find(
      r => r.userId === userId && r.experimentId === experimentId,
    ) ?? null
  }

  async getAssignmentsByExperiment(experimentId: string): Promise<AssignmentRecord[]> {
    return (await this._ensureAssignments()).filter(r => r.experimentId === experimentId)
  }

  async saveExperiment(experiment: Experiment): Promise<void> {
    const data = await this._ensureExperiments()
    const idx = data.findIndex(e => e.id === experiment.id)
    if (idx >= 0) data[idx] = experiment
    else data.push(experiment)
    await this.experimentStorage.save(data)
  }

  async getExperiment(id: string): Promise<Experiment | null> {
    return (await this._ensureExperiments()).find(e => e.id === id) ?? null
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return this._ensureExperiments()
  }
}
