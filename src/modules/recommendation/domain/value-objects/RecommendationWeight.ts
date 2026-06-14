// modules/recommendation/domain/value-objects/RecommendationWeight.ts — CE9-A
// Configurable weight for recommendation strategies.

export interface RecommendationWeightProps {
  readonly value: number
  readonly label: string
}

export class RecommendationWeight {
  readonly value: number
  readonly label: string

  private constructor(props: RecommendationWeightProps) {
    if (props.value < 0 || props.value > 1) {
      throw new Error('RecommendationWeight: value must be in range [0, 1]')
    }
    if (!props.label || props.label.trim().length === 0) {
      throw new Error('RecommendationWeight: label must not be empty')
    }

    this.value = props.value
    this.label = props.label.trim()
  }

  static create(value: number, label: string): RecommendationWeight {
    return new RecommendationWeight({ value, label })
  }

  /** Zero weight — engine contributes nothing */
  static zero(label: string): RecommendationWeight {
    return new RecommendationWeight({ value: 0, label })
  }

  /** Full weight — engine contribution at maximum */
  static full(label: string): RecommendationWeight {
    return new RecommendationWeight({ value: 1, label })
  }

  /** Apply this weight to a score value */
  apply(score: number): number {
    return score * this.value
  }

  equals(other: RecommendationWeight): boolean {
    return this.value === other.value && this.label === other.label
  }
}
