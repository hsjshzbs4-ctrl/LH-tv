// tests/architecture/recommendation-application-architecture.spec.ts — CE9-B
// Architecture guard: Application layer MUST only depend on Domain.

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

const APP_DIR = path.resolve('src/modules/recommendation/application')

describe('CE9-B Application Architecture Guard', () => {
  const files = readRecursive(APP_DIR)
  const sourceFiles = files.filter(f => !f.endsWith('.spec.ts') && !f.endsWith('.test.ts'))

  it('has expected number of application source files (14+)', () => {
    expect(sourceFiles.length).toBeGreaterThanOrEqual(14)
  })

  it('application MUST NOT import from infrastructure/', () => {
    const violations: string[] = []
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(content)
      for (const imp of imports) {
        if (imp.includes('infrastructure')) {
          violations.push(`${path.relative(APP_DIR, file)}: imports '${imp}'`)
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Application has forbidden infrastructure imports:\n${violations.join('\n')}`)
    }
  })

  it('application MUST NOT import from ipc/', () => {
    const violations: string[] = []
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(content)
      for (const imp of imports) {
        if (imp.includes('/ipc/') || imp.includes('/ipc')) {
          violations.push(`${path.relative(APP_DIR, file)}: imports '${imp}'`)
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Application has forbidden IPC imports:\n${violations.join('\n')}`)
    }
  })

  it('application MUST NOT import from ui/', () => {
    const violations: string[] = []
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(content)
      for (const imp of imports) {
        if (imp.includes('/ui/') || imp.includes('/ui')) {
          violations.push(`${path.relative(APP_DIR, file)}: imports '${imp}'`)
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Application has forbidden UI imports:\n${violations.join('\n')}`)
    }
  })

  it('application MUST NOT import electron or vue or pinia', () => {
    const FORBIDDEN = ['electron', 'vue', 'pinia']
    const violations: string[] = []

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(content)
      for (const imp of imports) {
        for (const forbidden of FORBIDDEN) {
          if (imp.startsWith(forbidden) || imp.includes(`/${forbidden}`)) {
            violations.push(`${path.relative(APP_DIR, file)}: imports '${imp}'`)
          }
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Application has forbidden framework imports:\n${violations.join('\n')}`)
    }
  })

  it('all use cases are stateless (no instance state)', () => {
    const useCaseDir = path.join(APP_DIR, 'use-cases')
    const caseFiles = readRecursive(useCaseDir).filter(f => f.endsWith('.ts'))

    for (const file of caseFiles) {
      const content = fs.readFileSync(file, 'utf-8')

      // Should not have mutable instance state: no "private cache", "private state", etc.
      if (content.match(/private\s+(cache|state|map|set|data|store|items|results)/i)) {
        expect.fail(`${path.relative(APP_DIR, file)}: use case has forbidden instance state`)
      }
    }
  })

  it('DTOs must not extend domain entities', () => {
    const dtoDir = path.join(APP_DIR, 'dto')
    const dtoFiles = readRecursive(dtoDir).filter(f => f.endsWith('.ts'))

    for (const file of dtoFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      // DTOs should be plain interfaces, not classes extending anything
      if (content.includes('extends') && content.includes('Entity')) {
        expect.fail(`${path.relative(APP_DIR, file)}: DTO must not extend domain entity`)
      }
    }
  })

  it('orchestrator has no scoring/ranking/diversity logic', () => {
    const orchFile = path.join(APP_DIR, 'orchestrators', 'RecommendationOrchestrator.ts')
    const content = fs.readFileSync(orchFile, 'utf-8')

    // Should NOT contain scoring, ranking, or diversity algorithm implementations
    const FORBIDDEN_PATTERNS = [
      /score\s*\+=\s*[0-9]/,
      /\.sort\(/,
      /jaccard/i,
      /cosine/i,
      /diversif/i,
    ]

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        expect.fail(`Orchestrator contains forbidden business logic matching: ${pattern}`)
      }
    }
  })

  it('barrel export covers all public API', () => {
    const indexPath = path.join(APP_DIR, 'index.ts')
    const content = fs.readFileSync(indexPath, 'utf-8')

    // Should export DTOs
    expect(content).toContain('RecommendationRequestDto')
    expect(content).toContain('RecommendationResponseDto')

    // Should export use cases
    expect(content).toContain('GenerateRecommendationsUseCase')
    expect(content).toContain('TrackRecommendationClickUseCase')

    // Should export orchestrator
    expect(content).toContain('RecommendationOrchestrator')

    // Should export all errors
    expect(content).toContain('RecommendationValidationError')
    expect(content).toContain('FeedGenerationFailedError')

    // Should export mappers
    expect(content).toContain('FeedMapper')
    expect(content).toContain('ProfileMapper')
  })
})
