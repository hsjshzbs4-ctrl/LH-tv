// src/player/fullscreenUX.ts — PB3-S1 Fullscreen UX Enhancement
// 包装全屏行为，不修改 PlayerFacade（FROZEN）

export interface FullscreenUXState {
  isFullscreen: boolean
  controlsVisible: boolean
  landscapeLocked: boolean
}

export class FullscreenUX {
  private _state: FullscreenUXState = {
    isFullscreen: false,
    controlsVisible: true,
    landscapeLocked: false,
  }
  private hideTimer: ReturnType<typeof setTimeout> | null = null
  private container: HTMLElement | null = null
  private _onFullscreenChange: (() => void) | null = null

  get state(): Readonly<FullscreenUXState> { return this._state }

  /** 绑定容器并监听全屏变化 */
  bind(container: HTMLElement): void {
    this.container = container
    this._onFullscreenChange = () => {
      this._state.isFullscreen = !!document.fullscreenElement
    }
    document.addEventListener('fullscreenchange', this._onFullscreenChange)
  }

  /** 进入全屏 */
  async enter(): Promise<void> {
    if (!this.container) return
    await this.container.requestFullscreen()
    this._state.isFullscreen = true
    this._state.landscapeLocked = true
  }

  /** 退出全屏 */
  async exit(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
    this._state.isFullscreen = false
    this._state.landscapeLocked = false
    this._state.controlsVisible = true
  }

  /** 切换全屏 */
  async toggle(): Promise<void> {
    if (this._state.isFullscreen) await this.exit()
    else await this.enter()
  }

  /** 显示控制栏（用户交互时） */
  showControls(): void {
    this._state.controlsVisible = true
    if (this.hideTimer) clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => {
      this._state.controlsVisible = false
    }, 3000)
  }

  /** 销毁 */
  destroy(): void {
    if (this._onFullscreenChange) {
      document.removeEventListener('fullscreenchange', this._onFullscreenChange)
    }
    if (this.hideTimer) clearTimeout(this.hideTimer)
    this.container = null
  }
}
