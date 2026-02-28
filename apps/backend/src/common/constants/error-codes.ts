export const ErrorCodes = {
  // 通用错误 E1xxxx
  SUCCESS: 'SUCCESS',
  UNKNOWN_ERROR: 'E10000',
  VALIDATION_ERROR: 'E10001',
  NOT_FOUND: 'E10002',
  ALREADY_EXISTS: 'E10003',

  // 认证错误 E2xxxx
  UNAUTHORIZED: 'E20001',
  TOKEN_EXPIRED: 'E20002',
  TOKEN_INVALID: 'E20003',
  REFRESH_TOKEN_EXPIRED: 'E20004',
  ACCOUNT_LOCKED: 'E20005',
  ACCOUNT_BANNED: 'E20006',
  WRONG_PASSWORD: 'E20007',
  CODE_INVALID: 'E20008',
  CODE_EXPIRED: 'E20009',

  // 用户错误 E3xxxx
  USER_NOT_FOUND: 'E30001',
  USER_ALREADY_EXISTS: 'E30002',
  NICKNAME_TAKEN: 'E30003',

  // 词库错误 E4xxxx
  WORDBANK_NOT_FOUND: 'E40001',
  CHAPTER_NOT_FOUND: 'E40002',
  SECTION_NOT_FOUND: 'E40003',
  WORD_NOT_FOUND: 'E40004',

  // 游戏错误 E5xxxx
  GAME_SESSION_EXPIRED: 'E50001',
  GAME_SESSION_INVALID: 'E50002',
  SECTION_LOCKED: 'E50003',
  MODE_LOCKED: 'E50004',

  // 限流错误 E6xxxx
  RATE_LIMIT_EXCEEDED: 'E60001',
} as const;

export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.SUCCESS]: '操作成功',
  [ErrorCodes.UNKNOWN_ERROR]: '未知错误',
  [ErrorCodes.VALIDATION_ERROR]: '参数验证失败',
  [ErrorCodes.NOT_FOUND]: '资源不存在',
  [ErrorCodes.ALREADY_EXISTS]: '资源已存在',
  [ErrorCodes.UNAUTHORIZED]: '未授权访问',
  [ErrorCodes.TOKEN_EXPIRED]: 'Token已过期',
  [ErrorCodes.TOKEN_INVALID]: 'Token无效',
  [ErrorCodes.REFRESH_TOKEN_EXPIRED]: 'RefreshToken已过期',
  [ErrorCodes.ACCOUNT_LOCKED]: '账号已锁定',
  [ErrorCodes.ACCOUNT_BANNED]: '账号已封禁',
  [ErrorCodes.WRONG_PASSWORD]: '密码错误',
  [ErrorCodes.CODE_INVALID]: '验证码错误',
  [ErrorCodes.CODE_EXPIRED]: '验证码已过期',
  [ErrorCodes.USER_NOT_FOUND]: '用户不存在',
  [ErrorCodes.USER_ALREADY_EXISTS]: '用户已存在',
  [ErrorCodes.GAME_SESSION_EXPIRED]: '游戏会话已过期',
  [ErrorCodes.SECTION_LOCKED]: '该小节尚未解锁',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '请求过于频繁',
};
