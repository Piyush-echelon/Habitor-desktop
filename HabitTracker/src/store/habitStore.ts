import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, UserProfile, Achievement, HabitCategory, Task } from '../types';

const STORAGE_KEYS = {
  HABITS: '@habit_tracker_habits',
  PROFILE: '@habit_tracker_profile',
  ACHIEVEMENTS: '@habit_tracker_achievements',
  TASKS: '@habit_tracker_tasks',
  AUTH_UID: '@habit_tracker_auth_uid',
};

const INITIAL_TASKS: Task[] = [];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first habit session',
    icon: '🎯',
    xpReward: 50,
    unlocked: false,
    type: 'completions',
    requirement: 1,
  },
  {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Reach a 3-day completion streak on any habit',
    icon: '🔥',
    xpReward: 100,
    unlocked: false,
    type: 'streak',
    requirement: 3,
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Reach a 7-day completion streak on any habit',
    icon: '⚡',
    xpReward: 250,
    unlocked: false,
    type: 'streak',
    requirement: 7,
  },
  {
    id: 'consistent_pioneer',
    title: 'Consistent Pioneer',
    description: 'Achieve 20 total habit completions',
    icon: '🏆',
    xpReward: 200,
    unlocked: false,
    type: 'completions',
    requirement: 20,
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Achieve 100 total habit completions',
    icon: '👑',
    xpReward: 500,
    unlocked: false,
    type: 'completions',
    requirement: 100,
  },
  {
    id: 'level_five',
    title: 'Power User',
    description: 'Reach Level 5 in your self-improvement journey',
    icon: '🔮',
    xpReward: 300,
    unlocked: false,
    type: 'level',
    requirement: 5,
  },
];

const INITIAL_PROFILE: UserProfile = {
  name: 'User',
  level: 1,
  xp: 0,
  nextLevelXp: 100,
  totalCompletions: 0,
  longestActiveStreak: 0,
  badges: [],
  sleepHours: 7.33,
  sleepDeep: 1.15,
  sleepQuality: 82,
  heartRate: 72,
  cortisol: 56,
  bookTitle: 'THE ART',
  bookAuthor: 'OF HABIT',
  biometrics: {},
};

const INITIAL_HABITS: Habit[] = [];

// Helper to format date as YYYY-MM-DD local
export const getLocalDateString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split('T')[0];
};

