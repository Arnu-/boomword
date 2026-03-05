// 用户相关类型
export interface User {
  id: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  level: number;
  experience: number;
  dailyGoal: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'banned';

// 词库相关类型
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface WordBank {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  difficulty: number;
  isActive: boolean;
  categoryId?: string;
  category?: Category;
}

export interface Chapter {
  id: string;
  wordBankId: string;
  name: string;
  order: number;
}

export interface Section {
  id: string;
  chapterId: string;
  name: string;
  order: number;
}

export interface Word {
  id: string;
  wordBankId: string;
  english: string;
  chinese: string;
  phonetic?: string;
  audioUrl?: string;
  example?: string;
  exampleTranslation?: string;
  difficulty: number;
}

// 游戏相关类型
export type GameMode = 'practice' | 'challenge';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface GameRecord {
  id: string;
  userId: string;
  sectionId: string;
  mode: GameMode;
  totalWords: number;
  correctWords: number;
  wrongWords: number;
  score: number;
  stars: number;
  duration: number;
  createdAt: Date;
  completedAt?: Date;
}

// 学习进度类型
export interface UserSection {
  userId: string;
  sectionId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
  bestScore: number;
  practiceCount: number;
  lastPracticeAt?: Date;
}

export interface UserWord {
  userId: string;
  wordId: string;
  masteryLevel: number;
  practiceCount: number;
  correctCount: number;
  lastPracticeAt?: Date;
}

// 排行榜类型
export type RankingType = 'weekly' | 'monthly' | 'total';

export interface RankingItem {
  rank: number;
  userId: string;
  nickname: string;
  avatar?: string;
  score: number;
  isCurrentUser: boolean;
}

// 成就类型
export type AchievementType =
  | 'words_mastered'
  | 'streak_days'
  | 'total_score'
  | 'perfect_games'
  | 'total_games'
  | 'wordbank_completed';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  threshold: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 认证相关类型
export interface LoginParams {
  account: string;
  password: string;
}

export interface RegisterParams {
  nickname: string;
  email?: string;
  phone?: string;
  password: string;
  code?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
