import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions, TextInput } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { Habit, HabitCategory, UserProfile, Task } from '../types';
import { VectorIcon } from './VectorIcon';

interface HabitListProps {
  habits: Habit[];
  tasks: Task[];
  profile: UserProfile;
  dateStr: string;
  selectedDayOffset?: number;
  onSelectedDayOffsetChange?: (offset: number) => void;
  onLogProgress: (id: string, date: string, delta: number) => void;
  onDelete: (id: string) => void;
  onCreateClick?: () => void;
  onUpdateBiometrics?: (dateStr: string, data: Partial<{
    sleepHours: number;
    sleepDeep: number;
    sleepQuality: number;
    heartRate: number;
    cortisol: number;
    pagesRead: number;
    distanceKm: number;
  }>) => void;
  isDark: boolean;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  tasks,
  profile,
  dateStr,
  selectedDayOffset: propSelectedDayOffset,
  onSelectedDayOffsetChange,
  onLogProgress,
  onDelete,
  onCreateClick,
  onUpdateBiometrics,
  isDark,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all');

  // Selected Day in horizontal strip (Index offset from today)
  const [localSelectedDayOffset, setLocalSelectedDayOffset] = useState(0);
  const selectedDayOffset = propSelectedDayOffset !== undefined ? propSelectedDayOffset : localSelectedDayOffset;
  const setSelectedDayOffset = onSelectedDayOffsetChange !== undefined ? onSelectedDayOffsetChange : setLocalSelectedDayOffset;

  // Helper to generate last/next 7 days for the date strip
  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
        offset: i,
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const activeDay = calendarDays.find(d => d.offset === selectedDayOffset) || calendarDays[3];

  // Dynamic Biometrics Data with dynamic gamified updates driven by selected day's habit logs and task status!
  const activeDateStr = activeDay.dateStr;
  const dayBio = profile.biometrics?.[activeDateStr] || {};

  const totalHabitsCount = habits.length;
  const completedHabitsToday = habits.filter((h) => (h.history[activeDateStr] || 0) >= h.targetCount);
  const completedHabitsCount = completedHabitsToday.length;
  const todayCompletionRate = totalHabitsCount > 0 ? completedHabitsCount / totalHabitsCount : 0;

  const sleepHours = dayBio.sleepHours !== undefined 
    ? dayBio.sleepHours 
    : (6.2 + 1.8 * todayCompletionRate);

  const completedHealthFitness = habits.filter((h) => (h.category === 'health' || h.category === 'fitness') && (h.history[activeDateStr] || 0) >= h.targetCount).length;
  const sleepDeep = dayBio.sleepDeep !== undefined
    ? dayBio.sleepDeep
    : Math.min(1.6, 0.75 + completedHealthFitness * 0.35);

  const sleepQuality = dayBio.sleepQuality !== undefined
    ? dayBio.sleepQuality
    : Math.round(62 + 34 * todayCompletionRate);

  const completedCalm = habits.filter((h) => (h.category === 'mind' || h.category === 'health') && (h.history[activeDateStr] || 0) >= h.targetCount).length;
  const heartRate = dayBio.heartRate !== undefined
    ? dayBio.heartRate
    : Math.max(62, 79 - completedCalm * 4);

  const pendingUrgentTasks = tasks.filter((t) => !t.completed && (t.category === 'urgent' || t.category === 'work')).length;
  const completedMindToday = habits.filter((h) => h.category === 'mind' && (h.history[activeDateStr] || 0) >= h.targetCount).length;
  const cortisol = dayBio.cortisol !== undefined
    ? dayBio.cortisol
    : Math.max(20, Math.min(95, 42 + pendingUrgentTasks * 12 - completedMindToday * 15));

  // Editing Biometrics State
  const [isEditingSleep, setIsEditingSleep] = useState(false);
  const [editSleepVal, setEditSleepVal] = useState('7');
  const [editSleepMins, setEditSleepMins] = useState('20');
  const [editDeepVal, setEditDeepVal] = useState('1');
  const [editDeepMins, setEditDeepMins] = useState('9');
  const [editQualityVal, setEditQualityVal] = useState('82');

  const [isEditingHr, setIsEditingHr] = useState(false);
  const [editHrVal, setEditHrVal] = useState('72');

  const [isEditingCortisol, setIsEditingCortisol] = useState(false);
  const [editCortisolVal, setEditCortisolVal] = useState('56');

  // Format Helper
  const formatHoursMins = (val: number) => {
    const hours = Math.floor(val);
    const mins = Math.round((val - hours) * 60);
    return `${hours}h ${mins}m`;
  };

  const handleSaveSleep = () => {
    const hours = parseInt(editSleepVal, 10) || 0;
    const mins = parseInt(editSleepMins, 10) || 0;
    const deepHours = parseInt(editDeepVal, 10) || 0;
    const deepMins = parseInt(editDeepMins, 10) || 0;
    const qual = Math.min(100, Math.max(0, parseInt(editQualityVal, 10) || 0));

    onUpdateBiometrics?.(activeDay.dateStr, {
      sleepHours: hours + (mins / 60),
      sleepDeep: deepHours + (deepMins / 60),
      sleepQuality: qual,
    });
    setIsEditingSleep(false);
  };

