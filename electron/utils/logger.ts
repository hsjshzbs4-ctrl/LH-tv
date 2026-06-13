// electron/utils/logger.ts - 结构化日志
export interface Logger {
  info: (msg: string, data?: Record<string, unknown>) => void
  warn: (msg: string, data?: Record<string, unknown>) => void
  error: (msg: string, data?: Record<string, unknown> | Error) => void
  debug: (msg: string, data?: Record<string, unknown>) => void
}

export function createLogger(module: string): Logger {
  const prefix = `[${module}]`
  const timestamp = () => new Date().toISOString()

  return {
    info(msg, data) {
      console.log(`${timestamp()} INFO  ${prefix} ${msg}`, data || '')
    },
    warn(msg, data) {
      console.warn(`${timestamp()} WARN  ${prefix} ${msg}`, data || '')
    },
    error(msg, data) {
      const detail = data instanceof Error ? data.stack || data.message : data
      console.error(`${timestamp()} ERROR ${prefix} ${msg}`, detail || '')
    },
    debug(msg, data) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${timestamp()} DEBUG ${prefix} ${msg}`, data || '')
      }
    }
  }
}
