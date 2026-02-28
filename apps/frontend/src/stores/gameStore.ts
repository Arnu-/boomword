import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type GameMode = 'practice' | 'challenge';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

interface Word {
  id: string;
  chinese: string;
  english?: string; // 练习模式有，挑战模式无
}

interface GameState {
  // 游戏状态
  status: GameStatus;
  mode: GameMode;
  gameRecordId: string | null;
  
  // 当前单词
  currentWord: Word | null;
  currentIndex: number;
  totalWords: number;
  
  // 分数统计
  score: number;
  correctCount: number;
  wrongCount: number;
  
  // 时间
  startTime: number | null;
  elapsedTime: number;
  wordStartTime: number | null;
  
  // 输入
  userInput: string;
  isInputShaking: boolean;
}

interface GameActions {
  // 游戏控制
  startGame: (gameRecordId: string, mode: GameMode, totalWords: number, firstWord: Word) => void;
  endGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  
  // 答题
  setNextWord: (word: Word | null, result: { isCorrect: boolean; score: number }) => void;
  setUserInput: (input: string) => void;
  shakeInput: () => void;
  
  // 时间
  updateElapsedTime: () => void;
  
  // 重置
  resetGame: () => void;
}

const initialState: GameState = {
  status: 'idle',
  mode: 'practice',
  gameRecordId: null,
  currentWord: null,
  currentIndex: 0,
  totalWords: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  startTime: null,
  elapsedTime: 0,
  wordStartTime: null,
  userInput: '',
  isInputShaking: false,
};

export const useGameStore = create<GameState & GameActions>()(
  immer((set, get) => ({
    ...initialState,

    startGame: (gameRecordId, mode, totalWords, firstWord) =>
      set((state) => {
        state.status = 'playing';
        state.mode = mode;
        state.gameRecordId = gameRecordId;
        state.totalWords = totalWords;
        state.currentWord = firstWord;
        state.currentIndex = 0;
        state.score = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.startTime = Date.now();
        state.wordStartTime = Date.now();
        state.elapsedTime = 0;
        state.userInput = '';
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
          state.wordStartTime = Date.now();
        }
      }),

    setNextWord: (word, result) =>
      set((state) => {
        if (result.isCorrect) {
          state.correctCount++;
        } else {
          state.wrongCount++;
        }
        state.score += result.score;
        state.currentIndex++;
        state.currentWord = word;
        state.wordStartTime = Date.now();
        state.userInput = '';
        
        if (!word) {
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

    updateElapsedTime: () =>
      set((state) => {
        if (state.status === 'playing' && state.startTime) {
          state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
        }
      }),

    resetGame: () => set(initialState),
  })),
);
