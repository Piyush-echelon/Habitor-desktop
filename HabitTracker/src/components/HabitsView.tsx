import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { Habit } from '../types';
import { VectorIcon } from './VectorIcon';

interface HabitsViewProps {
  habits: Habit[];
  onCreateHabitClick: () => void;
  onEditHabitClick: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  isDark: boolean;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onCreateHabitClick,
  onEditHabitClick,
  onDeleteHabit,
  isDark,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const getDifficultyColor = (diff?: Habit['difficulty']) => {
    const d = diff || 'easy';
    if (d === 'easy') return colors.success;
    if (d === 'medium') return colors.warning;
    return colors.danger;
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        
        {/* Header Block */}
        <View style={styles.headerArea}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Design, customize, and refine the core building blocks of your daily routine.
            </Text>
          </View>
          
          <Pressable
            onPress={onCreateHabitClick}
            style={({ pressed }) => [
              styles.addHabitBtn,
              { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <VectorIcon name="plus" color="#FFF" size={14} />
            <Text style={styles.addHabitBtnText}>Create Habit</Text>
          </Pressable>
        </View>

        {/* Habits Checklist Grid */}
        {habits.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <VectorIcon name="target" color={colors.textMuted} size={44} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No habits created yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Begin your self-discipline journey by clicking "Create Habit" above.
            </Text>
          </View>
        ) : (
          <View style={[styles.habitsGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            {habits.map((habit) => {
              const diffColor = getDifficultyColor(habit.difficulty);
              return (
                <View
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                      width: isDesktop ? '48.5%' : '100%',
                    }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleCol}>
                      <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
                      <Text style={[styles.habitName, { color: colors.textPrimary }]}>
                        {habit.name}
                      </Text>
                    </View>
                    
                    <View style={styles.cardActionsRow}>
                      <Pressable
                        onPress={() => onEditHabitClick(habit)}
                        style={({ pressed }) => [
                          styles.actionIconBtn,
                          { backgroundColor: colors.hover, opacity: pressed ? 0.8 : 1 }
                        ]}
                      >
                        <VectorIcon name="routine" color={colors.textSecondary} size={12} />
                      </Pressable>
                      <Pressable
                        onPress={() => onDeleteHabit(habit.id)}
                        style={({ pressed }) => [
                          styles.actionIconBtn,
                          { backgroundColor: 'rgba(239, 68, 68, 0.08)', opacity: pressed ? 0.8 : 1 }
                        ]}
                      >
                        <VectorIcon name="close" color={colors.danger} size={12} />
                      </Pressable>
                    </View>
                  </View>

                  <Text numberOfLines={3} style={[styles.description, { color: colors.textSecondary }]}>
                    {habit.description || 'No description provided.'}
                  </Text>

                  {/* Badges and statistics details */}
                  <View style={styles.cardFooter}>
                    <View style={styles.badgesRow}>
                      <View style={[styles.tag, { backgroundColor: colors.hover }]}>
                        <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                          {(habit.category || 'productivity').toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.tag, { backgroundColor: colors.hover }]}>
                        <Text style={[styles.tagText, { color: diffColor }]}>
                          {(habit.difficulty || 'easy').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.targetLabel, { color: colors.textMuted }]}>
                      Goal: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{habit.targetCount}</Text> daily
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
    gap: 24,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 4,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 260,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  addHabitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  addHabitBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Empty State Card
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
  },
  // Habits Checklist Grid
  habitsGrid: {
    flexWrap: 'wrap',
    gap: 16,
  },
  habitCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    minHeight: 32,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
