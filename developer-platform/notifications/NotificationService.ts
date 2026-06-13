// developer-platform/notifications/NotificationService.ts
import type { DeveloperNotification } from '../shared/types'

type Subscriber = (n: DeveloperNotification) => void

export class NotificationService {
  private notifications: DeveloperNotification[] = []
  private subscribers = new Set<Subscriber>()

  send(developerId: string, type: DeveloperNotification['type'], title: string, message: string): DeveloperNotification {
    const n: DeveloperNotification = { id: `notif-${Date.now()}`, developerId, type, title, message, read: false, createdAt: Date.now() }
    this.notifications.push(n)
    this._notify(n)
    return n
  }

  getByDeveloper(developerId: string): DeveloperNotification[] {
    return this.notifications.filter(n => n.developerId === developerId).sort((a, b) => b.createdAt - a.createdAt)
  }

  getUnread(developerId: string): DeveloperNotification[] {
    return this.getByDeveloper(developerId).filter(n => !n.read)
  }

  markRead(id: string): void {
    const n = this.notifications.find(x => x.id === id)
    if (n) n.read = true
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => { this.subscribers.delete(cb) }
  }

  private _notify(n: DeveloperNotification): void {
    this.subscribers.forEach(cb => { try { cb(n) } catch {/* */} })
  }
}

export const notificationService = new NotificationService()
