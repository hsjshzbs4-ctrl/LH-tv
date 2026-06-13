// local-media/matcher/ConfidenceScorer.ts — CE5.5
// Score metadata matches based on title, year, and provider weight

export interface ScoreInput {
  queryTitle: string
  queryYear?: number
  matchTitle: string
  matchYear?: number
  originalTitle?: string
  aliases?: string[]
}

export class ConfidenceScorer {
  score(input: ScoreInput): number {
    let score = 0

    // Title similarity (weight: 0-60)
    const titleScore = this._titleSimilarity(input.queryTitle, input.matchTitle, input.originalTitle, input.aliases)
    score += titleScore * 60

    // Year match (weight: 0-30)
    if (input.queryYear && input.matchYear) {
      score += input.queryYear === input.matchYear ? 30 : (Math.abs(input.queryYear - input.matchYear) <= 1 ? 15 : 0)
    } else {
      score += 15 // year unknown, partial credit
    }

    // Normalize to 0-1
    return Math.min(1, Math.max(0, score / 100))
  }

  private _titleSimilarity(query: string, match: string, original?: string, aliases?: string[]): number {
    const q = this._normalize(query)
    const m = this._normalize(match)

    // Exact match
    if (q === m) return 1.0

    // Contains
    if (q.includes(m) || m.includes(q)) return 0.9

    // Original title match
    if (original) {
      const o = this._normalize(original)
      if (q === o) return 1.0
      if (q.includes(o) || o.includes(q)) return 0.85
    }

    // Alias match
    if (aliases) {
      for (const alias of aliases) {
        const a = this._normalize(alias)
        if (q === a) return 0.95
        if (q.includes(a) || a.includes(q)) return 0.8
      }
    }

    // Token similarity
    const qTokens = new Set(q.split(/\s+/))
    const mTokens = new Set(m.split(/\s+/))
    let overlap = 0
    for (const t of qTokens) { if (mTokens.has(t)) overlap++ }
    const totalTokens = Math.max(qTokens.size, mTokens.size)
    return totalTokens > 0 ? overlap / totalTokens : 0
  }

  private _normalize(s: string): string {
    return s.toLowerCase()
      .replace(/[^a-z0-9一-鿿\s]/g, '') // keep CJK
      .replace(/\s+/g, ' ')
      .trim()
  }
}