  const getHrNote = (hr: number) => {
    if (hr < 60) return 'Resting bradycardia (athletic)';
    if (hr <= 80) return 'Ideal resting heart rate';
    if (hr <= 100) return 'Elevated resting heart rate';
    return 'Tachycardia (high resting)';
  };

  const getHrNoteColor = (hr: number) => {
    if (hr < 60) return colors.success;
    if (hr <= 80) return colors.success;
    if (hr <= 100) return colors.warning;
    return colors.danger;
  };

  const getHrBadgeBg = (hr: number) => {
    if (hr <= 80) return 'rgba(76,168,130,0.08)';
    if (hr <= 100) return 'rgba(255,159,67,0.08)';
    return 'rgba(238,82,83,0.08)';
  };

  const getCortisolNote = (cort: number) => {
    if (cort < 30) return 'Very low stress indicators';
    if (cort <= 60) return 'Normal morning cortisol level';
    if (cort <= 80) return 'Moderate stress warning';
    return 'High stress / sleep deprived';
  };

  const getCortisolNoteColor = (cort: number) => {
    if (cort < 30) return colors.success;
    if (cort <= 60) return colors.success;
    if (cort <= 80) return colors.warning;
    return colors.danger;
  };

  const getCortisolBadgeBg = (cort: number) => {
    if (cort <= 60) return 'rgba(76,168,130,0.08)';
    if (cort <= 80) return 'rgba(255,159,67,0.08)';
    return 'rgba(238,82,83,0.08)';
  };

  // Widescale Heatmap States
  const [heatmapScale, setHeatmapScale] = useState<'daily' | 'week' | 'month' | 'year'>('month');
  const [heatmapHabitId, setHeatmapHabitId] = useState<'all' | string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getGridConfig = () => {
    switch (heatmapScale) {
      case 'daily':
        return { cellSize: 18, cellGap: 6, borderRadius: 4 };
      case 'week':
        return { cellSize: 16, cellGap: 5, borderRadius: 4 };
      case 'month':
        return { cellSize: 14, cellGap: 5, borderRadius: 3 };
      case 'year':
        return { cellSize: 9, cellGap: 3, borderRadius: 2 };
      default:
        return { cellSize: 14, cellGap: 5, borderRadius: 3 };
    }
  };
  const { cellSize, cellGap, borderRadius: cellBorderRadius } = getGridConfig();



  const filteredHabits = activeCategory === 'all'
    ? habits
    : habits.filter(h => h.category === activeCategory);

  // Assign mock hours for premium layout styling in daily checklist
  const getHabitMockTime = (index: number) => {
    const times = [
      '07:00 - 07:20 AM',
      '07:45 - 08:00 AM',
      '08:00 - 08:30 AM',
      '08:30 - 09:00 AM',
      '09:15 - 09:45 AM',
      '10:00 - 10:30 AM',
    ];
    return times[index % times.length];
  };

