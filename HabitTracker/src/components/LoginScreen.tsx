import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, ScrollView, Platform } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { VectorIcon, IconName } from './VectorIcon';
import logoImg from '../assets/logo.png';

interface LoginScreenProps {
  isDark: boolean;
  onCompleteSetup: (name: string, habits: any[], tasks: string[]) => void;
}

const BACKGROUND_VECTORS: {
  name: IconName;
  color: string;
  size: number;
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  rotate: string;
}[] = [
  { name: 'fitness', color: '#FA5E1E', size: 90, top: '8%', left: '8%', rotate: '15deg' },
  { name: 'mind', color: '#06B6D4', size: 100, top: '15%', right: '10%', rotate: '-12deg' },
  { name: 'productivity', color: '#10B981', size: 85, bottom: '12%', left: '12%', rotate: '25deg' },
  { name: 'health', color: '#8B5CF6', size: 95, bottom: '15%', right: '12%', rotate: '-20deg' },
  { name: 'target', color: '#3B82F6', size: 80, top: '45%', left: '6%', rotate: '8deg' },
  { name: 'sparkles', color: '#F59E0B', size: 75, bottom: '48%', right: '8%', rotate: '-15deg' },
  { name: 'routine', color: '#EC4899', size: 85, top: '6%', right: '40%', rotate: '5deg' },
];

