import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialWalkthroughProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onStepChange?: (step: number) => void;
}

interface StepConfig {
  peekingSide: 'left' | 'bottom-left' | 'right' | 'top-center' | 'bottom-center' | 'top-right';
  title: string;
  text: string;
}

const TUTORIAL_STEPS: StepConfig[] = [
  {
    peekingSide: 'left',
    title: 'Meet Byte! 🤖',
    text: 'Beep-boop! Hi there, I\'m Byte! I will guide you through your premium Habitor sanctuary. Let\'s take a quick 1-minute tour to set you up for success!',
  },
  {
    peekingSide: 'bottom-left',
    title: 'Aura Focus & Audio 🎵',
    text: 'Block outer distractions by playing high-fidelity ambient lofi beats directly inside the sidebar. You can also start custom focused countdown timers to lock in deep work blocks!',
  },
  {
    peekingSide: 'right',
    title: 'Daily Habits & Vitals 📊',
    text: 'Complete daily checklist logs to earn XP! Watch as your level increases, and observe how your biometric logs (sleep quality, heart rate, cortisol stress levels) adjust dynamically.',
  },
  {
    peekingSide: 'top-center',
    title: 'Discipline Tasks Checklist 📝',
    text: 'Toggle the Tasks tab to manage one-off chores, urgent deadlines, or work deliverables separated from your recurring daily habit log routines.',
  },
  {
    peekingSide: 'bottom-center',
    title: 'Active Consistency Map 🗺️',
    text: 'Analyze 364 days of active consistency on this beautiful vector calendar grid. Watch as these gradient mood gauges react to your consistency score in real-time!',
  },
  {
    peekingSide: 'top-right',
    title: 'Zen Mind & Medals 🎯',
    text: 'Finally, tap the 🎯 mind icon in the header to enter the Zen breathing space for a quick XP boost (+15 XP!), or the 🏅 medal icon to admire your unlocked badges. Let\'s build elite consistency!',
  },
];

