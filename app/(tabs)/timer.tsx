import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Alert, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Timer as TimerIcon, Hourglass, FastForward } from 'lucide-react-native';
import Svg, { Circle, LinearGradient, Stop, Defs, RadialGradient } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useTimer } from '../../context/TimerContext';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CIRCLE_LENGTH = width * 0.7;
const CIRCLE_RADIUS = CIRCLE_LENGTH / (2 * Math.PI);

interface CircularProgressProps {
  progress: number;
  size: number;
  strokeWidth: number;
  children: ReactNode;
  color: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size, strokeWidth, children, color }) => {
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressStrokeDasharray = `${circumference * progress} ${circumference * (1 - progress)}`;
  
  // Renk değişimi için progress değerini kullan
  const getProgressColor = () => {
    if (progress > 0.6) return '#22c55e';
    if (progress > 0.3) return '#eab308';
    return '#ef4444';
  };

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={getProgressColor()} stopOpacity="1" />
          </LinearGradient>
          
          <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2}
          fill="url(#glowGradient)"
        />

        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="#1e293b"
          opacity={0.3}
        />
        
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={progressStrokeDasharray}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View 
        style={[
          {
            position: 'absolute',
            width: strokeWidth * 1.5,
            height: strokeWidth * 1.5,
            borderRadius: strokeWidth * 1.5,
            backgroundColor: '#fff',
            borderWidth: 3,
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
            transform: [
              { 
                translateX: center + radius * Math.cos(progress * 2 * Math.PI - Math.PI / 2) - strokeWidth / 1.5 
              },
              { 
                translateY: center + radius * Math.sin(progress * 2 * Math.PI - Math.PI / 2) - strokeWidth / 1.5 
              }
            ]
          }
        ]} 
      />

      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children}
      </View>
    </View>
  );
};

// Ekranın yanıp sönmesi için efekt bileşeni
const FlashEffect = () => {
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3 saniyelik yanıp sönme animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.7, // Maksimum opaklık değeri
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 5 } // 5 kez yanıp sönme (yaklaşık 3 saniye)
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        StyleSheet.absoluteFill,
        styles.flashEffect,
        {
          opacity: flashOpacity,
        }
      ]}
    />
  );
};