const CURATED_HABITS = [
  { id: 'h_water', name: 'Drink Water', iconName: 'health' as IconName, category: 'health', color: '#06B6D4', description: 'Hydrate your physical body', targetCount: 1 },
  { id: 'h_read', name: 'Read a Book', iconName: 'productivity' as IconName, category: 'productivity', color: '#8B5CF6', description: 'Expand your mental database', targetCount: 1 },
  { id: 'h_meditate', name: 'Meditation', iconName: 'mind' as IconName, category: 'mind', color: '#10B981', description: 'Quiet the mental noise', targetCount: 1 },
  { id: 'h_gym', name: 'Gym Workout', iconName: 'fitness' as IconName, category: 'fitness', color: '#FA5E1E', description: 'Stress-test physical capacity', targetCount: 1 },
  { id: 'h_walk', name: 'Morning Walk', iconName: 'routine' as IconName, category: 'fitness', color: '#EC4899', description: 'Low intensity outdoor cardio', targetCount: 1 }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  isDark,
  onCompleteSetup
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  // Setup state
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toggle habit selection
  const handleToggleHabit = (curated: typeof CURATED_HABITS[0]) => {
    const exists = selectedHabits.find((h) => h.curatedId === curated.id);
    if (exists) {
      setSelectedHabits((prev) => prev.filter((h) => h.curatedId !== curated.id));
    } else {
      setSelectedHabits((prev) => [
        ...prev,
        {
          name: curated.name,
          description: curated.description,
          category: curated.category,
          frequency: 'daily',
          targetCount: curated.targetCount,
          difficulty: 'easy',
          reminders: [],
          color: curated.color,
          curatedId: curated.id,
          history: {}
        }
      ]);
    }
  };

  const handleAddCustomHabit = () => {
    if (!customHabit.trim()) return;
    setSelectedHabits((prev) => [
      ...prev,
      {
        name: customHabit.trim(),
        description: 'My custom daily ritual',
        category: 'productivity',
        frequency: 'daily',
        targetCount: 1,
        difficulty: 'medium',
        reminders: [],
        color: '#E26D5C',
        history: {}
      }
    ]);
    setCustomHabit('');
  };

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    setTasksList((prev) => [...prev, taskInput.trim()]);
    setTaskInput('');
  };

  const handleRemoveTask = (idx: number) => {
    setTasksList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNextSlide = () => {
    if (slideIndex === 0) {
      if (!name.trim()) {
        setErrorMsg('Please tell the sanctuary your name to continue!');
        return;
      }
      setErrorMsg(null);
    }
    setSlideIndex((prev) => prev + 1);
  };

  const handlePrevSlide = () => {
    setSlideIndex((prev) => prev - 1);
  };

  const handleFinish = () => {
    onCompleteSetup(name.trim(), selectedHabits, tasksList);
  };

  const isNextDisabled = slideIndex === 0 && !name.trim();

  return (
    <View style={[styles.outerContainer, { backgroundColor: isDark ? '#0F172A' : '#ECECF1' }]}>
      {/* Premium glowing background elements */}
      <View style={[styles.glowOrb1, { backgroundColor: isDark ? '#FA5E1E' : '#FFD2C4' }]} />
      <View style={[styles.glowOrb2, { backgroundColor: isDark ? '#8B5CF6' : '#E0D4FF' }]} />
      <View style={[styles.glowOrb3, { backgroundColor: isDark ? '#10B981' : '#D1FAE5' }]} />

      {/* Scattered Premium Floating Vector Outlines */}
      {BACKGROUND_VECTORS.map((vec, idx) => {
        return (
          <View
            key={idx}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: vec.top,
              left: vec.left,
              bottom: vec.bottom,
              right: vec.right,
              transform: [{ rotate: vec.rotate }],
              opacity: isDark ? 0.05 : 0.09,
            }}
          >
            <VectorIcon name={vec.name} color={vec.color} size={vec.size} />
          </View>
        );
      })}

      <View style={[
        styles.loginCard,
        { 
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.72)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}>
        {/* Progress Bar Header */}
        <View style={styles.statusBarRow}>
          {[0, 1, 2, 3].map((idx) => {
            const isPassed = idx <= slideIndex;
            return (
              <View 
                key={idx} 
                style={[
                  styles.statusSegment, 
                  { 
                    backgroundColor: isPassed ? '#E26D5C' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' 
                  }
                ]} 
              />
            );
          })}
        </View>

        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideScrollContent}>
          {slideIndex === 0 && (
            /* Slide 0: Identity */
            <View style={styles.slideContainer}>
              <View style={styles.brandBox}>
                <View style={styles.iconShield}>
                  <Image source={logoImg} style={styles.logoImage} resizeMode="cover" />
                </View>
                <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Habitor</Text>
                <Text style={[styles.brandSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Your Personal Habit Sanctuary</Text>
              </View>

              <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>
                Welcome to your offline-first haven! Let's get to know you to prepare your biometrics dashboard.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>What is your name?</Text>
                <TextInput
                  style={[
                    styles.primaryInput,
                    { 
                      color: colors.textPrimary,
                      backgroundColor: colors.hover,
                      borderColor: colors.cardBorder
                    }
                  ]}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (val.trim()) setErrorMsg(null);
                  }}
                  placeholder="Elena"
                  placeholderTextColor={colors.textMuted}
                  maxLength={15}
                  autoFocus={true}
                />
              </View>

              {errorMsg && (
                <View style={styles.errorAlert}>
                  <VectorIcon name="close" color="#EF4444" size={14} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}
            </View>
          )}

          {slideIndex === 1 && (
            /* Slide 1: Starter Habits */
            <View style={styles.slideContainer}>
              <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>Choose Daily Rituals</Text>
              <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>
                Tap to add these curated habits, or add a custom one below. You can skip this step if you like!
              </Text>

              <View style={styles.habitsGrid}>
                {CURATED_HABITS.map((item) => {
                  const isSelected = !!selectedHabits.find((h) => h.curatedId === item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleToggleHabit(item)}
                      style={({ pressed }) => [
                        styles.curatedHabitCard,
                        {
                          backgroundColor: isSelected ? 'rgba(226, 109, 92, 0.15)' : colors.hover,
                          borderColor: isSelected ? '#E26D5C' : colors.cardBorder,
                          opacity: pressed ? 0.9 : 1
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isSelected ? 'rgba(226, 109, 92, 0.12)' : colors.hover, justifyContent: 'center', alignItems: 'center' }}>
                            <VectorIcon name={item.iconName} color={isSelected ? '#E26D5C' : colors.accent} size={15} />
                          </View>
                          <Text style={[styles.curatedName, { color: colors.textPrimary }]}>{item.name}</Text>
                        </View>
                        <View style={[styles.checkCircle, { borderColor: isSelected ? '#E26D5C' : colors.textMuted, backgroundColor: isSelected ? '#E26D5C' : 'transparent' }]}>
                          {isSelected && <VectorIcon name="check" color="#FFF" size={8} />}
                        </View>
                      </View>
                      <Text style={[styles.curatedDesc, { color: colors.textMuted, paddingLeft: 38 }]}>{item.description}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.customAddRow}>
                <TextInput
                  style={[
                    styles.customInput,
                    { 
                      color: colors.textPrimary,
                      backgroundColor: colors.hover,
                      borderColor: colors.cardBorder
                    }
                  ]}
                  value={customHabit}
                  onChangeText={setCustomHabit}
                  placeholder="Or write custom habit..."
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable
                  onPress={handleAddCustomHabit}
                  style={({ pressed }) => [
                    styles.addBtn,
                    { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '850', fontSize: 13 }}>+</Text>
                </Pressable>
              </View>

              {selectedHabits.length > 0 && (
                <Text style={[styles.selectionHint, { color: colors.accent }]}>
                  {selectedHabits.length} daily rituals queued for creation!
                </Text>
              )}
            </View>
          )}

          {slideIndex === 2 && (
            /* Slide 2: Starter Tasks */
            <View style={styles.slideContainer}>
              <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>Establish Tasks</Text>
              <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>
                What things are pending on your agenda today? Add a few tasks to begin. Skip if none are pending!
              </Text>

              <View style={styles.customAddRow}>
                <TextInput
                  style={[
                    styles.customInput,
                    { 
                      color: colors.textPrimary,
                      backgroundColor: colors.hover,
                      borderColor: colors.cardBorder
                    }
                  ]}
                  value={taskInput}
                  onChangeText={setTaskInput}
                  placeholder="e.g. Clear layout issues..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAddTask}
                />
                <Pressable
                  onPress={handleAddTask}
                  style={({ pressed }) => [
                    styles.addBtn,
                    { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '850', fontSize: 13 }}>+</Text>
                </Pressable>
              </View>

              {tasksList.length > 0 && (
                <View style={styles.tasksListCard}>
                  {tasksList.map((item, idx) => (
                    <View key={idx} style={[styles.taskItemRow, { borderBottomColor: colors.hover }]}>
                      <Text numberOfLines={1} style={[styles.taskItemText, { color: colors.textPrimary }]}>
                        • {item}
                      </Text>
                      <Pressable onPress={() => handleRemoveTask(idx)}>
                        <VectorIcon name="close" color="#EF4444" size={14} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {slideIndex === 3 && (
            /* Slide 3: Finish Onboarding */
            <View style={styles.slideContainer}>
              <View style={styles.brandBox}>
                <VectorIcon name="award" color={colors.accent} size={42} />
                <Text style={[styles.slideTitle, { color: colors.textPrimary, marginTop: 8 }]}>Your Sanctuary Awaits</Text>
              </View>

              <Text style={[styles.slideDesc, { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
                Welcome, <Text style={{ color: colors.accent, fontWeight: '800' }}>{name}</Text>! Your personal dashboard is configured and locked for extreme security offline.
              </Text>

              <View style={[styles.summaryCard, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Setup Summary:</Text>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>• Profile Name: {name}</Text>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>• Initial Daily Rituals: {selectedHabits.length}</Text>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>• Initial Agenda Tasks: {tasksList.length}</Text>
              </View>

              <Pressable
                onPress={handleFinish}
                style={({ pressed }) => [
                  styles.finishBtn,
                  { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }
                ]}
              >
                <Text style={styles.finishBtnText}>Enter Sanctuary ➔</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Slide Navigation Buttons */}
        {slideIndex < 3 && (
          <View style={styles.navRow}>
            {slideIndex > 0 ? (
              <Pressable
                onPress={handlePrevSlide}
                style={({ pressed }) => [
                  styles.navBtnPrev,
                  { backgroundColor: colors.hover, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <Pressable
              disabled={isNextDisabled}
              onPress={handleNextSlide}
              style={({ pressed }) => [
                styles.navBtnNext,
                { 
                  backgroundColor: colors.accent, 
                  opacity: isNextDisabled ? 0.5 : pressed ? 0.9 : 1 
                }
              ]}
            >
              <Text style={styles.navBtnTextNext}>Next</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  glowOrb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '10%',
    left: '15%',
    opacity: 0.12,
    filter: 'blur(80px)',
  },
  glowOrb2: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    bottom: '8%',
    right: '12%',
    opacity: 0.12,
    filter: 'blur(90px)',
  },
  glowOrb3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: '45%',
    left: '48%',
    opacity: 0.07,
    filter: 'blur(75px)',
  },
  loginCard: {
    width: '90%',
    maxWidth: 440,
    maxHeight: '85%',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    elevation: 8,
    backdropFilter: 'blur(20px)',
    gap: 16,
  },
  statusBarRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    height: 4,
    paddingHorizontal: 6,
  },
  statusSegment: {
    flex: 1,
    borderRadius: 2,
  },
  slideScroll: {
    flex: 1,
    width: '100%',
  },
  slideScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  slideContainer: {
    width: '100%',
    gap: 14,
  },
  brandBox: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconShield: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  slideDesc: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputWrapper: {
    gap: 8,
    width: '100%',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  primaryInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '750',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  // Habits grid
  habitsGrid: {
    gap: 10,
    width: '100%',
  },
  curatedHabitCard: {
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  curatedName: {
    fontSize: 12,
    fontWeight: '800',
  },
  curatedDesc: {
    fontSize: 10,
    fontWeight: '600',
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  customInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHint: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  // Tasks slide
  tasksListCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
    overflow: 'hidden',
    marginTop: 6,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  taskItemText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  // Finish slide
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  finishBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    boxShadow: '0 4px 14px rgba(226, 109, 92, 0.3)',
  },
  finishBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  // Bottom navigations
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 12,
  },
  navBtnPrev: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnNext: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  navBtnTextNext: {
    fontSize: 12,
    fontWeight: '850',
    color: '#FFF',
  },
});
