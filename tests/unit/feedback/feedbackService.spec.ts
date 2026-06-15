// tests/unit/feedback/feedbackService.spec.ts — PB1-007 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { FeedbackService, MemoryFeedbackStorage } from '@/feedback/feedbackService'

describe('FeedbackService', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService(new MemoryFeedbackStorage())
  })

  // ── Validation ──

  it('should validate a valid feedback entry', () => {
    const result = service.validate({
      type: 'bug',
      title: 'App crashes',
      description: 'Application crashes when clicking the settings button'
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject empty title', () => {
    const result = service.validate({ title: '', description: 'desc', type: 'bug' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Title is required')
  })

  it('should reject title over 200 characters', () => {
    const result = service.validate({
      title: 'A'.repeat(201),
      description: 'desc',
      type: 'bug'
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Title must be under 200 characters')
  })

  it('should reject empty description', () => {
    const result = service.validate({ title: 'Title', description: '', type: 'bug' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Description is required')
  })

  it('should reject description under 10 characters', () => {
    const result = service.validate({ title: 'Title', description: 'short', type: 'bug' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Description must be at least 10 characters')
  })

  it('should reject invalid type', () => {
    const result = service.validate({
      title: 'Title',
      description: 'Valid description here',
      type: 'invalid' as any
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Type must be one of: bug, suggestion, performance, other')
  })

  it('should accept all valid types', () => {
    for (const type of ['bug', 'suggestion', 'performance', 'other']) {
      const result = service.validate({
        title: 'Title',
        description: 'Valid description here',
        type: type as any
      })
      expect(result.valid).toBe(true)
    }
  })

  // ── Submit Feedback ──

  it('should submit feedback successfully', () => {
    const result = service.submitFeedback({
      type: 'bug',
      title: 'Test Bug',
      description: 'This is a test bug report for validation'
    })
    expect(result.success).toBe(true)
    expect(result.entry).toBeDefined()
    expect(result.entry!.id).toMatch(/^fb-/)
    expect(result.entry!.status).toBe('submitted')
    expect(result.entry!.type).toBe('bug')
  })

  it('should return validation errors on invalid submission', () => {
    const result = service.submitFeedback({
      type: 'bug',
      title: '',
      description: ''
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)
  })

  it('should attach telemetry snapshot when requested', () => {
    const result = service.submitFeedback({
      type: 'bug',
      title: 'Bug with telemetry',
      description: 'Bug description with telemetry data',
      attachTelemetry: true
    })
    expect(result.success).toBe(true)
    // Empty snapshot (no provider set) — dashboard is null but snapshot exists
    expect(result.entry!.telemetrySnapshot).toBeDefined()
    expect(result.entry!.telemetrySnapshot!.dashboard).toBeNull()
  })

  it('should not attach telemetry by default', () => {
    const result = service.submitFeedback({
      type: 'bug',
      title: 'Bug without telemetry',
      description: 'Bug description without telemetry data'
    })
    expect(result.success).toBe(true)
    // attachTelemetry defaults to false — snapshot should not be captured
    expect(result.entry!.telemetrySnapshot).toBeNull()
  })

  // ── Draft Management ──

  it('should save and load a draft', async () => {
    const draft = service.saveDraft({
      type: 'suggestion',
      title: 'Draft suggestion',
      description: 'A draft suggestion for later'
    })
    expect(draft.status).toBe('draft')

    const loaded = await service.loadDraft(draft.id)
    expect(loaded).not.toBeNull()
    expect(loaded!.title).toBe('Draft suggestion')
  })

  it('should delete a draft', async () => {
    const draft = service.saveDraft({
      type: 'bug',
      title: 'To delete',
      description: 'This draft will be deleted'
    })
    await service.deleteDraft(draft.id)
    const loaded = await service.loadDraft(draft.id)
    expect(loaded).toBeNull()
  })

  it('should list drafts', async () => {
    service.saveDraft({ type: 'bug', title: 'Draft 1', description: 'Description 1' })
    service.saveDraft({ type: 'suggestion', title: 'Draft 2', description: 'Description 2' })

    const drafts = await service.listDrafts()
    expect(drafts).toHaveLength(2)
  })

  // ── Queue Management ──

  it('should queue, send, and mark feedback status', () => {
    const result = service.submitFeedback({
      type: 'bug',
      title: 'Queue test',
      description: 'Testing queue functionality'
    })
    expect(result.entry!.status).toBe('submitted')

    // Queue
    expect(service.queueSubmission(result.entry!.id)).toBe(true)
    expect(service.getEntriesByStatus('queued')).toHaveLength(1)

    // Mark sent
    expect(service.markSent(result.entry!.id)).toBe(true)
    expect(service.getEntriesByStatus('sent')).toHaveLength(1)

    // Mark failed
    const r2 = service.submitFeedback({
      type: 'bug',
      title: 'Failed test',
      description: 'Testing failed status'
    })
    expect(service.markFailed(r2.entry!.id, 'Network error')).toBe(true)
    const failed = service.getEntriesByStatus('failed')
    expect(failed).toHaveLength(1)
    expect(failed[0].errorMessage).toBe('Network error')
  })

  it('should return false for nonexistent entries', () => {
    expect(service.queueSubmission('nonexistent')).toBe(false)
    expect(service.markSent('nonexistent')).toBe(false)
    expect(service.markFailed('nonexistent', 'error')).toBe(false)
    expect(service.attachDiagnostics('nonexistent')).toBe(false)
  })

  // ── Entry Retrieval ──

  it('should return all entries', () => {
    service.submitFeedback({ type: 'bug', title: 'Bug 1', description: 'Description for bug 1' })
    service.submitFeedback({ type: 'suggestion', title: 'Suggestion 1', description: 'Description for suggestion 1' })

    expect(service.getEntries()).toHaveLength(2)
  })

  it('should filter entries by status', () => {
    const r1 = service.submitFeedback({ type: 'bug', title: 'Bug', description: 'Bug description text' })
    service.queueSubmission(r1.entry!.id)

    expect(service.getEntriesByStatus('queued')).toHaveLength(1)
    expect(service.getEntriesByStatus('submitted')).toHaveLength(0)
  })

  // ── Persistence ──

  it('should persist and load across instances', async () => {
    const storage = new MemoryFeedbackStorage()
    const s1 = new FeedbackService(storage)

    s1.submitFeedback({
      type: 'bug',
      title: 'Persisted',
      description: 'This should persist across instances'
    })

    const s2 = new FeedbackService(storage)
    await s2.initialize()

    const entries = s2.getEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe('Persisted')
  })

  // ── Clear All ──

  it('should clear all data', async () => {
    service.submitFeedback({ type: 'bug', title: 'Bug', description: 'Bug description for clearing' })
    await service.clearAll()
    expect(service.getEntries()).toHaveLength(0)
  })

  // ── Snapshot Capture Access ──

  it('should provide snapshot capture', () => {
    expect(service.getSnapshotCapture()).toBeDefined()
  })
})
