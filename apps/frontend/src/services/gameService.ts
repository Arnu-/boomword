import api from './api';

export type GameMode = 'practice' | 'challenge';

export interface StartGameParams {
  sectionId: string;
  mode: GameMode;
}

export interface GameWord {
  id: string;
  chinese: string;
  english?: string;
  phonetic?: string;
  difficulty?: number;
}

export interface StartGameResponse {
  gameRecordId: string;
  mode: GameMode;
  totalWords: number;
  words: GameWord[];
  sectionInfo: {
    id: string;
    name: string;
    chapterName: string;
    wordBankName: string;
  };
}

export interface SubmitAnswerParams {
  gameRecordId: string;
  wordId: string;
  answer: string;
  timeSpent: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  wordScore: number;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  combo: number;
  maxCombo: number;
  isCompleted: boolean;
  progress: {
    current: number;
    total: number;
  };
}

export interface EndGameParams {
  gameRecordId: string;
}

export interface ReportWrongParams {
  gameRecordId: string;
  wordId: string;
}

export interface ReportWrongResponse {
  success: boolean;
  wrongCount: number;
  combo: number;
}

export interface EndGameResponse {
  gameRecordId: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  stars: number;
  duration: number;
  isNewBest: boolean;
}

export interface GameRecord {
  id: string;
  mode: GameMode;
  totalCount: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  stars: number;
  maxCombo: number;
  accuracy: number;
  timeUsed: number;
  createdAt: string;
  section: {
    id: string;
    name: string;
    chapter: {
      id: string;
      name: string;
      wordBank: {
        id: string;
        name: string;
      };
    };
  };
  nextSection: {
    id: string;
    name: string;
    wordCount: number;
  } | null;
}

export interface NextSectionInfo {
  sectionId: string;
  sectionName: string;
  chapterName: string;
  wordBankName: string;
  wordCount: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export const gameService = {
  // 开始游戏
  startGame: (params: StartGameParams): Promise<StartGameResponse> => {
    return api.post('/game/start', params);
  },

  // 提交答案
  submitAnswer: (params: SubmitAnswerParams): Promise<SubmitAnswerResponse> => {
    return api.post('/game/submit', params);
  },

  // 上报错误输入（不消耗单词机会）
  reportWrong: (params: ReportWrongParams): Promise<ReportWrongResponse> => {
    return api.post('/game/wrong', params);
  },

  // 结束游戏
  endGame: (params: EndGameParams): Promise<EndGameResponse> => {
    return api.post('/game/end', params);
  },

  // 获取游戏记录详情
  getGameRecord: (recordId: string): Promise<GameRecord> => {
    return api.get(`/game/record/${recordId}`);
  },

  // 获取游戏历史
  getGameHistory: (): Promise<GameRecord[]> => {
    return api.get('/game/history');
  },

  // 获取下一关信息（最后一次通过的关的下一关）
  getNextSection: (mode: GameMode): Promise<NextSectionInfo | null> => {
    return api.get(`/game/next-section?mode=${mode}`);
  },
};