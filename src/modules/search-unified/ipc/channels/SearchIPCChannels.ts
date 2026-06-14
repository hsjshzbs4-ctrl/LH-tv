// modules/search-unified/ipc/channels/SearchIPCChannels.ts — CE8-D
// Single source of truth for all unified search IPC channel names.
// No hardcoded strings anywhere else.

export const SEARCH_IPC_CHANNELS = {
  SEARCH_EXECUTE: 'unified-search:execute',
  SEARCH_SUGGEST: 'unified-search:suggest',
  SEARCH_CLICK: 'unified-search:click',
  SEARCH_PLAY: 'unified-search:play',
  SEARCH_HISTORY: 'unified-search:history',
  SEARCH_TRENDING: 'unified-search:trending',
  SEARCH_PROFILE: 'unified-search:profile',
  SEARCH_HEALTH: 'unified-search:health',
  SEARCH_DIAGNOSTICS: 'unified-search:diagnostics',
} as const

export type SearchIPCChannelName = typeof SEARCH_IPC_CHANNELS[keyof typeof SEARCH_IPC_CHANNELS]
