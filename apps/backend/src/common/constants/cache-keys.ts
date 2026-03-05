export const CacheKeys = {
  // 用户相关
  USER_INFO: (userId: string) => `user:info:${userId}`,
  USER_LEVEL: (userId: string) => `user:level:${userId}`,
  USER_PROGRESS: (userId: string, bankId: string) => `user:progress:${userId}:${bankId}`,
  USER_SECTIONS: (userId: string, bankId: string) => `user:sections:${userId}:${bankId}`,

  // 词库相关
  WORDBANK_LIST: (categoryId?: string) => `wordbank:list:${categoryId || 'all'}`,
  WORDBANK_DETAIL: (bankId: string) => `wordbank:detail:${bankId}`,
  CHAPTER_LIST: (bankId: string) => `chapter:list:${bankId}`,
  SECTION_WORDS: (sectionId: string) => `section:words:${sectionId}`,
  CATEGORIES: 'categories:all',

  // 游戏相关
  GAME_SESSION: (sessionId: string) => `game:session:${sessionId}`,

  // 排行榜
  RANKING_WEEKLY: 'ranking:weekly',
  RANKING_MONTHLY: 'ranking:monthly',
  RANKING_TOTAL: 'ranking:total',
  RANKING_SECTION: (sectionId: string) => `ranking:section:${sectionId}`,

  // 认证相关
  AUTH_TOKEN: (userId: string) => `auth:token:${userId}`,
  AUTH_REFRESH: (userId: string) => `auth:refresh:${userId}`,
  VERIFY_CODE: (target: string) => `verify:code:${target}`,

  // 分布式锁
  LOCK: (resource: string) => `lock:${resource}`,

  // 限流
  RATE_LIMIT: (ip: string) => `rate:limit:${ip}`,
  LOGIN_ATTEMPTS: (identifier: string) => `login:attempts:${identifier}`,
} as const;

export const CacheTTL = {
  USER_INFO: 600, // 10分钟
  USER_LEVEL: 600, // 10分钟
  USER_PROGRESS: 300, // 5分钟
  WORDBANK_LIST: 3600, // 1小时
  WORDBANK_DETAIL: 3600, // 1小时
  CHAPTER_LIST: 3600, // 1小时
  SECTION_WORDS: 3600, // 1小时
  CATEGORIES: 3600, // 1小时
  GAME_SESSION: 1800, // 30分钟
  AUTH_TOKEN: 86400, // 24小时
  AUTH_REFRESH: 604800, // 7天
  VERIFY_CODE: 300, // 5分钟
  LOCK_DEFAULT: 10, // 10秒
  RATE_LIMIT: 60, // 1分钟
  LOGIN_ATTEMPTS: 900, // 15分钟
} as const;
