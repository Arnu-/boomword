import api from './api';

export type GameMode = 'practice' | 'challenge';

export interface StartGameParams {
  sectionId: string;
  mode: GameMode;
}

export interface StartGameResponse {
  gameRecordId: string;
  mode: GameMode;
  totalWords: number;
  currentWord: {
    id: string;
    chinese: string;
    english?: string;
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
  hasNext: boolean;
  nextWord: {
    id: string;
    chinese: string;
    english?: string;
  } | null;
  progress: {
    current: number;
    total: number;
  };
}

export interface EndGameParams {
  gameRecordId: string;
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
  totalWords: number;
  correctWords: number;
  wrongWords: number;
  score: number;
  stars: number;
  duration: number;
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
};
