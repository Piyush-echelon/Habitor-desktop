import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Animated, Easing, ScrollView, TextInput, ImageBackground, Platform, Image } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { VectorIcon } from './VectorIcon';
import cloudsImage from '../assets/clouds.png';
import logoImg from '../assets/logo.png';
import { Habit, Task, UserProfile } from '../types';
import { SHUFFLED_QUOTES } from '../constants/quotes';

const FOCUS_PLAYLIST = [
  { id: 'track_1', title: 'Lofi Focus Beats', artist: 'Lofi Girl / ChilledCow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'track_2', title: 'Deep Focus Ambient', artist: 'Space Ambient Music', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'track_3', title: 'Rain & Thunder ASMR', artist: 'Nature Sounds Therapy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'track_4', title: 'Forest Stream Whispers', artist: 'Nature ASMR Stream', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'track_5', title: 'Pure Focus White Noise', artist: 'Sound Therapy White Noise', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'track_6', title: 'Cosy Fireplace ASMR', artist: 'Fireplace Atmosphere', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
];

interface SidebarProps {
  isDark: boolean;
  userLevel: number;
  sidebarWidth?: number;
  habits?: Habit[];
  tasks?: Task[];
  profile?: UserProfile;
  activeDateStr?: string;
  onUpdateBiometrics?: (dateStr: string, data: Partial<{
    sleepHours: number;
    sleepDeep: number;
    sleepQuality: number;
    heartRate: number;
    cortisol: number;
    pagesRead: number;
    distanceKm: number;
  }>) => void;
  onUpdateBookDetails?: (title: string, author: string) => void;
  syncStatus?: 'local' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: string;
  onEditProfileNameClick?: () => void;
  onNavigateToSync?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDark,
  userLevel,
  sidebarWidth = 300,
  habits = [],
  tasks = [],
  profile,
  activeDateStr = new Date().toISOString().split('T')[0],
  onUpdateBiometrics,
  onUpdateBookDetails,
  syncStatus = 'local',
  lastSyncedAt,
  onEditProfileNameClick,
  onNavigateToSync,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800;
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  // Collapse labels when sidebar is very narrow
  const isNarrow = sidebarWidth < 240;
  const isWide = sidebarWidth >= 360;

  // Music Player State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Music Playlist State
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    // Create stable background HTML5 audio element
    audioRef.current = new Audio(FOCUS_PLAYLIST[currentTrackIdx].url);
    audioRef.current.loop = true;

    // Direct event sync
    audioRef.current.onplay = () => setIsMusicPlaying(true);
    audioRef.current.onpause = () => setIsMusicPlaying(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync audio source when user clicks forward/back
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = FOCUS_PLAYLIST[currentTrackIdx].url;
      if (wasPlaying) {
        audioRef.current.play().catch((err) => console.log('Autoplay blocked:', err));
      }
    }
  }, [currentTrackIdx]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    try {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play().catch((err) => console.log('Playback error:', err));
        setIsMusicPlaying(true);
      }
    } catch (e) {
      console.error(e);
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIdx((prevIdx) => (prevIdx + 1) % FOCUS_PLAYLIST.length);
  };

  const prevTrack = () => {
    setCurrentTrackIdx((prevIdx) => (prevIdx - 1 + FOCUS_PLAYLIST.length) % FOCUS_PLAYLIST.length);
  };

  // Dynamic Reading Widget calculation linked to actual "Deep Reading" habit or any productivity habit
  const getReadingStats = () => {
    const dayBio = profile?.biometrics?.[activeDateStr] || {};
    if (dayBio.pagesRead !== undefined) {
      return dayBio.pagesRead;
    }
    const readingHabit = habits.find((h) => h.name.toLowerCase().includes('read'));
    let pagesRead = 120; // fallback base
    if (readingHabit) {
      const completionsCount = Object.values(readingHabit.history).filter((v) => v >= readingHabit.targetCount).length;
      pagesRead = 60 + completionsCount * 15;
    } else {
      const prodHabits = habits.filter((h) => h.category === 'productivity');
      let totalCompleted = 0;
      prodHabits.forEach((h) => {
        totalCompleted += Object.values(h.history).filter((v) => v >= h.targetCount).length;
      });
      pagesRead = 60 + totalCompleted * 10;
    }
    return Math.min(200, pagesRead);
  };

  // Dynamic Distance Workout Widget calculation linked to fitness habits
  const getDistanceStats = () => {
    const dayBio = profile?.biometrics?.[activeDateStr] || {};
    if (dayBio.distanceKm !== undefined) {
      return dayBio.distanceKm.toFixed(1);
    }
    const fitnessHabits = habits.filter((h) => h.category === 'fitness' || h.name.toLowerCase().includes('run') || h.name.toLowerCase().includes('walk') || h.name.toLowerCase().includes('workout'));
    let totalCompleted = 0;
    fitnessHabits.forEach((h) => {
      totalCompleted += Object.values(h.history).filter((v) => v >= h.targetCount).length;
    });
    const distance = 4.2 + totalCompleted * 3.5;
    return distance.toFixed(1);
  };



  // Quiet Time Countdown Timer
  const [baseTimerSeconds, setBaseTimerSeconds] = useState(600);
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editMinutes, setEditMinutes] = useState('10');
  const [isEditingReading, setIsEditingReading] = useState(false);
  const [editReadingVal, setEditReadingVal] = useState('120');
  const [editBookTitle, setEditBookTitle] = useState(profile?.bookTitle || 'THE ART');
  const [editBookAuthor, setEditBookAuthor] = useState(profile?.bookAuthor || 'OF HABIT');
  const [isEditingDistance, setIsEditingDistance] = useState(false);
  const [editDistanceVal, setEditDistanceVal] = useState('4.2');
  const timerInterval = useRef<any>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval.current!);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')} : 00`;
  };

  // Deterministic daily shuffle quote based on activeDateStr
  const getDailyQuote = () => {
    let hash = 0;
    const key = activeDateStr || new Date().toISOString().split('T')[0];
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % SHUFFLED_QUOTES.length;
    return SHUFFLED_QUOTES[idx];
  };

  // ─── Desktop Sidebar ─────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[styles.desktopSidebar, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.sidebarScroll, isNarrow && styles.sidebarScrollNarrow]}
        >
          {/* Greeting Header */}
          <View style={styles.brandContainer}>
            <Pressable onPress={onEditProfileNameClick} style={styles.greetingHeader}>
               {!isNarrow ? (
                 <>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                     <View style={{ width: 34, height: 34, borderRadius: 9, overflow: 'hidden', position: 'relative' }}>
                       <Image 
                         source={logoImg} 
                         style={{ 
                           position: 'absolute',
                           width: '108%', 
                           height: '108%', 
                           top: '-4%', 
                           left: '-4%',
                           borderRadius: 9 
                         }} 
                       />
                     </View>
                     <Text
                       style={[
                         styles.subGreetingText,
                         { color: colors.textPrimary, fontSize: isWide ? 26 : 22, fontWeight: '900', letterSpacing: -0.5 }
                       ]}
                     >
                       Habitor
                     </Text>
                   </View>
                   <Text style={[styles.hiText, { color: colors.textSecondary, marginTop: 6, fontSize: 13, fontWeight: '600' }]}>
                     Hi {profile?.name || 'Elena'} 👋
                   </Text>
                 </>
               ) : (
                 <View style={{ gap: 6, alignItems: 'center' }}>
                   <View style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                     <Image 
                       source={logoImg} 
                       style={{ 
                         position: 'absolute',
                         width: '108%', 
                         height: '108%', 
                         top: '-4%', 
                         left: '-4%',
                         borderRadius: 7 
                       }} 
                     />
                   </View>
                   <Text style={[styles.subGreetingText, { color: colors.textPrimary, fontSize: 11, fontWeight: '800', textAlign: 'center' }]}>
                     Habitor
                   </Text>
                 </View>
               )}
             </Pressable>

             {/* Cloud Sync Pill */}
             {!isNarrow && (
               <View style={styles.syncStatusContainer}>
                 <View style={[
                   styles.syncPill,
                   { 
                     backgroundColor: colors.hover,
                     borderColor: colors.cardBorder
                   }
                 ]}>
                   <View style={[
                     styles.syncStatusDot, 
                     { 
                       backgroundColor: syncStatus === 'synced' 
                         ? colors.success 
                         : syncStatus === 'syncing' 
                           ? colors.accent 
                           : syncStatus === 'error' 
                             ? colors.danger 
                             : colors.textMuted 
                     }
                   ]} />
                   <Text style={[styles.syncStatusText, { color: colors.textPrimary }]}>
                     {syncStatus === 'synced' 
                       ? `Cloud Backup Active` 
                       : syncStatus === 'syncing' 
                         ? 'Syncing to Cloud...' 
                         : syncStatus === 'error' 
                           ? 'Sync Failed' 
                           : 'Local Only (Offline)'}
                   </Text>
                 </View>
                 {lastSyncedAt && syncStatus === 'synced' && (
                   <Text style={[styles.lastSyncedLabel, { color: colors.textMuted }]}>
                     Synced: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </Text>
                 )}
               </View>
             )}
          </View>

          {/* Widget 1: Reading & Distance */}
          <View style={styles.gridWidgetRow}>
            {/* Reading Card */}
            <View style={[styles.widgetCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, flex: 1, padding: isNarrow ? 10 : 14 }]}>
              <View style={styles.readingHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={[styles.readingLabel, { color: colors.textPrimary, fontSize: isNarrow ? 11 : 13 }]}>Reading</Text>
                  {!isEditingReading && (
                    <Pressable
                      onPress={() => {
                        setEditReadingVal(getReadingStats().toString());
                        setEditBookTitle(profile?.bookTitle || 'THE ART');
                        setEditBookAuthor(profile?.bookAuthor || 'OF HABIT');
                        setIsEditingReading(true);
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 2 }]}
                    >
                      <VectorIcon name="routine" color={colors.textMuted} size={10} />
                    </Pressable>
                  )}
                </View>

                {isEditingReading ? (
                  <View style={{ gap: 2, marginVertical: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>PAGES READ</Text>
                    <TextInput
                      style={[styles.sidebarBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editReadingVal}
                      onChangeText={setEditReadingVal}
                      keyboardType="number-pad"
                      maxLength={3}
                      autoFocus={true}
                    />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>BOOK TITLE</Text>
                    <TextInput
                      style={[styles.sidebarBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editBookTitle}
                      onChangeText={setEditBookTitle}
                      placeholder="THE ART"
                      placeholderTextColor={colors.textMuted}
                      maxLength={30}
                    />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>AUTHOR / SUBTITLE</Text>
                    <TextInput
                      style={[styles.sidebarBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editBookAuthor}
                      onChangeText={setEditBookAuthor}
                      placeholder="OF HABIT"
                      placeholderTextColor={colors.textMuted}
                      maxLength={30}
                    />
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      <Pressable
                        onPress={() => {
                          const pages = parseInt(editReadingVal, 10) || 0;
                          onUpdateBiometrics?.(activeDateStr, { pagesRead: pages });
                          onUpdateBookDetails?.(editBookTitle, editBookAuthor);
                          setIsEditingReading(false);
                        }}
                        style={{ flex: 1, paddingVertical: 4, borderRadius: 5, backgroundColor: colors.accent, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>Save</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setIsEditingReading(false)}
                        style={{ flex: 1, paddingVertical: 4, borderRadius: 5, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center' }}
                      >
                        <Text style={{ color: colors.textPrimary, fontSize: 9, fontWeight: '800' }}>X</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={[styles.readingProgress, { color: colors.textSecondary, fontSize: isNarrow ? 14 : isWide ? 18 : 16 }]}>{getReadingStats()} / 200</Text>
                    <Text style={[styles.readingPages, { color: colors.textMuted }]}>pages</Text>
                  </View>
                )}
              </View>
              <View style={[styles.bookMockup, { backgroundColor: '#1A365D', height: isWide ? 80 : 65 }]}>
                <View style={styles.bookSpine} />
                <Text numberOfLines={1} style={styles.bookTitle}>{(profile?.bookTitle || 'THE ART').toUpperCase()}</Text>
                <Text numberOfLines={1} style={styles.bookAuthor}>{(profile?.bookAuthor || 'OF HABIT').toUpperCase()}</Text>
                <View style={styles.bookVisualRing} />
              </View>
            </View>

            {/* Distance Workout Card */}
            {!isNarrow && (
              <View style={[styles.widgetCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, flex: 1, padding: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.distanceDate, { color: colors.textMuted }]}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                  {!isEditingDistance && (
                    <Pressable
                      onPress={() => {
                        setEditDistanceVal(getDistanceStats().toString());
                        setIsEditingDistance(true);
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 2 }]}
                    >
                      <VectorIcon name="routine" color={colors.textMuted} size={10} />
                    </Pressable>
                  )}
                </View>

                {isEditingDistance ? (
                  <View style={{ gap: 4, marginVertical: 4 }}>
                    <TextInput
                      style={[styles.sidebarBioInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder }]}
                      value={editDistanceVal}
                      onChangeText={setEditDistanceVal}
                      keyboardType="numeric"
                      maxLength={5}
                      autoFocus={true}
                    />
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <Pressable
                        onPress={() => {
                          const km = parseFloat(editDistanceVal) || 0;
                          onUpdateBiometrics?.(activeDateStr, { distanceKm: km });
                          setIsEditingDistance(false);
                        }}
                        style={{ flex: 1, paddingVertical: 4, borderRadius: 5, backgroundColor: colors.accent, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>Save</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setIsEditingDistance(false)}
                        style={{ flex: 1, paddingVertical: 4, borderRadius: 5, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center' }}
                      >
                        <Text style={{ color: colors.textPrimary, fontSize: 9, fontWeight: '800' }}>X</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.distanceVal, { color: colors.textPrimary, fontSize: isWide ? 18 : 15 }]}>{getDistanceStats()} Km</Text>
                    <Text style={[styles.distanceLabel, { color: colors.textSecondary }]}>Distance</Text>
                  </View>
                )}

                {!isEditingDistance && (
                  <View style={styles.workoutPathBox}>
                    <Svg width="100%" height={isWide ? 50 : 40} viewBox="0 0 100 45">
                      <Path
                        d="M 10 30 Q 30 10 50 25 T 90 15"
                        fill="none"
                        stroke={colors.success}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <Circle cx="10" cy="30" r="3.5" fill={colors.success} />
                      <Circle cx="90" cy="15" r="3.5" fill={colors.accent} />
                    </Svg>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Widget 2: Music Player */}
          <View style={[styles.widgetCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, padding: isNarrow ? 12 : 16 }]}>
            <View style={styles.musicContainer}>
              
              <View style={styles.musicMeta}>
                <Text numberOfLines={1} style={[styles.musicTitle, { color: colors.textPrimary, fontSize: isNarrow ? 12 : isWide ? 15 : 13 }]}>
                  {FOCUS_PLAYLIST[currentTrackIdx].title}
                </Text>
                {!isNarrow && (
                  <Text numberOfLines={1} style={[styles.musicArtist, { color: colors.textSecondary }]}>
                    {FOCUS_PLAYLIST[currentTrackIdx].artist}
                  </Text>
                )}
                <View style={styles.mediaControls}>
                  <Pressable onPress={prevTrack} style={styles.mediaBtn}>
                    <VectorIcon name="minus" color={colors.textSecondary} size={isNarrow ? 12 : 15} />
                  </Pressable>
                  <Pressable
                    onPress={togglePlayPause}
                    style={[styles.mediaPlayBtn, { backgroundColor: colors.accent, width: isNarrow ? 26 : 30, height: isNarrow ? 26 : 30, borderRadius: isNarrow ? 13 : 15 }]}
                  >
                    <VectorIcon name={isMusicPlaying ? 'close' : 'plus'} color="#FFF" size={isNarrow ? 10 : 13} />
                  </Pressable>
                  <Pressable onPress={nextTrack} style={styles.mediaBtn}>
                    <VectorIcon name="plus" color={colors.textSecondary} size={isNarrow ? 12 : 15} />
                  </Pressable>
                </View>
              </View>

              <View style={[
                styles.vinylRecordOuter, 
                { 
                  width: isNarrow ? 44 : 60, 
                  height: isNarrow ? 44 : 60, 
                  borderRadius: isNarrow ? 22 : 30,
                },
                Platform.OS === 'web' && {
                  // @ts-ignore
                  animation: isMusicPlaying ? 'spin 6s linear infinite' : 'none'
                }
              ]}>
                <Svg width={isNarrow ? 44 : 60} height={isNarrow ? 44 : 60} viewBox="0 0 60 60">
                  <Circle cx="30" cy="30" r="28" fill="#1C1E22" />
                  <Circle cx="30" cy="30" r="23" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  <Circle cx="30" cy="30" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  <Circle cx="30" cy="30" r="13" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  <Circle cx="30" cy="30" r="9" fill={colors.accent} />
                  <Circle cx="30" cy="30" r="2" fill="#FFFFFF" />
                </Svg>
              </View>
            </View>
          </View>

          {/* Widget 3: Quiet Time Timer */}
          <ImageBackground
            source={cloudsImage}
            style={[styles.widgetCard, {
              backgroundColor: isDark ? '#2E3547' : colors.cardBg,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.cardBorder,
              padding: isNarrow ? 12 : 18,
              overflow: 'hidden',
            }]}
            imageStyle={{
              borderRadius: 18,
              opacity: isDark ? 0.35 : 0.85,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={[styles.timerTitle, { color: isDark ? 'rgba(255,255,255,0.75)' : colors.textPrimary, fontSize: isNarrow ? 10 : 12 }]}>
                Quiet Time
              </Text>
              {!isTimerRunning && !isEditingTimer && (
                <Pressable
                  onPress={() => {
                    setEditMinutes(Math.floor(timerSeconds / 60).toString());
                    setIsEditingTimer(true);
                  }}
                  style={({ pressed }) => [
                    { padding: 2, borderRadius: 4, opacity: pressed ? 0.6 : 1 }
                  ]}
                >
                  <VectorIcon name="routine" color={colors.textMuted} size={10} />
                </Pressable>
              )}
            </View>

            {isEditingTimer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 6 }}>
                <TextInput
                  style={[
                    styles.editMinutesInput,
                    {
                      color: isDark ? '#FFFFFF' : colors.textPrimary,
                      backgroundColor: colors.hover,
                      borderColor: colors.cardBorder,
                    }
                  ]}
                  value={editMinutes}
                  onChangeText={(val) => {
                    const sanitized = val.replace(/[^0-9]/g, '');
                    setEditMinutes(sanitized);
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  autoFocus={true}
                  onBlur={() => {
                    setIsEditingTimer(false);
                    const mins = parseInt(editMinutes, 10);
                    if (!isNaN(mins) && mins > 0) {
                      setBaseTimerSeconds(mins * 60);
                      setTimerSeconds(mins * 60);
                    } else {
                      setEditMinutes(Math.max(1, Math.floor(timerSeconds / 60)).toString());
                    }
                  }}
                  onSubmitEditing={() => {
                    setIsEditingTimer(false);
                    const mins = parseInt(editMinutes, 10);
                    if (!isNaN(mins) && mins > 0) {
                      setBaseTimerSeconds(mins * 60);
                      setTimerSeconds(mins * 60);
                    } else {
                      setEditMinutes(Math.max(1, Math.floor(timerSeconds / 60)).toString());
                    }
                  }}
                />
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }}>min</Text>
              </View>
            ) : (
              <Text style={[styles.timerClock, { color: isDark ? '#FFFFFF' : colors.textPrimary, fontSize: isNarrow ? 18 : isWide ? 28 : 23 }]}>
                {isNarrow ? `${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}` : formatTimer(timerSeconds)}
              </Text>
            )}

            <View style={styles.timerActionRow}>
              <Pressable
                onPress={() => { setIsTimerRunning(false); setTimerSeconds(baseTimerSeconds); }}
                style={[styles.timerBtn, { backgroundColor: 'rgba(128,128,128,0.15)' }]}
              >
                <Text style={[styles.timerBtnText, { color: isDark ? 'rgba(255,255,255,0.85)' : colors.textPrimary, fontSize: isNarrow ? 10 : 12 }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={isTimerRunning ? () => setIsTimerRunning(false) : () => setIsTimerRunning(true)}
                disabled={isEditingTimer}
                style={[styles.timerBtn, { backgroundColor: colors.accent, opacity: isEditingTimer ? 0.5 : 1 }]}
              >
                <Text style={[styles.timerBtnText, { color: '#FFF', fontSize: isNarrow ? 10 : 12 }]}>
                  {isTimerRunning ? 'Pause' : 'Start'}
                </Text>
              </Pressable>
            </View>
          </ImageBackground>

          {/* Widget 4: Quote & Avatar Row */}
          {!isNarrow && (
            <View style={styles.quoteRowGrid}>
              <View style={[styles.avatarWidgetBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, minHeight: isWide ? 90 : 74 }]}>
                <Svg width="100%" height="100%" viewBox="0 0 60 70">
                  <Circle cx="30" cy="35" r="22" fill="#FFEAA7" />
                  <Path d="M18 57 C 18 45, 42 45, 42 57 Z" fill="#E26D5C" />
                  <Circle cx="30" cy="30" r="10" fill="#2D3436" />
                </Svg>
              </View>
              <View style={[styles.quoteCardBox, { backgroundColor: isDark ? '#1E2535' : '#EDEDF2', borderWidth: 1, borderColor: colors.cardBorder, minHeight: isWide ? 90 : 74 }]}>
                <Text style={[styles.quoteFontText, { color: colors.textPrimary, fontSize: isWide ? 13 : 11 }]}>
                  {getDailyQuote()}
                </Text>
              </View>
            </View>
          )}



        </ScrollView>
      </View>
    );
  }

  // ─── Mobile Bottom Tab Bar ────────────────────────────────────────────────────
  return (
    <View style={[styles.mobileTabBar, { backgroundColor: colors.cardBg, borderTopColor: colors.cardBorder }]}>
      {[
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
        { id: 'analytics', label: 'Analytics', icon: 'analytics' as const },
        { id: 'achievements', label: 'Achievements', icon: 'achievements' as const },
      ].map((item) => {
        const isActive = false; // mobile tabs handled in App topBar
        return (
          <View key={item.id} style={styles.mobileNavItem}>
            <VectorIcon name={item.icon} color={isActive ? colors.accent : colors.textSecondary} size={22} />
            <Text style={[styles.mobileNavLabel, { color: isActive ? colors.accent : colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  desktopSidebar: {
    height: '100%',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  sidebarScroll: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },
  sidebarScrollNarrow: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    gap: 14,
  },
  brandContainer: {
    gap: 12,
  },
  greetingHeader: {
    gap: 2,
  },
  hiText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subGreetingText: {
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  modeDropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  modeDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  modeDropdownBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modeDropdownContent: {
    position: 'absolute',
    top: 40,
    left: 0,
    borderRadius: 10,
    borderWidth: 1,
    width: 140,
    padding: 4,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    elevation: 4,
    zIndex: 200,
  },
  dropdownOption: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dropdownOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Widget Cards
  widgetCard: {
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    elevation: 1,
  },
  gridWidgetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Reading widget
  readingHeader: {
    marginBottom: 10,
  },
  readingLabel: {
    fontWeight: '700',
  },
  readingProgress: {
    fontWeight: '900',
    marginTop: 2,
  },
  readingPages: {
    fontSize: 10,
    fontWeight: '700',
  },
  bookMockup: {
    borderRadius: 6,
    position: 'relative',
    padding: 9,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bookTitle: {
    color: '#FFEAA7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bookAuthor: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  bookVisualRing: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  // Distance widget
  distanceDate: {
    fontSize: 9,
    fontWeight: '700',
  },
  distanceVal: {
    fontWeight: '900',
  },
  distanceLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  workoutPathBox: {
    marginTop: 6,
  },
  // Music Player
  musicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  musicMeta: {
    flex: 1,
    gap: 2,
  },
  musicTitle: {
    fontWeight: '800',
  },
  musicArtist: {
    fontSize: 11,
    fontWeight: '600',
  },
  mediaControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  mediaBtn: {
    padding: 4,
  },
  mediaPlayBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylRecordOuter: {
    overflow: 'hidden',
  },
  sidebarBioInput: {
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 0,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  // Timer
  timerTitle: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timerClock: {
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  editMinutesInput: {
    width: 60,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    padding: 0,
  },
  timerActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timerBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtnText: {
    fontWeight: '700',
  },
  // Quote & Avatar
  quoteRowGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarWidgetBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quoteCardBox: {
    flex: 1.6,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
  },
  quoteFontText: {
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 16,
  },
  // Add widget button
  addNewWidgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
  },
  addNewWidgetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Mobile Tab Bar
  mobileTabBar: {
    height: 68,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    gap: 3,
  },
  mobileNavLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  syncStatusContainer: {
    gap: 4,
    alignSelf: 'flex-start',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  syncStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  lastSyncedLabel: {
    fontSize: 9,
    fontWeight: '700',
    paddingLeft: 6,
  },
  avatarVisualMini: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  signOutBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
});