export default function TimerScreen() {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'stopwatch' | 'countdown'>('pomodoro');
  const router = useRouter();
  
  // Bildirim izinlerini kontrol et ve pil optimizasyonu hakkında bilgilendir
  useEffect(() => {
    (async () => {
      // Bildirim izinlerini kontrol et
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Bildirim İzni Gerekli',
          'Zamanlayıcının arka planda çalışabilmesi için bildirim izni gereklidir. İzin vermek ister misiniz?',
          [
            { text: 'Hayır', style: 'cancel' },
            { 
              text: 'Evet', 
              onPress: async () => {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(
                    'Bildirim İzni Verilmedi',
                    'Bildirim izni olmadan zamanlayıcı arka planda çalışamayacak.'
                  );
                } else {
                  // Bildirim izni verildiyse, pil optimizasyonu hakkında bilgilendir
                  if (Platform.OS === 'android') {
                    // Arka plan uyarısı gösterildi mi kontrol et
                    const hasShownBatteryWarning = await AsyncStorage.getItem('@battery_warning_shown');
                    if (hasShownBatteryWarning !== 'true') {
                      setTimeout(() => {
                        Alert.alert(
                          'Arka Plan Çalışması',
                          'Zamanlayıcının arka planda düzgün çalışması için cihazınızın pil optimizasyonu ayarlarını değiştirmeniz gerekebilir. Ayarlar > Uygulamalar > MEB AGS > Pil > Pil optimizasyonu yok olarak ayarlayın.',
                          [{ 
                            text: 'Anladım', 
                            style: 'default',
                            onPress: () => {
                              // Uyarının gösterildiğini kaydet
                              AsyncStorage.setItem('@battery_warning_shown', 'true');
                            }
                          }]
                        );
                      }, 1000);
                    }
                  }
                }
              }
            }
          ]
        );
      } else if (Platform.OS === 'android') {
        // Bildirim izni zaten varsa, pil optimizasyonu hakkında bilgilendir
        // Arka plan uyarısı gösterildi mi kontrol et
        const hasShownBatteryWarning = await AsyncStorage.getItem('@battery_warning_shown');
        if (hasShownBatteryWarning !== 'true') {
          setTimeout(() => {
            Alert.alert(
              'Arka Plan Çalışması',
              'Zamanlayıcının arka planda düzgün çalışması için cihazınızın pil optimizasyonu ayarlarını değiştirmeniz gerekebilir. Ayarlar > Uygulamalar > MEB AGS > Pil > Pil optimizasyonu yok olarak ayarlayın.',
              [{ 
                text: 'Anladım', 
                style: 'default',
                onPress: () => {
                  // Uyarının gösterildiğini kaydet
                  AsyncStorage.setItem('@battery_warning_shown', 'true');
                }
              }]
            );
          }, 1000);
        }
      }
    })();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kronometre</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pomodoro' && styles.activeTabButton]}
          onPress={() => setActiveTab('pomodoro')}
        >
          <Clock color="#fff" size={20} />
          <Text style={[styles.tabButtonText, activeTab === 'pomodoro' && styles.activeTabButtonText]}>
            Pomodoro
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stopwatch' && styles.activeTabButton]}
          onPress={() => setActiveTab('stopwatch')}
        >
          <TimerIcon color="#fff" size={20} />
          <Text style={[styles.tabButtonText, activeTab === 'stopwatch' && styles.activeTabButtonText]}>
            Kronometre
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'countdown' && styles.activeTabButton]}
          onPress={() => setActiveTab('countdown')}
        >
          <Hourglass color="#fff" size={20} />
          <Text style={[styles.tabButtonText, activeTab === 'countdown' && styles.activeTabButtonText]}>
            Geri Sayım
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'pomodoro' && <PomodoroTimer />}
        {activeTab === 'stopwatch' && <StopwatchTimer />}
        {activeTab === 'countdown' && <CountdownTimer />}
      </ScrollView>
    </SafeAreaView>
  );
}

