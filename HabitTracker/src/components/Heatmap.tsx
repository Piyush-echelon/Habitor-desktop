import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { Habit } from '../types';
import { getLocalDateString } from '../store/habitStore';

interface HeatmapProps {
  habits: Habit[];
  isDark: boolean;
}

export const Heatmap: React.FC<HeatmapProps> = ({ habits, isDark }) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const [hoveredCell, setHoveredCell] = useState<{ dateStr: string; count: number } | null>(null);

  // Generate the last 10 weeks (70 days) up to today, aligned so today is in the last column
  const generateGridData = () => {
    const data = [];
    const today = new Date();
    // Start 69 days ago
    const totalDays = 70;
    const startDate = new Date();
    startDate.setDate(today.getDate() - (totalDays - 1));

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(currentDate);

      // Count completions for this day
      let completions = 0;
      habits.forEach((habit) => {
        const countForDay = habit.history[dateStr] || 0;
        if (countForDay >= habit.targetCount) {
          completions++;
        }
      });

      data.push({
        date: currentDate,
        dateStr,
        completions,
      });
    }

    // Split into 10 columns of 7 rows
    const columns = [];
    for (let col = 0; col < 10; col++) {
      const colItems = [];
      for (let row = 0; row < 7; row++) {
        colItems.push(data[col * 7 + row]);
      }
      columns.push(colItems);
    }

    return columns;
  };

  const gridColumns = generateGridData();

  const getCellColor = (count: number) => {
    if (count === 0) return isDark ? '#1C2538' : '#E2E8F0';
    if (count <= 1) return 'rgba(139, 92, 246, 0.25)'; // low activity (Purple glow)
    if (count <= 2) return 'rgba(139, 92, 246, 0.55)'; // medium activity
    return '#8B5CF6'; // high activity (Bright Purple)
  };

  const formatHeaderDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Activity Heatmap</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Your completion consistency over the last 10 weeks</Text>
        </View>
        {hoveredCell && (
          <View style={[styles.tooltip, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tooltipText, { color: colors.textPrimary }]}>
              {hoveredCell.count} {hoveredCell.count === 1 ? 'habit' : 'habits'} on {hoveredCell.dateStr}
            </Text>
          </View>
        )}
      </View>

      <ScrollViewContent gridColumns={gridColumns} getCellColor={getCellColor} setHoveredCell={setHoveredCell} />

      <View style={styles.legendRow}>
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Less</Text>
        <View style={[styles.legendBox, { backgroundColor: isDark ? '#1C2538' : '#E2E8F0' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(139, 92, 246, 0.25)' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(139, 92, 246, 0.55)' }]} />
        <View style={[styles.legendBox, { backgroundColor: '#8B5CF6' }]} />
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>More</Text>
      </View>
    </View>
  );
};

// Extracted inner content rendering so scrolling works perfectly
const ScrollViewContent = ({ gridColumns, getCellColor, setHoveredCell }: any) => {
  return (
    <View style={styles.gridOuter}>
      <View style={styles.gridContainer}>
        {gridColumns.map((column: any, colIdx: number) => (
          <View key={colIdx} style={styles.gridColumn}>
            {column.map((cell: any, rowIdx: number) => {
              const cellColor = getCellColor(cell.completions);
              return (
                <Pressable
                  key={cell.dateStr}
                  onHoverIn={() => setHoveredCell({ dateStr: cell.dateStr, count: cell.completions })}
                  onHoverOut={() => setHoveredCell(null)}
                  style={({ pressed }) => [
                    styles.gridCell,
                    {
                      backgroundColor: cellColor,
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    }
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tooltip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tooltipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridOuter: {
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
  },
  gridColumn: {
    gap: 5,
  },
  gridCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
