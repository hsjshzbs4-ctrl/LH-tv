// media-servers/base/HttpClient.ts — CE6.2
// HTTP client with auth headers, timeout, retry — for media server APIs

export interface HttpClientOptions {
  baseUrl: string
  authToken?: string
  authHeader?: string       // default: 'X-Emby-Token' or 'X-Plex-Token'
  timeout?: number
  maxRetries?: number
}

export class HttpClient {
  constructor(private options: HttpClientOptions) {}

  async get<T>(path: string, query?: Record<string, string>): Promise<T> {
    return this._request<T>('GET', path, undefined, query)
  }

  async post<T>(path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    return this._request<T>('POST', path, body, query)
  }

  async delete<T>(path: string): Promise<T> {
    return this._request<T>('DELETE', path)
  }

  private async _request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string>,
  ): Promise<T> {
    const url = this._buildUrl(path, query)
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    if (this.options.authToken && this.options.authHeader) {
      headers[this.options.authHeader] = this.options.authToken
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeout || 15000)

    const maxRetries = this.options.maxRetries || 2
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`)
        }

        // Handle empty responses
        const text = await response.text()
        clearTimeout(timer)
        return text ? JSON.parse(text) : ({} as T)
      } catch (e) {
        lastError = e as Error
        if (attempt < maxRetries) {
          await this._sleep(Math.pow(2, attempt) * 500)
        }
      }
    }

    clearTimeout(timer)
    throw lastError!
  }

  private _buildUrl(path: string, query?: Record<string, string>): string {
    const base = this.options.baseUrl.replace(/\/$/, '')
    const p = path.startsWith('/') ? path : `/${path}`
    let url = `${base}${p}`
    if (query) {
      const params = new URLSearchParams(query).toString()
      if (params) url += `?${params}`
    }
    return url
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }
}
