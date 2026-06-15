// electron/runtime/index.ts — Barrel export for recovery modules (RC3.1)
export { gracefulShutdown, registerShutdownHooks } from './shutdownManager'
export { attachRendererRecovery } from './rendererRecovery'
export { attachUnresponsiveRecovery } from './unresponsiveRecovery'
export { attachLoadFailureRecovery } from './loadFailureRecovery'
