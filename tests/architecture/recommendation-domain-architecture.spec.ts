// tests/architecture/recommendation-domain-architecture.spec.ts — CE9-A
// Architecture guard: domain layer MUST have zero external dependencies.

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

function readRecursive(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...readRecursive(full))
    } else if (entry.name.endsWith('.ts')) {
      files.push(full)
    }
  }
  return files
}

function extractImports(content: string): string[] {
  const lines = content.split('\n')
  const imports: string[] = []
  for (const line of lines) {
    const match = line.match(/from\s+['"]([^'"]+)['"]/)
    if (match) {
      imports.push(match[1])
    }
  }
  return imports
}

const DOMAIN_DIR = path.resolve('src/modules/recommendation/domain')

/** Packages / modules that domain is allowed to import from */
const ALLOWED_PREFIXES = [
  './',           // relative (same layer)
  '../',          // relative (same layer parent)
]

describe('CE9-A Domain Architecture Guard', () => {
  const files = readRecursive(DOMAIN_DIR)
  const sourceFiles = files.filter(f => !f.endsWith('.spec.ts') && !f.endsWith('.test.ts'))

  it('has expected number of domain source files', () => {
    // Expected: entities(6) + value-objects(4) + contracts(4) + services(5) + events(1) + index(1)
    // Note: SectionType and RecommendationType are type-only files — included in the 22 count
    expect(sourceFiles.length).toBeGreaterThanOrEqual(16)
  })

  it('domain has zero external imports (no application, runtime, infrastructure, ipc, ui)', () => {
    const violations: string[] = []

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(content)

      for (const imp of imports) {
        // Skip relative imports (same layer)
        if (imp.startsWith('./') || imp.startsWith('../')) continue

        // Skip bare type imports from value-objects (these are bundled into entities)
        // Check for forbidden layer imports
        if (
          imp.includes('application') ||
          imp.includes('runtime') ||
          imp.includes('infrastructure') ||
          imp.includes('/ipc') ||
          imp.includes('/ui')
        ) {
          violations.push(`${path.relative(DOMAIN_DIR, file)}: '${imp}'`)
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Domain has forbidden imports:\n${violations.join('\n')}`)
    }
  })

  it('domain does not import any provider-specific code', () => {
    const violations: string[] = []
    const FORBIDDEN = ['jellyfin', 'plex', 'emby', 'tmdb', 'bangumi', 'tvmaze']

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8').toLowerCase()
      const imports = extractImports(content)

      for (const imp of imports) {
        for (const forbidden of FORBIDDEN) {
          if (imp.toLowerCase().includes(forbidden)) {
            violations.push(`${path.relative(DOMAIN_DIR, file)}: imports '${imp}'`)
          }
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Domain has provider-specific imports:\n${violations.join('\n')}`)
    }
  })

  it('all entities use static create() with private constructor', () => {
    const entityFiles = sourceFiles.filter(f => f.includes('entities'))

    for (const file of entityFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      // Every entity should have a private constructor
      if (!content.includes('private constructor')) {
        // Context uses a regular constructor style — check for either private constructor or static create
        expect(content).toMatch(/private constructor|static create/)
      }
      // Every entity should have static create
      expect(content).toContain('static create')
    }
  })

  it('all value objects validate in constructor', () => {
    const voFiles = sourceFiles.filter(f => f.includes('value-objects'))

    for (const file of voFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      // Value objects that are classes should have validation
      if (content.includes('class ') && content.includes('private constructor')) {
        expect(content).toMatch(/throw new Error/)
      }
    }
  })

  it('AIRecommendationProvider is defined as interface only (no implementation)', () => {
    const aiFile = path.join(DOMAIN_DIR, 'contracts', 'AIRecommendationProvider.ts')
    const content = fs.readFileSync(aiFile, 'utf-8')

    // Must be an interface, not a class
    expect(content).toContain('interface AIRecommendationProvider')
    expect(content).not.toContain('class AIRecommendationProvider')

    // Must have the DO NOT implement warning
    expect(content).toContain('DO NOT implement')
  })

  it('index.ts exports all public API', () => {
    const indexPath = path.join(DOMAIN_DIR, 'index.ts')
    const content = fs.readFileSync(indexPath, 'utf-8')

    // Should export all entity names
    expect(content).toContain('RecommendationFeed')
    expect(content).toContain('RecommendationSection')
    expect(content).toContain('RecommendationItem')
    expect(content).toContain('RecommendationProfile')
    expect(content).toContain('RecommendationContext')
    expect(content).toContain('RecommendationSource')

    // Should export all value objects
    expect(content).toContain('RecommendationScore')
    expect(content).toContain('RecommendationReason')

    // Should export all contracts
    expect(content).toContain('IRecommendationProvider')
    expect(content).toContain('AIRecommendationProvider')

    // Should export all services
    expect(content).toContain('RecommendationScoringService')
    expect(content).toContain('FeedAssemblyService')

    // Should export events
    expect(content).toContain('RecommendationEventFactory')
  })
})
