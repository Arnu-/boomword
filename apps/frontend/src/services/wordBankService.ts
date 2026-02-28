import api from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  wordBankCount: number;
}

export interface WordBank {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  difficulty: number;
  totalWords: number;
  category?: Category;
}

export interface WordBankProgress {
  wordBank: {
    id: string;
    name: string;
    description?: string;
    totalWords: number;
  };
  progress: {
    completedSections: number;
    totalSections: number;
    percentage: number;
    totalStars: number;
    maxStars: number;
  };
  chapters: Array<{
    id: string;
    name: string;
    order: number;
    sections: Array<{
      id: string;
      name: string;
      order: number;
      wordCount: number;
      isUnlocked: boolean;
      isCompleted: boolean;
      stars: number;
      bestScore: number;
    }>;
  }>;
}

export interface SectionDetail {
  id: string;
  name: string;
  wordCount: number;
  chapter: {
    id: string;
    name: string;
    wordBank: {
      id: string;
      name: string;
    };
  };
  userProgress: {
    isUnlocked: boolean;
    isCompleted: boolean;
    stars: number;
    bestScore: number;
    practiceCount: number;
  };
}

export const wordBankService = {
  // 获取分类列表
  getCategories: (): Promise<Category[]> => {
    return api.get('/categories');
  },

  // 获取词库列表
  getWordBanks: (categoryId?: string): Promise<WordBank[]> => {
    const params = categoryId ? { categoryId } : {};
    return api.get('/wordbanks', { params });
  },

  // 获取词库详情（包含进度）
  getWordBankProgress: (wordBankId: string): Promise<WordBankProgress> => {
    return api.get(`/wordbanks/${wordBankId}/progress`);
  },

  // 选择词库开始挑战
  selectWordBank: (wordBankId: string): Promise<void> => {
    return api.post(`/wordbanks/${wordBankId}/select`);
  },

  // 获取小节详情
  getSectionDetail: (sectionId: string): Promise<SectionDetail> => {
    return api.get(`/levels/sections/${sectionId}`);
  },

  // 获取小节单词列表
  getSectionWords: (sectionId: string): Promise<Array<{
    id: string;
    english: string;
    chinese: string;
    phonetic?: string;
  }>> => {
    return api.get(`/levels/sections/${sectionId}/words`);
  },
};
