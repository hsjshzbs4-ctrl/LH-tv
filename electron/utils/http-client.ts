// electron/utils/http-client.ts - 统一 HTTP 请求客户端
import { HTTP } from './config'

export interface FetchOptions {
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  signal?: AbortSignal
}

export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const timeout = options.timeout ?? HTTP.timeout
  const maxRetries = options.retries ?? HTTP.retries

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // 合并外部 signal
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort())
  }

  const headers: Record<string, string> = {
    'User-Agent': HTTP.userAgent,
    ...options.headers
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow'
      })
      return response
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries) {
        // 指数退避
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500))
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError ?? new Error('HTTP request failed')
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithTimeout(url, options)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const response = await fetchWithTimeout(url, options)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.text()
}