export const useHabitStore = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<{ show: boolean; level: number } | null>(null);


  // Load all data on mount (AsyncStorage only — cloud restore happens in App.tsx)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const storedHabits = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
        const storedAchievements = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
        const storedTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);

        setHabits(storedHabits ? JSON.parse(storedHabits) : INITIAL_HABITS);
        setProfile(storedProfile ? JSON.parse(storedProfile) : INITIAL_PROFILE);
        setAchievements(storedAchievements ? JSON.parse(storedAchievements) : DEFAULT_ACHIEVEMENTS);
        setTasks(storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS);
      } catch (error) {
        console.error('Failed to load habit tracker data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // ── Core save utility ───────────────────────────────────────────────────────
  // Writes to AsyncStorage for persistent offline-first storage.
  const saveData = async (
    newHabits: Habit[],
    newProfile: UserProfile,
    newAchievements: Achievement[],
    newTasks: Task[] = tasks
  ) => {
    try {
      // Local persist (always)
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(newHabits));
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(newAchievements));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Add Habit
  const addHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'history' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Math.random().toString(36).substring(2, 9),
      streak: 0,
      longestStreak: 0,
      history: {},
      createdAt: new Date().toISOString(),
    };
    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await saveData(updatedHabits, profile, achievements);
  };

  // Delete Habit
  const deleteHabit = async (id: string) => {
    const updatedHabits = habits.filter(h => h.id !== id);
    setHabits(updatedHabits);
    await saveData(updatedHabits, profile, achievements);
  };

  // Edit Habit
  const editHabit = async (
    id: string,
    updatedData: Partial<Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'history' | 'createdAt'>>
  ) => {
    const updatedHabits = habits.map((h) => (h.id === id ? { ...h, ...updatedData } : h));
    setHabits(updatedHabits);
    await saveData(updatedHabits, profile, achievements);
  };

  // Add Task
  const addTask = async (title: string, category: Task['category'] = 'work') => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      completed: false,
      category,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveData(habits, profile, achievements, updatedTasks);
  };

  // Toggle Task Completion
  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    await saveData(habits, profile, achievements, updatedTasks);
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    await saveData(habits, profile, achievements, updatedTasks);
  };

  // Update Task Category
  const updateTaskCategory = async (id: string, category: Task['category']) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, category } : t);
    setTasks(updatedTasks);
    await saveData(habits, profile, achievements, updatedTasks);
  };

  // Helper: Calculate streak for a habit history
  const calculateStreak = (history: { [dateStr: string]: number }, targetCount: number): number => {
    let currentStreak = 0;
    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const todayProgress = history[todayStr] || 0;
    const yesterdayProgress = history[yesterdayStr] || 0;
    
    const completedToday = todayProgress >= targetCount;
    const completedYesterday = yesterdayProgress >= targetCount;

    if (!completedToday && !completedYesterday) {
      return 0;
    }

    let checkDate = new Date();
    if (!completedToday && completedYesterday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const checkDateStr = getLocalDateString(checkDate);
      const progress = history[checkDateStr] || 0;
      if (progress >= targetCount) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  };

  // Log progress
  const logHabitProgress = async (id: string, dateStr: string, delta: number) => {
    let xpEarned = 0;
    let completedAction = false;
    let revertedAction = false;

    const updatedHabits = habits.map((habit): Habit => {
      if (habit.id !== id) return habit;

      const currentCount = habit.history[dateStr] || 0;
      const newCount = Math.max(0, currentCount + delta);
      const newHistory = { ...habit.history, [dateStr]: newCount };

      const wasCompleted = currentCount >= habit.targetCount;
      const isCompleted = newCount >= habit.targetCount;

      if (!wasCompleted && isCompleted) {
        completedAction = true;
        const xpMap = { easy: 10, medium: 20, hard: 30 };
        xpEarned += xpMap[habit.difficulty];
      } else if (wasCompleted && !isCompleted) {
        revertedAction = true;
        const xpMap = { easy: 10, medium: 20, hard: 30 };
        xpEarned -= xpMap[habit.difficulty];
      } else if (isCompleted && delta > 0) {
        xpEarned += 2;
      }

      const calculatedStreak = calculateStreak(newHistory, habit.targetCount);
      const longestStreak = Math.max(habit.longestStreak, calculatedStreak);

      if (calculatedStreak > habit.streak && calculatedStreak > 0) {
        if (calculatedStreak === 3) xpEarned += 20;
        if (calculatedStreak === 7) xpEarned += 50;
      }

      return {
        ...habit,
        history: newHistory,
        streak: calculatedStreak,
        longestStreak: longestStreak,
      };
    });

    const completionsDelta = completedAction ? 1 : (revertedAction ? -1 : 0);
    const totalCompletions = Math.max(0, profile.totalCompletions + completionsDelta);
    
    const maxStreakAcrossHabits = updatedHabits.reduce((max, h) => Math.max(max, h.streak), 0);
    const longestActiveStreak = Math.max(profile.longestActiveStreak, maxStreakAcrossHabits);

    let currentXp = profile.xp + xpEarned;
    let currentLevel = profile.level;
    let currentNextLevelXp = profile.nextLevelXp;
    let leveledUp = false;

    while (currentXp >= currentNextLevelXp) {
      currentXp -= currentNextLevelXp;
      currentLevel += 1;
      currentNextLevelXp = currentLevel * 150 + 100;
      leveledUp = true;
    }

    if (currentXp < 0) {
      if (currentLevel > 1) {
        currentLevel -= 1;
        currentNextLevelXp = currentLevel * 150 + 100;
        currentXp = currentNextLevelXp + currentXp;
      } else {
        currentXp = 0;
      }
    }

    if (leveledUp) {
      setShowLevelUpAlert({ show: true, level: currentLevel });
    }

    const updatedAchievements = achievements.map((ach): Achievement => {
      if (ach.unlocked) return ach;

      let meetsRequirement = false;
      if (ach.type === 'completions' && totalCompletions >= ach.requirement) {
        meetsRequirement = true;
      } else if (ach.type === 'streak' && longestActiveStreak >= ach.requirement) {
        meetsRequirement = true;
      } else if (ach.type === 'level' && currentLevel >= ach.requirement) {
        meetsRequirement = true;
      }

      if (meetsRequirement) {
        currentXp += ach.xpReward;
        while (currentXp >= currentNextLevelXp) {
          currentXp -= currentNextLevelXp;
          currentLevel += 1;
          currentNextLevelXp = currentLevel * 150 + 100;
          setShowLevelUpAlert({ show: true, level: currentLevel });
        }
        return { ...ach, unlocked: true };
      }

      return ach;
    });

    const updatedProfile: UserProfile = {
      ...profile,
      level: currentLevel,
      xp: currentXp,
      nextLevelXp: currentNextLevelXp,
      totalCompletions: totalCompletions,
      longestActiveStreak: longestActiveStreak,
      badges: updatedAchievements.filter(a => a.unlocked).map(a => a.id),
    };

    setHabits(updatedHabits);
    setProfile(updatedProfile);
    setAchievements(updatedAchievements);
    
    await saveData(updatedHabits, updatedProfile, updatedAchievements);
  };

  // Reset
  const resetData = async () => {
    const emptyProfile: UserProfile = {
      name: profile?.name || 'User',
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      totalCompletions: 0,
      longestActiveStreak: 0,
      badges: [],
      sleepHours: 7.0,
      sleepDeep: 1.0,
      sleepQuality: 70,
      heartRate: 70,
      cortisol: 45,
      bookTitle: 'THE ART',
      bookAuthor: 'OF HABIT',
      biometrics: {},
    };
    const lockedAchievements = DEFAULT_ACHIEVEMENTS.map(ach => ({ ...ach, unlocked: false }));
    
    setHabits([]);
    setProfile(emptyProfile);
    setAchievements(lockedAchievements);
    setTasks([]);
    
    await saveData([], emptyProfile, lockedAchievements, []);
  };

  // Update Biometrics
  const updateBiometrics = async (
    dateStr: string,
    data: Partial<{
      sleepHours: number;
      sleepDeep: number;
      sleepQuality: number;
      heartRate: number;
      cortisol: number;
      pagesRead: number;
      distanceKm: number;
    }>
  ) => {
    const updatedBiometrics = {
      ...(profile.biometrics || {}),
      [dateStr]: {
        ...(profile.biometrics?.[dateStr] || {}),
        ...data,
      },
    };
    const updatedProfile: UserProfile = {
      ...profile,
      biometrics: updatedBiometrics,
    };
    setProfile(updatedProfile);
    await saveData(habits, updatedProfile, achievements);
  };

  // Update Book Details
  const updateBookDetails = async (title: string, author: string) => {
    const updatedProfile: UserProfile = {
      ...profile,
      bookTitle: title,
      bookAuthor: author,
    };
    setProfile(updatedProfile);
    await saveData(habits, updatedProfile, achievements);
  };

  // Update Profile Name
  const updateProfileName = async (name: string) => {
    const updatedProfile: UserProfile = {
      ...profile,
      name,
    };
    setProfile(updatedProfile);
    await saveData(habits, updatedProfile, achievements);
  };

  // Award Direct XP
  const awardXp = async (amount: number) => {
    let currentXp = profile.xp + amount;
    let currentLevel = profile.level;
    let currentNextLevelXp = profile.nextLevelXp;
    let leveledUp = false;

    while (currentXp >= currentNextLevelXp) {
      currentXp -= currentNextLevelXp;
      currentLevel += 1;
      currentNextLevelXp = currentLevel * 150 + 100;
      leveledUp = true;
    }

    if (leveledUp) {
      setShowLevelUpAlert({ show: true, level: currentLevel });
    }

    const updatedProfile: UserProfile = {
      ...profile,
      level: currentLevel,
      xp: currentXp,
      nextLevelXp: currentNextLevelXp,
    };

    setProfile(updatedProfile);
    await saveData(habits, updatedProfile, achievements);
  };

  // Restore State from Cloud — merges or overwrites local with cloud data
  const syncStateFromBluetooth = async (
    incomingData: {
      habits?: Habit[];
      profile?: UserProfile;
      achievements?: Achievement[];
      tasks?: Task[];
    },
    mergeWithLocal = true
  ) => {
    let newHabits = incomingData.habits ?? INITIAL_HABITS;
    let newProfile = incomingData.profile ?? INITIAL_PROFILE;
    let newAchievements = incomingData.achievements ?? DEFAULT_ACHIEVEMENTS;
    let newTasks = incomingData.tasks ?? INITIAL_TASKS;

    if (mergeWithLocal) {
      console.log('[Habitor] Merging local offline edits with Bluetooth sync state...');
      
      // 1. Merge Habits
      const mergedHabitsMap = new Map<string, Habit>();
      // First populate with incoming cloud habits
      newHabits.forEach(h => mergedHabitsMap.set(h.id, h));
      // Then merge current local habits
      habits.forEach(localHabit => {
        const cloudHabit = mergedHabitsMap.get(localHabit.id);
        if (cloudHabit) {
          // Merge history records
          const mergedHistory = { ...cloudHabit.history };
          Object.keys(localHabit.history).forEach(date => {
            mergedHistory[date] = Math.max(mergedHistory[date] || 0, localHabit.history[date] || 0);
          });
          mergedHabitsMap.set(localHabit.id, {
            ...cloudHabit,
            ...localHabit, // Keep local configuration edits
            history: mergedHistory,
            streak: Math.max(cloudHabit.streak || 0, localHabit.streak || 0),
            longestStreak: Math.max(cloudHabit.longestStreak || 0, localHabit.longestStreak || 0),
          });
        } else {
          // Local offline-only habit
          mergedHabitsMap.set(localHabit.id, localHabit);
        }
      });
      newHabits = Array.from(mergedHabitsMap.values());

      // 2. Merge Tasks
      const mergedTasksMap = new Map<string, Task>();
      newTasks.forEach(t => mergedTasksMap.set(t.id, t));
      tasks.forEach(localTask => {
        const cloudTask = mergedTasksMap.get(localTask.id);
        if (cloudTask) {
          mergedTasksMap.set(localTask.id, {
            ...cloudTask,
            completed: cloudTask.completed || localTask.completed,
          });
        } else {
          // Local offline-only task
          mergedTasksMap.set(localTask.id, localTask);
        }
      });
      newTasks = Array.from(mergedTasksMap.values());

      // 3. Merge Profile Progress
      let finalProfile = { ...newProfile };
      const localLevel = profile.level || 1;
      const cloudLevel = newProfile.level || 1;
      if (localLevel > cloudLevel) {
        finalProfile.level = localLevel;
        finalProfile.xp = profile.xp || 0;
        finalProfile.nextLevelXp = profile.nextLevelXp || 100;
      } else if (localLevel === cloudLevel) {
        finalProfile.xp = Math.max(newProfile.xp || 0, profile.xp || 0);
      }

      // Merge Biometrics history records
      const mergedBiometrics = { ...(newProfile.biometrics || {}) };
      if (profile.biometrics) {
        Object.keys(profile.biometrics).forEach(date => {
          mergedBiometrics[date] = {
            ...(mergedBiometrics[date] || {}),
            ...(profile.biometrics?.[date] || {}),
          };
        });
      }
      finalProfile.biometrics = mergedBiometrics;

      // Retain custom offline profile name if cloud name is generic
      if ((newProfile.name === 'User' || !newProfile.name) && profile.name && profile.name !== 'User') {
        finalProfile.name = profile.name;
      }

      newProfile = finalProfile;

      // 4. Merge Achievements
      newAchievements = newAchievements.map(cloudAch => {
        const localAch = achievements.find(a => a.id === cloudAch.id);
        return {
          ...cloudAch,
          unlocked: cloudAch.unlocked || (localAch ? localAch.unlocked : false),
        };
      });
    }

    setHabits(newHabits);
    setProfile(newProfile);
    setAchievements(newAchievements);
    setTasks(newTasks);

    // Persist to local cache (skip cloud push to avoid infinite loop)
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(newHabits));
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(newAchievements));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
      console.log('[Habitor] Bluetooth merge completed successfully.');
    } catch (e) {
      console.error('syncStateFromBluetooth local save failed:', e);
    }
  };

  return {
    habits,
    profile,
    achievements,
    tasks,
    isLoading,
    addHabit,
    deleteHabit,
    editHabit,
    logHabitProgress,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskCategory,
    updateBiometrics,
    updateBookDetails,
    updateProfileName,
    awardXp,
    syncStateFromBluetooth,
    resetData,
    showLevelUpAlert,
    dismissLevelUpAlert: () => setShowLevelUpAlert(null),
  };
};
