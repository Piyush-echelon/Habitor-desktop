export type HabitCategory = 'health' | 'mind' | 'productivity' | 'fitness' | 'routine';

export type HabitDifficulty = 'easy' | 'medium' | 'hard';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly';
  targetCount: number; // e.g. 8 for glasses of water, 1 for gym session
  difficulty: HabitDifficulty;
  color: string;
  streak: number;
  longestStreak: number;
  history: { [dateStr: string]: number }; // e.g. { '2026-05-23': 8, '2026-05-22': 5 }
  createdAt: string;
}

export interface UserProfile {
  name?: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  totalCompletions: number;
  longestActiveStreak: number;
  badges: string[];
  sleepHours?: number;
  sleepDeep?: number;
  sleepQuality?: number;
  heartRate?: number;
  cortisol?: number;
  bookTitle?: string;
  bookAuthor?: string;
  biometrics?: {
    [dateStr: string]: {
      sleepHours?: number;
      sleepDeep?: number;
      sleepQuality?: number;
      heartRate?: number;
      cortisol?: number;
      pagesRead?: number;
      distanceKm?: number;
    };
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  type: 'completions' | 'streak' | 'level' | 'category';
  requirement: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'work' | 'personal' | 'urgent' | 'routine';
  createdAt: string;
}