// Pomodoro Timer Component
function PomodoroTimer() {
  const { 
    timerData, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    setTimerMode, 
    formatTime, 
    getProgress,
    skipPomodoroSession 
  } = useTimer();
  
  // Animasyon değeri
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [showFlashEffect, setShowFlashEffect] = useState(false);
  
  // Timer modunu pomodoro olarak ayarla
  useEffect(() => {
    setTimerMode('pomodoro');
  }, []);
  
  // Timer tamamlandığında efekt göster
  useEffect(() => {
    // Eğer timer aktif değilse ve ilerleme 1'e eşitse (tamamlandıysa)
    if (!timerData.isActive && getProgress() >= 0.99 && timerData.elapsedTime > 0) {
      setShowCompletionEffect(true);
      setShowFlashEffect(true);
      
      // Titreşim efekti
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Pulse animasyonu başlat
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          })
        ]),
        { iterations: 5 }
      ).start(() => {
        // Animasyon tamamlandığında efekti kaldır
        setShowCompletionEffect(false);
        
        // 3 saniye sonra flash efektini kaldır
        setTimeout(() => {
          setShowFlashEffect(false);
        }, 3000);
      });
    } else {
      setShowCompletionEffect(false);
      setShowFlashEffect(false);
    }
  }, [timerData.isActive, timerData.elapsedTime, getProgress]);
  
  // Pomodoro modu renkleri
  const getModeColor = () => {
    if (timerData.pomodoroState === 'work') {
      return ['#3b82f6', '#2563eb'] as const;
    } else if (timerData.pomodoroState === 'shortBreak') {
      return ['#10b981', '#059669'] as const;
    } else {
      return ['#8b5cf6', '#7c3aed'] as const; // longBreak
    }
  };
  
  // İlerleme çubuğu rengi
  const getProgressColor = () => {
    const progress = getProgress();
    if (progress > 0.6) return '#22c55e';
    if (progress > 0.3) return '#eab308';
    return '#ef4444';
  };
  
  // Kalan süreyi hesapla
  const getRemainingTime = () => {
    if (!timerData.totalTime) return 0;
    const remaining = timerData.totalTime - timerData.elapsedTime;
    return remaining > 0 ? remaining : 0;
  };
  
  // Pomodoro durumunu metin olarak göster
  const getPomodoroStateText = () => {
    if (timerData.pomodoroState === 'work') {
      return (
        <Text style={styles.timerModeText}>
          <Text style={{ color: '#3b82f6' }}>Çalışma</Text>
          <Text style={{ color: '#9ca3af' }}> ({timerData.pomodoroCount}/4)</Text>
        </Text>
      );
    } else if (timerData.pomodoroState === 'shortBreak') {
      return (
        <Text style={styles.timerModeText}>
          <Text style={{ color: '#10b981' }}>Kısa Mola</Text>
        </Text>
      );
    } else {
      return (
        <Text style={styles.timerModeText}>
          <Text style={{ color: '#8b5cf6' }}>Uzun Mola</Text>
        </Text>
      );
    }
  };
  
  return (
    <View style={styles.timerContainer}>
      {/* Yanıp sönme efekti */}
      {showFlashEffect && <FlashEffect />}
      
      {/* Tamamlanma efekti */}
      {showCompletionEffect && (
        <Animated.View 
          style={[
            styles.completionEffect,
            {
              opacity: pulseAnim,
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2]
                })
              }]
            }
          ]}
        >
          <Text style={styles.completionText}>
            {timerData.pomodoroState === 'work' 
              ? 'Çalışma Süresi Tamamlandı!' 
              : timerData.pomodoroState === 'shortBreak' 
                ? 'Kısa Mola Tamamlandı!' 
                : 'Uzun Mola Tamamlandı!'}
          </Text>
        </Animated.View>
      )}
      
      <View style={styles.circularProgressContainer}>
        <CircularProgress 
          progress={getProgress()} 
          size={width * 0.8} 
          strokeWidth={15}
          color={getModeColor()[0]}
        >
          <Text style={styles.timerText}>{formatTime(getRemainingTime())}</Text>
          {getPomodoroStateText()}
          <Text style={styles.timerSessionText}>
            <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>{timerData.completedSessions}</Text> Oturum Tamamlandı
          </Text>
        </CircularProgress>
      </View>
      
      <View style={styles.timerControls}>
        {!timerData.isActive ? (
          <TouchableOpacity 
            style={[styles.timerButton, { backgroundColor: getModeColor()[0] }]} 
            onPress={startTimer}
          >
            <Play color="#fff" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.timerButton, { backgroundColor: '#f59e0b' }]} 
            onPress={pauseTimer}
          >
            <Pause color="#fff" size={24} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.timerButton, styles.resetButton]} 
          onPress={resetTimer}
        >
          <RotateCcw color="#fff" size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.timerButton, { backgroundColor: '#8b5cf6' }]} 
          onPress={skipPomodoroSession}
        >
          <FastForward color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionText}>
          Pomodoro tekniği, 25 dakikalık çalışma periyotları ve kısa molalarla verimliliği artırır.
        </Text>
      </View>
      
      <ExpoLinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.infoCard}
      >
        <Text style={styles.infoTitle}>Pomodoro Tekniği Hakkında</Text>
        <Text style={styles.infoText}>
          • Her 25 dakikalık <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>çalışma</Text> periyodundan sonra 5 dakika <Text style={{ color: '#10b981', fontWeight: 'bold' }}>kısa mola</Text> verin.
        </Text>
        <Text style={styles.infoText}>
          • 4 pomodoro tamamladıktan sonra 30 dakikalık <Text style={{ color: '#8b5cf6', fontWeight: 'bold' }}>uzun mola</Text> yapın.
        </Text>
        <Text style={styles.infoText}>
          • <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Çalışma</Text> sırasında dikkatinizi dağıtacak şeylerden uzak durun.
        </Text>
        <Text style={styles.infoText}>
          • <Text style={{ color: '#10b981', fontWeight: 'bold' }}>Mola</Text> sırasında zihinsel olarak tamamen dinlenin.
        </Text>
        <Text style={styles.infoText}>
          • <Text style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Geç</Text> butonunu kullanarak istediğiniz zaman bir sonraki oturuma geçebilirsiniz.
        </Text>
      </ExpoLinearGradient>
    </View>
  );
}