  // Mock icons matching the categories
  const getHabitCategoryIcon = (cat: HabitCategory) => {
    switch (cat) {
      case 'health': return 'health';
      case 'mind': return 'mind';
      case 'productivity': return 'productivity';
      case 'fitness': return 'fitness';
      case 'routine': return 'routine';
      default: return 'award';
    }
  };
  const generateMiniHistory = (habit: Habit) => {
    const data = [];
    const today = new Date();
    const totalDays = 14; // last 2 weeks
    const startDate = new Date();
    startDate.setDate(today.getDate() - (totalDays - 1));

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = habit.history[dateStr] || 0;
      const isDayCompleted = count >= habit.targetCount;

      data.push({
        dateStr,
        isCompleted: isDayCompleted,
      });
    }
    return data;
  };

  const generateFullGridData = () => {
    const data = [];
    const today = new Date();
    
    let totalDays = 84; // Month (12 weeks)
    if (heatmapScale === 'daily') totalDays = 14; // Daily (14 days - 2 weeks)
    if (heatmapScale === 'week') totalDays = 28; // Week (4 weeks)
    if (heatmapScale === 'year') totalDays = 364; // Year (52 weeks)

    const startDate = new Date();
    startDate.setDate(today.getDate() - (totalDays - 1));

    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const adjustedTotalDays = totalDays + dayOfWeek;

    for (let i = 0; i < adjustedTotalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      let completedCount = 0;
      let targetHabitCompleted = false;
      let habitColor = colors.accent;

      if (heatmapHabitId === 'all') {
        habits.forEach((h) => {
          const progress = h.history[dateStr] || 0;
          if (progress >= h.targetCount) {
            completedCount++;
          }
        });
      } else {
        const h = habits.find((x) => x.id === heatmapHabitId);
        if (h) {
          habitColor = h.color;
          const progress = h.history[dateStr] || 0;
          if (progress >= h.targetCount) {
            targetHabitCompleted = true;
          }
        }
      }

      data.push({
        dateStr,
        date: currentDate,
        completedCount,
        targetHabitCompleted,
        habitColor,
      });
    }

    const columns = [];
    const numCols = Math.ceil(data.length / 7);
    for (let col = 0; col < numCols; col++) {
      const colItems = [];
      for (let row = 0; row < 7; row++) {
        const item = data[col * 7 + row];
        if (item) colItems.push(item);
      }
      columns.push(colItems);
    }

    return columns;
  };

  const renderModernEmoji = (percent: number) => {
    let faceColorStart = '#EF4444'; // Red
    let faceColorEnd = '#991B1B';
    let eyesPath = null;
    let mouthPath = null;
    let extraDecorations = null;

    if (percent >= 80) {
      faceColorStart = '#10B981'; // Green
      faceColorEnd = '#047857';
      // Happy eyes
      eyesPath = (
        <>
          <Path d="M13 16 Q15 13 17 16" stroke="#022C22" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M23 16 Q25 13 27 16" stroke="#022C22" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
      // Happy open smile
      mouthPath = (
        <Path d="M14 22 Q20 28 26 22 Z" fill="#022C22" />
      );
    } else if (percent >= 35) {
      faceColorStart = '#FBBF24'; // Yellow
      faceColorEnd = '#B45309';
      // Neutral eyes
      eyesPath = (
        <>
          <Circle cx="15" cy="16" r="2.5" fill="#451A03" />
          <Circle cx="25" cy="16" r="2.5" fill="#451A03" />
        </>
      );
      // Straight mouth
      mouthPath = (
        <Path d="M14 23 L26 23" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
      );
    } else {
      // Sad eyes
      eyesPath = (
        <>
          <Path d="M13 17 Q15 19 17 17" stroke="#450A0A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M23 17 Q25 19 27 17" stroke="#450A0A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      );
      // Sad mouth
      mouthPath = (
        <Path d="M15 25 Q20 20 25 25" stroke="#450A0A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      );
      // Sad tear
      extraDecorations = (
        <Path d="M13 19 C11 22 13 24 14 24 C15 24 15 22 13 19 Z" fill="#3B82F6" />
      );
    }

    return (
      <Svg width="36" height="36" viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id={`emojiGrad-${percent}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={faceColorStart} />
            <Stop offset="100%" stopColor={faceColorEnd} />
          </LinearGradient>
        </Defs>
        <Circle cx="20" cy="20" r="18" fill={`url(#emojiGrad-${percent})`} />
        {eyesPath}
        {mouthPath}
        {extraDecorations}
      </Svg>
    );
  };

  const calculateCompletionStats = () => {
    const today = new Date();
    let daysToCount = 28; // default month
    if (heatmapScale === 'daily') daysToCount = 1;
    if (heatmapScale === 'week') daysToCount = 7;
    if (heatmapScale === 'year') daysToCount = 364;

    let completions = 0;
    let totalTarget = 0;

    if (heatmapHabitId === 'all') {
      if (habits.length === 0) return { percent: 0, completions: 0, total: 0 };
      habits.forEach((h) => {
        for (let i = 0; i < daysToCount; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const progress = h.history[dateStr] || 0;
          if (progress >= h.targetCount) {
            completions++;
          }
        }
      });
      totalTarget = habits.length * daysToCount;
    } else {
      const h = habits.find((x) => x.id === heatmapHabitId);
      if (!h) return { percent: 0, completions: 0, total: 0 };
      for (let i = 0; i < daysToCount; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const progress = h.history[dateStr] || 0;
        if (progress >= h.targetCount) {
          completions++;
        }
      }
      totalTarget = daysToCount;
    }

    const percent = totalTarget > 0 ? Math.round((completions / totalTarget) * 100) : 0;
    return {
      percent,
      completions,
      total: totalTarget
    };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mainDashboardGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        {/* Left Column: Sleep time & Biometrics */}
        <View style={[styles.leftDashboardColumn, { flex: isDesktop ? 1.2 : 1 }]}>
          
          {/* Sleep Time Widget with Triple Rings */}
          <View style={[
            styles.wideWidgetCard, 
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            isDesktop && { flex: 1 }
          ]}>
            <View style={styles.sleepMetaContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.sleepWidgetTitle, { color: colors.textSecondary }]}>Sleep time</Text>
                {!isEditingSleep && (
                  <Pressable
                    onPress={() => {
                      setEditSleepVal(Math.floor(sleepHours).toString());
                      setEditSleepMins(Math.round((sleepHours % 1) * 60).toString());
                      setEditDeepVal(Math.floor(sleepDeep).toString());
                      setEditDeepMins(Math.round((sleepDeep % 1) * 60).toString());
                      setEditQualityVal(sleepQuality.toString());
                      setIsEditingSleep(true);
                    }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 2 }]}
                  >
                    <VectorIcon name="routine" color={colors.textMuted} size={11} />
                  </Pressable>
                )}
              </View>
              
              {isEditingSleep ? (
                <View style={{ gap: 6, marginVertical: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', width: 55 }}>Sleep:</Text>
                    <TextInput
                      style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editSleepVal}
                      onChangeText={setEditSleepVal}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>h</Text>
                    <TextInput
                      style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editSleepMins}
                      onChangeText={setEditSleepMins}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>m</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', width: 55 }}>Deep:</Text>
                    <TextInput
                      style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editDeepVal}
                      onChangeText={setEditDeepVal}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>h</Text>
                    <TextInput
                      style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editDeepMins}
                      onChangeText={setEditDeepMins}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>m</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', width: 55 }}>Quality:</Text>
                    <TextInput
                      style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editQualityVal}
                      onChangeText={setEditQualityVal}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, width: 140 }}>
                    <Pressable
                      onPress={handleSaveSleep}
                      style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.accent, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Save</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIsEditingSleep(false)}
                      style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '800' }}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.sleepStatsRow}>
                  {/* Stat 1 */}
                  <View style={styles.sleepStatItem}>
                    <View style={[styles.sleepStatIconWrapper, { backgroundColor: colors.hover }]}>
                      <VectorIcon name="routine" color={colors.accent} size={12} />
                    </View>
                    <View>
                      <Text style={[styles.sleepStatValue, { color: colors.textPrimary }]}>{formatHoursMins(sleepHours)}</Text>
                      <Text style={[styles.sleepStatLabel, { color: colors.textSecondary }]}>Total sleep duration</Text>
                    </View>
                  </View>

                  {/* Stat 2 */}
                  <View style={styles.sleepStatItem}>
                    <View style={[styles.sleepStatIconWrapper, { backgroundColor: colors.hover }]}>
                      <VectorIcon name="mind" color="#6366F1" size={12} />
                    </View>
                    <View>
                      <Text style={[styles.sleepStatValue, { color: colors.textPrimary }]}>{formatHoursMins(sleepDeep)}</Text>
                      <Text style={[styles.sleepStatLabel, { color: colors.textSecondary }]}>Deep sleep</Text>
                    </View>
                  </View>

                  {/* Stat 3 */}
                  <View style={styles.sleepStatItem}>
                    <View style={[styles.sleepStatIconWrapper, { backgroundColor: colors.hover }]}>
                      <VectorIcon name="star" color="#E26D5C" size={12} />
                    </View>
                    <View>
                      <Text style={[styles.sleepStatValue, { color: colors.textPrimary }]}>{sleepQuality}%</Text>
                      <Text style={[styles.sleepStatLabel, { color: colors.textSecondary }]}>Sleep quality</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Apple Activity Rings Visual */}
            <View style={styles.activityRingsWrapper}>
              <Svg width="110" height="110" viewBox="0 0 100 100">
                {/* Outer Ring - Sleep (Coral) */}
                <Circle cx="50" cy="50" r="40" fill="none" stroke={colors.hover} strokeWidth="7" />
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="7"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (Math.min(100, (sleepHours / 8) * 100) / 100) * 251}
                  strokeLinecap="round"
                />

                {/* Middle Ring - Deep Sleep (Blue) */}
                <Circle cx="50" cy="50" r="30" fill="none" stroke={colors.hover} strokeWidth="7" />
                <Circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="7"
                  strokeDasharray="188"
                  strokeDashoffset={188 - (Math.min(100, (sleepDeep / 1.5) * 100) / 100) * 188}
                  strokeLinecap="round"
                />

                {/* Inner Ring - Quality (Teal) */}
                <Circle cx="50" cy="50" r="20" fill="none" stroke={colors.hover} strokeWidth="7" />
                <Circle
                  cx="50"
                  cy="50"
                  r="20"
                  fill="none"
                  stroke={colors.success}
                  strokeWidth="7"
                  strokeDasharray="125"
                  strokeDashoffset={125 - (Math.min(100, sleepQuality) / 100) * 125}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>

          {/* Under Sleep: Heart rate & Cortisol side-by-side */}
          <View style={styles.biometricsRowGrid}>
            {/* Heart Rate Widget */}
            <View style={[styles.biometricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.bioHeader}>
                <VectorIcon name="health" color="#EE5253" size={13} />
                <Text style={[styles.bioTitle, { color: colors.textSecondary }]}>Heart rate</Text>
                {!isEditingHr && (
                  <Pressable
                    onPress={() => {
                      setEditHrVal(heartRate.toString());
                      setIsEditingHr(true);
                    }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 2 }]}
                  >
                    <VectorIcon name="routine" color={colors.textMuted} size={11} />
                  </Pressable>
                )}
              </View>
              
              {isEditingHr ? (
                <View style={{ gap: 6, marginVertical: 4 }}>
                  <TextInput
                    style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder, width: 80 }]}
                    value={editHrVal}
                    onChangeText={setEditHrVal}
                    keyboardType="number-pad"
                    maxLength={3}
                    autoFocus={true}
                  />
                  <View style={{ flexDirection: 'row', gap: 6, width: 120 }}>
                    <Pressable
                      onPress={() => {
                        const hr = parseInt(editHrVal, 10) || 72;
                        onUpdateBiometrics?.(activeDay.dateStr, { heartRate: hr });
                        setIsEditingHr(false);
                      }}
                      style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.accent, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Save</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIsEditingHr(false)}
                      style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '800' }}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.bioMetricValRow}>
                    <Text style={[styles.bioValueNum, { color: colors.textPrimary }]}>{heartRate}</Text>
                    <Text style={[styles.bioUnitLabel, { color: colors.textSecondary }]}>Bpm</Text>
                    
                    {/* SVG Pulse Line */}
                    <View style={styles.pulseSvgWrapper}>
                      <Svg width="60" height="28" viewBox="0 0 100 45">
                        <Path
                          d="M 5 25 L 35 25 L 42 10 L 48 40 L 55 5 L 62 30 L 68 25 L 95 25"
                          fill="none"
                          stroke="#EE5253"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  </View>
                  <View style={[styles.bioBadge, { backgroundColor: getHrBadgeBg(heartRate) }]}>
                    <Text style={[styles.bioBadgeText, { color: getHrNoteColor(heartRate) }]}>{getHrNote(heartRate)}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Cortisol Widget */}
            <View style={[styles.biometricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.bioHeader}>
                <VectorIcon name="mind" color={colors.warning} size={13} />
                <Text style={[styles.bioTitle, { color: colors.textSecondary }]}>Cortisol</Text>
                {!isEditingCortisol && (
                  <Pressable
                    onPress={() => {
                      setEditCortisolVal(cortisol.toString());
                      setIsEditingCortisol(true);
                    }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 2 }]}
                  >
                    <VectorIcon name="routine" color={colors.textMuted} size={11} />
                  </Pressable>
                )}
              </View>
              
              {isEditingCortisol ? (
                <View style={{ gap: 6, marginVertical: 4 }}>
                  <TextInput
                    style={[styles.smallBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder, width: 80 }]}
                    value={editCortisolVal}
                    onChangeText={setEditCortisolVal}
                    keyboardType="number-pad"
                    maxLength={3}
                    autoFocus={true}
                  />
                  <View style={{ flexDirection: 'row', gap: 6, width: 120 }}>
                    <Pressable
                      onPress={() => {
                        const cort = Math.min(100, Math.max(0, parseInt(editCortisolVal, 10) || 56));
                        onUpdateBiometrics?.(activeDay.dateStr, { cortisol: cort });
                        setIsEditingCortisol(false);
                      }}
                      style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.accent, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Save</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIsEditingCortisol(false)}
                      style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '800' }}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.bioMetricValRow}>
                    <Text style={[styles.bioValueNum, { color: colors.textPrimary }]}>{cortisol}</Text>
                    <Text style={[styles.bioUnitLabel, { color: colors.textSecondary }]}>/100</Text>
                  </View>
                  
                  {/* Colored Gauge Bar */}
                  <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeTrack}>
                      <View style={[styles.gaugeNeedlePointer, { left: `${cortisol}%` }]} />
                    </View>
                  </View>

                  <View style={[styles.bioBadge, { backgroundColor: getCortisolBadgeBg(cortisol) }]}>
                    <Text style={[styles.bioBadgeText, { color: getCortisolNoteColor(cortisol) }]}>{getCortisolNote(cortisol)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Right Column: Calendar Strip & Daily Checklist Card */}
        <View style={[styles.rightDashboardColumn, { flex: 1 }]}>
          <View style={[styles.calendarListCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, flex: isDesktop ? 1 : undefined }]}>
            <View style={styles.calendarCardHeader}>
              <Text style={[styles.calendarCardTitle, { color: colors.textPrimary }]}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <Pressable
                onPress={onCreateClick}
                style={[styles.addTaskBtn, { backgroundColor: '#2D3436' }]}
              >
                <VectorIcon name="plus" color="#FFF" size={10} />
                <Text style={styles.addTaskBtnText}>Add Habit</Text>
              </Pressable>
            </View>

            {/* Horizontal Week Strip */}
            <View style={[styles.weekStripRow, { borderBottomColor: colors.divider }]}>
              {calendarDays.map((day) => {
                const isActive = day.offset === selectedDayOffset;
                return (
                  <Pressable
                    key={day.offset}
                    onPress={() => setSelectedDayOffset(day.offset)}
                    style={[
                      styles.weekStripDayBtn,
                      isActive && { backgroundColor: '#EE5253' }
                    ]}
                  >
                    <Text style={[styles.weekDayName, { color: isActive ? '#FFF' : colors.textMuted }]}>
                      {day.name}
                    </Text>
                    <Text style={[styles.weekDayNum, { color: isActive ? '#FFF' : colors.textPrimary }]}>
                      {day.num}
                    </Text>
                    {isActive && <View style={styles.activeUnderlineBar} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Daily Checklist Tasks list */}
            <ScrollView style={[styles.checklistScrollBox, isDesktop && { flex: 1, maxHeight: undefined }]} showsVerticalScrollIndicator={false}>
              {filteredHabits.length > 0 ? (
                <View style={styles.checklistList}>
                  {filteredHabits.map((habit, index) => {
                    const progress = habit.history[activeDay.dateStr] || 0;
                    const isCompleted = progress >= habit.targetCount;
                    
                    return (
                      <View key={habit.id} style={[styles.taskItemRow, { borderBottomColor: colors.divider }]}>
                        <View style={styles.taskMetaArea}>
                          <View style={[styles.taskCategoryCircle, { backgroundColor: habit.color }]}>
                            <VectorIcon name={getHabitCategoryIcon(habit.category)} color="#FFF" size={10} />
                          </View>
                          <View style={styles.taskTextDetails}>
                            <Text style={[
                              styles.taskNameText, 
                              { 
                                color: colors.textPrimary, 
                                textDecorationLine: isCompleted ? 'line-through' : 'none',
                                opacity: isCompleted ? 0.5 : 1 
                              }
                            ]}>
                              {habit.name}
                            </Text>
                            <Text style={[styles.taskTimeText, { color: colors.textSecondary, marginBottom: 4 }]}>
                              {getHabitMockTime(index)}
                            </Text>

                            {/* Habit-wise mini heatmap (14-day history) */}
                            <View style={styles.miniHeatmapRow}>
                              {generateMiniHistory(habit).map((day) => (
                                <View
                                  key={day.dateStr}
                                  style={[
                                    styles.miniHeatmapCell,
                                    {
                                      backgroundColor: day.isCompleted 
                                        ? habit.color 
                                        : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                                    }
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                        </View>

                        {/* Checklist Button / Progressive Counter */}
                        {habit.targetCount > 1 ? (
                          <View style={styles.progressiveCounterRow}>
                            <Pressable
                              onPress={() => onLogProgress(habit.id, activeDay.dateStr, -1)}
                              disabled={progress === 0}
                              style={[
                                styles.progressiveActionBtn,
                                {
                                  backgroundColor: colors.hover,
                                  borderColor: colors.cardBorder,
                                  opacity: progress === 0 ? 0.4 : 1,
                                }
                              ]}
                            >
                              <Text style={[styles.progressiveActionBtnText, { color: colors.textPrimary }]}>-</Text>
                            </Pressable>
                            
                            <View style={styles.progressiveValueBox}>
                              <Text style={[styles.progressiveValueText, { color: isCompleted ? colors.success : colors.textPrimary }]}>
                                {progress} <Text style={{ color: colors.textMuted }}>/ {habit.targetCount}</Text>
                              </Text>
                            </View>

                            <Pressable
                              onPress={() => onLogProgress(habit.id, activeDay.dateStr, 1)}
                              disabled={isCompleted}
                              style={[
                                styles.progressiveActionBtn,
                                {
                                  backgroundColor: isCompleted ? colors.success : colors.accent,
                                  borderColor: isCompleted ? colors.success : colors.accent,
                                  opacity: isCompleted ? 0.35 : 1,
                                }
                              ]}
                            >
                              <Text style={styles.progressiveActionBtnTextPlus}>+</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => onLogProgress(habit.id, activeDay.dateStr, isCompleted ? -1 : 1)}
                            style={[
                              styles.taskDoneCheckbox,
                              {
                                backgroundColor: isCompleted ? colors.success : 'transparent',
                                borderColor: isCompleted ? colors.success : colors.textSecondary,
                              }
                            ]}
                          >
                            {isCompleted ? (
                              <VectorIcon name="check" color="#FFF" size={10} />
                            ) : (
                              <Text style={[styles.doneBtnLabelText, { color: colors.textSecondary }]}>Done</Text>
                            )}
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyChecklistArea}>
                  <Text style={[styles.emptyChecklistTitle, { color: colors.textMuted }]}>No tasks for this category</Text>
                  <Pressable
                    onPress={onCreateClick}
                    style={[styles.emptyCreateBtn, { backgroundColor: colors.accent }]}
                  >
                    <Text style={styles.emptyCreateBtnText}>Create Habit</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Habit Widescale Heatmap Widget (scaled to full width) */}
      <View style={[styles.largeHeatmapCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.largeHeatmapHeaderRow}>
          <View>
            <Text style={[styles.largeHeatmapTitle, { color: colors.textPrimary }]}>Habit Consistency Map</Text>
            <Text style={[styles.largeHeatmapSubtitle, { color: colors.textSecondary }]}>Full widescale activity grid</Text>
          </View>

          {/* Timescale Switcher */}
          <View style={[styles.pillSwitcher, { backgroundColor: colors.hover }]}>
            {(['daily', 'week', 'month', 'year'] as const).map((scale) => {
              const isActive = heatmapScale === scale;
              return (
                <Pressable
                  key={scale}
                  onPress={() => setHeatmapScale(scale)}
                  style={[styles.pillSwitchBtn, isActive && { backgroundColor: colors.cardBg }]}
                >
                  <Text style={[styles.pillSwitchText, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>
                    {scale.charAt(0).toUpperCase() + scale.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.heatmapSplitRow, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          {/* Left Column (78% width) */}
          <View style={[styles.heatmapLeftCol, { flex: isDesktop ? 7.8 : 1, width: isDesktop ? '78%' : '100%' }]}>
            {/* Habit selector drop down menu */}
            {(() => {
              const selectedHabit = habits.find(h => h.id === heatmapHabitId);
              const displayedHabits = searchQuery.trim() === ''
                ? habits
                : habits.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));

              return (
                <View style={styles.dropdownContainer}>
                  <Pressable
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={[
                      styles.dropdownTrigger,
                      {
                        backgroundColor: colors.hover,
                        borderColor: colors.cardBorder,
                      }
                    ]}
                  >
                    <View style={styles.dropdownTriggerLeft}>
                      <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor: heatmapHabitId === 'all' ? colors.accent : (selectedHabit?.color || colors.accent)
                          }
                        ]}
                      />
                      <Text style={[styles.dropdownTriggerText, { color: colors.textPrimary }]}>
                        {heatmapHabitId === 'all' ? 'All Habits' : (selectedHabit?.name || 'All Habits')}
                      </Text>
                    </View>
                    <Svg width="12" height="12" viewBox="0 0 24 24" style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}>
                      <Path d="M6 9l6 6 6-6" stroke={colors.textSecondary} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Pressable>

                  {isDropdownOpen && (
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                      {habits.length > 3 && (
                        <View style={[styles.dropdownSearchWrapper, { borderBottomColor: colors.divider }]}>
                          <TextInput
                            placeholder="Search habits..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={[styles.dropdownSearchInput, { color: colors.textPrimary, backgroundColor: colors.hover }]}
                          />
                        </View>
                      )}

                      <ScrollView style={styles.dropdownScrollList} nestedScrollEnabled={true}>
                        {/* "All Habits" option */}
                        <Pressable
                          onPress={() => {
                            setHeatmapHabitId('all');
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            heatmapHabitId === 'all' && { backgroundColor: colors.hover },
                            pressed && { opacity: 0.8 }
                          ]}
                        >
                          <View style={[styles.colorDot, { backgroundColor: colors.accent }]} />
                          <Text style={[styles.dropdownItemText, { color: colors.textPrimary, fontWeight: heatmapHabitId === 'all' ? '800' : '600' }]}>
                            All Habits
                          </Text>
                        </Pressable>

                        {/* List items */}
                        {displayedHabits.map((h) => {
                          const isSelected = heatmapHabitId === h.id;
                          return (
                            <Pressable
                              key={h.id}
                              onPress={() => {
                                setHeatmapHabitId(h.id);
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              style={({ pressed }) => [
                                styles.dropdownItem,
                                isSelected && { backgroundColor: colors.hover },
                                pressed && { opacity: 0.8 }
                              ]}
                            >
                              <View style={[styles.colorDot, { backgroundColor: h.color }]} />
                              <View style={styles.dropdownItemTextCol}>
                                <Text style={[styles.dropdownItemText, { color: colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
                                  {h.name}
                                </Text>
                                <Text style={[styles.dropdownItemSubtext, { color: colors.textSecondary }]}>
                                  {h.category.charAt(0).toUpperCase() + h.category.slice(1)}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}

                        {displayedHabits.length === 0 && (
                          <View style={styles.dropdownEmpty}>
                            <Text style={[styles.dropdownEmptyText, { color: colors.textMuted }]}>No habits found</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* Heatmap Grid Content */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
              <View style={[styles.largeGridContainer, { gap: cellGap }]}>
                {generateFullGridData().map((column, colIdx) => (
                  <View key={colIdx} style={[styles.largeGridColumn, { gap: cellGap }]}>
                    {column.map((cell) => {
                      let cellBg = isDark ? '#1C2538' : '#E2E8F0';
                      if (heatmapHabitId === 'all') {
                        if (cell.completedCount === 1) cellBg = 'rgba(139, 92, 246, 0.25)';
                        else if (cell.completedCount === 2) cellBg = 'rgba(139, 92, 246, 0.55)';
                        else if (cell.completedCount >= 3) cellBg = '#8B5CF6';
                      } else {
                        if (cell.targetHabitCompleted) {
                          cellBg = cell.habitColor;
                        }
                      }

                      return (
                        <View
                          key={cell.dateStr}
                          style={[
                            styles.largeGridCell,
                            {
                              width: cellSize,
                              height: cellSize,
                              borderRadius: cellBorderRadius,
                              backgroundColor: cellBg,
                            }
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Legend Row */}
            <View style={styles.largeHeatmapLegendRow}>
              <Text style={[styles.largeHeatmapLegendText, { color: colors.textMuted }]}>Less</Text>
              <View style={[styles.legendSquare, { width: cellSize, height: cellSize, borderRadius: cellBorderRadius, backgroundColor: isDark ? '#1C2538' : '#E2E8F0' }]} />
              <View style={[styles.legendSquare, { width: cellSize, height: cellSize, borderRadius: cellBorderRadius, backgroundColor: heatmapHabitId === 'all' ? 'rgba(139, 92, 246, 0.25)' : `${habits.find(x=>x.id===heatmapHabitId)?.color || colors.accent}40` }]} />
              <View style={[styles.legendSquare, { width: cellSize, height: cellSize, borderRadius: cellBorderRadius, backgroundColor: heatmapHabitId === 'all' ? 'rgba(139, 92, 246, 0.55)' : `${habits.find(x=>x.id===heatmapHabitId)?.color || colors.accent}80` }]} />
              <View style={[styles.legendSquare, { width: cellSize, height: cellSize, borderRadius: cellBorderRadius, backgroundColor: heatmapHabitId === 'all' ? '#8B5CF6' : (habits.find(x=>x.id===heatmapHabitId)?.color || colors.accent) }]} />
              <Text style={[styles.largeHeatmapLegendText, { color: colors.textMuted }]}>More</Text>
            </View>
          </View>

          {/* Right Column (22% width) - Completion progress ring with dynamic emoji */}
          <View style={[styles.heatmapRightCol, { flex: isDesktop ? 2.2 : 1, width: isDesktop ? '22%' : '100%', paddingLeft: isDesktop ? 20 : 0, marginTop: isDesktop ? 0 : 20, justifyContent: 'center' }]}>
            {(() => {
              const { percent, completions, total } = calculateCompletionStats();
              
              // Determine emoji based on percentage
              let emoji = '😢'; // Red/Sad
              let strokeColor = '#EE5253'; // Red
              
              if (percent >= 80) {
                emoji = '🥳'; // Green/Celebrate
                strokeColor = '#10B981'; // Green
              } else if (percent >= 35) {
                emoji = '😐'; // Yellow/Neutral
                strokeColor = '#F59E0B'; // Yellow
              }

              const radius = 30;
              const strokeWidth = 8;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (percent / 100) * circumference;

              return (
                <View style={[styles.completionContainer, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.completionTitle, { color: colors.textSecondary }]}>Consistency Rate</Text>
                  
                  <View style={styles.ringGraphicContainer}>
                    <Svg width="80" height="80" viewBox="0 0 80 80">
                      {/* Base circle track */}
                      <Circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke={isDark ? '#1C2538' : '#E2E8F0'}
                        strokeWidth={strokeWidth}
                      />
                      {/* Active progress track */}
                      <Circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </Svg>
                    {/* Modern SVG Emoji in the center */}
                    <View style={styles.ringCenterOverlay}>
                      {renderModernEmoji(percent)}
                    </View>
                  </View>

                  <View style={styles.statsLabelCol}>
                    <Text style={[styles.percentValueText, { color: colors.textPrimary }]}>{percent}%</Text>
                    <Text style={[styles.completionsCountLabel, { color: colors.textSecondary }]}>
                      {completions} / {total} {total === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 28,
  },
  mainDashboardGrid: {
    gap: 18,
  },
  leftDashboardColumn: {
    gap: 18,
  },
  rightDashboardColumn: {
    gap: 18,
  },
  // Wide Sleep Card
  wideWidgetCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  sleepMetaContainer: {
    flex: 1,
    gap: 10,
  },
  sleepWidgetTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sleepStatsRow: {
    gap: 12,
  },
  sleepStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sleepStatIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepStatValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  sleepStatLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityRingsWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Biometrics Under Sleep
  biometricsRowGrid: {
    flexDirection: 'row',
    gap: 18,
  },
  biometricCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bioTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bioMetricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    position: 'relative',
    height: 38,
  },
  bioValueNum: {
    fontSize: 28,
    fontWeight: '900',
  },
  bioUnitLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  pulseSvgWrapper: {
    position: 'absolute',
    right: 0,
    bottom: 2,
  },
  bioBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bioBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  // Cortisol gauge
  gaugeContainer: {
    marginVertical: 4,
  },
  gaugeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DFE4EA',
    position: 'relative',
    // Gradient mock styling using color bands
    borderLeftWidth: 30,
    borderLeftColor: '#4CA882',
    borderRightWidth: 30,
    borderRightColor: '#EE5253',
  },
  gaugeNeedlePointer: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#2D3436',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  // Calendar Task checklist Card on Right
  calendarListCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    gap: 18,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  calendarCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarCardTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 11,
    gap: 7,
  },
  addTaskBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  weekStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  weekStripDayBtn: {
    width: 40,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  weekDayName: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  weekDayNum: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  activeUnderlineBar: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#EE5253',
  },
  // Checklist Scroll container
  checklistScrollBox: {
    maxHeight: 320,
    minHeight: 200,
  },
  checklistList: {
    gap: 12,
  },
  taskItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  taskMetaArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  taskCategoryCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTextDetails: {
    gap: 3,
  },
  taskNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  taskTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskDoneCheckbox: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 54,
  },
  doneBtnLabelText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressiveCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressiveActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressiveActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 15,
  },
  progressiveActionBtnTextPlus: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 15,
    color: '#FFF',
  },
  progressiveValueBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  progressiveValueText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyChecklistArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyChecklistTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCreateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  emptyCreateBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  miniHeatmapRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  miniHeatmapCell: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
    marginVertical: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    minWidth: 200,
    maxWidth: '100%',
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    zIndex: 9999,
  },
  dropdownSearchWrapper: {
    padding: 8,
    borderBottomWidth: 1,
  },
  dropdownSearchInput: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '600',
    borderWidth: 0,
  },
  dropdownScrollList: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  dropdownItemTextCol: {
    flex: 1,
    gap: 2,
  },
  dropdownItemText: {
    fontSize: 13,
  },
  dropdownItemSubtext: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  dropdownEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  largeHeatmapCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    marginTop: 18,
    width: '100%',
    alignSelf: 'stretch',
  },
  largeHeatmapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  largeHeatmapTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  largeHeatmapSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  pillSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  pillSwitchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  pillSwitchText: {
    fontSize: 11,
    fontWeight: '800',
  },
  habitChipListRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  habitSelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
  },
  habitSelectorChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  largeGridContainer: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
  },
  largeGridColumn: {
    gap: 5,
  },
  largeGridCell: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  largeHeatmapLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  largeHeatmapLegendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2.5,
  },
  heatmapSplitRow: {
    gap: 16,
    alignItems: 'stretch',
  },
  heatmapLeftCol: {
    gap: 12,
  },
  heatmapRightCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 160,
    maxWidth: '100%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },
  completionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ringGraphicContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenterOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenterEmoji: {
    fontSize: 22,
  },
  statsLabelCol: {
    alignItems: 'center',
    gap: 2,
  },
  percentValueText: {
    fontSize: 18,
    fontWeight: '900',
  },
  completionsCountLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  smallBioInput: {
    width: 46,
    height: 25,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
});
