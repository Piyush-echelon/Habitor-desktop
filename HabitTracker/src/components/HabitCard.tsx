import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { Habit } from '../types';
import { VectorIcon } from './VectorIcon';

interface HabitCardProps {
  habit: Habit;
  dateStr: string;
  onLogProgress: (id: string, date: string, delta: number) => void;
  onDelete: (id: string) => void;
  isDark: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  dateStr,
  onLogProgress,
  onDelete,
  isDark,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const [isHovered, setIsHovered] = useState(false);

  const progressCount = habit.history[dateStr] || 0;
  const isCompleted = progressCount >= habit.targetCount;
  
  const completionPercentage = Math.min(100, (progressCount / habit.targetCount) * 100);

  const getDifficultyColor = () => {
    if (habit.difficulty === 'easy') return colors.success;
    if (habit.difficulty === 'medium') return colors.warning;
    return colors.danger;
  };

  const generateMiniGridData = () => {
    const data = [];
    const today = new Date();
    const totalDays = 28; // 4 weeks
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

    const columns = [];
    for (let col = 0; col < 7; col++) {
      const colItems = [];
      for (let row = 0; row < 4; row++) {
        colItems.push(data[col * 4 + row]);
      }
      columns.push(colItems);
    }
    return columns;
  };

  return (
    <Pressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: isCompleted 
            ? habit.color 
            : (isHovered ? 'rgba(255, 255, 255, 0.15)' : colors.cardBorder),
          transform: [{ scale: isHovered || pressed ? 1.01 : 1 }],
          boxShadow: isCompleted 
            ? `0 4px 16px ${habit.color}26`
            : (isHovered ? '0 4px 20px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'),
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <View style={[styles.categoryDot, { backgroundColor: habit.color }]} />
          <Text style={[styles.habitName, { color: colors.textPrimary, textDecorationLine: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.6 : 1 }]}>
            {habit.name}
          </Text>
        </View>
        <Pressable 
          onPress={() => onDelete(habit.id)}
          style={styles.deleteBtn}
        >
          <VectorIcon name="close" color={colors.textMuted} size={14} />
        </Pressable>
      </View>

      <Text numberOfLines={2} style={[styles.description, { color: colors.textSecondary }]}>
        {habit.description || 'No description provided.'}
      </Text>

      {/* Tags row */}
      <View style={styles.tagsRow}>
        <View style={[styles.tag, { backgroundColor: colors.hover }]}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            {habit.category.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: colors.hover }]}>
          <Text style={[styles.tagText, { color: getDifficultyColor() }]}>
            {habit.difficulty.toUpperCase()}
          </Text>
        </View>
        {habit.streak > 0 && (
          <View style={[styles.tag, { backgroundColor: 'rgba(251, 191, 36, 0.08)', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <VectorIcon name="streak" color={colors.gold} size={10} />
            <Text style={[styles.streakText, { color: colors.gold }]}>
              {habit.streak}d streak
            </Text>
          </View>
        )}
      </View>

      {/* Habit-wise Mini Heatmap */}
      <View style={[styles.heatmapContainer, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
        <View style={styles.heatmapHeader}>
          <VectorIcon name="target" color={colors.textSecondary} size={10} />
          <Text style={[styles.heatmapLabel, { color: colors.textSecondary }]}>Consistency (last 28 days)</Text>
        </View>
        <View style={styles.miniGridContainer}>
          {generateMiniGridData().map((column, colIdx) => (
            <View key={colIdx} style={styles.miniGridColumn}>
              {column.map((cell) => {
                const cellBg = cell.isCompleted 
                  ? habit.color 
                  : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
                return (
                  <View
                    key={cell.dateStr}
                    style={[
                      styles.miniGridCell,
                      {
                        backgroundColor: cellBg,
                      }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Progress tracking interaction */}
      <View style={styles.footerRow}>
        <View style={styles.progressCounterArea}>
          {habit.targetCount > 1 ? (
            <View>
              <Text style={[styles.progressNumberText, { color: colors.textPrimary }]}>
                {progressCount} <Text style={{ color: colors.textSecondary }}>/ {habit.targetCount}</Text>
              </Text>
              <View style={styles.progressMiniTrack}>
                <View style={[styles.progressMiniFill, { width: `${completionPercentage}%`, backgroundColor: habit.color }]} />
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {isCompleted && <VectorIcon name="check" color={colors.success} size={12} />}
              <Text style={[styles.completionStatusText, { color: isCompleted ? colors.success : colors.textSecondary }]}>
                {isCompleted ? 'Completed' : 'Pending'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonsGroup}>
          {habit.targetCount > 1 ? (
            <>
              <Pressable
                onPress={() => onLogProgress(habit.id, dateStr, -1)}
                disabled={progressCount === 0}
                style={[styles.actionBtn, { backgroundColor: colors.hover, opacity: progressCount === 0 ? 0.4 : 1 }]}
              >
                <VectorIcon name="minus" color={colors.textPrimary} size={14} />
              </Pressable>
              <Pressable
                onPress={() => onLogProgress(habit.id, dateStr, 1)}
                disabled={isCompleted}
                style={[styles.actionBtn, { backgroundColor: colors.hover, opacity: isCompleted ? 0.35 : 1 }]}
              >
                <VectorIcon name="plus" color={isCompleted ? colors.textMuted : colors.textPrimary} size={14} />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => onLogProgress(habit.id, dateStr, isCompleted ? -1 : 1)}
              style={[
                styles.checkboxBtn,
                {
                  backgroundColor: isCompleted ? habit.color : 'transparent',
                  borderColor: isCompleted ? habit.color : colors.textSecondary,
                }
              ]}
            >
              {isCompleted && <VectorIcon name="check" color="#FFF" size={14} />}
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  streakText: {
    fontSize: 9,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressCounterArea: {
    flex: 1,
    marginRight: 12,
  },
  progressNumberText: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  progressMiniTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  completionStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buttonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  checkboxBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  heatmapContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heatmapLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  miniGridContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  miniGridColumn: {
    gap: 3,
  },
  miniGridCell: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },
});
