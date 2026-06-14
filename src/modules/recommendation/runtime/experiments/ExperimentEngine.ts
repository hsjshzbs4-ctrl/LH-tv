// modules/recommendation/runtime/experiments/ExperimentEngine.ts — CE9-C
// A/B testing experiment engine (Req 10).
// Supports experiment/variant assignment, traffic splitting, and metric comparison.

export interface ExperimentVariant {
  readonly id: string
  readonly name: string
  readonly weight: number           // Traffic allocation weight
  readonly config: Record<string, unknown>
}

export interface Experiment {
  readonly id: string
  readonly name: string
  readonly variants: ExperimentVariant[]
  readonly trafficAllocation: number // 0-1
  readonly status: 'draft' | 'running' | 'completed'
}

export interface ExperimentAssignment {
  readonly experimentId: string
  readonly variantId: string
}

export class ExperimentEngine {
  private experiments: Map<string, Experiment> = new Map()
  private assignmentCache: Map<string, ExperimentAssignment> = new Map()

  /** Register an experiment */
  registerExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment)
  }

  /** Get an experiment by ID */
  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id)
  }

  /** Assign a user to a variant deterministically */
  assign(userId: string, experimentId: string): ExperimentAssignment {
    const cacheKey = `${userId}:${experimentId}`
    const cached = this.assignmentCache.get(cacheKey)
    if (cached) return cached

    const experiment = this.experiments.get(experimentId)
    if (!experiment) {
      return { experimentId, variantId: 'control' }
    }

    if (experiment.status !== 'running') {
      return { experimentId, variantId: experiment.variants[0]?.id ?? 'control' }
    }

    // Deterministic hash-based assignment
    const hash = this._hash(userId + experimentId)
    const bucket = hash % 100

    // Check traffic allocation
    if (bucket >= experiment.trafficAllocation * 100) {
      const assignment: ExperimentAssignment = {
        experimentId,
        variantId: experiment.variants[0]?.id ?? 'control',
      }
      this.assignmentCache.set(cacheKey, assignment)
      return assignment
    }

    // Weighted variant selection
    let cumulative = 0
    for (const variant of experiment.variants) {
      cumulative += variant.weight
      if (bucket < cumulative * 100) {
        const assignment: ExperimentAssignment = {
          experimentId,
          variantId: variant.id,
        }
        this.assignmentCache.set(cacheKey, assignment)
        return assignment
      }
    }

    return { experimentId, variantId: experiment.variants[0]?.id ?? 'control' }
  }

  /** Get all active experiments */
  get activeExperiments(): Experiment[] {
    return [...this.experiments.values()].filter(e => e.status === 'running')
  }

  /** Clear assignment cache */
  clearCache(): void {
    this.assignmentCache.clear()
  }

  /** FNV-1a hash for deterministic bucketing */
  private _hash(input: string): number {
    let hash = 2166136261
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return Math.abs(hash)
  }
}
