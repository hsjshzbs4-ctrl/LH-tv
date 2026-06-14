// modules/recommendation/domain/value-objects/RecommendationReason.ts — CE9-A
// Every recommendation must include a reason (Req 5).
// Template-based with parameter interpolation.

export type ReasonTemplate =
  | 'because-you-watched'
  | 'trending-in-genre'
  | 'popular-on-provider'
  | 'recently-added'
  | 'similar-to'
  | 'recommended-for-you'
  | 'new-on-provider'
  | 'top-pick'

export const REASON_TEMPLATES: Record<ReasonTemplate, string> = {
  'because-you-watched': 'Because you watched {title}',
  'trending-in-genre': 'Trending in {genre}',
  'popular-on-provider': 'Popular on {provider}',
  'recently-added': 'Recently Added',
  'similar-to': 'Similar to {title}',
  'recommended-for-you': 'Recommended for you',
  'new-on-provider': 'New on {provider}',
  'top-pick': 'Top Pick',
}

export interface RecommendationReasonProps {
  readonly template: ReasonTemplate
  readonly params: Record<string, string>
}

export class RecommendationReason {
  readonly template: ReasonTemplate
  readonly params: Readonly<Record<string, string>>

  private _rendered: string | null = null

  private constructor(props: RecommendationReasonProps) {
    const tpl = REASON_TEMPLATES[props.template]
    if (!tpl) {
      throw new Error(`RecommendationReason: unknown template "${props.template}"`)
    }

    this.template = props.template
    this.params = Object.freeze({ ...props.params })
  }

  static create(template: ReasonTemplate, params: Record<string, string> = {}): RecommendationReason {
    return new RecommendationReason({ template, params })
  }

  /** "Because you watched Breaking Bad" */
  static becauseYouWatched(title: string): RecommendationReason {
    return new RecommendationReason({ template: 'because-you-watched', params: { title } })
  }

  /** "Trending in Crime Drama" */
  static trendingInGenre(genre: string): RecommendationReason {
    return new RecommendationReason({ template: 'trending-in-genre', params: { genre } })
  }

  /** "Popular on Jellyfin" */
  static popularOnProvider(provider: string): RecommendationReason {
    return new RecommendationReason({ template: 'popular-on-provider', params: { provider } })
  }

  /** "Recently Added" */
  static recentlyAdded(): RecommendationReason {
    return new RecommendationReason({ template: 'recently-added', params: {} })
  }

  /** "Similar to The Matrix" */
  static similarTo(title: string): RecommendationReason {
    return new RecommendationReason({ template: 'similar-to', params: { title } })
  }

  /** "Recommended for you" */
  static recommendedForYou(): RecommendationReason {
    return new RecommendationReason({ template: 'recommended-for-you', params: {} })
  }

  /** "New on Plex" */
  static newOnProvider(provider: string): RecommendationReason {
    return new RecommendationReason({ template: 'new-on-provider', params: { provider } })
  }

  /** "Top Pick" — cold start fallback */
  static topPick(): RecommendationReason {
    return new RecommendationReason({ template: 'top-pick', params: {} })
  }

  /** Render the human-readable reason string */
  render(): string {
    if (this._rendered) return this._rendered

    let result = REASON_TEMPLATES[this.template]
    for (const [key, value] of Object.entries(this.params)) {
      result = result.replace(`{${key}}`, value)
    }
    this._rendered = result
    return result
  }

  /** Get the rendered string (alias) */
  get rendered(): string {
    return this.render()
  }

  equals(other: RecommendationReason): boolean {
    if (this.template !== other.template) return false
    const keys = Object.keys(this.params)
    const otherKeys = Object.keys(other.params)
    if (keys.length !== otherKeys.length) return false
    return keys.every(k => this.params[k] === other.params[k])
  }

  /** Serialize to plain object */
  toJSON(): { template: ReasonTemplate; params: Record<string, string>; rendered: string } {
    return {
      template: this.template,
      params: { ...this.params },
      rendered: this.rendered,
    }
  }
}
