// tests/developer-platform/repository.spec.ts
import { describe, it, expect } from 'vitest'
import { PluginRegistry } from '@developer-platform/repository-server/PluginRegistry'
import type { PluginSubmission } from '@developer-platform'

describe('Plugin Repository', () => {
  const registry = new PluginRegistry()

  it('should register and search plugins', () => {
    const sub: PluginSubmission = { id:'s1', developerId:'d1', manifest:{id:'test-plugin',name:'Test',version:'1.0.0',sdkVersion:'1.0.0',entry:'main.js',permissions:[]}, state:'APPROVED', submittedAt:Date.now() }
    registry.register(sub)
    expect(registry.get('test-plugin')).toBeDefined()
    expect(registry.search('test')).toHaveLength(1)
  })

  it('should track downloads', () => {
    const sub: PluginSubmission = { id:'s2', developerId:'d1', manifest:{id:'dl-test',name:'DL Test',version:'1.0.0'}, state:'APPROVED', submittedAt:Date.now() }
    registry.register(sub)
    registry.incrementDownloads('dl-test')
    expect(registry.get('dl-test')!.downloads).toBe(1)
  })
})
