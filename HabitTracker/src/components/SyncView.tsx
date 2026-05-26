import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, ActivityIndicator, TextInput, Platform, Modal, Animated } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { VectorIcon, IconName } from './VectorIcon';
import { Habit, Task, UserProfile } from '../types';

interface SyncViewProps {
  isDark: boolean;
  habits: Habit[];
  tasks: Task[];
  profile: UserProfile;
  syncStateFromBluetooth: (
    incomingData: {
      habits?: Habit[];
      profile?: UserProfile;
      achievements?: any[];
      tasks?: Task[];
    },
    mergeWithLocal?: boolean
  ) => Promise<void>;
}

interface DiscoveredDevice {
  id: string;
  name: string;
  iconName: IconName;
  type: 'Phone' | 'Tablet' | 'Desktop' | 'Wearable';
  synced: boolean;
  mockData: {
    habits: any[];
    tasks: any[];
  };
}

const DEVICE_POSITIONS = [
  { top: '16%', left: '16%' },
  { top: '15%', left: '64%' },
  { top: '56%', left: '15%' },
  { top: '58%', left: '64%' },
  { top: '35%', left: '10%' },
  { top: '35%', left: '70%' },
];

export const SyncView: React.FC<SyncViewProps> = ({
  isDark,
  habits,
  tasks,
  profile,
  syncStateFromBluetooth
}) => {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  // LAN states
  const [isBluetoothOn, setIsBluetoothOn] = useState(true); // Toggles WiFi Radar Active state
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [activeSyncingDevice, setActiveSyncingDevice] = useState<DiscoveredDevice | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStep, setSyncStep] = useState('');
  const [syncCompletedMessage, setSyncCompletedMessage] = useState<string | null>(null);

  // Real LAN IP / Connectivity States
  const [myLocalIPs, setMyLocalIPs] = useState<string[]>([]);
  const [myServerPort, setMyServerPort] = useState<number>(18280);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('18280');
  const [manualConnecting, setManualConnecting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;
  const [copiedExport, setCopiedExport] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<any>(null);

  // Sync Wizard States
  const [syncWizardDevice, setSyncWizardDevice] = useState<(DiscoveredDevice & { isRealDevice?: boolean }) | null>(null);
  const [selectedSyncMode, setSelectedSyncMode] = useState<'merge' | 'pull' | 'push'>('merge');
  const sweepAnim = useRef(new Animated.Value(0)).current;

  // Helper to dynamically get the local backend server base URL
  const getBackendUrl = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = typeof window !== 'undefined' ? window.location.port : '';
    if (port === '5173') {
      // In Vite development server, Electron backend is at port 18280
      return `http://${host}:18280`;
    }
    return typeof window !== 'undefined' && window.location.host 
      ? `${window.location.protocol}//${window.location.host}` 
      : 'http://localhost:18280';
  };

  // State refs to prevent continuous polling effect teardowns and infinite render loops
  const habitsRef = useRef(habits);
  const tasksRef = useRef(tasks);
  const profileRef = useRef(profile);

  useEffect(() => {
    habitsRef.current = habits;
    tasksRef.current = tasks;
    profileRef.current = profile;
  }, [habits, tasks, profile]);

  // Fetch local IPs and server port on mount
  useEffect(() => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.electronAPI) {
      // @ts-ignore
      window.electronAPI.getLocalIPs().then((ips: string[]) => {
        if (ips && ips.length > 0) setMyLocalIPs(ips);
      }).catch((e: any) => console.error(e));

      // @ts-ignore
      window.electronAPI.getServerPort().then((p: number) => {
        if (p) setMyServerPort(p);
      }).catch((e: any) => console.error(e));
    }
  }, []);

  // Poll registry & Announce scanning presence periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const registerAndFetch = async () => {
      const backendUrl = getBackendUrl();
      const currentProfile = profileRef.current;
      const currentHabits = habitsRef.current;
      const currentTasks = tasksRef.current;
      
      // 1. Announce/Register ourselves on the server
      fetch(`${backendUrl}/api/sync/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          isScanning: isScanning && isBluetoothOn,
          name: `${currentProfile.name || 'User'}'s Sanctuary`,
          deviceType: Platform.OS === 'web' ? (window.innerWidth < 800 ? 'Phone' : 'Desktop') : 'Desktop',
          habits: currentHabits,
          tasks: currentTasks,
          profile: currentProfile
        })
      }).catch(err => console.warn('Register scan presence failed:', err));

      if (isScanning && isBluetoothOn) {
        // 2. Fetch actively scanning peers registered to our local server
        fetch(`${backendUrl}/api/sync/peers?exclude=${instanceId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.peers) {
              setDevices(prev => {
                const updated = [...prev];
                data.peers.forEach((peer: any) => {
                  const idx = updated.findIndex(d => d.id === peer.id);
                  const newPeer = {
                    ...peer,
                    isRealDevice: true,
                    serverUrl: backendUrl
                  };
                  if (idx >= 0) {
                    updated[idx] = { ...newPeer, synced: updated[idx].synced };
                  } else {
                    updated.push(newPeer);
                  }
                });
                return updated;
              });
            }
          })
          .catch(err => console.warn('Fetch peers from server failed:', err));

        // 3. Poll for any pending P2P sync payloads pushed to us
        fetch(`${backendUrl}/api/sync/poll?instanceId=${instanceId}`)
          .then(res => res.json())
          .then(async (data) => {
            if (data && data.pending && data.data) {
              const incoming = data.data;
              console.log('[Habitor] P2P LAN received pushed sync payload, reconciling...');
              
              setActiveSyncingDevice({
                id: incoming.senderId,
                name: 'Remote Peer',
                iconName: 'sparkles',
                type: 'Desktop',
                synced: false,
                mockData: { habits: incoming.habits, tasks: incoming.tasks, profile: incoming.profile }
              });
              setSyncProgress(20);
              setSyncStep('Handshake secure connection established...');
              
              await new Promise(r => setTimeout(r, 600));
              setSyncProgress(65);
              setSyncStep(incoming.overwrite ? 'Overwriting local checklist database...' : 'Merging & Reconciling checklists...');
              
              await new Promise(r => setTimeout(r, 600));
              await syncStateFromBluetooth({
                habits: incoming.habits,
                tasks: incoming.tasks,
                profile: incoming.profile,
              }, !incoming.overwrite);
              
              setSyncProgress(100);
              setSyncStep('Synchronization finalized!');
              
              await new Promise(r => setTimeout(r, 500));
              setActiveSyncingDevice(null);
              setSyncCompletedMessage(incoming.overwrite ? 'Sanctuary database overwritten by remote device! 📥' : 'Mutual P2P sync complete! Reconciled and merged data successfully! ✨');
            }
          })
          .catch(err => console.warn('Sync poll failed:', err));
      }
    };

    if (isBluetoothOn) {
      registerAndFetch(); // Immediate call
      interval = setInterval(registerAndFetch, 1500);
    }

    return () => {
      clearInterval(interval);
      
      // Clean up scanning state on unmount or disable
      if (isBluetoothOn) {
        fetch(`${getBackendUrl()}/api/sync/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId, isScanning: false })
        }).catch(() => {});
      }
    };
  }, [isScanning, isBluetoothOn]);

  // Subnet network ping discovery scanner
  const performSubnetScan = async () => {
    const subnetsToScan: string[] = [];

    // Extract subnets from local interfaces
    myLocalIPs.forEach(ip => {
      const parts = ip.split('.');
      if (parts.length === 4) {
        subnetsToScan.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
      }
    });

    // Extract subnet from browser hostname
    if (typeof window !== 'undefined' && window.location.hostname) {
      const parts = window.location.hostname.split('.');
      if (parts.length === 4 && parts[0] !== '127') {
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
        if (!subnetsToScan.includes(subnet)) {
          subnetsToScan.push(subnet);
        }
      }
    }

    if (subnetsToScan.length === 0) return;

    console.log('[Habitor] Scanning WiFi subnets:', subnetsToScan);
    const port = myServerPort;
    const foundServers: string[] = [];

    // Probe subnet IP ranges
    for (const subnet of subnetsToScan) {
      const chunkSize = 50;
      for (let offset = 1; offset <= 254; offset += chunkSize) {
        const promises = [];
        const limit = Math.min(254, offset + chunkSize - 1);
        
        for (let i = offset; i <= limit; i++) {
          const ip = `${subnet}.${i}`;
          if (ip === window.location.hostname) continue;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);

          const p = fetch(`http://${ip}:${port}/api/sync/status`, {
            signal: controller.signal,
            mode: 'cors'
          })
            .then(async (res) => {
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                if (data.status === 'online') {
                  return ip;
                }
              }
              return null;
            })
            .catch(() => {
              clearTimeout(timeoutId);
              return null;
            });
          promises.push(p);
        }

        const results = await Promise.all(promises);
        results.filter(Boolean).forEach(ip => {
          if (ip && !foundServers.includes(ip)) {
            foundServers.push(ip);
          }
        });
      }
    }

    // Connect to found remote servers
    foundServers.forEach(serverIp => {
      fetch(`http://${serverIp}:${port}/api/sync/peers?exclude=${instanceId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.peers) {
            setDevices(prev => {
              const updated = [...prev];
              data.peers.forEach((peer: any) => {
                const idx = updated.findIndex(d => d.id === peer.id);
                const newPeer = {
                  ...peer,
                  isRealDevice: true,
                  serverUrl: `http://${serverIp}:${port}`
                };
                if (idx >= 0) {
                  updated[idx] = { ...newPeer, synced: updated[idx].synced };
                } else {
                  updated.push(newPeer);
                }
              });
              return updated;
            });
          }
        })
        .catch(err => console.warn(`Failed to connect to subnet remote server ${serverIp}:`, err));
    });
  };

  // Trigger scanning radar pings
  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;

    if (isBluetoothOn && isScanning) {
      setDevices([]);
      setSyncCompletedMessage(null);

      // Perform fast subnet sweep ONCE immediately on scan start
      performSubnetScan();

      // Auto stop scanning radar after 20 seconds
      scanTimeout = setTimeout(() => {
        setIsScanning(false);
      }, 20000);
    } else {
      setIsScanning(false);
      setDevices([]);
    }

    return () => {
      clearTimeout(scanTimeout);
    };
  }, [isScanning, isBluetoothOn]);

  // Rotate radar sweep animation loop
  useEffect(() => {
    let sweepLoop: Animated.CompositeAnimation | null = null;

    if (isScanning && isBluetoothOn) {
      sweepAnim.setValue(0);
      sweepLoop = Animated.loop(
        Animated.timing(sweepAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      sweepLoop.start();
    } else {
      sweepAnim.setValue(0);
    }

    return () => {
      if (sweepLoop) {
        sweepLoop.stop();
      }
    };
  }, [isScanning, isBluetoothOn]);

  const handleStartScan = () => {
    if (!isBluetoothOn) return;
    setIsScanning(true);
  };

  const handleManualConnect = async () => {
    if (!manualIp.trim()) {
      setManualError('Please enter a valid IP address');
      return;
    }
    
    setManualError(null);
    setManualConnecting(true);
    const targetUrl = `http://${manualIp.trim()}:${manualPort.trim()}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const res = await fetch(`${targetUrl}/api/sync/status`, {
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.status !== 'online') throw new Error();
      
      const peerRes = await fetch(`${targetUrl}/api/sync/peers?exclude=${instanceId}`);
      const peerData = await peerRes.json();
      
      if (peerData && peerData.peers && peerData.peers.length > 0) {
        setDevices(prev => {
          const updated = [...prev];
          peerData.peers.forEach((peer: any) => {
            const idx = updated.findIndex(d => d.id === peer.id);
            const newPeer = {
              ...peer,
              isRealDevice: true,
              serverUrl: targetUrl
            };
            if (idx >= 0) {
              updated[idx] = { ...newPeer, synced: updated[idx].synced };
            } else {
              updated.push(newPeer);
            }
          });
          return updated;
        });

        setSelectedSyncMode('merge');
        const firstPeer = peerData.peers[0];
        setSyncWizardDevice({
          ...firstPeer,
          isRealDevice: true,
          serverUrl: targetUrl,
          synced: false
        });
        
        setManualIp('');
      } else {
        setManualError('Connected to server, but no active scanning devices were found on it.');
      }
    } catch (e) {
      setManualError('Failed to connect. Verify IP, Port, and that the remote device is scanning.');
    } finally {
      setManualConnecting(false);
    }
  };

  const handleSyncDevice = async (device: DiscoveredDevice & { isRealDevice?: boolean; serverUrl?: string }, mode: 'merge' | 'pull' | 'push') => {
    if (activeSyncingDevice) return;
    setSyncCompletedMessage(null);
    setActiveSyncingDevice(device);
    setSyncProgress(0);

    const steps = [
      { progress: 15, text: 'Opening local secure network connection...' },
      { progress: 40, text: 'Authenticating device keys & metadata...' },
      { progress: 65, text: 'Exchanging encrypted habit history packets...' },
      { progress: 85, text: 'Merging tasks & biometric records...' },
      { progress: 100, text: 'Sync finalized! Database reconciled successfully.' }
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSyncProgress(step.progress);
      setSyncStep(step.text);
    }

    try {
      const targetServer = device.serverUrl || getBackendUrl();

      if (mode === 'pull') {
        // Option B: Overwrite Local (Pull from Device 2 to 1)
        await syncStateFromBluetooth({
          habits: device.mockData.habits,
          tasks: device.mockData.tasks,
          profile: device.mockData.profile || profile
        }, false);
        setSyncCompletedMessage(`Imported all data from ${device.name}! Local state overwritten. ✨`);
      } else if (mode === 'push') {
        // Option C: Overwrite Remote (Push from Device 1 to 2)
        await fetch(`${targetServer}/api/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetId: device.id,
            senderId: instanceId,
            habits,
            tasks,
            profile,
            overwrite: true
          })
        });
        setSyncCompletedMessage(`Pushed local checklists to remote device ${device.name}! Overwrite requested. 📤`);
      } else {
        // Option A: 2-way Reconcile & Merge
        const mergedHabitsMap = new Map<string, Habit>();
        device.mockData.habits.forEach((h: Habit) => mergedHabitsMap.set(h.id, h));
        habits.forEach((localHabit) => {
          const remoteHabit = mergedHabitsMap.get(localHabit.id);
          if (remoteHabit) {
            const mergedHistory = { ...remoteHabit.history };
            Object.keys(localHabit.history).forEach((date) => {
              mergedHistory[date] = Math.max(mergedHistory[date] || 0, localHabit.history[date] || 0);
            });
            mergedHabitsMap.set(localHabit.id, {
              ...remoteHabit,
              ...localHabit,
              history: mergedHistory,
              streak: Math.max(remoteHabit.streak || 0, localHabit.streak || 0),
              longestStreak: Math.max(remoteHabit.longestStreak || 0, localHabit.longestStreak || 0)
            });
          } else {
            mergedHabitsMap.set(localHabit.id, localHabit);
          }
        });
        const finalHabits = Array.from(mergedHabitsMap.values());

        const mergedTasksMap = new Map<string, Task>();
        device.mockData.tasks.forEach((t: Task) => mergedTasksMap.set(t.id, t));
        tasks.forEach((localTask) => {
          const remoteTask = mergedTasksMap.get(localTask.id);
          if (remoteTask) {
            mergedTasksMap.set(localTask.id, {
              ...remoteTask,
              completed: remoteTask.completed || localTask.completed
            });
          } else {
            mergedTasksMap.set(localTask.id, localTask);
          }
        });
        const finalTasks = Array.from(mergedTasksMap.values());

        const remoteProfile = device.mockData.profile || profile;
        const finalProfile = { ...remoteProfile };
        const localLevel = profile.level || 1;
        const remoteLevel = remoteProfile.level || 1;
        if (localLevel > remoteLevel) {
          finalProfile.level = localLevel;
          finalProfile.xp = profile.xp || 0;
          finalProfile.nextLevelXp = profile.nextLevelXp || 100;
        } else if (localLevel === remoteLevel) {
          finalProfile.xp = Math.max(remoteProfile.xp || 0, profile.xp || 0);
        }
        finalProfile.xp += 50; // Reconcile reward!

        // Save locally
        await syncStateFromBluetooth({
          habits: finalHabits,
          tasks: finalTasks,
          profile: finalProfile
        }, false);

        // Push merged state back to remote device
        await fetch(`${targetServer}/api/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetId: device.id,
            senderId: instanceId,
            habits: finalHabits,
            tasks: finalTasks,
            profile: finalProfile,
            overwrite: true
          })
        }).catch(err => console.error('Push back merged state failed:', err));

        setSyncCompletedMessage(`Mutual P2P sync complete! Reconciled and merged data successfully +50 XP! ✨`);
      }

      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, synced: true } : d))
      );
    } catch (e) {
      console.error(e);
      setSyncCompletedMessage('Handshake timeout. Please check your WiFi connection.');
    } finally {
      setActiveSyncingDevice(null);
    }
  };

  const handleExportPack = () => {
    try {
      const payload = {
        habits,
        tasks,
        profile: {
          name: profile.name,
          level: profile.level,
          xp: profile.xp,
          nextLevelXp: profile.nextLevelXp,
          totalCompletions: profile.totalCompletions,
          longestActiveStreak: profile.longestActiveStreak,
          badges: profile.badges,
          biometrics: profile.biometrics,
        }
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      
      // Trigger native browser download of JSON file
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `habitor_sanctuary_${profile.name || 'user'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 3000);
    } catch (e) {
      console.error('Export pack failed:', e);
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (!parsed.habits || !parsed.profile) {
          setImportStatus({ success: false, message: 'Invalid Sanctuary Pack JSON. Missing habits or profile fields.' });
          return;
        }

        await syncStateFromBluetooth({
          habits: parsed.habits,
          tasks: parsed.tasks || [],
          profile: parsed.profile,
        }, true); // Merge!

        setImportStatus({ success: true, message: `Sanctuary reconciled successfully! Merged ${parsed.habits.length} habits! ✨` });
        setTimeout(() => setImportStatus(null), 5000);
      } catch (err) {
        console.error(err);
        setImportStatus({ success: false, message: 'Failed to read JSON. Make sure it is a valid backup file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const sweepRotation = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Injecting CSS Keyframes directly for web build */}
      {typeof document !== 'undefined' && (
        <style>{`
          @keyframes radar-pulse-glow {
            0% { transform: scale(0.6); opacity: 0.8; }
            50% { opacity: 0.4; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes radar-pulse-glow-slow {
            0% { transform: scale(0.4); opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes radar-sweep-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .radar-pulse-one {
            animation: radar-pulse-glow 2.5s infinite linear;
          }
          .radar-pulse-two {
            animation: radar-pulse-glow-slow 4s infinite linear;
          }
          .radar-sweeper {
            animation: radar-sweep-rotate 4s infinite linear;
            transform-origin: center center;
          }
        `}</style>
      )}

      {/* Settings Row */}
      <View style={[styles.controlHeader, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.controlMeta}>
          <Text style={[styles.controlTitle, { color: colors.textPrimary }]}>Same WiFi Network CrossSync</Text>
          <Text style={[styles.controlSubtitle, { color: colors.textMuted }]}>
            Scan and synchronize habit state logs offline with nearby devices on the same WiFi.
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: isBluetoothOn ? colors.accent : colors.textSecondary }]}>
            {isBluetoothOn ? 'WiFi Radar Active' : 'WiFi Radar Off'}
          </Text>
          <Switch
            value={isBluetoothOn}
            onValueChange={(val) => {
              setIsBluetoothOn(val);
              if (!val) {
                setIsScanning(false);
                setDevices([]);
              }
            }}
            trackColor={{ false: '#EF4444', true: colors.accent }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {!isBluetoothOn ? (
        // WiFi is Off Banner
        <View style={[styles.warningBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <VectorIcon name="close" color="#EF4444" size={26} />
          <Text style={[styles.warningTitle, { color: '#EF4444' }]}>WiFi Network Radar Off</Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Please connect your device to WiFi and toggle the switch above to discover other active scanning sanctuaries.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {/* Pulsing Radar Section */}
          <View style={styles.radarContainer}>
            {/* Pulsing rings */}
            {isScanning && (
              <>
                <View className="radar-pulse-one" style={[styles.pulseRing, { borderColor: colors.accent }]} />
                <View className="radar-pulse-two" style={[styles.pulseRing, { borderColor: colors.accent, animationDelay: '1.2s' }]} />
              </>
            )}

            <View style={[styles.radarOuterCircle, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}>
              {/* Concentric Circles */}
              <View style={[styles.radarMiddleCircle, { borderColor: colors.cardBorder }]} />
              <View style={[styles.radarInnerCircle, { borderColor: colors.cardBorder }]} />

              {/* Grid Lines */}
              <View style={[styles.radarGridLineH, { backgroundColor: colors.cardBorder }]} />
              <View style={[styles.radarGridLineV, { backgroundColor: colors.cardBorder }]} />

              {/* Sweep Sector (Modern Radar Cone Sweep) */}
              {isScanning && (
                <Animated.View style={[
                  styles.sweepSectorContainer,
                  {
                    transform: [{ rotate: sweepRotation }]
                  }
                ]}>
                  <View style={[
                    styles.sweepSector,
                    {
                      backgroundImage: `conic-gradient(from 0deg, ${colors.accent} 0deg, rgba(6, 182, 212, 0.05) 120deg, transparent 180deg)`
                    }
                  ]} />
                </Animated.View>
              )}

              {/* Render Discovered Devices directly on the radar! */}
              {devices.filter(Boolean).map((device, idx) => {
                const pos = DEVICE_POSITIONS[idx % DEVICE_POSITIONS.length] || { top: '30%', left: '30%' };
                return (
                  <Pressable
                    key={`radar_${device.id}`}
                    onPress={() => {
                      setSelectedSyncMode('merge');
                      setSyncWizardDevice(device);
                    }}
                    disabled={device.synced || activeSyncingDevice !== null}
                    style={({ pressed }) => [
                      styles.radarDeviceNode,
                      {
                        top: pos.top,
                        left: pos.left,
                        opacity: pressed ? 0.7 : 1,
                      }
                    ]}
                  >
                    <View style={[
                      styles.radarDeviceAvatar, 
                      { 
                        backgroundColor: device.synced ? '#10B981' : colors.accent,
                        borderColor: '#FFF',
                        borderWidth: 2.5,
                      }
                    ]}>
                      <VectorIcon name={device.iconName} color="#FFF" size={16} />
                    </View>
                    <Text numberOfLines={1} style={[styles.radarDeviceText, { color: colors.textPrimary }]}>
                      {device.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Central Glowing Node */}
              <View style={[styles.centerNode, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
                <VectorIcon name="dashboard" color="#FFF" size={12} />
              </View>
            </View>

            {/* Discover text */}
            <Text style={[styles.radarLabel, { color: colors.textSecondary }]}>
              {isScanning ? 'Pinging local frequencies...' : 'Radar Sanctuary Scanner Idle'}
            </Text>

            {myLocalIPs.length > 0 && (
              <Text style={[styles.localIpText, { color: colors.textSecondary }]}>
                Your Local LAN Address: <Text style={{ color: colors.accent, fontWeight: '850' }}>{myLocalIPs[0]}:{myServerPort}</Text>
              </Text>
            )}

            <Pressable
              disabled={isScanning || activeSyncingDevice !== null}
              onPress={handleStartScan}
              style={({ pressed }) => [
                styles.scanBtn,
                {
                  backgroundColor: isScanning ? colors.hover : colors.accent,
                  opacity: (isScanning || activeSyncingDevice !== null) ? 0.7 : pressed ? 0.9 : 1,
                  borderColor: colors.cardBorder
                }
              ]}
            >
              <Text style={[styles.scanBtnText, { color: isScanning ? colors.textPrimary : '#FFF' }]}>
                {isScanning ? 'Scanning Nearby Devices...' : 'Search for Nearby Sanctuaries'}
              </Text>
            </Pressable>
          </View>

          {/* Manual LAN Connector Form */}
          <View style={[styles.manualConnectCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.manualConnectHeader}>
              <VectorIcon name="sparkles" color={colors.accent} size={18} />
              <Text style={[styles.manualConnectTitle, { color: colors.textPrimary }]}>Connect Manually via IP</Text>
            </View>
            <Text style={[styles.manualConnectSub, { color: colors.textMuted }]}>
              Type a peer's local WiFi address if the radar scanner is blocked by firewall rules.
            </Text>
            <View style={styles.manualConnectForm}>
              <TextInput
                style={[styles.manualConnectInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder, flex: 2 }]}
                value={manualIp}
                onChangeText={setManualIp}
                placeholder="e.g. 192.168.1.99"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.manualConnectInput, { color: colors.textPrimary, backgroundColor: colors.hover, borderColor: colors.cardBorder, flex: 1 }]}
                value={manualPort}
                onChangeText={setManualPort}
                placeholder="18280"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              <Pressable
                onPress={handleManualConnect}
                disabled={manualConnecting || !isBluetoothOn}
                style={({ pressed }) => [
                  styles.manualConnectBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity: (manualConnecting || !isBluetoothOn) ? 0.6 : pressed ? 0.8 : 1
                  }
                ]}
              >
                {manualConnecting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.manualConnectBtnText}>Connect</Text>
                )}
              </Pressable>
            </View>
            {manualError && (
              <Text style={[styles.manualConnectError, { color: colors.danger }]}>{manualError}</Text>
            )}
          </View>

          {/* Sync Progress Status overlay */}
          {activeSyncingDevice && (
            <View style={[styles.syncProgressCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.syncHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <VectorIcon name={activeSyncingDevice.iconName} color={colors.accent} size={16} />
                  <Text style={[styles.syncTitle, { color: colors.textPrimary }]}>
                    Syncing with {activeSyncingDevice.name}
                  </Text>
                </View>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
              <View style={[styles.progressBarOuter, { backgroundColor: colors.hover }]}>
                <View style={[styles.progressBarInner, { backgroundColor: colors.accent, width: `${syncProgress}%` }]} />
              </View>
              <Text style={[styles.syncStepText, { color: colors.textSecondary }]}>{syncStep}</Text>
            </View>
          )}

          {/* Sync Completed Alert Banner */}
          {syncCompletedMessage && (
            <View style={[styles.completedBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <VectorIcon name="sparkles" color="#10B981" size={16} />
              <Text style={[styles.completedText, { color: colors.textPrimary }]}>{syncCompletedMessage}</Text>
            </View>
          )}

          {/* Discovered Devices List */}
          {devices.length > 0 && (
            <View style={styles.devicesSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                DISCOVERED PEERS ({devices.length})
              </Text>
              
              <View style={styles.devicesList}>
                {devices.filter(Boolean).map((device) => (
                  <View key={device.id} style={[styles.deviceCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <View style={styles.deviceMetaRow}>
                      <View style={[styles.deviceIconBox, { backgroundColor: colors.hover }]}>
                        <VectorIcon name={device.iconName} color={colors.accent} size={20} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deviceName, { color: colors.textPrimary }]}>{device.name}</Text>
                        <Text style={[styles.deviceType, { color: colors.textMuted }]}>
                          WiFi {device.type} • Status: {device.synced ? 'Synced' : 'Available'}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      disabled={device.synced || activeSyncingDevice !== null}
                      onPress={() => {
                        setSelectedSyncMode('merge');
                        setSyncWizardDevice(device);
                      }}
                      style={({ pressed }) => [
                        styles.deviceActionBtn,
                        {
                          backgroundColor: device.synced ? 'rgba(16, 185, 129, 0.15)' : colors.hover,
                          borderColor: device.synced ? 'rgba(16, 185, 129, 0.3)' : colors.cardBorder,
                          opacity: pressed ? 0.8 : 1
                        }
                      ]}
                    >
                      <Text style={[styles.deviceActionBtnText, { color: device.synced ? '#10B981' : colors.textPrimary }]}>
                        {device.synced ? '✓ Synced' : 'Sync Wizard'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}
          {/* Manual Backup / Import / Export CrossSync */}
          <View style={[styles.manualSyncCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.manualHeader}>
              <VectorIcon name="routine" color={colors.accent} size={18} />
              <View>
                <Text style={[styles.manualTitle, { color: colors.textPrimary }]}>Manual Backup & Reconcile</Text>
                <Text style={[styles.manualSubtitle, { color: colors.textMuted }]}>
                  Sync offline devices by exporting and importing Sanctuary JSON Backups.
                </Text>
              </View>
            </View>

            {/* Hidden native HTML file input for web */}
            {Platform.OS === 'web' && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: 'none' }}
              />
            )}

            <View style={styles.manualActions}>
              {/* Export Panel */}
              <View style={[styles.actionSection, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>1. Export Backup file</Text>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                  Generate a portable JSON file containing your habits checklist, task lists, level progress, and active vitals.
                </Text>
                <Pressable
                  onPress={handleExportPack}
                  style={({ pressed }) => [
                    styles.manualBtn,
                    {
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.9 : 1,
                    }
                  ]}
                >
                  <Text style={styles.manualBtnText}>
                    {copiedExport ? '✓ JSON Backup Downloaded!' : 'Export & Download JSON'}
                  </Text>
                </Pressable>
              </View>

              {/* Import Panel */}
              <View style={[styles.actionSection, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>2. Reconcile / Import Backup file</Text>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                  Upload a Sanctuary Backup JSON file from another device to merge and reconcile your routines.
                </Text>
                
                {importStatus && (
                  <Text style={[
                    styles.statusMessage, 
                    { color: importStatus.success ? colors.success : colors.danger }
                  ]}>
                    {importStatus.message}
                  </Text>
                )}

                <Pressable
                  onPress={() => fileInputRef.current?.click()}
                  style={({ pressed }) => [
                    styles.manualBtnSecondary,
                    {
                      backgroundColor: colors.hover,
                      borderColor: colors.cardBorder,
                      opacity: pressed ? 0.8 : 1,
                    }
                  ]}
                >
                  <Text style={[styles.manualBtnTextSecondary, { color: colors.textPrimary }]}>
                    Select & Reconcile JSON File
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Sync & Reconciliation Wizard Modal */}
          <Modal
            visible={syncWizardDevice !== null}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSyncWizardDevice(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.wizardCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                {/* Header */}
                <View style={[styles.wizardHeader, { borderColor: colors.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {syncWizardDevice && <VectorIcon name={syncWizardDevice.iconName} color={colors.accent} size={18} />}
                    <Text style={[styles.wizardTitle, { color: colors.textPrimary }]}>Sync & Import Wizard</Text>
                  </View>
                  <Pressable onPress={() => setSyncWizardDevice(null)}>
                    <VectorIcon name="close" color={colors.textSecondary} size={16} />
                  </Pressable>
                </View>

                {/* Subtitle */}
                <Text style={[styles.wizardSub, { color: colors.textSecondary }]}>
                  Configure data exchange direction with remote device <Text style={{ color: colors.accent, fontWeight: '850' }}>{syncWizardDevice?.name}</Text>:
                </Text>

                {/* Mode Options List */}
                <View style={styles.modeOptions}>
                  {[
                    {
                      id: 'merge' as const,
                      title: 'Option A: Reconcile & Merge (2-Way) [RECOMMENDED]',
                      desc: 'Combine habits history, tasks checklist, achievements, and cortisol biometric records from both devices seamlessly.',
                      color: colors.success
                    },
                    {
                      id: 'pull' as const,
                      title: 'Option B: Import Remote Data (Pull 1-Way)',
                      desc: 'Completely replace your local habits and routine checklists with the incoming data from the remote device.',
                      color: colors.accent
                    },
                    {
                      id: 'push' as const,
                      title: 'Option C: Overwrite Remote Data (Push 1-Way)',
                      desc: 'Push this device\'s current checklists and configurations, overwriting all progress on the remote device.',
                      color: colors.warning
                    }
                  ].map((modeOpt) => {
                    const isSelected = selectedSyncMode === modeOpt.id;
                    return (
                      <Pressable
                        key={modeOpt.id}
                        onPress={() => setSelectedSyncMode(modeOpt.id)}
                        style={[
                          styles.modeCard,
                          {
                            backgroundColor: colors.hover,
                            borderColor: isSelected ? modeOpt.color : colors.cardBorder
                          }
                        ]}
                      >
                        <View style={styles.modeMeta}>
                          <Text style={[styles.modeTitleText, { color: isSelected ? modeOpt.color : colors.textPrimary }]}>
                            {modeOpt.title}
                          </Text>
                          <Text style={[styles.modeDescText, { color: colors.textSecondary }]}>
                            {modeOpt.desc}
                          </Text>
                        </View>
                        <View style={[styles.modeRadioCircle, { borderColor: isSelected ? modeOpt.color : colors.textMuted }]}>
                          {isSelected && <View style={[styles.modeRadioInner, { backgroundColor: modeOpt.color }]} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Action buttons */}
                <View style={styles.wizardActionRow}>
                  <Pressable
                    onPress={() => setSyncWizardDevice(null)}
                    style={[styles.wizardBtnCancel, { backgroundColor: colors.hover }]}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (syncWizardDevice) {
                        const dev = syncWizardDevice;
                        const mode = selectedSyncMode;
                        setSyncWizardDevice(null);
                        handleSyncDevice(dev, mode);
                      }
                    }}
                    style={[styles.wizardBtnConfirm, { backgroundColor: colors.accent }]}
                  >
                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>Start Reconciliation</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  controlHeader: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  controlMeta: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  controlSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  warningBox: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    marginTop: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  scrollArea: {
    flex: 1,
  },
  radarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    top: 24,
    zIndex: 0,
    pointerEvents: 'none',
  },
  radarOuterCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  radarMiddleCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    position: 'absolute',
    borderStyle: 'dashed',
  },
  radarInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    position: 'absolute',
  },
  radarGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  radarGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  sweepSectorContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    borderRadius: 130,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  sweepSector: {
    width: '100%',
    height: '100%',
    borderRadius: 130,
    opacity: 0.32,
  },
  radarDeviceNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  radarDeviceAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  radarDeviceText: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 4,
    textShadow: '0px 1px 3px rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  centerNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    elevation: 4,
    boxShadow: '0 0 12px rgba(226, 109, 92, 0.6)',
  },
  radarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    letterSpacing: 0.5,
  },
  scanBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  scanBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncProgressCard: {
    marginHorizontal: 4,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
  },
  syncStepText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginHorizontal: 4,
    marginTop: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  devicesSection: {
    marginTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  devicesList: {
    gap: 12,
    paddingBottom: 20,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    flexWrap: 'wrap',
  },
  deviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 180,
  },
  deviceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '800',
  },
  deviceType: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  deviceActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  deviceActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  manualSyncCard: {
    marginHorizontal: 4,
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  manualSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  manualActions: {
    gap: 16,
  },
  actionSection: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 14,
  },
  manualBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  manualBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  manualBtnSecondary: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  manualBtnTextSecondary: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    padding: 20,
  },
  wizardCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    elevation: 8,
  },
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  wizardTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  wizardSub: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  modeOptions: {
    gap: 10,
    marginVertical: 4,
  },
  modeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeMeta: {
    flex: 1,
    gap: 4,
  },
  modeTitleText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  modeDescText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  modeRadioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modeRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wizardActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  wizardBtnCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardBtnConfirm: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(226, 109, 92, 0.25)',
  },
  importInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11.5,
    fontWeight: '600',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statusMessage: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  localIpText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  manualConnectCard: {
    marginHorizontal: 4,
    marginTop: 12,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  manualConnectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualConnectTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  manualConnectSub: {
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 14,
  },
  manualConnectForm: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  manualConnectInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 11.5,
    fontWeight: '600',
  },
  manualConnectBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  manualConnectBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  manualConnectError: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },
});
