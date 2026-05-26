import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Modal } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { UserProfile } from '../types';
import { VectorIcon } from './VectorIcon';

interface HeaderProps {
  profile: UserProfile;
  isDark: boolean;
  currentTab: string;
  onEditProfileNameClick?: () => void;
  onTabChange?: (tabName: string) => void;
  onAwardXp?: (amount: number) => void;
  onOpenDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  profile, 
  isDark, 
  currentTab, 
  onEditProfileNameClick,
  onTabChange,
  onAwardXp,
  onOpenDrawer
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Zen Focus Breathing Modal State
  const [showZenModal, setShowZenModal] = useState(false);
  const [zenActive, setZenActive] = useState(false);
  const [zenTime, setZenTime] = useState(0); // 0 to 60s
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold In' | 'Exhale' | 'Hold Out'>('Inhale');
  const [phaseSeconds, setPhaseSeconds] = useState(0); // 0 to 4s
  const [zenCompleted, setZenCompleted] = useState(false);

  // Interval hook for Breathing Coach cycle
  useEffect(() => {
    let interval: any = null;
    if (zenActive && !zenCompleted) {
      interval = setInterval(() => {
        setZenTime((prevTime) => {
          const nextTime = prevTime + 1;
          if (nextTime >= 60) {
            setZenActive(false);
            setZenCompleted(true);
            onAwardXp?.(15); // reward 15 XP upon completing meditation
            return 60;
          }
          return nextTime;
        });

        setPhaseSeconds((prevSec) => {
          const nextSec = prevSec + 1;
          if (nextSec > 4) {
            setBreathPhase((prevPhase) => {
              if (prevPhase === 'Inhale') return 'Hold In';
              if (prevPhase === 'Hold In') return 'Exhale';
              if (prevPhase === 'Exhale') return 'Hold Out';
              return 'Inhale';
            });
            return 1;
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [zenActive, zenCompleted, onAwardXp]);

  const handleCloseZen = () => {
    setShowZenModal(false);
    setZenActive(false);
    setZenTime(0);
    setBreathPhase('Inhale');
    setPhaseSeconds(0);
    setZenCompleted(false);
  };

  const handleResetZen = () => {
    setZenActive(false);
    setZenTime(0);
    setBreathPhase('Inhale');
    setPhaseSeconds(0);
    setZenCompleted(false);
  };

  const getOrbScale = () => {
    if (breathPhase === 'Inhale') {
      return 1.0 + (phaseSeconds / 4) * 0.4; // grows smoothly from 1.0 to 1.4
    }
    if (breathPhase === 'Hold In') {
      return 1.4;
    }
    if (breathPhase === 'Exhale') {
      return 1.4 - (phaseSeconds / 4) * 0.4; // shrinks smoothly from 1.4 to 1.0
    }
    return 1.0; // Hold Out (static small)
  };

  const getGreetingText = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning, Visionary!';
    if (hrs < 17) return 'Good Afternoon, Builder!';
    return 'Good Evening, Mastermind!';
  };

  const handleAskAi = (question: string) => {
    setAiLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      setAiLoading(false);
      if (question.toLowerCase().includes('water') || question.toLowerCase().includes('hydrate')) {
        setAiResponse("💧 Hydration Tip: Drinking water immediately after waking up activates your internal organs and boosts mental clarity by 14%. Try pairing it with a visual trigger—placing a glass on your desk tonight!");
      } else if (question.toLowerCase().includes('meditat') || question.toLowerCase().includes('mind')) {
        setAiResponse("🧘 Mindfulness Guide: Just 10 minutes of box-breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) lowers your cortisol levels by up to 25%. Pair this habit right after checking off your morning tea or coffee!");
      } else if (question.toLowerCase().includes('streak') || question.toLowerCase().includes('consist')) {
        setAiResponse("🔥 Streak Starter: Consistency trumps intensity. Doing 1 minute of a habit is infinitely better than doing 0. If you are tired, scale down—read just 1 page of a book to protect your chain!");
      } else {
        setAiResponse("✨ AI Habit Coach: Your self-discipline has ascended! To lock in your new routines, implement 'Habit Stacking'—linking a new habit (e.g. journaling) directly after a fully established anchor routine (e.g. brushing your teeth). You've got this!");
      }
    }, 1200);
  };

  const pageTitle = (() => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard';
      case 'habits': return 'Core Habits';
      case 'tasks': return 'Discipline Tasks';
      case 'analytics': return 'Performance Insights';
      case 'achievements': return 'Achievements & Badges';
      default: return 'Habitor';
    }
  })();

  return (
    <View style={styles.container}>
      <View style={styles.topHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onOpenDrawer && (
            <Pressable
              onPress={onOpenDrawer}
              style={({ pressed }) => [
                {
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: colors.hover,
                  opacity: pressed ? 0.7 : 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              ]}
            >
              <VectorIcon name="menu" color={colors.accent} size={18} />
            </Pressable>
          )}
          {/* Dynamic Title */}
          <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>{pageTitle}</Text>
        </View>

        {/* Right Actions Grid */}
        <View style={styles.rightActionsRow}>
          {/* Ask AI capsule button */}
          <Pressable
            onPress={() => setShowAiModal(true)}
            style={({ pressed }) => [
              styles.askAiCapsule,
              {
                borderColor: colors.success,
                opacity: pressed ? 0.9 : 1,
              }
            ]}
          >
            <View style={[styles.aiDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.askAiText, { color: colors.success }]}>Ask AI</Text>
          </Pressable>

          {/* Auxiliary Message Icon */}
          <Pressable 
            onPress={() => setShowZenModal(true)}
            style={({ pressed }) => [styles.iconChip, { backgroundColor: colors.hover, opacity: pressed ? 0.8 : 1 }]}
          >
            <VectorIcon name="mind" color={colors.textSecondary} size={15} />
          </Pressable>

          {/* Auxiliary Bell Notification */}
          <Pressable 
            onPress={() => onTabChange?.('achievements')}
            style={({ pressed }) => [styles.iconChip, { backgroundColor: colors.hover, opacity: pressed ? 0.8 : 1 }]}
          >
            <VectorIcon name="award" color={colors.textSecondary} size={15} />
            <View style={[styles.redAlertDot, { backgroundColor: colors.danger }]} />
          </Pressable>

          {/* Divider */}
          <View style={[styles.vDivider, { backgroundColor: colors.divider }]} />

          {/* Profile Badge Elena C. */}
          <Pressable onPress={onEditProfileNameClick} style={styles.profileChip}>
            <View style={[styles.avatarVisualMini, { backgroundColor: colors.hover }]}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: colors.accent }}>
                {(profile?.name || 'Elena')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.profileChipName, { color: colors.textPrimary }]}>
              {profile?.name || 'Elena'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Ask AI glassmorphic popup modal */}
      <Modal
        visible={showAiModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.aiDot, { backgroundColor: colors.success, width: 8, height: 8 }]} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Habitor AI Coach</Text>
              </View>
              <Pressable onPress={() => setShowAiModal(false)}>
                <VectorIcon name="close" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Ask about habit stacking, building morning focus, or optimizing your streaks!
            </Text>

