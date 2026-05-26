import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView, useWindowDimensions, SafeAreaView, ActivityIndicator, Modal, TextInput, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors } from './src/theme/colors';
import { useHabitStore, getLocalDateString } from './src/store/habitStore';
import { Sidebar } from './src/components/Sidebar';
import { Header } from './src/components/Header';
import { HabitList } from './src/components/HabitList';
import { CreateHabitModal } from './src/components/CreateHabitModal';
import { AnalyticsView } from './src/components/AnalyticsView';
import { AchievementsView } from './src/components/AchievementsView';
import { TasksView } from './src/components/TasksView';
import { VectorIcon } from './src/components/VectorIcon';
import { HabitsView } from './src/components/HabitsView';
import { Habit } from './src/types';
import { LoginScreen } from './src/components/LoginScreen';
import { TutorialWalkthrough } from './src/components/TutorialWalkthrough';
import { SyncView } from './src/components/SyncView';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;
const SIDEBAR_DEFAULT = 300;

export default function App() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 800;

  const [isDark, setIsDark] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newNameVal, setNewNameVal] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dragging state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(SIDEBAR_DEFAULT);

  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const todayStr = getLocalDateString(new Date());
  
  const activeDateStr = (() => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() + selectedDayOffset);
    return d.toISOString().split('T')[0];
  })();

    const {
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
      dismissLevelUpAlert,
    } = useHabitStore();

  const [setupCompleted, setSetupCompleted] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Dynamic top-bar theme matching in Electron
  useEffect(() => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.changeTheme) {
      // @ts-ignore
      window.electronAPI.changeTheme(isDark ? 'dark' : 'light');
    }
  }, [isDark]);

  // Check onboarding status for first-time dashboard enter
  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (setupCompleted) {
        try {
          const completed = await AsyncStorage.getItem('@habitor_tutorial_completed');
          if (completed !== 'true') {
            setShowTutorial(true);
          }
        } catch (e) {
          console.error('Error fetching tutorial state:', e);
        }
      }
    };
    checkTutorialStatus();
  }, [setupCompleted]);

  const handleStepChange = (step: number) => {
    // Switch tabs dynamically to sync layout views with Byte's guidance
    if (step === 0 || step === 1 || step === 2) {
      setCurrentTab('dashboard');
    } else if (step === 3) {
      setCurrentTab('tasks');
    } else if (step === 4) {
      setCurrentTab('analytics');
    } else if (step === 5) {
      setCurrentTab('dashboard');
    }
  };

  // Circular Reveal Theme Transition State
  const [animatingTheme, setAnimatingTheme] = useState(false);
  const [nextThemeDark, setNextThemeDark] = useState(false);
  const [clickCoords, setClickCoords] = useState({ x: 0, y: 0 });
  const themeProgress = useRef(new Animated.Value(0)).current;

  const handleThemeToggle = (e: any) => {
    if (animatingTheme) return;

    const nextDark = !isDark;

    // Use browser-level native View Transitions if running on Web and supported
    // @ts-ignore
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.startViewTransition) {
      const clientX = e?.nativeEvent?.clientX ?? (width - 120);
      const clientY = e?.nativeEvent?.clientY ?? 40;
      
      const endRadius = Math.hypot(
        Math.max(clientX, width - clientX),
        Math.max(clientY, height - clientY)
      );

      // @ts-ignore
      const transition = document.startViewTransition(() => {
        setIsDark(nextDark);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${clientX}px ${clientY}px)`,
              `circle(${endRadius}px at ${clientX}px ${clientY}px)`
            ],
          },
          {
            duration: 550,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    } else {
      // Fallback for native devices: solid circle reveal overlay
      const x = e?.nativeEvent?.pageX ?? (width - 120);
      const y = e?.nativeEvent?.pageY ?? 40;

      setNextThemeDark(nextDark);
      setClickCoords({ x, y });
      setAnimatingTheme(true);

      themeProgress.setValue(0);

      Animated.timing(themeProgress, {
        toValue: 1,
        duration: 650,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setAnimatingTheme(false);
        }
      });

      setTimeout(() => {
        setIsDark(nextDark);
      }, 320);
    }
  };

  // Check if setup onboarding is completed
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem('@habitor_setup_completed');
        if (completed === 'true') {
          setSetupCompleted(true);
        } else {
          setSetupCompleted(false);
        }
      } catch (e) {
        console.error('Error checking setup completion:', e);
      } finally {
        setIsCheckingSetup(false);
      }
    };
    if (!isLoading) {
      checkSetupStatus();
    }
  }, [isLoading]);

  // Mouse/pointer drag handlers — work on web (react-native-web renders to DOM)
  const handleDividerMouseDown = useCallback((e: any) => {
    isDragging.current = true;
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragStartWidth.current = sidebarWidth;
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragStartWidth.current + delta));
      setSidebarWidth(next);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // While Firebase resolves its cached session, show a loading screen.
  // This prevents the login page from flashing for already-authenticated users.
  if (isLoading || isCheckingSetup) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Restoring your habit sanctuary...</Text>
      </View>
    );
  }

  // Slide Onboarding Setup Flow if setup is not finished
  if (!setupCompleted) {
    return (
      <LoginScreen
        isDark={isDark}
        onCompleteSetup={async (name, firstHabits, firstTasks) => {
          try {
            // 1. Prepare initial profile state
            const newProfile = {
              ...profile,
              name: name,
            };

            // 2. Prepare initial habits with valid fields and random IDs
            const initialHabits = firstHabits.map((h: any) => ({
              ...h,
              id: Math.random().toString(36).substring(2, 9),
              streak: 0,
              longestStreak: 0,
              history: {},
              createdAt: new Date().toISOString(),
            }));

            // 3. Prepare initial tasks with valid fields and random IDs
            const initialTasks = firstTasks.map((t: string) => ({
              id: Math.random().toString(36).substring(2, 9),
              title: t,
              completed: false,
              category: 'routine' as const,
              createdAt: new Date().toISOString(),
            }));

            // 4. Batch update all store states and AsyncStorage persistently in a single transaction
            await syncStateFromBluetooth({
              habits: initialHabits,
              profile: newProfile,
              tasks: initialTasks,
            }, false);

            // 5. Persist setup onboarding completion status
            await AsyncStorage.setItem('@habitor_setup_completed', 'true');
            setSetupCompleted(true);
          } catch (e) {
            console.error('Failed to complete first-time onboarding setup:', e);
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Electron Draggable Title Bar */}
      {Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).electronAPI && (
        <View 
          style={[
            styles.electronTitleBar, 
            { 
              backgroundColor: colors.background,
              borderColor: colors.cardBorder,
            }
          ]}
        >
          <Text style={[styles.electronTitleText, { color: colors.textSecondary }]}>Habitor</Text>
        </View>
      )}

      <View style={[styles.appFrame, { flexDirection: isDesktop ? 'row' : 'column' }]}>

        {/* Left Sidebar — fixed pixel width on desktop, auto on mobile */}
        {isDesktop && (
          <View style={[styles.sidebarContainer, { width: sidebarWidth }]}>
            <Sidebar
              isDark={isDark}
              userLevel={profile.level}
              sidebarWidth={sidebarWidth}
              habits={habits}
              tasks={tasks}
              profile={profile}
              activeDateStr={activeDateStr}
              onUpdateBiometrics={updateBiometrics}
              onUpdateBookDetails={updateBookDetails}
              onEditProfileNameClick={() => {
                setNewNameVal(profile.name || 'User');
                setRenameModalVisible(true);
              }}
              onNavigateToSync={() => setCurrentTab('sync')}
            />
          </View>
        )}

        {/* Draggable Divider — desktop only */}
        {isDesktop && (
          <View
            style={styles.dividerHitArea}
            // @ts-ignore — web-only prop
            onMouseDown={handleDividerMouseDown}
          >
            {/* Full-height visible line */}
            <View style={[styles.dividerLine, { backgroundColor: colors.textMuted }]} />
            {/* Centered grab handle pill */}
            <View style={[styles.dividerHandle, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={[styles.handleDot, { backgroundColor: colors.textMuted }]} />
              <View style={[styles.handleDot, { backgroundColor: colors.textMuted }]} />
              <View style={[styles.handleDot, { backgroundColor: colors.textMuted }]} />
            </View>
          </View>
        )}

        {/* Central Content Area */}
        <View style={[styles.mainContent, !isDesktop && { paddingBottom: 88, paddingHorizontal: 16, paddingTop: 12 }]}>
          <View style={styles.contentWrapper}>

            {/* Top Bar: tabs on left, controls on right */}
            <View style={styles.topBar}>
              {/* Navigation Tabs (desktop only) */}
              {isDesktop && (
                <View style={[styles.navTabsRow, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
                    { id: 'habits', label: 'Habits', icon: 'routine' as const },
                    { id: 'tasks', label: 'Tasks', icon: 'tasks' as const },
                    { id: 'analytics', label: 'Analytics', icon: 'analytics' as const },
                    { id: 'achievements', label: 'Achievements', icon: 'achievements' as const },
                    { id: 'sync', label: 'CrossSync', icon: 'sparkles' as const },
                  ].map((tab) => {
                    const isActive = currentTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => setCurrentTab(tab.id)}
                        style={({ pressed }) => [
                          styles.navTab,
                          {
                            backgroundColor: isActive ? colors.cardBg : 'transparent',
                            opacity: pressed ? 0.8 : 1,
                            boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : undefined,
                          }
                        ]}
                      >
                        <VectorIcon name={tab.icon} color={isActive ? colors.accent : colors.textSecondary} size={14} />
                        <Text style={[styles.navTabText, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Right controls */}
              <View style={[styles.topBarRight, !isDesktop && { width: '100%', justifyContent: 'flex-end' }]}>
                <Pressable
                  onPress={(e) => handleThemeToggle(e)}
                  style={({ pressed }) => [
                    styles.themeToggle,
                    { backgroundColor: colors.hover, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <VectorIcon name={isDark ? 'sun' : 'moon'} color={colors.accent} size={14} />
                  <Text style={[styles.themeToggleText, { color: colors.textPrimary }]}>
                    {isDark ? 'Light UI' : 'Dark UI'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Header (page title + AI button + profile) */}
            <Header 
              profile={profile} 
              isDark={isDark} 
              currentTab={currentTab} 
              onEditProfileNameClick={() => {
                setNewNameVal(profile.name || 'Elena');
                setRenameModalVisible(true);
              }}
              onTabChange={setCurrentTab}
              onAwardXp={awardXp}
              onOpenDrawer={!isDesktop ? () => setIsDrawerOpen(true) : undefined}
            />

            {/* Active Tab Content */}
            {currentTab === 'dashboard' && (
              <ScrollView style={styles.tabScroll} showsVerticalScrollIndicator={false}>
                <HabitList
                  habits={habits}
                  tasks={tasks}
                  profile={profile}
                  dateStr={todayStr}
                  selectedDayOffset={selectedDayOffset}
                  onSelectedDayOffsetChange={setSelectedDayOffset}
                  onLogProgress={logHabitProgress}
                  onDelete={deleteHabit}
                  onCreateClick={() => {
                    setHabitToEdit(undefined);
                    setCreateModalVisible(true);
                  }}
                  onUpdateBiometrics={updateBiometrics}
                  isDark={isDark}
                />
              </ScrollView>
            )}

            {currentTab === 'habits' && (
              <HabitsView
                habits={habits}
                onCreateHabitClick={() => {
                  setHabitToEdit(undefined);
                  setCreateModalVisible(true);
                }}
                onEditHabitClick={(habit) => {
                  setHabitToEdit(habit);
                  setCreateModalVisible(true);
                }}
                onDeleteHabit={deleteHabit}
                isDark={isDark}
              />
            )}

            {currentTab === 'tasks' && (
              <TasksView
                tasks={tasks}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onUpdateTaskCategory={updateTaskCategory}
                isDark={isDark}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView habits={habits} profile={profile} tasks={tasks} isDark={isDark} />
            )}

            {currentTab === 'achievements' && (
              <AchievementsView 
                achievements={achievements} 
                profile={profile} 
                isDark={isDark} 
                onResetHabitor={async () => {
                  await resetData();
                  await AsyncStorage.removeItem('@habitor_setup_completed');
                  setSetupCompleted(false);
                }}
                onReplayTutorial={() => setShowTutorial(true)}
              />
            )}

            {currentTab === 'sync' && (
              <SyncView
                isDark={isDark}
                habits={habits}
                tasks={tasks}
                profile={profile}
                syncStateFromBluetooth={syncStateFromBluetooth}
              />
            )}
          </View>
        </View>
      </View>

      {/* Creation / Edit Modal */}
      <CreateHabitModal
        visible={createModalVisible}
        onClose={() => {
          setCreateModalVisible(false);
          setHabitToEdit(undefined);
        }}
        onSave={(data) => {
          if (habitToEdit) {
            editHabit(habitToEdit.id, data);
          } else {
            addHabit(data);
          }
        }}
        habitToEdit={habitToEdit}
        isDark={isDark}
      />

      {/* Level-up Celebration Overlay */}
      {showLevelUpAlert?.show && (
        <View style={styles.celebrationOverlay}>
          <View style={[styles.celebrationCard, { backgroundColor: colors.cardBg, borderColor: colors.gold }]}>
            <Text style={styles.celebrationEmoji}>🎉✨</Text>
            <Text style={[styles.celebrationTitle, { color: colors.textPrimary }]}>LEVEL UP!</Text>
            <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
              Your self-discipline has ascended! You are now
            </Text>
            <Text style={[styles.celebrationLevel, { color: colors.gold }]}>
              Level {showLevelUpAlert.level}
            </Text>
            <Text style={[styles.celebrationBonus, { color: colors.success }]}>
              Unlocked +100 Max Level XP Capacity!
            </Text>
            <Pressable
              onPress={dismissLevelUpAlert}
              style={[styles.celebrationBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.celebrationBtnText}>Claim Glory</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Edit Profile Name Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.celebrationOverlay}>
          <View style={[styles.renameModalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.renameModalHeader}>
              <Text style={[styles.renameModalTitle, { color: colors.textPrimary }]}>Edit Profile Name</Text>
              <Pressable onPress={() => setRenameModalVisible(false)}>
                <VectorIcon name="close" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>
            <Text style={[styles.renameModalSub, { color: colors.textSecondary }]}>
              Change the profile name displayed globally in greetings and badges.
            </Text>
            <TextInput
              style={[
                styles.renameInput,
                { 
                  color: colors.textPrimary, 
                  backgroundColor: colors.hover, 
                  borderColor: colors.cardBorder 
                }
              ]}
              value={newNameVal}
              onChangeText={setNewNameVal}
              placeholder="Elena"
              placeholderTextColor={colors.textMuted}
              maxLength={15}
              autoFocus={true}
            />
            <View style={styles.renameActionRow}>
              <Pressable
                onPress={() => setRenameModalVisible(false)}
                style={[styles.renameBtnCancel, { backgroundColor: colors.hover }]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (newNameVal.trim()) {
                    updateProfileName(newNameVal.trim());
                    setRenameModalVisible(false);
                  }
                }}
                style={[styles.renameBtnSave, { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Onboarding Interactive Byte Walkthrough */}
      <TutorialWalkthrough
        visible={showTutorial}
        isDark={isDark}
        onClose={() => setShowTutorial(false)}
        onStepChange={handleStepChange}
      />

      {/* Mobile left-sliding drawer overlay */}
      {!isDesktop && isDrawerOpen && (
        <View style={styles.mobileDrawerOverlay}>
          <Pressable 
            onPress={() => setIsDrawerOpen(false)} 
            style={styles.mobileDrawerBackdrop}
          />
          <View style={[styles.mobileDrawerPanel, { backgroundColor: isDark ? '#1E293B' : colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.mobileDrawerHeader}>
              <Text style={[styles.mobileDrawerTitle, { color: colors.textPrimary }]}>Habitor - Focus & Account</Text>
              <Pressable 
                onPress={() => setIsDrawerOpen(false)}
                style={{ padding: 6, borderRadius: 6, backgroundColor: colors.hover }}
              >
                <VectorIcon name="close" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>
            <View style={{ flex: 1, paddingVertical: 10 }}>
              <Sidebar
                isDark={isDark}
                userLevel={profile.level}
                sidebarWidth={280}
                habits={habits}
                tasks={tasks}
                profile={profile}
                activeDateStr={activeDateStr}
                onUpdateBiometrics={updateBiometrics}
                onUpdateBookDetails={updateBookDetails}
                onEditProfileNameClick={() => {
                  setIsDrawerOpen(false);
                  setNewNameVal(profile.name || 'User');
                  setRenameModalVisible(true);
                }}
                onNavigateToSync={() => {
                  setIsDrawerOpen(false);
                  setCurrentTab('sync');
                }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Mobile Floating Bottom Tab Bar */}
      {!isDesktop && (
        <View style={[styles.navTabsRowMobile, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(238, 238, 244, 0.9)', borderColor: colors.cardBorder }]}>
          {[
            {id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
            { id: 'habits', label: 'Habits', icon: 'routine' as const },
            { id: 'tasks', label: 'Tasks', icon: 'tasks' as const },
            { id: 'sync', label: 'CrossSync', icon: 'sparkles' as const },
            { id: 'analytics', label: 'Analytics', icon: 'analytics' as const },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setCurrentTab(tab.id)}
                style={({ pressed }) => [
                  styles.navTabMobile,
                  {
                    opacity: pressed ? 0.8 : 1,
                  }
                ]}
              >
                <View style={[styles.navTabIconBox, isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <VectorIcon name={tab.icon} color={isActive ? colors.accent : colors.textSecondary} size={16} />
                </View>
                <Text numberOfLines={1} style={[styles.navTabTextMobile, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Stunning Circular Reveal Theme Transition Overlay */}
      {animatingTheme && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: clickCoords.y - 1200,
            left: clickCoords.x - 1200,
            width: 2400,
            height: 2400,
            borderRadius: 1200,
            backgroundColor: nextThemeDark ? '#0F172A' : '#ECECF1',
            zIndex: 9999999,
            transform: [
              {
                scale: themeProgress.interpolate({
                  inputRange: [0, 0.8, 1],
                  outputRange: [0, 1.8, 1.8],
                }),
              },
            ],
            opacity: themeProgress.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  electronTitleBar: {
    height: 35,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    // @ts-ignore — web-only CSS dragging handle
    '-webkit-app-region': 'drag',
    userSelect: 'none',
    zIndex: 10000,
  },
  electronTitleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appFrame: {
    flex: 1,
    minHeight: 0,       // allow shrinking on web
    overflow: 'hidden',
  },
  sidebarContainer: {
    flexShrink: 0,
    alignSelf: 'stretch', // fill vertically naturally without forcing % height
    overflow: 'hidden',
    minHeight: 0,
  },
  // Draggable divider
  dividerHitArea: {
    width: 16,
    alignSelf: 'stretch',   // fill full parent height without relying on % height
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'col-resize',
    zIndex: 10,
    flexShrink: 0,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,               // thicker = more visible
    opacity: 0.35,          // subtle but clearly there
  },
  dividerHandle: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    alignItems: 'center',
    zIndex: 1,              // sits above the line
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  },
  handleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
    minHeight: 0,       // KEY: prevents flex child overflowing parent on web
    minWidth: 0,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    minHeight: 0,       // KEY: prevents overflow
    width: '100%',
    overflow: 'hidden',
  },
  tabScroll: {
    flex: 1,
    minHeight: 0,
  },
  // Top nav bar row
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  navTabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 2,
    borderWidth: 1,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 7,
  },
  navTabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Celebration
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 2,
    padding: 34,
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 8px 40px rgba(251,191,36,0.25)',
    elevation: 10,
  },
  celebrationEmoji: {
    fontSize: 52,
    textAlign: 'center',
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  celebrationSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  celebrationLevel: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  celebrationBonus: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  celebrationBtn: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  celebrationBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  renameModalCard: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    elevation: 6,
  },
  renameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  renameModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  renameModalSub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    width: '100%',
  },
  renameActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  renameBtnCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameBtnSave: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(226, 109, 92, 0.25)',
  },
  mobileDrawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flexDirection: 'row',
  },
  mobileDrawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  mobileDrawerPanel: {
    width: 290,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 20,
    boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
    elevation: 16,
  },
  mobileDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  mobileDrawerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  navTabsRowMobile: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    zIndex: 999,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    // Note: backdrop-filter is added for web, UWP ignores gracefully
    backdropFilter: 'blur(16px)',
  },
  navTabMobile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navTabIconBox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTabTextMobile: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
