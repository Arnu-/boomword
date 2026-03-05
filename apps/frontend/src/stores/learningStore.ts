import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface DailyGoal {
  goal: number;
  completed: number;
  percentage: number;
  isCompleted: boolean;
}

interface LearningOverview {
  masteredCount: number;
  learningCount: number;
  totalLearnedCount: number;
  streakDays: number;
}

interface TodayStats {
  wordsLearned: number;
  score: number;
  duration: number;
  gamesPlayed: number;
}

interface WordBankProgress {
  id: string;
  name: string;
  totalWords: number;
  completedSections: number;
  totalSections: number;
  percentage: number;
}

interface LearningState {
  overview: LearningOverview | null;
  todayStats: TodayStats | null;
  dailyGoal: DailyGoal | null;
  wordBankProgress: WordBankProgress[];
  isLoading: boolean;
}

interface LearningActions {
  setOverview: (overview: LearningOverview) => void;
  setTodayStats: (stats: TodayStats) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  setWordBankProgress: (progress: WordBankProgress[]) => void;
  setLoading: (loading: boolean) => void;
  updateAfterGame: (wordsLearned: number, score: number, duration: number) => void;
}

export const useLearningStore = create<LearningState & LearningActions>()(
  immer((set) => ({
    overview: null,
    todayStats: null,
    dailyGoal: null,
    wordBankProgress: [],
    isLoading: false,

    setOverview: (overview) =>
      set((state) => {
        state.overview = overview;
      }),

    setTodayStats: (stats) =>
      set((state) => {
        state.todayStats = stats;
      }),

    setDailyGoal: (goal) =>
      set((state) => {
        state.dailyGoal = goal;
      }),

    setWordBankProgress: (progress) =>
      set((state) => {
        state.wordBankProgress = progress;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    updateAfterGame: (wordsLearned, score, duration) =>
      set((state) => {
        if (state.todayStats) {
          state.todayStats.wordsLearned += wordsLearned;
          state.todayStats.score += score;
          state.todayStats.duration += duration;
          state.todayStats.gamesPlayed += 1;
        }
        if (state.dailyGoal) {
          state.dailyGoal.completed += wordsLearned;
          state.dailyGoal.percentage = Math.min(
            100,
            Math.round((state.dailyGoal.completed / state.dailyGoal.goal) * 100),
          );
          state.dailyGoal.isCompleted = state.dailyGoal.completed >= state.dailyGoal.goal;
        }
      }),
  })),
);
