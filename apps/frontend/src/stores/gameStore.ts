import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type GameMode = 'practice' | 'challenge';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface Word {
  id: string;
  chinese: string;
  english?: string;
  phonetic?: string;
  difficulty?: number;
}

interface GameState {
  // 游戏状态
  status: GameStatus;
  mode: GameMode;
  gameRecordId: string | null;
  
  // 单词列表
  words: Word[];
  answeredWordIds: string[];
  totalWords: number;
  
  // 分数统计
  score: number;
  correctCount: number;
  wrongCount: number;
  combo: number;
  maxCombo: number;
  
  // 时间
  startTime: number | null;
  elapsedTime: number;
  
  // 输入
  userInput: string;
  isInputShaking: boolean;
  
  // 最近消除的泡泡（用于动画）
  poppingWordId: string | null;
}

interface GameActions {
  // 游戏控制
  startGame: (gameRecordId: string, mode: GameMode, words: Word[]) => void;
  endGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  
  // 答题
  markWordAnswered: (wordId: string, result: { isCorrect: boolean; score: number; combo: number; maxCombo: number }) => void;
  setUserInput: (input: string) => void;
  shakeInput: () => void;
  clearPoppingWord: () => void;
  
  // 时间
  updateElapsedTime: () => void;
  
  // 重置
  resetGame: () => void;
  
  // 计算属性
  getRemainingWords: () => Word[];
}

const initialState: GameState = {
  status: 'idle',
  mode: 'practice',
  gameRecordId: null,
  words: [],
  answeredWordIds: [],
  totalWords: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  combo: 0,
  maxCombo: 0,
  startTime: null,
  elapsedTime: 0,
  userInput: '',
  isInputShaking: false,
  poppingWordId: null,
};

export const useGameStore = create<GameState & GameActions>()(
  immer((set, get) => ({
    ...initialState,

    startGame: (gameRecordId, mode, words) =>
      set((state) => {
        state.status = 'playing';
        state.mode = mode;
        state.gameRecordId = gameRecordId;
        state.words = words;
        state.answeredWordIds = [];
        state.totalWords = words.length;
        state.score = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.combo = 0;
        state.maxCombo = 0;
        state.startTime = Date.now();
        state.elapsedTime = 0;
        state.userInput = '';
        state.poppingWordId = null;
      }),

    endGame: () =>
      set((state) => {
        state.status = 'finished';
      }),

    pauseGame: () =>
      set((state) => {
        if (state.status === 'playing') {
          state.status = 'paused';
        }
      }),

    resumeGame: () =>
      set((state) => {
        if (state.status === 'paused') {
          state.status = 'playing';
        }
      }),

    markWordAnswered: (wordId, result) =>
      set((state) => {
        if (result.isCorrect) {
          state.correctCount++;
          state.poppingWordId = wordId;
        } else {
          state.wrongCount++;
        }
        state.score += result.score;
        state.combo = result.combo;
        state.maxCombo = result.maxCombo;
        state.answeredWordIds.push(wordId);
        state.userInput = '';
        
        // 检查是否所有单词都已回答
        if (state.answeredWordIds.length >= state.words.length) {
          state.status = 'finished';
        }
      }),

    setUserInput: (input) =>
      set((state) => {
        state.userInput = input;
      }),

    shakeInput: () => {
      set((state) => {
        state.isInputShaking = true;
      });
      setTimeout(() => {
        set((state) => {
          state.isInputShaking = false;
        });
      }, 500);
    },

    clearPoppingWord: () =>
      set((state) => {
        state.poppingWordId = null;
      }),

    updateElapsedTime: () =>
      set((state) => {
        if (state.status === 'playing' && state.startTime) {
          state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
        }
      }),

    resetGame: () => set(initialState),

    getRemainingWords: () => {
      const state = get();
      return state.words.filter(w => !state.answeredWordIds.includes(w.id));
    },
  })),
);
