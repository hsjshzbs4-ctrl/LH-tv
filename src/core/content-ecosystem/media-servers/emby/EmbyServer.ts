// media-servers/emby/EmbyServer.ts — CE6.4
// Emby media server — extends Jellyfin (same API, Emby is upstream)

import { JellyfinServer } from '../jellyfin/JellyfinServer'
import { HttpClient } from '../base/HttpClient'
import type { ServerType } from '../contracts/media-server.types'
import type { ServerCredentials } from '@provider-contracts'
import type { AuthResult } from '../contracts/auth.types'

export class EmbyServer extends JellyfinServer {
  readonly serverType: ServerType = 'emby'

  constructor(config: { id: string; name: string; url: string }) {
    super(config)
  }

  protected override async _authenticate(creds: ServerCredentials): Promise<AuthResult> {
    try {
      if (creds.token) {
        const h2 = new HttpClient({ baseUrl: this.config.url, authToken: creds.token, authHeader: 'X-Emby-Token' })
        const me = await h2.get<{ Id: string; Name: string }>('/Users/Me')
        return { success: true, token: creds.token, userId: me.Id, serverName: me.Name }
      }

      const http = new HttpClient({ baseUrl: this.config.url, authHeader: 'X-Emby-Token' })
      const result = await http.post<{ AccessToken: string; User: { Id: string; Name: string } }>(
        '/Users/AuthenticateByName',
        { Username: creds.username || '', Pw: creds.password || '' },
      )
      return { success: true, token: result.AccessToken, userId: result.User?.Id, serverName: result.User?.Name }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
