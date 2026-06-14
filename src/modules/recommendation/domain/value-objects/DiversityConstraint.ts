// modules/recommendation/domain/value-objects/DiversityConstraint.ts — CE9-A
// Diversity protection rules (Req 7).
// No more than 3 items from the same franchise, 5 from the same genre per section.

export interface DiversityConstraintProps {
  readonly maxPerFranchise: number
  readonly maxPerGenre: number
}

export class DiversityConstraint {
  readonly maxPerFranchise: number
  readonly maxPerGenre: number

  private constructor(props: DiversityConstraintProps) {
    if (props.maxPerFranchise < 1) {
      throw new Error('DiversityConstraint: maxPerFranchise must be >= 1')
    }
    if (props.maxPerGenre < 1) {
      throw new Error('DiversityConstraint: maxPerGenre must be >= 1')
    }

    this.maxPerFranchise = props.maxPerFranchise
    this.maxPerGenre = props.maxPerGenre
  }

  static create(props?: Partial<DiversityConstraintProps>): DiversityConstraint {
    return new DiversityConstraint({
      maxPerFranchise: props?.maxPerFranchise ?? 3,
      maxPerGenre: props?.maxPerGenre ?? 5,
    })
  }

  /** Default constraints as specified in Req 7 */
  static default(): DiversityConstraint {
    return new DiversityConstraint({
      maxPerFranchise: 3,
      maxPerGenre: 5,
    })
  }

  equals(other: DiversityConstraint): boolean {
    return this.maxPerFranchise === other.maxPerFranchise
      && this.maxPerGenre === other.maxPerGenre
  }
}