            {/* Predefined quick prompts */}
            <View style={styles.promptsRow}>
              <Pressable
                onPress={() => {
                  setAiQuestion('How to build consistent streaks?');
                  handleAskAi('How to build consistent streaks?');
                }}
                style={[styles.promptChip, { backgroundColor: colors.hover }]}
              >
                <Text style={[styles.promptChipText, { color: colors.textPrimary }]}>🔥 Build streaks</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAiQuestion('Why is drinking water in the morning good?');
                  handleAskAi('Why is drinking water in the morning good?');
                }}
                style={[styles.promptChip, { backgroundColor: colors.hover }]}
              >
                <Text style={[styles.promptChipText, { color: colors.textPrimary }]}>💧 Morning Hydration</Text>
              </Pressable>
            </View>

            {/* Custom search bar */}
            <View style={[styles.searchBarBox, { backgroundColor: colors.hover, borderColor: colors.cardBorder }]}>
              <TextInput
                value={aiQuestion}
                onChangeText={setAiQuestion}
                placeholder="Ask your habit question..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
              <Pressable
                onPress={() => handleAskAi(aiQuestion)}
                disabled={!aiQuestion.trim()}
                style={[styles.sendBtn, { backgroundColor: colors.accent }]}
              >
                <VectorIcon name="plus" color="#FFF" size={12} />
              </Pressable>
            </View>

            {/* AI response window */}
            {(aiLoading || aiResponse) && (
              <View style={[styles.responseBox, { backgroundColor: colors.hover }]}>
                {aiLoading ? (
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing your focus graphs...</Text>
                ) : (
                  <Text style={[styles.responseText, { color: colors.textPrimary }]}>{aiResponse}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Zen Space - Focus Breathing Modal */}
      <Modal
        visible={showZenModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseZen}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, maxWidth: 420 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.aiDot, { backgroundColor: colors.accent, width: 8, height: 8 }]} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Zen Space - Focus Breathing</Text>
              </View>
              <Pressable onPress={handleCloseZen} disabled={zenActive && !zenCompleted}>
                <VectorIcon name="close" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>

            {zenCompleted ? (
              <View style={{ alignItems: 'center', gap: 16, marginVertical: 20 }}>
                <Text style={{ fontSize: 50, textAlign: 'center' }}>🧘‍♂️✨</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.accent, textAlign: 'center' }}>Session Completed!</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                  Your mind has aligned. You have successfully completed 60 seconds of box breathing to calm focus.
                </Text>
                <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.success }}>
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>
                    🎉 Claimed +15 XP Focus Reward!
                  </Text>
                </View>
                <Pressable
                  onPress={handleCloseZen}
                  style={[styles.sendBtn, { backgroundColor: colors.accent, height: 44, width: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>Return to Habitor</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 20, marginVertical: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                  Box breathing calms the nervous system and boosts cognitive performance. Focus on the orb below.
                </Text>

                {/* Orb Container */}
                <View style={{ height: 160, justifyContent: 'center', alignItems: 'center', width: '100%', position: 'relative' }}>
                  {/* Outer Pulsing Aura */}
                  <View 
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: `${colors.accent}15`,
                      position: 'absolute',
                      transform: [{ scale: getOrbScale() + 0.2 }],
                    }}
                  />
                  {/* Main Breathing Orb */}
                  <View 
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: colors.accent,
                      justifyContent: 'center',
                      alignItems: 'center',
                      transform: [{ scale: getOrbScale() }],
                      boxShadow: `0 0 24px ${colors.accent}40`,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
                      {breathPhase}
                    </Text>
                  </View>
                </View>

                {/* Phase & Time Details */}
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>
                    {breathPhase === 'Inhale' && '吸 Inhale Deeply...'}
                    {breathPhase === 'Hold In' && '停 Hold the Focus...'}
                    {breathPhase === 'Exhale' && '呼 Exhale Slowly...'}
                    {breathPhase === 'Hold Out' && '停 Ready Cycle...'}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>
                    Time Remaining: {60 - zenTime}s | Phase Timer: {phaseSeconds}s / 4s
                  </Text>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 }}>
                  {zenActive ? (
                    <Pressable
                      onPress={() => setZenActive(false)}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '800' }}>Pause Trainer</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setZenActive(true)}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>
                        {zenTime > 0 ? 'Resume Session' : 'Start 60s Session'}
                      </Text>
                    </Pressable>
                  )}
                  {zenTime > 0 && (
                    <Pressable
                      onPress={handleResetZen}
                      style={{ paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
                    >
                      <VectorIcon name="close" color={colors.danger} size={14} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  askAiCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 7,
  },
  aiDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  askAiText: {
    fontSize: 13,
    fontWeight: '800',
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  redAlertDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  vDivider: {
    width: 1,
    height: 22,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  avatarVisualMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileChipName: {
    fontSize: 13,
    fontWeight: '800',
  },
  // Modal Ask AI Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 14,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  promptsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promptChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  promptChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseBox: {
    borderRadius: 14,
    padding: 14,
    minHeight: 60,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  responseText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});
