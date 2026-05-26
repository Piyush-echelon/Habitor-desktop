import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { Task } from '../types';
import { VectorIcon } from './VectorIcon';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (title: string, category: Task['category']) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTaskCategory?: (id: string, category: Task['category']) => void;
  isDark: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTaskCategory,
  isDark,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const { width } = useWindowDimensions();
  const isWide = width >= 800;

  // New task input state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Task['category']>('work');

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | Task['category']>('all');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const handleAddTaskSubmit = () => {
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newCategory);
    setNewTitle('');
  };

  const getCategoryColor = (cat: Task['category']) => {
    switch (cat) {
      case 'work': return '#3B82F6';
      case 'personal': return '#A855F7';
      case 'urgent': return '#EF4444';
      case 'routine': return '#F59E0B';
      default: return colors.accent;
    }
  };

  const filteredTasks = activeFilter === 'all'
    ? tasks
    : tasks.filter(t => t.category === activeFilter);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Block */}
        <View style={styles.headerArea}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Capture quick one-off to-dos, action items, and checklists. Unlike habits, these do not repeat daily.
          </Text>
        </View>

        {/* Stats Summary Widget */}
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{tasks.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: colors.accent }]}>{pendingCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: colors.success }]}>{completedCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
        </View>

        {/* Filter Bar Row */}
        <View style={styles.filterBar}>
          {(['all', 'work', 'personal', 'urgent', 'routine'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            const filterColor = filter === 'all' ? colors.accent : getCategoryColor(filter);
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                    borderColor: isActive ? filterColor : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? filterColor : colors.textSecondary }
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tasks Checklist Grid */}
        <View style={styles.tasksList}>
          {filteredTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <VectorIcon name="tasks" color={colors.textMuted} size={40} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tasks found</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {activeFilter === 'all'
                  ? "All caught up! Type a task below to capture details."
                  : `No tasks in the ${activeFilter} category.`}
              </Text>
            </View>
          ) : (
            <View style={[styles.tasksUnifiedCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {filteredTasks.map((task, index) => {
                const catColor = getCategoryColor(task.category);
                const isLast = index === filteredTasks.length - 1;
                return (
                  <View
                    key={task.id}
                    style={[
                      styles.taskRow,
                      {
                        borderBottomColor: colors.divider,
                        borderBottomWidth: isLast ? 0 : 1,
                      }
                    ]}
                  >
                    {/* Left Custom Checkbox */}
                    <Pressable
                      onPress={() => onToggleTask(task.id)}
                      style={({ pressed }) => [
                        styles.checkbox,
                        {
                          borderColor: task.completed ? colors.success : colors.textMuted,
                          backgroundColor: task.completed ? 'rgba(16,185,129,0.1)' : 'transparent',
                          opacity: pressed ? 0.8 : 1,
                        }
                      ]}
                    >
                      {task.completed && <VectorIcon name="check" color={colors.success} size={14} />}
                    </Pressable>

                    {/* Task details title & tag */}
                    <View style={styles.taskDetails}>
                      <Text
                        style={[
                          styles.taskTitle,
                          {
                            color: task.completed ? colors.textMuted : colors.textPrimary,
                            textDecorationLine: task.completed ? 'line-through' : 'none',
                          }
                        ]}
                      >
                        {task.title}
                      </Text>
                      
                      {/* Dynamic inline Category picker tag */}
                      {editingCategoryId === task.id ? (
                        <View style={styles.inlineCategorySelectRow}>
                          {(['work', 'personal', 'urgent', 'routine'] as const).map((cat) => {
                            const inlineColor = getCategoryColor(cat);
                            const isCurrent = task.category === cat;
                            return (
                              <Pressable
                                key={cat}
                                onPress={() => {
                                  onUpdateTaskCategory?.(task.id, cat);
                                  setEditingCategoryId(null);
                                }}
                                style={[
                                  styles.inlineCategoryCircle,
                                  {
                                    backgroundColor: inlineColor,
                                    borderColor: isCurrent ? colors.textPrimary : 'transparent',
                                    borderWidth: isCurrent ? 1.5 : 0
                                  }
                                ]}
                              />
                            );
                          })}
                          <Pressable onPress={() => setEditingCategoryId(null)} style={styles.inlineCategoryCancelBtn}>
                            <VectorIcon name="close" color={colors.textSecondary} size={10} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => setEditingCategoryId(task.id)}
                          style={[styles.categoryTag, { backgroundColor: `${catColor}15` }]}
                        >
                          <View style={[styles.colorDot, { backgroundColor: catColor }]} />
                          <Text style={[styles.categoryTagText, { color: catColor }]}>
                            {task.category.toUpperCase()}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Delete Trash Action */}
                    <Pressable
                      onPress={() => onDeleteTask(task.id)}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        { opacity: pressed ? 0.6 : 1 }
                      ]}
                    >
                      <VectorIcon name="trash" color={colors.textMuted} size={14} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Create Task Card */}
        <View style={[styles.createCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Quick Add Task</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.hover, color: colors.textPrimary, borderColor: colors.cardBorder }]}
              placeholder="e.g. Clean workspace, Buy grocery, Submit paper..."
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              onSubmitEditing={handleAddTaskSubmit}
            />
            
            <Pressable
              onPress={handleAddTaskSubmit}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <VectorIcon name="plus" color="#FFF" size={16} />
              {isWide && <Text style={styles.addBtnText}>Add Task</Text>}
            </Pressable>
          </View>

          {/* Category Picker Selector */}
          <View style={styles.categoryPickerRow}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Category:</Text>
            <View style={styles.pickerOptions}>
              {(['work', 'personal', 'urgent', 'routine'] as Task['category'][]).map((cat) => {
                const isActive = newCategory === cat;
                const catColor = getCategoryColor(cat);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setNewCategory(cat)}
                    style={({ pressed }) => [
                      styles.pickerChip,
                      {
                        backgroundColor: isActive ? catColor : colors.hover,
                        borderColor: isActive ? catColor : colors.cardBorder,
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: isActive ? '#FFF' : catColor }]} />
                    <Text
                      style={[
                        styles.pickerChipText,
                        { color: isActive ? '#FFF' : colors.textPrimary }
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
  headerArea: {
    marginBottom: 4,
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
  summaryCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 30,
  },
  createCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pickerChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(128,128,128,0.08)',
    paddingBottom: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tasksList: {
    gap: 12,
  },
  tasksUnifiedCard: {
    borderRadius: 22,
    borderWidth: 1,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  inlineCategorySelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  inlineCategoryCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  inlineCategoryCancelBtn: {
    padding: 4,
    marginLeft: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDetails: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    gap: 4,
  },
  categoryTagText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