export const TutorialWalkthrough: React.FC<TutorialWalkthroughProps> = ({
  visible,
  isDark,
  onClose,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = offscreen, 1 = onscreen
  const bubbleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      triggerTransition();
    }
  }, [visible, currentStep]);

  const triggerTransition = () => {
    // Reset positions
    slideAnim.setValue(0);
    bubbleFade.setValue(0);

    if (onStepChange) {
      onStepChange(currentStep);
    }

    // Spring slide in and fade dialogue bubble
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(bubbleFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  if (!visible) return null;

  const activeStep = TUTORIAL_STEPS[currentStep];

  const handleNext = async () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Completed tutorial!
      await finishTutorial();
    }
  };

  const handleSkip = async () => {
    await finishTutorial();
  };

  const finishTutorial = async () => {
    try {
      await AsyncStorage.setItem('@habitor_tutorial_completed', 'true');
    } catch (e) {
      console.error('Failed to save tutorial complete state:', e);
    }
    onClose();
    setCurrentStep(0);
  };

  // Get dynamic Droid styles based on peeking side
  const getDroidStyle = () => {
    const slideOffset = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [120, 0], // slide from offscreen to peek position
    });

    switch (activeStep.peekingSide) {
      case 'left':
        return {
          left: -35,
          top: '35%',
          transform: [{ translateX: Animated.multiply(slideOffset, -1) }],
        };
      case 'bottom-left':
        return {
          left: -20,
          bottom: 30,
          transform: [
            { translateX: Animated.multiply(slideOffset, -1) },
            { translateY: slideOffset },
          ],
        };
      case 'right':
        return {
          right: -35,
          top: '40%',
          transform: [{ translateX: slideOffset }],
        };
      case 'top-center':
        return {
          top: -20,
          left: '45%',
          transform: [{ translateY: Animated.multiply(slideOffset, -1) }],
        };
      case 'bottom-center':
        return {
          bottom: -20,
          left: '45%',
          transform: [{ translateY: slideOffset }],
        };
      case 'top-right':
        return {
          top: -15,
          right: 35,
          transform: [
            { translateX: slideOffset },
            { translateY: Animated.multiply(slideOffset, -1) },
          ],
        };
      default:
        return {};
    }
  };

  // Get dialogue bubble style based on peeking side
  const getBubbleStyle = () => {
    const opacityStyle = { opacity: bubbleFade };

    switch (activeStep.peekingSide) {
      case 'left':
        return [
          styles.bubbleLeft,
          opacityStyle,
          { left: 100, top: '28%' },
        ];
      case 'bottom-left':
        return [
          styles.bubbleLeft,
          opacityStyle,
          { left: 110, bottom: 95 },
        ];
      case 'right':
        return [
          styles.bubbleRight,
          opacityStyle,
          { right: 100, top: '33%' },
        ];
      case 'top-center':
        return [
          styles.bubbleCenter,
          opacityStyle,
          { top: 115, left: SCREEN_WIDTH / 2 - 190 },
        ];
      case 'bottom-center':
        return [
          styles.bubbleCenter,
          opacityStyle,
          { bottom: 105, left: SCREEN_WIDTH / 2 - 190 },
        ];
      case 'top-right':
        return [
          styles.bubbleRight,
          opacityStyle,
          { right: 70, top: 105 },
        ];
      default:
        return [styles.bubbleCenter, opacityStyle];
    }
  };

  // Render Byte's SVG character with neat animation details
  const renderByteDroid = () => {
    return (
      <View>
        <Svg width={110} height={110} viewBox="0 0 100 100">
          {/* Floating Outer Aura Effect */}
          <Circle cx="50" cy="50" r="46" fill="rgba(226, 109, 92, 0.06)" stroke="rgba(226, 109, 92, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
          <Circle cx="50" cy="50" r="38" fill="rgba(6, 182, 212, 0.05)" />

          {/* Droid Body Backing */}
          <Path d="M 30,58 Q 50,75 70,58" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />

          {/* Cute Little Flexible Robotic Neck */}
          <Rect x="44" y="52" width="12" height="10" rx="4" fill="#64748B" />

          {/* Byte's Metallic Head Structure */}
          <Rect x="22" y="18" width="56" height="42" rx="16" fill="#1E293B" stroke="#06B6D4" strokeWidth="3" />
          <Rect x="26" y="22" width="48" height="34" rx="12" fill="#0F172A" />

          {/* Cute Ears / Side Knobs */}
          <Rect x="16" y="28" width="6" height="14" rx="3" fill="#06B6D4" />
          <Rect x="78" y="28" width="6" height="14" rx="3" fill="#06B6D4" />

          {/* Glow Eye Shield / Neon Mask */}
          <Rect x="32" y="29" width="36" height="12" rx="6" fill="rgba(6, 182, 212, 0.15)" />

          {/* Pulsing Cyan Eyes */}
          <Circle cx="41" cy="35" r="4.5" fill="#06B6D4" />
          <Circle cx="59" cy="35" r="4.5" fill="#06B6D4" />
          
          {/* Eye Highlights */}
          <Circle cx="39.5" cy="33.5" r="1.5" fill="#FFFFFF" />
          <Circle cx="57.5" cy="33.5" r="1.5" fill="#FFFFFF" />

          {/* Byte's Tech Antenna */}
          <Path d="M 50,18 L 50,8" stroke="#06B6D4" strokeWidth="2.5" />
          <Circle cx="50" cy="6" r="4" fill="#E26D5C" />

          {/* Happy Mechanical Mouth Gauge */}
          <Path d="M 44,48 Q 50,54 56,48" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />

          {/* Glowing Indicators / Cheek Dots */}
          <Circle cx="32" cy="46" r="2" fill="rgba(226, 109, 92, 0.6)" />
          <Circle cx="68" cy="46" r="2" fill="rgba(226, 109, 92, 0.6)" />
        </Svg>
      </View>
    );
  };

  return (
    <View style={styles.tutorialContainer} pointerEvents="box-none">
      {/* Dimmed focused background overlay */}
      <View style={styles.backdrop} pointerEvents="auto" />

      {/* Absolutely Peeking Animated Droid */}
      <Animated.View style={[styles.droidBase, getDroidStyle()]}>
        {renderByteDroid()}
      </Animated.View>

      {/* Floating Dialogue Speech Bubble */}
      <Animated.View style={[styles.bubbleBase, getBubbleStyle(), { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.bubbleHeader}>
          <Text style={[styles.bubbleTitle, { color: colors.textPrimary }]}>{activeStep.title}</Text>
          <Text style={[styles.stepIndicator, { color: colors.textSecondary }]}>
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </Text>
        </View>

        <Text style={[styles.bubbleText, { color: colors.textSecondary }]}>
          {activeStep.text}
        </Text>

        <View style={styles.bubbleFooter}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipBtn,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>Skip Tour</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextBtn,
              { 
                backgroundColor: colors.accent,
                opacity: pressed ? 0.9 : 1 
              }
            ]}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Let\'s Build! 🚀' : 'Next Step →'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tutorialContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 15, 30, 0.42)', // translucent overlay
  },
  droidBase: {
    position: 'absolute',
    zIndex: 999999,
  },
  bubbleBase: {
    position: 'absolute',
    width: 380,
    maxWidth: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 12,
    zIndex: 999999,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
      }
    }),
  },
  bubbleLeft: {
    // specific left layouts
  },
  bubbleRight: {
    // specific right layouts
  },
  bubbleCenter: {
    // center overlays
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bubbleTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  stepIndicator: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  nextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 3px 10px rgba(226, 109, 92, 0.22)',
      }
    }),
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
