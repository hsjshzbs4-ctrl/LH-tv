// tests/developer-platform/review.spec.ts
import { describe, it, expect } from 'vitest'
import { PluginReviewService } from '@developer-platform/review/PluginReviewService'
import type { PluginSubmission } from '@developer-platform'

describe('Plugin Review', () => {
  const service = new PluginReviewService()
  const sub: PluginSubmission = { id:'s1', developerId:'d1', manifest:{id:'p1',name:'Test',permissions:['NETWORK_ACCESS','STORAGE_ACCESS']}, state:'SUBMITTED', submittedAt:Date.now() }

  it('should detect dangerous permissions', () => {
    service.addToQueue(sub)
    const issues = service.scan(sub)
    expect(issues.some(i=>i.includes('STORAGE_ACCESS'))).toBe(true)
  })

  it('should approve submission', () => {
    service.addToQueue(sub)
    service.approve('s1')
    expect(sub.state).toBe('APPROVED')
  })

  it('should reject with reason', () => {
    const s2: PluginSubmission = {...sub, id:'s2', state:'SUBMITTED'}
    service.addToQueue(s2)
    service.reject('s2', 'Insecure')
    expect(s2.state).toBe('REJECTED')
    expect(s2.reviewerNotes).toBe('Insecure')
  })
})
