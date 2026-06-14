// modules/recommendation/ipc/channels/RecommendationIPCChannels.ts — CE9-E

export const RecommendationIPCChannels = {
  GENERATE: 'recommendation:generate',
  PERSONALIZED: 'recommendation:personalized',
  TRENDING: 'recommendation:trending',
  CONTINUE_WATCHING: 'recommendation:continueWatching',
  SIMILAR: 'recommendation:similar',
  TRACK_CLICK: 'recommendation:trackClick',
  TRACK_CONSUME: 'recommendation:trackConsume',
  HEALTH: 'recommendation:health',
  METRICS: 'recommendation:metrics',
} as const

export type RecommendationIPCChannel = typeof RecommendationIPCChannels[keyof typeof RecommendationIPCChannels]
