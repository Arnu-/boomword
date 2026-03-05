import api from './api';

// ==================== 类型定义 ====================

export interface AdminUser {
  id: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  gender: string;
  grade?: string;
  isGuest: boolean;
  createdAt: string;
  lastLoginAt?: string;
  level?: { level: number; totalExp: number; consecutiveDays: number };
  gamesCount: number;
  wordsCount: number;
  achievementsCount: number;
}

export interface UserDetail extends AdminUser {
  statistics: {
    totalGames: number;
    totalWords: number;
    totalAchievements: number;
    totalWrongWords: number;
    totalScore: number;
    totalDuration: number;
    totalCorrect: number;
    avgStars: number;
    avgAccuracy: number;
    maxScore: number;
    modeStats: Array<{ mode: string; _count: { id: number }; _avg: { score: number } }>;
  };
}

export interface GameRecord {
  id: string;
  userId: string;
  sectionId: string;
  mode: string;
  score: number;
  stars: number;
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  maxCombo: number;
  accuracy: number;
  timeUsed: number;
  createdAt: string;
  section?: {
    id: string;
    name: string;
    chapter?: {
      id: string;
      name: string;
      wordBank?: { id: string; name: string };
    };
  };
}

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  code: string;
  description?: string;
  sort: number;
  isActive: boolean;
  createdAt: string;
  _count?: { wordBanks: number };
}

export interface WordBank {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  description?: string;
  coverImage?: string;
  wordCount: number;
  chapterCount: number;
  difficulty: number;
  sort: number;
  isActive: boolean;
  isFree: boolean;
  createdAt: string;
  category?: { id: string; name: string };
  _count?: { chapters: number; userWordBanks: number };
}

export interface Chapter {
  id: string;
  wordBankId: string;
  name: string;
  description?: string;
  order: number;
  wordCount: number;
  isActive: boolean;
  createdAt: string;
  _count?: { sections: number };
}

export interface Section {
  id: string;
  chapterId: string;
  name: string;
  order: number;
  wordCount: number;
  timeLimit: number;
  isActive: boolean;
  createdAt: string;
  _count?: { sectionWords: number };
}

export interface Word {
  id: string;
  english: string;
  chinese: string;
  phonetic?: string;
  difficulty: number;
  exampleSentence?: string;
  exampleChinese?: string;
  tags: string[];
  createdAt: string;
  _count?: { sectionWords: number };
}

export interface SectionWord {
  id: string;
  sectionId: string;
  wordId: string;
  order: number;
  word: Word;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PageResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface OverviewStats {
  totalUsers: number;
  guestUsers: number;
  totalWordBanks: number;
  totalWords: number;
  totalGames: number;
  activeUsers: number;
  totalChapters: number;
  totalSections: number;
  todayNewUsers: number;
  todayGames: number;
  todayAvgScore: number;
  todayAvgAccuracy: number;
}

export interface DailyStat {
  date: string;
  newUsers: number;
  games: number;
  totalScore: number;
  avgAccuracy: number;
}

// ==================== 用户管理 API ====================

export const adminUserApi = {
  /** 获取用户列表 */
  getUsers: (params: { page?: number; limit?: number; keyword?: string; status?: string }) =>
    api.get<PageResult<AdminUser>>('/admin/users', { params }),

  /** 获取用户详情 */
  getUserDetail: (id: string) =>
    api.get<UserDetail>(`/admin/users/${id}`),

  /** 更新用户状态 */
  updateUserStatus: (id: string, status: string) =>
    api.put(`/admin/users/${id}/status`, { status }),

  /** 更新用户角色 */
  updateUserRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),

  /** 重置用户密码 */
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),

  /** 获取用户游戏记录 */
  getGameRecords: (id: string, params: { page?: number; limit?: number; mode?: string }) =>
    api.get<PageResult<GameRecord>>(`/admin/users/${id}/game-records`, { params }),

  /** 获取用户学习进度 */
  getProgress: (id: string) =>
    api.get(`/admin/users/${id}/progress`),
};

// ==================== 分类管理 API ====================

