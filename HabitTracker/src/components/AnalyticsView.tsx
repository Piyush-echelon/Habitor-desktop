import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TextInput, Pressable } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { Habit, UserProfile, Task } from '../types';
import { ProgressRing } from './ProgressRing';
import { Heatmap } from './Heatmap';
import { getLocalDateString } from '../store/habitStore';
import { VectorIcon } from './VectorIcon';

interface AnalyticsViewProps {
  habits: Habit[];
  profile: UserProfile;
  tasks?: Task[];
  isDark: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ habits, profile, tasks = [], isDark }) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const { width } = useWindowDimensions();
  const todayStr = getLocalDateString(new Date());

  const isWide = width >= 900;

  // ─── Health Vitals Trend Calculations ───
  const [selectedVitalTab, setSelectedVitalTab] = useState<'sleep' | 'deep' | 'quality' | 'hr' | 'cortisol' | 'reading' | 'distance'>('sleep');

  const getLast7Days = () => {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push({
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      });
    }
    return list;
  };
  const last7Days = getLast7Days();

  const getDayMetrics = (dateStr: string) => {
    const dayBio = profile?.biometrics?.[dateStr] || {};
    
    const totalHabitsCount = habits.length;
    const completedHabitsToday = habits.filter((h) => (h.history[dateStr] || 0) >= h.targetCount);
    const completedHabitsCount = completedHabitsToday.length;
    const todayCompletionRate = totalHabitsCount > 0 ? completedHabitsCount / totalHabitsCount : 0;

    const sleepHours = dayBio.sleepHours !== undefined 
      ? dayBio.sleepHours 
      : (6.2 + 1.8 * todayCompletionRate);

    const completedHealthFitness = habits.filter((h) => (h.category === 'health' || h.category === 'fitness') && (h.history[dateStr] || 0) >= h.targetCount).length;
    const sleepDeep = dayBio.sleepDeep !== undefined
      ? dayBio.sleepDeep
      : Math.min(1.6, 0.75 + completedHealthFitness * 0.35);

    const sleepQuality = dayBio.sleepQuality !== undefined
      ? dayBio.sleepQuality
      : Math.round(62 + 34 * todayCompletionRate);

    const completedCalm = habits.filter((h) => (h.category === 'mind' || h.category === 'health') && (h.history[dateStr] || 0) >= h.targetCount).length;
    const heartRate = dayBio.heartRate !== undefined
      ? dayBio.heartRate
      : Math.max(62, 79 - completedCalm * 4);

    const pendingUrgentTasks = tasks?.filter((t) => !t.completed && (t.category === 'urgent' || t.category === 'work')).length || 0;
    const completedMindToday = habits.filter((h) => h.category === 'mind' && (h.history[dateStr] || 0) >= h.targetCount).length;
    const cortisol = dayBio.cortisol !== undefined
      ? dayBio.cortisol
      : Math.max(20, Math.min(95, 42 + pendingUrgentTasks * 12 - completedMindToday * 15));

    // Pages Read
    let pagesRead = dayBio.pagesRead !== undefined ? dayBio.pagesRead : 0;
    if (dayBio.pagesRead === undefined) {
      const readingHabit = habits.find((h) => h.name.toLowerCase().includes('read'));
      if (readingHabit) {
        const completed = (readingHabit.history[dateStr] || 0) >= readingHabit.targetCount;
        pagesRead = completed ? 15 : 0;
      }
    }

    // Distance
    let distanceKm = dayBio.distanceKm !== undefined ? dayBio.distanceKm : 0;
    if (dayBio.distanceKm === undefined) {
      const completedFitness = habits.filter((h) => (h.category === 'fitness') && (h.history[dateStr] || 0) >= h.targetCount).length;
      distanceKm = completedFitness * 3.5;
    }

    return {
      sleepHours,
      sleepDeep,
      sleepQuality,
      heartRate,
      cortisol,
      pagesRead,
      distanceKm,
    };
  };

  const last7DaysMetrics = last7Days.map(d => ({ ...d, metrics: getDayMetrics(d.dateStr) }));
  
  const avgSleep = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.sleepHours, 0) / 7;
  const avgDeep = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.sleepDeep, 0) / 7;
  const avgQuality = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.sleepQuality, 0) / 7;
  const avgHr = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.heartRate, 0) / 7;
  const avgCortisol = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.cortisol, 0) / 7;
  const totalPages = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.pagesRead, 0);
  const totalDistance = last7DaysMetrics.reduce((sum, d) => sum + d.metrics.distanceKm, 0);

  // Setup points for SVG sparkline trend graph
  const getTabStatsInfo = () => {
    switch (selectedVitalTab) {
      case 'sleep':
        return {
          title: 'Total Sleep',
          color: colors.accent,
          unit: 'h',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - (d.metrics.sleepHours / 10) * 80,
            val: d.metrics.sleepHours.toFixed(1),
          })),
        };
      case 'deep':
        return {
          title: 'Deep Sleep',
          color: '#6366F1',
          unit: 'h',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - (d.metrics.sleepDeep / 2.5) * 80,
            val: d.metrics.sleepDeep.toFixed(1),
          })),
        };
      case 'quality':
        return {
          title: 'Sleep Quality',
          color: colors.success,
          unit: '%',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - (d.metrics.sleepQuality / 100) * 80,
            val: Math.round(d.metrics.sleepQuality),
          })),
        };
      case 'hr':
        return {
          title: 'Heart Rate',
          color: '#EE5253',
          unit: ' Bpm',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - ((d.metrics.heartRate - 40) / 80) * 80,
            val: Math.round(d.metrics.heartRate),
          })),
        };
      case 'cortisol':
        return {
          title: 'Cortisol Stress',
          color: colors.warning,
          unit: '/100',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - (d.metrics.cortisol / 100) * 80,
            val: Math.round(d.metrics.cortisol),
          })),
        };
      case 'reading':
        return {
          title: 'Pages Read',
          color: '#3B82F6',
          unit: ' p',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - (Math.min(100, d.metrics.pagesRead) / 100) * 80,
            val: d.metrics.pagesRead,
          })),
        };
      case 'distance':
        return {
          title: 'Distance Run',
          color: colors.success,
          unit: ' Km',
          points: last7DaysMetrics.map((d, i) => ({
            x: 20 + i * 40,
            y: 110 - (Math.min(15, d.metrics.distanceKm) / 15) * 80,
            val: d.metrics.distanceKm.toFixed(1),
          })),
        };
    }
  };

  const activeVital = getTabStatsInfo();
  const pathString = activeVital.points.length > 0
    ? `M ${activeVital.points[0].x} ${activeVital.points[0].y} ` +
      activeVital.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaString = activeVital.points.length > 0
    ? `${pathString} L ${activeVital.points[activeVital.points.length - 1].x} 115 L ${activeVital.points[0].x} 115 Z`
    : '';

  // Today's Score Logic
  let todayTotal = habits.length;
  let todayCompleted = 0;
  habits.forEach((habit) => {
    const progress = habit.history[todayStr] || 0;
    if (progress >= habit.targetCount) {
      todayCompleted++;
    }
  });
  const todayPercentage = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  // Category completion breakdowns
  const categoryStats = {
    health: { completed: 0, total: 0 },
    mind: { completed: 0, total: 0 },
    productivity: { completed: 0, total: 0 },
    fitness: { completed: 0, total: 0 },
    routine: { completed: 0, total: 0 },
  };

  habits.forEach((habit) => {
    const cat = habit.category;
    const completedDays = Object.values(habit.history).filter(c => c >= habit.targetCount).length;
    categoryStats[cat].completed += completedDays;
    categoryStats[cat].total += 1;
  });

  const maxStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
  const totalLogs = habits.reduce((sum, h) => sum + Object.values(h.history).filter(c => c >= h.targetCount).length, 0);

  // Redesign Row 2: Habit Streak Strip
  const streakTimeline = [
    { day: 12, status: 'checked' },
    { day: 13, status: 'checked' },
    { day: 14, status: 'partial' },
    { day: 15, status: 'missed' },
    { day: 16, status: 'checked' },
    { day: 17, status: 'missed' },
    { day: 18, status: 'checked' },
    { day: 19, status: 'missed' },
    { day: 20, status: 'checked' },
    { day: 21, status: 'checked' },
    { day: 22, status: 'active' },
    { day: 23, status: 'future' },
    { day: 24, status: 'future' },
    { day: 25, status: 'future' },
    { day: 26, status: 'future' },
    { day: 27, status: 'future' },
    { day: 28, status: 'future' },
  ];

  // Redesign Row 3: Bar Chart Data
  const favouriteHabitBars = [
    { label: 'Walk', height: 75, active: false },
    { label: 'Journaling', height: 50, active: false },
    { label: 'Meditation', height: 110, active: true }, // highlighted bar
    { label: 'Drink water', height: 40, active: false },
    { label: 'Cardio', height: 55, active: false },
    { label: 'Skincare', height: 35, active: false },
  ];

  // Journal Entry State
  const [journalText, setJournalText] = useState('');
  const [isJournalSaved, setIsJournalSaved] = useState(false);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* Row 1: Traditional Progress widget & metrics */}
        <View style={[styles.statsRow, { flexDirection: isWide ? 'row' : 'column' }]}>
          {/* Progress Circle Card */}
          <View style={[styles.widgetCard, { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.widgetTitle, { color: colors.textSecondary }]}>TODAY'S SCORE</Text>
            <View style={styles.ringContainer}>
              <ProgressRing percentage={todayPercentage} isDark={isDark} size={130} strokeWidth={12} />
              <View style={styles.scoreInsights}>
                <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>
                  {todayCompleted} of {todayTotal} Completed
                </Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                  {todayPercentage === 100 
                    ? "Perfect day! You unlocked +50 XP bonus! ✨" 
                    : todayPercentage >= 50 
                      ? "Over halfway done! Push through to complete the rest!" 
                      : "Start small. Checking off just one habit builds momentum!"}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics Cards Grid */}
          <View style={[styles.metricsGrid, { flex: 1.2 }]}>
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <VectorIcon name="streak" color={colors.accent} size={24} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>LONGEST STREAK</Text>
                <Text style={[styles.metricVal, { color: colors.accent }]}>{maxStreak} days</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <VectorIcon name="gem" color={colors.success} size={24} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL SESSIONS</Text>
                <Text style={[styles.metricVal, { color: colors.success }]}>{totalLogs} sessions</Text>
              </View>
            </View>

            <View style={[styles.categoryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.widgetTitle, { color: colors.textSecondary }]}>COMPLETIONS BY CATEGORY</Text>
              <View style={styles.categoryStatsList}>
                {(Object.keys(categoryStats) as Array<keyof typeof categoryStats>).map((cat) => {
                  const stats = categoryStats[cat];
                  const maxPercent = totalLogs > 0 ? (stats.completed / totalLogs) * 100 : 0;
                  const catColor = colors.categories[cat];

                  return (
                    <View key={cat} style={styles.categoryStatRow}>
                      <View style={styles.catRowLabel}>
                        <Text style={[styles.catNameText, { color: colors.textPrimary }]}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                        <Text style={[styles.catCountText, { color: colors.textSecondary }]}>
                          {stats.completed} sessions
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(4, maxPercent)}%`, backgroundColor: catColor }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Row 2: Habit Streak calendar widget */}
        <View style={[styles.habitStreakWidget, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.streakHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <VectorIcon name="streak" color={colors.accent} size={15} />
              <Text style={[styles.streakWidgetTitle, { color: colors.textPrimary }]}>Habit streak</Text>
            </View>
            
            <View style={styles.streakActionsRow}>
              {/* This Month Dropdown mockup */}
              <View style={[styles.streakFilterChip, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                <Text style={[styles.streakFilterChipText, { color: colors.textPrimary }]}>This month</Text>
                <VectorIcon name="routine" color={colors.textSecondary} size={8} />
              </View>
              {/* Monthly / Yearly buttons */}
              <View style={[styles.pillSwitcher, { backgroundColor: colors.hover }]}>
                <Pressable style={[styles.pillSwitchBtn, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.pillSwitchText, { color: colors.textPrimary }]}>Monthly</Text>
                </Pressable>
                <Pressable style={styles.pillSwitchBtn}>
                  <Text style={[styles.pillSwitchText, { color: colors.textSecondary }]}>Yearly</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Timeline Days List */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streakTimelineDaysRow}>
            {streakTimeline.map((item) => {
              const isChecked = item.status === 'checked';
              const isPartial = item.status === 'partial';
              const isMissed = item.status === 'missed';
              const isActive = item.status === 'active';
              const isFuture = item.status === 'future';

              return (
                <View key={item.day} style={styles.timelineDayBox}>
                  {/* Status Indicator bubble */}
                  <View style={[
                    styles.timelineStatusIcon,
                    isChecked && { backgroundColor: 'rgba(76,168,130,0.1)', borderColor: 'transparent' },
                    isPartial && { borderColor: colors.warning },
                    isMissed && { backgroundColor: 'rgba(238,82,83,0.1)', borderColor: 'transparent' },
                    isActive && { borderColor: '#EE5253', backgroundColor: '#EE5253' },
                    isFuture && { borderColor: colors.divider, borderStyle: 'dashed' },
                    { borderColor: isFuture ? colors.divider : (isActive ? '#EE5253' : (isPartial ? colors.warning : 'transparent')) }
                  ]}>
                    {isChecked && <VectorIcon name="check" color={colors.success} size={10} />}
                    {isPartial && <View style={[styles.partialDot, { backgroundColor: colors.warning }]} />}
                    {isMissed && <Text style={[styles.missedAlertMark, { color: colors.danger }]}>!</Text>}
                    {isActive && <VectorIcon name="check" color="#FFF" size={10} />}
                    {isFuture && <View style={styles.futureCircleCenter} />}
                  </View>
                  
                  {/* Day Date Text */}
                  <Text style={[styles.timelineDayNumText, { color: isActive ? '#EE5253' : colors.textSecondary }]}>
                    {item.day}
                  </Text>
                  {isActive && <View style={styles.timelineDayActiveBar} />}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Row 3: Favourite Habit bar chart & Journaling promo side-by-side */}
        <View style={[styles.insightsRowGrid, { flexDirection: isWide ? 'row' : 'column' }]}>
          {/* Favourite Habit Widget with Bar Chart */}
          <View style={[styles.widgetCard, { flex: 1.2, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, padding: 18 }]}>
            <Text style={[styles.widgetTitle, { color: colors.textSecondary, marginBottom: 8 }]}>FAVOURITE HABIT</Text>
            
            {/* Chart Area */}
            <View style={styles.chartWrapper}>
              
              {/* Bars Row */}
              <View style={styles.chartBarsContainer}>
                {favouriteHabitBars.map((bar) => {
                  return (
                    <View key={bar.label} style={styles.chartBarItem}>
                      <View style={styles.barVerticalTrack}>
                        <View style={[
                          styles.barVerticalFill, 
                          { 
                            height: bar.height, 
                            backgroundColor: bar.active ? '#10B981' : '#F1F2F6',
                          }
                        ]}>
                          {bar.active && (
                            <View style={styles.activeBarTopIcon}>
                              <VectorIcon name="mind" color="#FFF" size={8} />
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.chartBarLabelText, { color: colors.textSecondary }]}>{bar.label}</Text>
                      
                      {/* Meditation Floating Tooltip */}
                      {bar.active && (
                        <View style={styles.barActiveTooltip}>
                          <Text style={styles.tooltipName}>Meditation</Text>
                          <Text style={styles.tooltipTime}>45 min</Text>
                          <Text style={styles.tooltipPercent}>▲ 4% vs last month</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* New Feature: Journaling Widget with color blobs */}
          <View style={[styles.widgetCard, { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, padding: 18, position: 'relative', overflow: 'hidden' }]}>
            {/* Abstract Background Blur Glowing Blobs */}
            <View style={styles.gradientBlobsWrapper}>
              <View style={[styles.blobItemCircle, { backgroundColor: 'rgba(99,102,241,0.06)', width: 140, height: 140, top: -20, left: -20 }]} />
              <View style={[styles.blobItemCircle, { backgroundColor: 'rgba(238,82,83,0.06)', width: 130, height: 130, bottom: -30, right: -10 }]} />
              <View style={[styles.blobItemCircle, { backgroundColor: 'rgba(245,158,11,0.04)', width: 100, height: 100, top: 40, right: 30 }]} />
            </View>

            <View style={styles.journalContentContainer}>
              <Text style={styles.newFeatureLabel}>LET'S TRY NEW FEATURE</Text>
              <Text style={styles.newFeatureTitle}>Journaling</Text>
              
              <Pressable
                onPress={() => setIsJournalSaved(true)}
                style={[styles.tryNowCapsuleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1 }]}
              >
                <Text style={styles.tryNowCapsuleText}>Try now</Text>
                <VectorIcon name="rocket" color="#2D3436" size={10} />
              </Pressable>

              {/* Text Area Summary */}
              <View style={styles.journalTextAreaWrapper}>
                <TextInput
                  value={journalText}
                  onChangeText={(t) => {
                    setJournalText(t);
                    setIsJournalSaved(false);
                  }}
                  placeholder="Write a summary of your day..."
                  placeholderTextColor={colors.textMuted}
                  multiline={true}
                  style={[styles.journalTextAreaInput, { backgroundColor: 'rgba(255,255,255,0.7)', color: colors.textPrimary }]}
                />
              </View>

              {isJournalSaved && (
                <Text style={styles.journalSavedStatusText}>✨ Entry saved inside your discipline log!</Text>
              )}
            </View>
          </View>
        </View>

        {/* Heatmap Widget */}
        <Heatmap habits={habits} isDark={isDark} />

        {/* New Feature: Vitals & Health Logs Trend Widescale Card */}
        <View style={[styles.vitalsMainCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.vitalsHeader}>
            <Text style={[styles.vitalsTitle, { color: colors.textPrimary }]}>Health Vitals & Logs Trend</Text>
            <Text style={[styles.vitalsSubtitle, { color: colors.textSecondary }]}>Historical 7-day diagnostics and vitals analysis</Text>
          </View>

          {/* Interactive Metric Switcher Pill Buttons */}
          <View style={styles.vitalsTabContainer}>
            {([
              { id: 'sleep', label: '🛏️ Sleep Duration' },
              { id: 'deep', label: '💤 Deep Sleep' },
              { id: 'quality', label: '✨ Sleep Quality' },
              { id: 'hr', label: '💓 Heart Rate' },
              { id: 'cortisol', label: '⚡ Cortisol Stress' },
              { id: 'reading', label: '📚 Reading Pages' },
              { id: 'distance', label: '🏃‍♂️ Workout Distance' }
            ] as const).map(tab => {
              const isActive = selectedVitalTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setSelectedVitalTab(tab.id)}
                  style={[
                    styles.vitalsTabBtn,
                    isActive && { backgroundColor: activeVital.color, borderColor: activeVital.color }
                  ]}
                >
                  <Text style={[styles.vitalsTabBtnText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Side-by-side grid panel (desktop style split) */}
          <View style={[styles.vitalsDisplayGrid, { flexDirection: isWide ? 'row' : 'column' }]}>
            {/* Left panel: Averages Cards list */}
            <View style={styles.vitalsLeftAveragesPanel}>
              {/* Avg Sleep */}
              <View style={[styles.averageRowCard, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                <VectorIcon name="routine" color={colors.accent} size={16} />
                <View style={styles.avgLabelCol}>
                  <Text style={[styles.avgTitleText, { color: colors.textSecondary }]}>WEEKLY AVG SLEEP</Text>
                  <Text style={[styles.avgValueText, { color: colors.textPrimary }]}>
                    {avgSleep.toFixed(1)}h <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>(Quality: {Math.round(avgQuality)}%)</Text>
                  </Text>
                </View>
              </View>

              {/* Avg HR */}
              <View style={[styles.averageRowCard, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                <VectorIcon name="health" color="#EE5253" size={16} />
                <View style={styles.avgLabelCol}>
                  <Text style={[styles.avgTitleText, { color: colors.textSecondary }]}>WEEKLY AVG HEART RATE</Text>
                  <Text style={[styles.avgValueText, { color: colors.textPrimary }]}>
                    {Math.round(avgHr)} Bpm
                  </Text>
                </View>
              </View>

              {/* Avg Cortisol */}
              <View style={[styles.averageRowCard, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                <VectorIcon name="mind" color={colors.warning} size={16} />
                <View style={styles.avgLabelCol}>
                  <Text style={[styles.avgTitleText, { color: colors.textSecondary }]}>WEEKLY AVG STRESS SCORE</Text>
                  <Text style={[styles.avgValueText, { color: colors.textPrimary }]}>
                    {Math.round(avgCortisol)}/100
                  </Text>
                </View>
              </View>

              {/* Total Reading & Distance */}
              <View style={[styles.averageRowCard, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                <VectorIcon name="trophy" color="#3B82F6" size={16} />
                <View style={styles.avgLabelCol}>
                  <Text style={[styles.avgTitleText, { color: colors.textSecondary }]}>7-DAY READING & WORKOUTS</Text>
                  <Text style={[styles.avgValueText, { color: colors.textPrimary }]}>
                    {totalPages} pages / {totalDistance.toFixed(1)} Km
                  </Text>
                </View>
              </View>
            </View>

            {/* Right panel: Modern SVG Line trend chart */}
            <View style={[styles.vitalsRightChartPanel, { backgroundColor: isDark ? '#1C2538' : '#F8FAFC' }]}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                7-Day Trend: {activeVital.title}
              </Text>
              
              <Svg width="300" height="130" viewBox="0 0 280 130">
                <Defs>
                  <LinearGradient id="vitalGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={activeVital.color} stopOpacity="0.3" />
                    <Stop offset="100%" stopColor={activeVital.color} stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>

                {/* Grid guidelines */}
                <Path d="M 20 30 L 260 30" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} strokeWidth="1" />
                <Path d="M 20 70 L 260 70" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} strokeWidth="1" />
                <Path d="M 20 110 L 260 110" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="1.5" />

                {/* Filled gradient area */}
                {areaString !== '' && (
                  <Path d={areaString} fill="url(#vitalGradient)" />
                )}

                {/* Main trend line */}
                {pathString !== '' && (
                  <Path
                    d={pathString}
                    fill="none"
                    stroke={activeVital.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Data points (draw circles and values) */}
                {activeVital.points.map((p, i) => (
                  <g key={i}>
                    {/* Pulsing indicator ring */}
                    <Circle cx={p.x} cy={p.y} r="6.5" fill="none" stroke={activeVital.color} strokeWidth="1.5" strokeOpacity="0.4" />
                    {/* Inner core circle */}
                    <Circle cx={p.x} cy={p.y} r="3.5" fill={activeVital.color} />
                    {/* Floating Value text */}
                    <Text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill={colors.textPrimary}
                      fontSize="9"
                      fontWeight="900"
                    >
                      {p.val}{activeVital.unit}
                    </Text>
                  </g>
                ))}
              </Svg>

              {/* Bottom dates labels */}
              <View style={styles.chartLabelRow}>
                {last7DaysMetrics.map(day => (
                  <Text key={day.dateStr} style={[styles.chartLabelText, { color: colors.textSecondary }]}>
                    {day.label} {day.dayNum}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Historical Logs Detailed Table */}
          <Text style={[styles.vitalsTableTitle, { color: colors.textPrimary }]}>7-Day Detailed Diagnostics Table</Text>
          <View style={[styles.logsTableContainer, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { borderBottomColor: colors.cardBorder, backgroundColor: isDark ? '#1C2538' : '#ECECF1' }]}>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.3 }]}>Date</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Sleep</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Deep</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Qual</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Heart</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Stress</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Pages</Text>
              <Text style={[styles.thText, { color: colors.textPrimary, flex: 1.1 }]}>Dist</Text>
            </View>

            {/* Table Body rows */}
            {last7DaysMetrics.map((day) => (
              <View key={day.dateStr} style={[styles.tableBodyRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.tdText, { color: colors.textSecondary, flex: 1.3, fontWeight: '800' }]}>{day.label} {day.dayNum}</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{day.metrics.sleepHours.toFixed(1)}h</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{day.metrics.sleepDeep.toFixed(1)}h</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{Math.round(day.metrics.sleepQuality)}%</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{Math.round(day.metrics.heartRate)}</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{Math.round(day.metrics.cortisol)}</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{day.metrics.pagesRead}p</Text>
                <Text style={[styles.tdText, { color: colors.textPrimary, flex: 1.1 }]}>{day.metrics.distanceKm.toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  container: {
    paddingBottom: 40,
    gap: 20,
  },
  statsRow: {
    gap: 16,
  },
  widgetCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    elevation: 1,
  },
  widgetTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  ringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  scoreInsights: {
    flex: 1,
    minWidth: 150,
    gap: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  insightText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  metricsGrid: {
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    elevation: 1,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  categoryCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    elevation: 1,
  },
  categoryStatsList: {
    gap: 10,
  },
  categoryStatRow: {
    gap: 4,
  },
  catRowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  catNameText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Redesign Row 2: Habit Streak Widget
  habitStreakWidget: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    elevation: 1,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  streakWidgetTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  streakActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  streakFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  pillSwitchBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSwitchText: {
    fontSize: 10,
    fontWeight: '800',
  },
  streakTimelineDaysRow: {
    gap: 10,
    paddingBottom: 6,
  },
  timelineDayBox: {
    alignItems: 'center',
    width: 28,
    gap: 6,
    position: 'relative',
  },
  timelineStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partialDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  missedAlertMark: {
    fontSize: 11,
    fontWeight: '900',
  },
  futureCircleCenter: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#DFE4EA',
  },
  timelineDayNumText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timelineDayActiveBar: {
    position: 'absolute',
    bottom: -6,
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#EE5253',
  },
  // Redesign Row 3: Insights grids
  insightsRowGrid: {
    gap: 16,
  },
  chartWrapper: {
    height: 150,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 4,
  },
  chartBarItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  barVerticalTrack: {
    width: 16,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barVerticalFill: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  activeBarTopIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartBarLabelText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  // Meditation Tooltip
  barActiveTooltip: {
    position: 'absolute',
    bottom: 125,
    width: 105,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    zIndex: 10,
    alignItems: 'center',
    gap: 2,
  },
  tooltipName: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A4A7B0',
    textTransform: 'uppercase',
  },
  tooltipTime: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2D3436',
  },
  tooltipPercent: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10B981',
  },
  // New Feature: Journaling Widget
  gradientBlobsWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  blobItemCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  journalContentContainer: {
    zIndex: 1,
    gap: 8,
  },
  newFeatureLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#A4A7B0',
    letterSpacing: 1,
  },
  newFeatureTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#2D3436',
    marginTop: -4,
  },
  tryNowCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tryNowCapsuleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2D3436',
  },
  journalTextAreaWrapper: {
    marginTop: 6,
  },
  journalTextAreaInput: {
    height: 70,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 10,
    fontSize: 10,
    fontWeight: '600',
    textAlignVertical: 'top',
  },
  journalSavedStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4CA882',
    textAlign: 'center',
  },
  // Health & Vitals
  vitalsMainCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    elevation: 1,
    marginTop: 8,
  },
  vitalsHeader: {
    marginBottom: 14,
  },
  vitalsTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  vitalsSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  vitalsTabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  vitalsTabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
  },
  vitalsTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vitalsDisplayGrid: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 14,
  },
  vitalsLeftAveragesPanel: {
    flex: 1,
    gap: 8,
  },
  averageRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  avgLabelCol: {
    flex: 1,
  },
  avgTitleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  avgValueText: {
    fontSize: 14,
    fontWeight: '900',
  },
  vitalsRightChartPanel: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.08)',
    padding: 10,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 6,
  },
  chartLabelText: {
    fontSize: 9,
    fontWeight: '800',
  },
  vitalsTableTitle: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logsTableContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tdText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});