// Stopwatch Timer Component
function StopwatchTimer() {
  const { 
    timerData, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    addLap, 
    setTimerMode, 
    formatTime 
  } = useTimer();
  
  // Timer modunu stopwatch olarak ayarla
  useEffect(() => {
    setTimerMode('stopwatch');
  }, []);
  
  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formatTime(timerData.elapsedTime)}</Text>
      </View>
      
      <View style={styles.timerControls}>
        {!timerData.isActive ? (
          <TouchableOpacity 
            style={[styles.timerButton, { backgroundColor: '#10b981' }]} 
            onPress={startTimer}
          >
            <Play color="#fff" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.timerButton, { backgroundColor: '#f59e0b' }]} 
            onPress={pauseTimer}
          >
            <Pause color="#fff" size={24} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.timerButton, styles.resetButton]} 
          onPress={resetTimer}
        >
          <RotateCcw color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.lapButton, !timerData.isActive && styles.disabledButton]} 
        onPress={addLap}
        disabled={!timerData.isActive}
      >
        <Text style={styles.lapButtonText}>Tur Ekle</Text>
      </TouchableOpacity>
      
      {timerData.laps.length > 0 && (
        <View style={styles.lapsContainer}>
          <Text style={styles.lapsTitle}>Turlar</Text>
          <ScrollView style={styles.lapsList}>
            {timerData.laps.map((lapTime, index) => (
              <View key={index} style={styles.lapItem}>
                <Text style={styles.lapNumber}>Tur {timerData.laps.length - index}</Text>
                <Text style={styles.lapTime}>{formatTime(lapTime)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Countdown Timer Component
function CountdownTimer() {
  const { 
    timerData, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    setTimerMode, 
    setTotalTime, 
    formatTime, 
    getProgress 
  } = useTimer();
  
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');
  const [isEditing, setIsEditing] = useState(true);
  
  // Animasyon değeri
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [showFlashEffect, setShowFlashEffect] = useState(false);
  
  // Timer modunu countdown olarak ayarla
  useEffect(() => {
    setTimerMode('countdown');
  }, []);
  
  // Timer tamamlandığında efekt göster
  useEffect(() => {
    // Eğer timer aktif değilse ve ilerleme 1'e eşitse (tamamlandıysa)
    if (!timerData.isActive && getProgress() >= 0.99 && timerData.elapsedTime > 0 && timerData.totalTime && timerData.elapsedTime >= timerData.totalTime) {
      setShowCompletionEffect(true);
      setShowFlashEffect(true);
      
      // Titreşim efekti
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Pulse animasyonu başlat
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          })
        ]),
        { iterations: 5 }
      ).start(() => {
        // Animasyon tamamlandığında efekti kaldır
        setShowCompletionEffect(false);
        
        // 3 saniye sonra flash efektini kaldır
        setTimeout(() => {
          setShowFlashEffect(false);
        }, 3000);
      });
    } else {
      setShowCompletionEffect(false);
      setShowFlashEffect(false);
    }
  }, [timerData.isActive, timerData.elapsedTime, timerData.totalTime, getProgress]);
  
  // Toplam süre değiştiğinde input alanlarını güncelle
  useEffect(() => {
    if (isEditing && timerData.totalTime) {
      const totalSeconds = Math.floor(timerData.totalTime / 1000);
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      
      setHours(hrs.toString().padStart(2, '0'));
      setMinutes(mins.toString().padStart(2, '0'));
      setSeconds(secs.toString().padStart(2, '0'));
    }
  }, [timerData.totalTime, isEditing]);
  
  // Timer durumu değiştiğinde düzenleme modunu güncelle
  useEffect(() => {
    setIsEditing(!timerData.isActive && timerData.elapsedTime === 0);
  }, [timerData.isActive, timerData.elapsedTime]);
  
  // Saat değişikliğini işle
  const handleHoursChange = (text: string) => {
    // Sadece sayılara izin ver ve 2 basamakla sınırla, maksimum değer 23
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 2);
    const value = parseInt(filtered) || 0;
    if (value <= 23) {
      // Düzenleme sırasında sıfırlarla doldurma
      setHours(filtered);
    }
  };
  
  // Dakika değişikliğini işle
  const handleMinutesChange = (text: string) => {
    // Sadece sayılara izin ver ve 2 basamakla sınırla, maksimum değer 59
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 2);
    const value = parseInt(filtered) || 0;
    if (value <= 59) {
      // Düzenleme sırasında sıfırlarla doldurma
      setMinutes(filtered);
    }
  };
  
  // Saniye değişikliğini işle
  const handleSecondsChange = (text: string) => {
    // Sadece sayılara izin ver ve 2 basamakla sınırla, maksimum değer 59
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 2);
    const value = parseInt(filtered) || 0;
    if (value <= 59) {
      // Düzenleme sırasında sıfırlarla doldurma
      setSeconds(filtered);
    }
  };
  
  // Timer'ı başlat
  const handleStartTimer = () => {
    if (isEditing) {
      // Giriş alanlarını sıfırlarla doldur
      const paddedHours = hours.padStart(2, '0');
      const paddedMinutes = minutes.padStart(2, '0');
      const paddedSeconds = seconds.padStart(2, '0');
      
      // Görüntüleme değerlerini doldurulmuş versiyonlarla güncelle
      setHours(paddedHours);
      setMinutes(paddedMinutes);
      setSeconds(paddedSeconds);
      
      // Toplam saniyeyi hesapla
      const hrs = parseInt(paddedHours) || 0;
      const mins = parseInt(paddedMinutes) || 0;
      const secs = parseInt(paddedSeconds) || 0;
      
      const totalSeconds = hrs * 3600 + mins * 60 + secs;
      
      if (totalSeconds > 0) {
        // Toplam süreyi saniye cinsinden ayarla
        setTotalTime(totalSeconds);
        setIsEditing(false);
        startTimer();
      } else {
        // Süre girilmediğinde kullanıcıyı uyar
        Alert.alert('Uyarı', 'Lütfen bir süre girin.');
      }
    } else {
      startTimer();
    }
  };
  
  // İlerleme çubuğu rengi
  const getProgressColor = () => {
    const progress = getProgress();
    if (progress > 0.6) return '#22c55e';
    if (progress > 0.3) return '#eab308';
    return '#ef4444';
  };
  
  return (
    <View style={styles.timerContainer}>
      {/* Yanıp sönme efekti */}
      {showFlashEffect && <FlashEffect />}
      
      {/* Tamamlanma efekti */}
      {showCompletionEffect && (
        <Animated.View 
          style={[
            styles.completionEffect,
            {
              opacity: pulseAnim,
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2]
                })
              }]
            }
          ]}
        >
          <Text style={styles.completionText}>Geri Sayım Tamamlandı!</Text>
        </Animated.View>
      )}
      
      <Text style={styles.countdownTitle}>Geri Sayım Zamanlayıcısı</Text>
      
      {!isEditing && (
        <View style={styles.circularProgressContainer}>
          <CircularProgress 
            progress={getProgress()} 
            size={width * 0.8} 
            strokeWidth={15}
            color={getProgressColor()}
          >
            <Text style={styles.timerText}>
              {formatTime(timerData.totalTime ? timerData.totalTime - timerData.elapsedTime : 0)}
            </Text>
          </CircularProgress>
        </View>
      )}
      
      {isEditing && (
        <View style={styles.countdownDisplay}>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeInputLabel}>Saat</Text>
              <TextInput
                style={styles.timeInput}
                value={hours}
                onChangeText={handleHoursChange}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus={true}
                editable={true}
                placeholder="00"
              />
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeInputLabel}>Dakika</Text>
              <TextInput
                style={styles.timeInput}
                value={minutes}
                onChangeText={handleMinutesChange}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus={true}
                editable={true}
                placeholder="00"
              />
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeInputLabel}>Saniye</Text>
              <TextInput
                style={styles.timeInput}
                value={seconds}
                onChangeText={handleSecondsChange}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus={true}
                editable={true}
                placeholder="00"
              />
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.countdownControls}>
        {isEditing ? (
          <TouchableOpacity 
            style={[styles.countdownButton, styles.startButton]} 
            onPress={handleStartTimer}
          >
            <Play color="#fff" size={20} />
            <Text style={styles.countdownButtonText}>Başlat</Text>
          </TouchableOpacity>
        ) : !timerData.isActive ? (
          <>
            <TouchableOpacity 
              style={[styles.countdownButton, styles.startButton]} 
              onPress={startTimer}
            >
              <Play color="#fff" size={20} />
              <Text style={styles.countdownButtonText}>Devam Et</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.countdownButton, styles.resetButton]} 
              onPress={resetTimer}
            >
              <RotateCcw color="#fff" size={20} />
              <Text style={styles.countdownButtonText}>Sıfırla</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.countdownButton, styles.pauseButton]} 
              onPress={pauseTimer}
            >
              <Pause color="#fff" size={20} />
              <Text style={styles.countdownButtonText}>Duraklat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.countdownButton, styles.resetButton]} 
              onPress={resetTimer}
            >
              <RotateCcw color="#fff" size={20} />
              <Text style={styles.countdownButtonText}>Sıfırla</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {!isEditing && (
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => {
            resetTimer();
            setIsEditing(true);
          }}
        >
          <Text style={styles.editButtonText}>Süreyi Düzenle</Text>
        </TouchableOpacity>
      )}
      
      <ExpoLinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.infoCard}
      >
        <Text style={styles.infoTitle}>Geri Sayım Hakkında</Text>
        <Text style={styles.infoText}>
          • Saat, dakika ve saniye alanlarını kullanarak istediğiniz süreyi ayarlayabilirsiniz.
        </Text>
        <Text style={styles.infoText}>
          • Süre dolduğunda bildirim alacaksınız.
        </Text>
        <Text style={styles.infoText}>
          • Uygulama arka planda çalışırken bile geri sayım devam eder.
        </Text>
        <Text style={styles.infoText}>
          • Bildirim alanında süreyi takip edebilirsiniz.
        </Text>
      </ExpoLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#0f172a',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timerContainer: {
    padding: 16,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 40,
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  timerButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resetButton: {
    backgroundColor: '#ef4444',
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sessionText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 20,
  },
  lapButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  lapButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  lapsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lapsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  lapsList: {
    maxHeight: 200,
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  lapNumber: {
    fontSize: 14,
    color: '#9ca3af',
  },
  lapTime: {
    fontSize: 14,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  countdownDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 40,
    marginBottom: 24,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputGroup: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    width: 80,
    height: 80,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 8,
  },
  countdownControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  countdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  countdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  editButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  editButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  timerModeText: {
    fontSize: 20,
    color: '#9ca3af',
    marginTop: 8,
  },
  timerSessionText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  completionEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    zIndex: 10,
    borderRadius: 16,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    padding: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 12,
  },
  flashEffect: {
    backgroundColor: '#3b82f6', // Mavi renk
    zIndex: 999, // En üstte görünmesi için
    pointerEvents: 'none', // Dokunma etkileşimlerini engellemeyecek
  },
});