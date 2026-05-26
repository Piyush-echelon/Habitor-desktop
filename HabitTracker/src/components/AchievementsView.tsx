import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TextInput, Pressable, Modal, Platform } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { Achievement, UserProfile } from '../types';
import { VectorIcon } from './VectorIcon';

interface AchievementsViewProps {
  achievements: Achievement[];
  profile: UserProfile;
  isDark: boolean;
  onResetHabitor: () => void;
  onReplayTutorial?: () => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  profile,
  isDark,
  onResetHabitor,
  onReplayTutorial,
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const { width } = useWindowDimensions();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const numColumns = width >= 900 ? 2 : 1;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const getAchievementIcon = (emoji: string): any => {
    switch (emoji) {
      case '🎯': return 'target';
      case '🔥': return 'streak';
      case '⚡': return 'dashboard';
      case '🏆': return 'trophy';
      case '👑': return 'crown';
      case '🔮': return 'sparkles';
      default: return 'award';
    }
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Earn XP bonuses and unlock rare badges by building long streaks and consistency.
          </Text>
        </View>

        {/* Level Stats Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.badgeCountArea}>
            <VectorIcon name="crown" color={colors.accent} size={40} />
            <View>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Badge Collection</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>
                {unlockedCount} of {achievements.length} Unlocked
              </Text>
            </View>
          </View>
          <View style={styles.rankContainer}>
            <Text style={[styles.rankLabel, { color: colors.textSecondary }]}>CURRENT RANK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <VectorIcon 
                name={profile.level >= 10 ? 'sparkles' : profile.level >= 5 ? 'dashboard' : 'leaf'} 
                color={colors.gold} 
                size={14} 
              />
              <Text style={[styles.rankTitle, { color: colors.gold, marginTop: 0 }]}>
                {profile.level >= 10 ? 'Habit Mastermind' : profile.level >= 5 ? 'Routine Architect' : 'Dedicated Seeker'}
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Unlocked Milestones</Text>
        <View style={styles.gridContainer}>
          {achievements.map((ach) => {
            return (
              <View
                key={ach.id}
                style={[
                  styles.achievementCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: ach.unlocked ? colors.gold : colors.cardBorder,
                    opacity: ach.unlocked ? 1 : 0.6,
                    width: numColumns === 2 ? '48%' : '100%',
                  }
                ]}
              >
                <View style={styles.achRow}>
                  <View style={{ opacity: ach.unlocked ? 1 : 0.3, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                    {ach.unlocked ? (
                      <VectorIcon name={getAchievementIcon(ach.icon)} color={colors.gold} size={36} />
                    ) : (
                      <VectorIcon name="lock" color={colors.textMuted} size={36} />
                    )}
                  </View>
                  <View style={styles.achDetails}>
                    <Text style={[styles.achTitle, { color: colors.textPrimary, textDecorationLine: ach.unlocked ? 'none' : 'none' }]}>
                      {ach.title}
                    </Text>
                    <Text style={[styles.achDesc, { color: colors.textSecondary }]}>
                      {ach.description}
                    </Text>
                    <View style={styles.rewardRow}>
                      <View style={{ backgroundColor: colors.hover, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 }}>
                        <VectorIcon name="gem" color={ach.unlocked ? colors.gold : colors.textMuted} size={10} />
                        <Text style={{ color: ach.unlocked ? colors.gold : colors.textMuted, fontSize: 9, fontWeight: '800' }}>
                          +{ach.xpReward} XP
                        </Text>
                      </View>
                      <Text style={[styles.statusText, { color: ach.unlocked ? colors.success : colors.textMuted }]}>
                        {ach.unlocked ? 'COMPLETED' : 'LOCKED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Help & Walkthrough System Card */}
        <View style={[
          styles.dangerCard, 
          { 
            backgroundColor: isDark ? 'rgba(6, 182, 212, 0.05)' : 'rgba(6, 182, 212, 0.03)', 
            borderColor: 'rgba(6, 182, 212, 0.2)' 
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <VectorIcon name="sparkles" color="#06B6D4" size={20} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Help & Onboarding</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, lineHeight: 18 }}>
            Need a refresher on how the habit logger, Apple Vitals telemetry, Zen breathing space, or consistency grids work? Re-trigger our premium interactive guide with your companion Byte!
          </Text>
          <Pressable
            onPress={onReplayTutorial}
            style={({ pressed }) => [
              styles.resetBtn,
              { 
                backgroundColor: '#06B6D4', 
                opacity: pressed ? 0.9 : 1,
                ...Platform.select({
                  web: {
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                  }
                })
              }
            ]}
          >
            <Text style={styles.resetBtnText}>Replay Byte Walkthrough 🤖</Text>
          </Pressable>
        </View>

        {/* Reset Habitor Section */}
        <View style={[styles.dangerCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <VectorIcon name="close" color="#EF4444" size={20} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Danger Zone</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, lineHeight: 18 }}>
            Resetting Habitor will completely wipe all of your habits, daily history logs, biometrics history, active streaks, task lists, and achievements. This action is permanent and cannot be undone.
          </Text>
          <Pressable
            onPress={() => setShowConfirmModal(true)}
            style={({ pressed }) => [
              styles.resetBtn,
              { 
                backgroundColor: '#EF4444', 
                opacity: pressed ? 0.9 : 1,
                ...Platform.select({
                  web: {
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  }
                })
              }
            ]}
          >
            <Text style={styles.resetBtnText}>Reset Habitor</Text>
          </Pressable>
        </View>
      </View>

      {/* Warning Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <View style={[styles.dangerIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <VectorIcon name="close" color="#EF4444" size={28} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Are you absolutely sure?</Text>
            <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
              This will permanently delete every single habit, completed history log, biometric tracking, active to-do tasks, and badge achievements. You will NOT be able to recover this data afterwards!
            </Text>
            <View style={styles.confirmActionRow}>
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                style={({ pressed }) => [
                  styles.confirmCancelBtn,
                  { backgroundColor: colors.hover, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={[styles.confirmCancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowConfirmModal(false);
                  onResetHabitor();
                }}
                style={({ pressed }) => [
                  styles.confirmDeleteBtn,
                  { backgroundColor: '#EF4444', opacity: pressed ? 0.9 : 1 }
                ]}
              >
                <Text style={styles.confirmDeleteBtnText}>Yes, Reset Everything</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
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
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeCountArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  badgeSummaryEmoji: {
    fontSize: 40,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  rankContainer: {
    alignItems: 'flex-end',
    minWidth: 150,
  },
  rankLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  rankTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  // Profile Identity card
  identityCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarVisualLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  identityTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  identitySub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(226, 109, 92, 0.25)',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: -4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    minHeight: 110,
    justifyContent: 'center',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  achRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  achIcon: {
    fontSize: 36,
  },
  achDetails: {
    flex: 1,
    gap: 4,
  },
  achTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  achDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  rewardTag: {
    fontSize: 9,
    fontWeight: '800',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Danger Zone Reset Styles
  dangerCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginTop: 10,
    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.05)',
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
  },
  resetBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Warning Confirmation Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      }
    }),
  },
  confirmModalCard: {
    width: '90%',
    maxWidth: 400,
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
  },
  dangerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  confirmActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  confirmDeleteBtn: {
    flex: 1.3,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
  },
  confirmDeleteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