export const adminCategoryApi = {
  /** 获取分类列表 */
  getCategories: () =>
    api.get<Category[]>('/admin/categories'),

  /** 创建分类 */
  createCategory: (data: { name: string; code: string; description?: string; parentId?: string; sort?: number }) =>
    api.post<Category>('/admin/categories', data),

  /** 更新分类 */
  updateCategory: (id: string, data: Partial<Category>) =>
    api.put<Category>(`/admin/categories/${id}`, data),

  /** 删除分类 */
  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`),
};

// ==================== 词库管理 API ====================

export const adminWordBankApi = {
  /** 获取词库列表 */
  getWordBanks: (params: { page?: number; limit?: number; keyword?: string; categoryId?: string }) =>
    api.get<PageResult<WordBank>>('/admin/wordbanks', { params }),

  /** 创建词库 */
  createWordBank: (data: Partial<WordBank> & { name: string; code: string; categoryId: string }) =>
    api.post<WordBank>('/admin/wordbanks', data),

  /** 更新词库 */
  updateWordBank: (id: string, data: Partial<WordBank>) =>
    api.put<WordBank>(`/admin/wordbanks/${id}`, data),

  /** 删除词库 */
  deleteWordBank: (id: string) =>
    api.delete(`/admin/wordbanks/${id}`),

  /** 获取章节列表 */
  getChapters: (wordBankId: string) =>
    api.get<Chapter[]>(`/admin/wordbanks/${wordBankId}/chapters`),

  /** 创建章节 */
  createChapter: (wordBankId: string, data: { name: string; description?: string; order?: number }) =>
    api.post<Chapter>(`/admin/wordbanks/${wordBankId}/chapters`, data),
};

// ==================== 章节管理 API ====================

export const adminChapterApi = {
  /** 更新章节 */
  updateChapter: (id: string, data: Partial<Chapter>) =>
    api.put<Chapter>(`/admin/chapters/${id}`, data),

  /** 删除章节 */
  deleteChapter: (id: string) =>
    api.delete(`/admin/chapters/${id}`),

  /** 获取小节列表 */
  getSections: (chapterId: string) =>
    api.get<Section[]>(`/admin/chapters/${chapterId}/sections`),

  /** 创建小节 */
  createSection: (chapterId: string, data: { name: string; order?: number; timeLimit?: number }) =>
    api.post<Section>(`/admin/chapters/${chapterId}/sections`, data),
};

// ==================== 小节管理 API ====================

export const adminSectionApi = {
  /** 更新小节 */
  updateSection: (id: string, data: Partial<Section>) =>
    api.put<Section>(`/admin/sections/${id}`, data),

  /** 删除小节 */
  deleteSection: (id: string) =>
    api.delete(`/admin/sections/${id}`),

  /** 获取小节单词列表 */
  getSectionWords: (sectionId: string) =>
    api.get<SectionWord[]>(`/admin/sections/${sectionId}/words`),

  /** 添加单词到小节 */
  addWord: (sectionId: string, data: { wordId: string; order?: number }) =>
    api.post<SectionWord>(`/admin/sections/${sectionId}/words`, data),

  /** 批量添加单词到小节 */
  batchAddWords: (sectionId: string, wordIds: string[]) =>
    api.post(`/admin/sections/${sectionId}/words/batch`, { wordIds }),

  /** 从小节移除单词 */
  removeWord: (sectionId: string, wordId: string) =>
    api.delete(`/admin/sections/${sectionId}/words/${wordId}`),
};

// ==================== 单词管理 API ====================

export const adminWordApi = {
  /** 获取全局单词列表 */
  getWords: (params: { page?: number; limit?: number; keyword?: string }) =>
    api.get<PageResult<Word>>('/admin/words', { params }),

  /** 创建单词 */
  createWord: (data: Partial<Word> & { english: string; chinese: string }) =>
    api.post<Word>('/admin/words', data),

  /** 更新单词 */
  updateWord: (id: string, data: Partial<Word>) =>
    api.put<Word>(`/admin/words/${id}`, data),

  /** 删除单词 */
  deleteWord: (id: string) =>
    api.delete(`/admin/words/${id}`),
};

// ==================== 统计 API ====================

export const adminStatsApi = {
  /** 总览统计 */
  getOverview: () =>
    api.get<OverviewStats>('/admin/statistics/overview'),

  /** 每日统计 */
  getDailyStats: (days = 30) =>
    api.get<DailyStat[]>('/admin/statistics/daily', { params: { days } }),

  /** 游戏模式分布 */
  getGameModeStats: () =>
    api.get('/admin/statistics/game-modes'),
};
