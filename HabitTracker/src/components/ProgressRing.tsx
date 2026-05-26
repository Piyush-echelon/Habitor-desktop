import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isDark: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 130,
  strokeWidth = 12,
  isDark,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Glowing Filled Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Central Percent Text overlay */}
      <View style={styles.textOverlay}>
        <Text style={[styles.percentNum, { color: colors.textPrimary }]}>
          {Math.round(percentage)}%
        </Text>
        <Text style={[styles.percentLabel, { color: colors.textMuted }]}>
          TODAY
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  percentLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: -2,
  },
});
