// modules/search-unified/ipc/mappers/SearchIPCErrorMapper.ts — CE8-D
// Safe error mapping for renderer. NEVER leaks: stack, filesystem paths,
// internal service names, or provider secrets.

import { IPC_CONTRACT_VERSION } from '../contracts/SearchIPCContracts'
import type { SearchIPCError } from '../contracts/SearchIPCContracts'
import { SearchValidationError, SearchTimeoutError, SearchProviderError, SearchError } from '../../application/errors/SearchErrors'

export class SearchIPCErrorMapper {
  toSafeError(error: unknown): SearchIPCError {
    // Known application errors: safe to expose code + message
    if (error instanceof SearchValidationError) {
      return {
        version: IPC_CONTRACT_VERSION,
        code: error.code,
        message: error.message,
        recoverable: error.recoverable,
      }
    }
    if (error instanceof SearchTimeoutError) {
      return {
        version: IPC_CONTRACT_VERSION,
        code: error.code,
        message: 'Search request timed out. Please try again.',
        recoverable: true,
      }
    }
    if (error instanceof SearchProviderError) {
      return {
        version: IPC_CONTRACT_VERSION,
        code: error.code,
        message: 'Search service temporarily unavailable.',
        recoverable: error.recoverable,
      }
    }
    if (error instanceof SearchError) {
      return {
        version: IPC_CONTRACT_VERSION,
        code: error.code,
        message: error.message,
        recoverable: error.recoverable,
      }
    }

    // Unknown error: generic message only — NEVER leak details
    const msg = error instanceof Error ? 'An unexpected error occurred.' : 'Unknown error'
    return {
      version: IPC_CONTRACT_VERSION,
      code: 'INTERNAL_ERROR',
      message: msg,
      recoverable: true,
    }
  }
}
