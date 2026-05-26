import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { Habit, HabitCategory, HabitDifficulty } from '../types';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (habitData: {
    name: string;
    description: string;
    category: HabitCategory;
    frequency: 'daily' | 'weekly';
    targetCount: number;
    difficulty: HabitDifficulty;
    color: string;
  }) => void;
  habitToEdit?: Habit;
  isDark: boolean;
}

const PRESET_COLORS = [
  '#00F2FE', // Cyan/Aqua
  '#A855F7', // Violet
  '#3B82F6', // Cobalt
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#EF4444', // Red/Coral
];

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  visible,
  onClose,
  onSave,
  habitToEdit,
  isDark,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [difficulty, setDifficulty] = useState<HabitDifficulty>('easy');
  const [targetCount, setTargetCount] = useState(1);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (visible) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setDescription(habitToEdit.description || '');
        setCategory(habitToEdit.category);
        setDifficulty(habitToEdit.difficulty);
        setTargetCount(habitToEdit.targetCount);
        setSelectedColor(habitToEdit.color);
      } else {
        setName('');
        setDescription('');
        setCategory('health');
        setDifficulty('easy');
        setTargetCount(1);
        setSelectedColor(PRESET_COLORS[0]);
      }
    }
  }, [visible, habitToEdit]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      frequency: 'daily',
      targetCount,
      difficulty,
      color: selectedColor,
    });

    onClose();
  };

  const categories: Array<{ id: HabitCategory; label: string; icon: string }> = [
    { id: 'health', label: 'Health', icon: '❤️' },
    { id: 'mind', label: 'Mind', icon: '🧘' },
    { id: 'productivity', label: 'Work', icon: '⚡' },
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'routine', label: 'Routine', icon: '⏰' },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {habitToEdit ? 'Edit Habit Details' : 'Create New Habit'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeIcon, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>HABIT NAME</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.hover, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                placeholder="e.g. Read Books, Go for a Run"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.hover, color: colors.textPrimary, borderColor: colors.cardBorder }]}
                placeholder="Why do you want to track this habit?"
                placeholderTextColor={colors.textMuted}
                multiline={true}
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={[
                        styles.catTab,
                        {
                          backgroundColor: colors.hover,
                          borderColor: isSelected ? colors.accent : 'transparent',
                        }
                      ]}
                    >
                      <Text style={styles.catIcon}>{cat.icon}</Text>
                      <Text style={[styles.catLabel, { color: isSelected ? colors.accent : colors.textPrimary }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Difficulty & Target Count */}
            <View style={styles.rowLayout}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DIFFICULTY</Text>
                <View style={styles.difficultyTabs}>
                  {(['easy', 'medium', 'hard'] as HabitDifficulty[]).map((diff) => {
                    const isSelected = difficulty === diff;
                    return (
                      <Pressable
                        key={diff}
                        onPress={() => setDifficulty(diff)}
                        style={[
                          styles.diffTab,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.hover,
                          }
                        ]}
                      >
                        <Text style={[styles.diffLabel, { color: isSelected ? '#FFF' : colors.textPrimary }]}>
                          {diff.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 0.8 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DAILY TARGET</Text>
                <View style={[styles.counterTrack, { backgroundColor: colors.hover }]}>
                  <Pressable
                    onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
                    style={styles.counterBtn}
                  >
                    <Text style={[styles.counterBtnText, { color: colors.textPrimary }]}>-</Text>
                  </Pressable>
                  <Text style={[styles.counterVal, { color: colors.textPrimary }]}>{targetCount}</Text>
                  <Pressable
                    onPress={() => setTargetCount(targetCount + 1)}
                    style={styles.counterBtn}
                  >
                    <Text style={[styles.counterBtnText, { color: colors.textPrimary }]}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Color Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>THEME ACCENT COLOR</Text>
              <View style={styles.colorPalette}>
                {PRESET_COLORS.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <Pressable
                      key={col}
                      onPress={() => setSelectedColor(col)}
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor: col,
                          borderColor: '#FFF',
                          borderWidth: isSelected ? 3 : 0,
                          transform: [{ scale: isSelected ? 1.15 : 1 }],
                        }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, { backgroundColor: colors.hover, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
            
            <Pressable
              onPress={handleSave}
              disabled={!name.trim()}
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  backgroundColor: name.trim() ? colors.accent : colors.textMuted,
                  opacity: pressed ? 0.85 : 1,
                }
              ]}
            >
              <Text style={styles.saveBtnText}>{habitToEdit ? 'Save Changes' : 'Add Habit'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
    elevation: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  formContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
    gap: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  catIcon: {
    fontSize: 14,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  difficultyTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    height: 42,
  },
  diffTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  counterTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 8,
  },
  counterBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  counterVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
