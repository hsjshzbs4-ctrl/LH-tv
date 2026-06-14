// modules/recommendation/ipc/errors/IPCErrors.ts — CE9-E
// IPC-safe errors. Never expose internal details.

export class RecommendationIPCError extends Error {
  readonly code: string
  readonly safeMessage: string

  constructor(code: string, safeMessage: string, internalMessage?: string) {
    super(internalMessage ?? safeMessage)
    this.name = 'RecommendationIPCError'
    this.code = code
    this.safeMessage = safeMessage
  }

  toResponse(): { code: string; message: string } {
    return { code: this.code, message: this.safeMessage }
  }
}

export class IPCValidationError extends RecommendationIPCError {
  constructor(errors: string[]) {
    super('VALIDATION_ERROR', `Invalid request: ${errors.join('; ')}`)
  }
}

export class IPCTransportError extends RecommendationIPCError {
  constructor(details: string) {
    super('TRANSPORT_ERROR', 'IPC transport failure', details)
  }
}

export class IPCTimeoutError extends RecommendationIPCError {
  constructor(channel: string, timeoutMs: number) {
    super('TIMEOUT_ERROR', `Request timed out after ${timeoutMs}ms`, `Channel: ${channel}`)
  }
}

/** Map any error to an IPC-safe error */
export function toSafeError(err: unknown): RecommendationIPCError {
  if (err instanceof RecommendationIPCError) return err
  if (err instanceof Error) {
    // Map known application errors
    const code = (err as any).code as string | undefined
    if (code) return new RecommendationIPCError(code, err.message)
    return new RecommendationIPCError('INTERNAL_ERROR', 'An internal error occurred', err.message)
  }
  return new RecommendationIPCError('UNKNOWN_ERROR', 'An unknown error occurred')
}
