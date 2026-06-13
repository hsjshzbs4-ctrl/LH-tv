// tests/developer-platform/publishing.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PluginSubmissionService } from '@developer-platform/publishing/PluginSubmissionService'
import { developerAccountManager } from '@developer-platform/accounts/DeveloperAccount'

describe('Publishing Pipeline', () => {
  let service: PluginSubmissionService
  beforeEach(()=>{ service = new PluginSubmissionService() })

  it('should reject unverified developer', () => {
    const result = service.submit('unknown', { id:'p1', name:'Test', version:'1.0.0', sdkVersion:'1.0.0', entry:'main.js' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('not verified')
  })

  it('should accept submission from verified developer', () => {
    developerAccountManager.register({ id:'dev1', username:'dev', email:'a@b.com', role:'VERIFIED_DEVELOPER', verified:true, pluginCount:0, totalDownloads:0, rating:0, createdAt:Date.now() })
    const result = service.submit('dev1', { id:'p1', name:'Test', version:'1.0.0', sdkVersion:'1.0.0', entry:'main.js' })
    expect(result.success).toBe(true)
  })

  it('should validate manifest', () => {
    const errors = service.validateManifest({})
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e=>e.includes('Missing'))).toBe(true)
  })

  it('should transition submission states', () => {
    developerAccountManager.register({ id:'dev1', username:'dev', email:'a@b.com', role:'VERIFIED_DEVELOPER', verified:true, pluginCount:0, totalDownloads:0, rating:0, createdAt:Date.now() })
    const r = service.submit('dev1', { id:'p1', name:'Test', version:'1.0.0', sdkVersion:'1.0.0', entry:'main.js' })
    service.transition(r.submissionId!, 'APPROVED')
    expect(service.getSubmission(r.submissionId!)!.state).toBe('APPROVED')
  })
})
