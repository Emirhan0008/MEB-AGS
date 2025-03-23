import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import { AppState, Platform, AppStateStatus } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Alert } from 'react-native';
import { Linking } from 'react-native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { EventRegister } from 'react-native-event-listeners';
import * as Device from 'expo-device';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Constants from 'expo-constants';

// AsyncStorage anahtarları
const TIMER_STORAGE_KEY = 'meb-ags-timer';
const BACKGROUND_TIMER_TASK = 'BACKGROUND-TIMER-TASK';
const STUDY_TIME_KEY = 'meb-ags-study-time'; // Toplam çalışma süresi için anahtar
const DAILY_STUDY_KEY = 'meb-ags-daily-study'; // Günlük çalışma süresi için anahtar
const WEEKLY_STUDY_KEY = 'meb-ags-weekly-study'; // Haftalık çalışma süresi için anahtar
const MONTHLY_STUDY_KEY = 'meb-ags-monthly-study'; // Aylık çalışma süresi için anahtar
const LAST_UPDATE_KEY = 'meb-ags-last-update'; // Son güncelleme zamanı için anahtar

// Bildirim kanalı ID'si
const TIMER_NOTIFICATION_CHANNEL = 'timer-notifications';

// Timer durumları için tip tanımlaması
type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown';

// Timer verileri için tip tanımlaması
interface TimerData {
  mode: TimerMode;
  isActive: boolean;
  startTime: number | null;
  pausedTime: number | null;
  elapsedTime: number;
  totalTime: number | null; // Pomodoro ve Countdown için
  laps: number[]; // Kronometre için
  completedSessions: number; // Pomodoro için
  pomodoroState: 'work' | 'shortBreak' | 'longBreak'; // Pomodoro durumu
  pomodoroCount: number; // Pomodoro döngüsündeki oturum sayısı (1-4)
}

// Context için tip tanımlaması
interface TimerContextType {
  timerData: TimerData;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addLap: () => void; // Kronometre için
  setTimerMode: (mode: TimerMode) => void;
  setTotalTime: (seconds: number) => void; // Countdown için
  formatTime: (ms: number) => string;
  getProgress: () => number;
  skipPomodoroSession: () => void;
}

// Varsayılan timer verileri
const defaultTimerData: TimerData = {
  mode: 'pomodoro',
  isActive: false,
  startTime: null,
  pausedTime: null,
  elapsedTime: 0,
  totalTime: 25 * 60 * 1000, // 25 dakika (ms cinsinden)
  laps: [],
  completedSessions: 0,
  pomodoroState: 'work',
  pomodoroCount: 1,
};

// Context oluşturma
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Bildirim yapılandırması
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Pil optimizasyonu muafiyeti için kullanıcıyı yönlendir
const requestBatteryOptimizationExemption = async () => {
  try {
    if (Platform.OS !== 'android') return;
    
    // Doğrudan sabit değeri kullan - getActivityConstantAsync mevcut değil
    const pkg = 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS';
    
    // Her seferinde istek yapmak yerine sadece bir kere deneyelim
    const key = '@battery_optimization_requested';
    const requested = await AsyncStorage.getItem(key);
    if (requested === 'true') return;

    await IntentLauncher.startActivityAsync(pkg, {
      data: `package:${Application.applicationId}`,
    });
    
    await AsyncStorage.setItem(key, 'true');
  } catch (error) {
    // Hata logunu sadece development modunda gösterelim
    if (__DEV__) {
      console.error('Pil optimizasyonu muafiyeti istenemedi:', error);
    }
  }
};

// Arka plan görevi tanımla
TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
  try {
    console.log('[TIMER_LOG] Arka plan görevi çalışıyor...');
    
    // Timer verilerini al
    const storedData = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
    if (!storedData) {
      console.log('[TIMER_LOG] Kayıtlı timer verisi bulunamadı');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const timerData: TimerData = JSON.parse(storedData);
    
    // Timer aktif değilse işlem yapma
    if (!timerData.isActive || !timerData.startTime) {
      console.log('[TIMER_LOG] Timer aktif değil, işlem yapılmadı');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Geçen süreyi hesapla
    const now = Date.now();
    const elapsedSinceStart = now - timerData.startTime;
    const elapsedTime = timerData.elapsedTime + elapsedSinceStart;
    
    // Güncellenmiş verileri hazırla
    const updatedData: TimerData = {
      ...timerData,
      elapsedTime,
      startTime: now,
    };
    
    // Bildirim içeriğini hazırla
    let title = '';
    let body = '';
    let shouldSendNotification = false;
    let isCompleted = false;
    
    if (timerData.mode === 'pomodoro' && timerData.totalTime) {
      const remainingTime = Math.max(0, timerData.totalTime - elapsedTime);
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      
      const stateText = timerData.pomodoroState === 'work' 
        ? `Çalışma (${timerData.pomodoroCount}/4)` 
        : timerData.pomodoroState === 'shortBreak' 
          ? 'Kısa Mola' 
          : 'Uzun Mola';
      
      title = `Pomodoro: ${stateText}`;
      body = `Kalan süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Bitmesine 5 dakika kala bildirim gönder
      if (minutes === 5 && seconds >= 0 && seconds < 5) {
        shouldSendNotification = true;
        title = `${stateText} - 5 dakika kaldı!`;
        body = "Pomodoro zamanlayıcınız 5 dakika içinde tamamlanacak.";
      }
      
      // Tamamlandıysa bildirim gönder
      if (remainingTime <= 0) {
        isCompleted = true;
      }
    } else if (timerData.mode === 'stopwatch') {
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      
      title = 'Kronometre Çalışıyor';
      body = `Geçen süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Kronometre için bildirim göndermeye gerek yok
      shouldSendNotification = false;
    } else if (timerData.mode === 'countdown' && timerData.totalTime) {
      const remainingTime = Math.max(0, timerData.totalTime - elapsedTime);
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      
      title = 'Geri Sayım Devam Ediyor';
      body = `Kalan süre: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Bitmesine 5 dakika kala bildirim gönder
      if (minutes === 5 && seconds >= 0 && seconds < 5) {
        shouldSendNotification = true;
        title = "Geri Sayım - 5 dakika kaldı!";
        body = "Geri sayım zamanlayıcınız 5 dakika içinde tamamlanacak.";
      }
      
      // Tamamlandıysa bildirim gönder
      if (remainingTime <= 0) {
        isCompleted = true;
      }
    }
    
    // Bildirim gönder (sadece gerektiğinde)
    if (shouldSendNotification) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: { type: 'timer_reminder', screen: 'timer' },
        },
        trigger: null,
      });
    }
    
    // Tamamlandıysa bildirim gönder
    if (isCompleted) {
      let completionTitle = '';
      let completionBody = '';
      
      if (timerData.mode === 'pomodoro') {
        if (timerData.pomodoroState === 'work') {
          completionTitle = 'Pomodoro Çalışma Oturumu Tamamlandı!';
          completionBody = `${timerData.pomodoroCount}/4 çalışma oturumunuz tamamlandı. ${timerData.pomodoroCount === 4 ? '30 dakika uzun mola' : '5 dakika kısa mola'} zamanı!`;
        } else {
          completionTitle = 'Pomodoro Mola Süresi Tamamlandı!';
          completionBody = 'Mola süreniz doldu. Şimdi çalışma zamanı!';
        }
      } else if (timerData.mode === 'countdown') {
        completionTitle = 'Geri Sayım Tamamlandı!';
        completionBody = 'Ayarladığınız süre doldu.';
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: completionTitle,
          body: completionBody,
          data: { type: 'timer_completed', screen: 'timer' },
        },
        trigger: null,
      });
    }
    
    // Güncellenmiş verileri kaydet
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(updatedData));
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Arka plan görevi hatası:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Linter hatalarını düzeltmek için tip tanımlaması
interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [timerData, setTimerData] = useState<TimerData>(defaultTimerData);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState as AppStateStatus);
  const isInitialMount = useRef(true);
  
  // Ekranın uyanık kalmasını sağla (timer aktifse ve web platformunda değilse)
  if (Platform.OS !== 'web') {
    useKeepAwake();
  }
  
  const loadTimerData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@timer_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData) as TimerData;
        if (__DEV__) {
          console.log('[TIMER_LOG] Yüklenen timer:', 
            `mode=${parsedData.mode}`,
            `isActive=${parsedData.isActive}`,
            `elapsedTime=${parsedData.elapsedTime}ms`
          );
        }
        setTimerData(parsedData);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Timer verisi yüklenirken hata:', error);
      }
    }
  };
  
  useEffect(() => {
    if (isInitialMount.current) {
      if (__DEV__) {
        console.log('TimerProvider bileşeni yükleniyor...');
      }
      loadTimerData();
      isInitialMount.current = false;
    }
  }, []);
  
  // Timer verilerini AsyncStorage'a kaydet
  const saveTimerData = async (dataToSave = timerData) => {
    try {
      // Mevcut timer verilerinin bir kopyasını oluştur
      const dataCopy = { ...dataToSave };
      
      // Sadece kritik durumlarda log
      if (dataCopy.mode === 'pomodoro' && dataCopy.pomodoroState === 'work' && dataCopy.totalTime) {
        // Pomodoro modunda elapsedTime değerinin doğru kaydedilmesi için ek kontrol
        // elapsedTime değerinin totalTime'dan büyük olmamasını sağla
        if (dataCopy.elapsedTime > dataCopy.totalTime) {
          console.log(`[TIMER_LOG] Pomodoro: elapsedTime (${dataCopy.elapsedTime}ms) totalTime'dan (${dataCopy.totalTime}ms) büyük, düzeltiliyor.`);
          dataCopy.elapsedTime = dataCopy.totalTime;
        }
        
        // Pomodoro çalışma oturumunda ve elapsedTime neredeyse totalTime'a eşitse
        // Bu, 24:52 -> 25:00 sıfırlanma sorununu önler
        const THRESHOLD = 10 * 1000; // 10 saniye eşik değeri
        if (dataCopy.totalTime - dataCopy.elapsedTime < THRESHOLD) {
          console.log(`[TIMER_LOG] Pomodoro çalışma oturumu bitmek üzere, elapsedTime korunuyor: ${dataCopy.elapsedTime}ms`);
        }
      }
      
      // Timer aktif ise, startTime'ı güncelle
      if (dataCopy.isActive) {
        dataCopy.startTime = Date.now();
        dataCopy.pausedTime = null;
      } else {
        // Timer aktif değilse, pausedTime'ı güncelle
        dataCopy.pausedTime = Date.now();
        dataCopy.startTime = null;
      }
      
      await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(dataCopy));
    } catch (error) {
      console.error('[TIMER_LOG] Timer verileri kaydedilirken hata oluştu:', error);
    }
  };
  
  // AppState değişikliklerini yönet - useCallback ile tanımla
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    // Sadece durum değişikliğinde log
    if (
      (appState.current.match(/inactive|background/) && nextAppState === 'active') ||
      (appState.current === 'active' && nextAppState.match(/inactive|background/))
    ) {
      console.log(`[TIMER_LOG] Uygulama durumu değişti: ${appState.current} -> ${nextAppState}`);
    }
    
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Arka plandan ön plana geçiş
      loadTimerData();
    } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // Ön plandan arka plana geçiş
      
      // Güncel timer verilerini doğrudan al
      // Eğer timer aktifse, güncel elapsedTime değerini hesapla ve kaydet
      if (timerData.isActive && timerData.startTime) {
        const now = Date.now();
        const realElapsed = now - timerData.startTime;
        const newElapsedTime = timerData.elapsedTime + realElapsed;
        
        // Güncel verileri içeren yeni bir obje oluştur
        const updatedTimerData = {
          ...timerData,
          elapsedTime: newElapsedTime,
          startTime: now // startTime'ı güncelle
        };
        
        // Güncel verileri kaydet
        saveTimerData(updatedTimerData);
      } else {
        // Timer aktif değilse normal kaydet
        saveTimerData(timerData);
      }
    }
    
    appState.current = nextAppState;
  }, [timerData]);
  
  // Geçen süreyi güncelle
  const updateElapsedTime = () => {
    setTimerData(prev => {
      if (!prev.isActive) return prev;
      
      // Şu anki zaman
      const now = Date.now();
      
      // Sabit bir süre artışı kullan (1 saniye)
      let newElapsedTime = prev.elapsedTime + 1000; // 1 saniye (ms cinsinden)
      
      // Eğer startTime varsa, gerçek geçen süreyi hesapla
      // Bu, arka planda geçen süreyi daha doğru hesaplamak için
      if (prev.startTime) {
        const realElapsed = now - prev.startTime;
        
        // Pomodoro modunda çalışma süresini düzenli olarak güncelle
        if (prev.mode === 'pomodoro' && prev.pomodoroState === 'work') {
          // Her 15 saniyede bir çalışma süresini güncelle
          if (newElapsedTime % 15000 === 0) {
            setTimeout(() => {
              updateStudyTime(0.25); // 15 saniye = 0.25 dakika
              EventRegister.emit('forceReloadStudyTime', true);
            }, 0);
          }
        }
        
        // Pomodoro modunda elapsedTime değerinin doğru hesaplanması için ek kontrol
        if (prev.mode === 'pomodoro' && prev.totalTime) {
          // Eğer gerçek geçen süre 1 saniyeden fazlaysa (arka planda geçen süre)
          if (realElapsed > 1100) { // 1.1 saniye tolerans
            // Maksimum 10 dakika ile sınırla
            const MAX_BACKGROUND_TIME = 10 * 60 * 1000; // 10 dakika
            const adjustedElapsed = Math.min(realElapsed, MAX_BACKGROUND_TIME);
            
            // Pomodoro için gerçek geçen süreyi ekle
            newElapsedTime = prev.elapsedTime + adjustedElapsed;
            
            // Süre doldu mu kontrol et
            if (newElapsedTime > prev.totalTime) {
              newElapsedTime = prev.totalTime;
            }
            
            // Sadece önemli değişikliklerde log
            if (adjustedElapsed > 5000) { // 5 saniyeden fazla geçmişse
              const remainingTime = Math.max(0, prev.totalTime - newElapsedTime);
              const minutes = Math.floor(remainingTime / 60000);
              const seconds = Math.floor((remainingTime % 60000) / 1000);
              console.log(`[TIMER_LOG] Pomodoro güncelleniyor: Yeni süre: ${newElapsedTime}ms, Kalan: ${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
            
            // Çalışma süresine ekle (dakika cinsinden)
            updateStudyTime(Math.floor(adjustedElapsed / 60000));
            
            // Anlık geri bildirim gönder
            setTimeout(() => {
              EventRegister.emit('forceReloadStudyTime', true);
            }, 100);
            
            // Güncel verileri hemen kaydet
            setTimeout(() => {
              const updatedData = {
                ...prev,
                elapsedTime: newElapsedTime,
                startTime: now
              };
              saveTimerData(updatedData);
            }, 0);
          }
        } else if (prev.mode === 'stopwatch') {
          // Eğer gerçek geçen süre 1 saniyeden fazlaysa (arka planda geçen süre)
          if (realElapsed > 1100) { // 1.1 saniye tolerans
            // Maksimum 10 dakika ile sınırla
            const MAX_BACKGROUND_TIME = 10 * 60 * 1000; // 10 dakika
            const adjustedElapsed = Math.min(realElapsed, MAX_BACKGROUND_TIME);
            
            // Kronometre için gerçek geçen süreyi ekle
            newElapsedTime = prev.elapsedTime + adjustedElapsed;
            
            // Sadece önemli değişikliklerde log
            if (adjustedElapsed > 5000) { // 5 saniyeden fazla geçmişse
              const minutes = Math.floor(newElapsedTime / 60000);
              const seconds = Math.floor((newElapsedTime % 60000) / 1000);
              console.log(`[TIMER_LOG] Kronometre güncelleniyor: Yeni süre: ${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
            
            // Çalışma süresine ekle (dakika cinsinden)
            updateStudyTime(Math.floor(adjustedElapsed / 60000));
            
            // Anlık geri bildirim gönder
            setTimeout(() => {
              EventRegister.emit('forceReloadStudyTime', true);
            }, 100);
            
            // Güncel verileri hemen kaydet
            setTimeout(() => {
              const updatedData = {
                ...prev,
                elapsedTime: newElapsedTime,
                startTime: now
              };
              saveTimerData(updatedData);
            }, 0);
          }
        } else if (prev.mode === 'countdown' && prev.totalTime) {
          // Eğer gerçek geçen süre 1 saniyeden fazlaysa (arka planda geçen süre)
          if (realElapsed > 1100) { // 1.1 saniye tolerans
            // Maksimum 10 dakika ile sınırla
            const MAX_BACKGROUND_TIME = 10 * 60 * 1000; // 10 dakika
            const adjustedElapsed = Math.min(realElapsed, MAX_BACKGROUND_TIME);
            
            // Countdown için gerçek geçen süreyi ekle
            newElapsedTime = prev.elapsedTime + adjustedElapsed;
            
            // Süre doldu mu kontrol et
            if (newElapsedTime > prev.totalTime) {
              newElapsedTime = prev.totalTime;
            }
            
            // Sadece önemli değişikliklerde log
            if (adjustedElapsed > 5000) { // 5 saniyeden fazla geçmişse
              const remainingTime = Math.max(0, prev.totalTime - newElapsedTime);
              const minutes = Math.floor(remainingTime / 60000);
              const seconds = Math.floor((remainingTime % 60000) / 1000);
              console.log(`[TIMER_LOG] Geri sayım güncelleniyor: Kalan süre: ${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
            
            // Çalışma süresine ekle (dakika cinsinden)
            updateStudyTime(Math.floor(adjustedElapsed / 60000));
            
            // Anlık geri bildirim gönder
            setTimeout(() => {
              EventRegister.emit('forceReloadStudyTime', true);
            }, 100);
            
            // Güncel verileri hemen kaydet
            setTimeout(() => {
              const updatedData = {
                ...prev,
                elapsedTime: newElapsedTime,
                startTime: now
              };
              saveTimerData(updatedData);
            }, 0);
          }
        }
      }
      
      // Pomodoro veya Countdown modunda ve süre dolduysa
      if ((prev.mode === 'pomodoro' || prev.mode === 'countdown') && 
          prev.totalTime && newElapsedTime >= prev.totalTime) {
        
        // Timer'ı durdur
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Pomodoro için oturum sayısını artır
        if (prev.mode === 'pomodoro') {
          // Pomodoro durumuna göre işlem yap
          if (prev.pomodoroState === 'work') {
            // Çalışma oturumu tamamlandı
            const newCompletedSessions = prev.completedSessions + 1;
            let newPomodoroCount = prev.pomodoroCount;
            let newPomodoroState: 'work' | 'shortBreak' | 'longBreak' = 'shortBreak';
            let newTotalTime = 5 * 60 * 1000; // 5 dakika kısa mola
            
            // 4. çalışma oturumu tamamlandıysa uzun mola ver
            if (prev.pomodoroCount === 4) {
              newPomodoroState = 'longBreak';
              newTotalTime = 30 * 60 * 1000; // 30 dakika uzun mola
              newPomodoroCount = 1; // Döngüyü sıfırla
            } else {
              // Sonraki oturuma geç
              newPomodoroCount = prev.pomodoroCount + 1;
            }
            
            // Çalışma oturumunun tam süresini çalışma süresine ekle (25 dakika)
            const workSessionDuration = prev.totalTime || 25 * 60 * 1000; // 25 dakika çalışma (ms cinsinden)
            const workSessionMinutes = Math.floor(workSessionDuration / 60000);
            updateStudyTime(workSessionMinutes);
            
            // Bildirim gönder
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Pomodoro Tamamlandı!',
                body: `${newCompletedSessions}. çalışma oturumunuz tamamlandı. ${newPomodoroState === 'shortBreak' ? '5 dakika kısa mola' : '30 dakika uzun mola'} zamanı!`,
                data: { type: 'pomodoro_completed', screen: 'timer' },
              },
              trigger: null,
            });
            
            // Bildirim gönder
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Mola Tamamlandı!',
                body: 'Mola süreniz doldu. Şimdi çalışma zamanı!',
                data: { type: 'break_completed', screen: 'timer' },
              },
              trigger: null,
            });
            
            console.log(`[TIMER_LOG] Pomodoro çalışma oturumu tamamlandı, ${newPomodoroState} moduna geçiliyor`);
            
            const newData: TimerData = {
              ...prev,
              isActive: true, // Otomatik olarak molaya başla
              startTime: now,
              elapsedTime: 0,
              completedSessions: newCompletedSessions,
              pomodoroState: newPomodoroState,
              pomodoroCount: newPomodoroCount,
              totalTime: newTotalTime,
            };
            
            // Güncel verileri hemen kaydet
            setTimeout(() => {
              saveTimerData(newData);
            }, 0);
            
            return newData;
          } else if (prev.pomodoroState === 'shortBreak' || prev.pomodoroState === 'longBreak') {
            // Mola tamamlandı, çalışma oturumuna geç
            
            // Bildirim gönder
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Mola Tamamlandı!',
                body: 'Mola süreniz doldu. Şimdi çalışma zamanı!',
                data: { type: 'break_completed', screen: 'timer' },
              },
              trigger: null,
            });
            
            console.log('[TIMER_LOG] Pomodoro mola tamamlandı, çalışma moduna geçiliyor');
            
            const newData: TimerData = {
              ...prev,
              isActive: true, // Otomatik olarak çalışmaya başla
              startTime: now,
              elapsedTime: 0,
              pomodoroState: 'work',
              totalTime: 25 * 60 * 1000, // 25 dakika çalışma
            };
            
            // Güncel verileri hemen kaydet
            setTimeout(() => {
              saveTimerData(newData);
            }, 0);
            
            return newData;
          }
        } else if (prev.mode === 'countdown') {
          // Geri sayım için bildirim
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Geri Sayım Tamamlandı!',
              body: 'Ayarladığınız süre doldu.',
              data: { type: 'countdown_completed', screen: 'timer' },
            },
            trigger: null,
          });
          
          console.log('[TIMER_LOG] Geri sayım tamamlandı');
          
          const newData: TimerData = {
            ...prev,
            isActive: false,
            startTime: null,
            elapsedTime: prev.totalTime || 0,
          };
          
          // Güncel verileri hemen kaydet
          setTimeout(() => {
            saveTimerData(newData);
          }, 0);
          
          return newData;
        }
      }
      
      const newData: TimerData = {
        ...prev,
        elapsedTime: newElapsedTime,
        startTime: now, // Her güncellemede startTime'ı güncelle
      };
      
      // Her 5 saniyede bir verileri kaydet (performans için)
      if (newElapsedTime % 5000 === 0) {
        setTimeout(() => {
          saveTimerData(newData);
        }, 0);
      }
      
      return newData;
    });
  };
  
  useEffect(() => {
    const setupBackgroundTasks = async () => {
      try {
        await registerBackgroundTask();
        await requestBatteryOptimizationExemption();
      } catch (error) {
        if (__DEV__) {
          console.error('Arka plan görevleri ayarlanırken hata:', error);
        }
      }
    };

    setupBackgroundTasks();

    return () => {
      if (__DEV__) {
        console.log('TimerProvider bileşeni kaldırılıyor...');
      }
    };
  }, []);
  
  // Timer aktif olduğunda interval başlat
  useEffect(() => {
    if (timerData.isActive) {
      console.log('Timer aktif, interval başlatılıyor...');
      
      // Önceki interval'i temizle
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Yeni interval başlat
      timerRef.current = setInterval(() => {
        updateElapsedTime();
      }, 1000); // 1 saniye aralıklarla güncelle
      
      console.log('Timer interval başlatıldı');
    } else if (timerRef.current) {
      console.log('Timer pasif, interval durduruluyor...');
      
      // Timer aktif değilse interval'i temizle
      clearInterval(timerRef.current);
      timerRef.current = null;
      
      console.log('Timer interval durduruldu');
    }
    
    // Timer durumu değiştiğinde AsyncStorage'a kaydet
    // Güncel timer verilerini doğrudan al
    saveTimerData(timerData);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log('Timer interval temizlendi (cleanup)');
      }
    };
  }, [timerData.isActive]);
  
  // Timer'ı başlat
  const startTimer = () => {
    const now = Date.now();
    console.log('Timer başlatılıyor...');
    
    setTimerData(prev => {
      const newData = {
        ...prev,
        isActive: true,
        startTime: now,
        pausedTime: null,
      };
      
      console.log('Yeni timer verileri:', JSON.stringify(newData));
      
      // Timer verilerini kaydet
      setTimeout(() => {
        saveTimerData(newData);
      }, 0);
      
      return newData;
    });
  };
  
  // Timer'ı duraklat
  const pauseTimer = () => {
    const now = Date.now();
    console.log('Timer duraklatılıyor...');
    
    setTimerData(prev => {
      // Eğer aktif bir timer varsa ve süre geçmişse, çalışma süresine ekle
      if (prev.isActive && prev.startTime && prev.elapsedTime > 0) {
        const elapsedSinceStart = now - prev.startTime;
        if (elapsedSinceStart > 0) {
          // Çalışma süresine ekle (dakika cinsinden)
          const studyMinutes = Math.floor(elapsedSinceStart / 60000);
          if (studyMinutes > 0) {
            // Asenkron işlem olduğu için setTimeout kullanarak ana thread'i bloklamadan çalıştır
            setTimeout(() => {
              updateStudyTime(studyMinutes);
              // Timer duraklatıldığında çalışma süresi değiştiğini bildirmek için force reload event'i gönder
              setTimeout(() => {
                EventRegister.emit('forceReloadStudyTime', true);
              }, 300);
            }, 0);
          }
        }
      }
      
      const newData = {
        ...prev,
        isActive: false,
        startTime: null,
        pausedTime: now,
      };
      
      console.log('Yeni timer verileri:', JSON.stringify(newData));
      
      // Timer verilerini kaydet
      setTimeout(() => {
        saveTimerData(newData);
      }, 0);
      
      return newData;
    });
  };
  
  // Timer'ı sıfırla
  const resetTimer = () => {
    console.log('Timer sıfırlanıyor...');
    
    setTimerData(prev => {
      // Eğer aktif bir timer varsa ve süre geçmişse, çalışma süresine ekle
      if (prev.isActive && prev.elapsedTime > 0) {
        // Çalışma süresine ekle (dakika cinsinden)
        const studyMinutes = Math.floor(prev.elapsedTime / 60000);
        if (studyMinutes > 0) {
          // Asenkron işlem olduğu için setTimeout kullanarak ana thread'i bloklamadan çalıştır
          setTimeout(() => {
            updateStudyTime(studyMinutes);
            // Timer sıfırlandığında çalışma süresi değiştiğini bildirmek için force reload event'i gönder
            setTimeout(() => {
              EventRegister.emit('forceReloadStudyTime', true);
            }, 300);
          }, 0);
        }
      }
      
      let resetData = {
        ...prev,
        isActive: false,
        startTime: null,
        pausedTime: null,
        elapsedTime: 0,
      };
      
      // Kronometre modunda turları da sıfırla
      if (prev.mode === 'stopwatch') {
        resetData.laps = [];
      }
      
      // Pomodoro modunda durumu sıfırla
      if (prev.mode === 'pomodoro') {
        resetData.pomodoroState = 'work';
        resetData.pomodoroCount = 1;
        resetData.totalTime = 25 * 60 * 1000; // 25 dakika çalışma
      }
      
      console.log('Yeni timer verileri:', JSON.stringify(resetData));
      
      // Timer verilerini kaydet
      setTimeout(() => {
        saveTimerData(resetData);
      }, 0);
      
      return resetData;
    });
  };
  
  // Kronometre için tur ekle
  const addLap = () => {
    if (timerData.mode === 'stopwatch' && timerData.isActive) {
      setTimerData(prev => ({
        ...prev,
        laps: [...prev.laps, prev.elapsedTime],
      }));
    }
  };
  
  // Timer modunu değiştir
  const setTimerMode = (mode: TimerMode) => {
    console.log(`Timer modu değiştiriliyor: ${mode}`);
    
    setTimerData(prev => {
      const newData = {
        ...defaultTimerData,
        mode,
      };
      
      // Pomodoro için varsayılan süre
      if (mode === 'pomodoro') {
        newData.totalTime = 25 * 60 * 1000; // 25 dakika
        newData.pomodoroState = 'work';
        newData.pomodoroCount = 1;
      }
      
      console.log('Yeni timer verileri:', JSON.stringify(newData));
      
      // Timer verilerini kaydet
      setTimeout(() => {
        saveTimerData(newData);
      }, 0);
      
      return newData;
    });
  };
  
  // Toplam süreyi ayarla (Countdown için)
  const setTotalTime = (seconds: number) => {
    console.log(`Toplam süre ayarlanıyor: ${seconds} saniye`);
    
    setTimerData(prev => {
      const newData = {
        ...prev,
        totalTime: seconds * 1000, // ms'ye çevir
      };
      
      console.log('Yeni timer verileri:', JSON.stringify(newData));
      
      // Timer verilerini kaydet
      setTimeout(() => {
        saveTimerData(newData);
      }, 0);
      
      return newData;
    });
  };
  
  // Zamanı formatlı göster
  const formatTime = (ms: number) => {
    if (timerData.mode === 'stopwatch') {
      // Kronometre formatı: HH:MM:SS (salise kaldırıldı, saat eklendi)
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      
      // Kronometre çalışma süresi her dakika geçtiğinde çalışma süresini güncelle
      if (timerData.isActive) {
        // Her tam dakika geçtiğinde
        const elapsedMinutes = Math.floor(timerData.elapsedTime / 60000);
        const previousMinutes = Math.floor((timerData.elapsedTime - 1000) / 60000);
        
        // Eğer yeni bir dakikaya geçtiyse çalışma süresini güncelle
        if (elapsedMinutes > previousMinutes) {
          // Her dakika çalışma süresini güncelleyelim
          setTimeout(() => {
            updateStudyTime(1); // 1 dakika ekle
            
            // Güncelleme bildirimini hemen gönder
            setTimeout(() => {
              EventRegister.emit('forceReloadStudyTime', true);
            }, 100);
          }, 0);
        }
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (timerData.mode === 'pomodoro' || timerData.mode === 'countdown') {
      // Pomodoro ve Countdown formatı: MM:SS
      if (timerData.totalTime) {
        // Kalan süreyi hesapla
        const remainingTime = timerData.mode === 'countdown' 
          ? Math.max(0, ms) 
          : Math.max(0, timerData.totalTime - timerData.elapsedTime);
        
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        
        // Pomodoro çalışma süresi her dakika geçtiğinde çalışma süresini güncelle
        if (timerData.mode === 'pomodoro' && timerData.pomodoroState === 'work' && timerData.isActive) {
          // Her tam dakikaya geçtiğinde
          const elapsedMinutes = Math.floor(timerData.elapsedTime / 60000);
          const previousMinutes = Math.floor((timerData.elapsedTime - 1000) / 60000);
          
          // Eğer yeni bir dakikaya geçtiyse çalışma süresini güncelle
          if (elapsedMinutes > previousMinutes) {
            // Her dakika çalışma süresini güncelleyelim
            setTimeout(() => {
              updateStudyTime(1); // 1 dakika ekle
              
              // Güncelleme bildirimini hemen gönder
              setTimeout(() => {
                EventRegister.emit('forceReloadStudyTime', true);
              }, 100);
            }, 0);
          }
        }
        // Countdown modu için de her dakika süre güncellemesi yap
        else if (timerData.mode === 'countdown' && timerData.isActive) {
          // Countdown'da geçen süreyi ölç
          const elapsedMinutes = Math.floor(timerData.elapsedTime / 60000);
          const previousMinutes = Math.floor((timerData.elapsedTime - 1000) / 60000);
          
          // Eğer yeni bir dakikaya geçtiyse çalışma süresini güncelle
          if (elapsedMinutes > previousMinutes) {
            // Her dakika çalışma süresini güncelleyelim
            setTimeout(() => {
              updateStudyTime(1); // 1 dakika ekle
              
              // Güncelleme bildirimini hemen gönder
              setTimeout(() => {
                EventRegister.emit('forceReloadStudyTime', true);
              }, 100);
            }, 0);
          }
        }
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        // Eğer totalTime yoksa, geçen süreyi göster
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } else {
      // Varsayılan format: MM:SS
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };
  
  // İlerleme yüzdesini hesapla
  const getProgress = () => {
    if (timerData.mode === 'stopwatch') {
      // Kronometre için ilerleme yok, sabit değer döndür
      return 1;
    } else if (timerData.totalTime) {
      // Pomodoro ve Countdown için ilerleme
      if (timerData.mode === 'countdown') {
        // Geri sayım için kalan süre yüzdesi
        const remainingTime = Math.max(0, timerData.totalTime - timerData.elapsedTime);
        return remainingTime / timerData.totalTime;
      } else {
        // Pomodoro için geçen süre yüzdesi
        return Math.min(timerData.elapsedTime / timerData.totalTime, 1);
      }
    }
    
    return 0;
  };
  
  // Pomodoro oturumunu atla
  const skipPomodoroSession = () => {
    console.log('[TIMER_LOG] Pomodoro oturumu atlanıyor');
    
    setTimerData(prev => {
      // Sadece pomodoro modunda çalışsın
      if (prev.mode !== 'pomodoro') return prev;
      
      const now = Date.now();
      let newPomodoroState: 'work' | 'shortBreak' | 'longBreak';
      let newTotalTime: number;
      let newCompletedSessions = prev.completedSessions;
      let newPomodoroCount = prev.pomodoroCount;
      
      // Mevcut duruma göre bir sonraki durumu belirle
      if (prev.pomodoroState === 'work') {
        // Çalışma oturumunu atla, molaya geç
        // Çalışma oturumu tamamlandığında sayıları güncelle
        newCompletedSessions = prev.completedSessions + 1;
        
        // 4. çalışma oturumu tamamlandıysa uzun mola ver
        if (prev.pomodoroCount === 4) {
          newPomodoroState = 'longBreak';
          newTotalTime = 30 * 60 * 1000; // 30 dakika uzun mola
          newPomodoroCount = 1; // Döngüyü sıfırla
        } else {
          // Kısa mola
          newPomodoroState = 'shortBreak';
          newTotalTime = 5 * 60 * 1000; // 5 dakika kısa mola
          newPomodoroCount = prev.pomodoroCount + 1;
        }
        
        // Çalışma oturumunun tam süresini çalışma süresine ekle (25 dakika)
        const workSessionDuration = prev.totalTime || 25 * 60 * 1000; // 25 dakika çalışma (ms cinsinden)
        const workSessionMinutes = Math.floor(workSessionDuration / 60000);
        updateStudyTime(workSessionMinutes);
        
        // Bildirim gönder
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Pomodoro Oturumu Atlandı',
            body: `${newCompletedSessions}. çalışma oturumunuz tamamlandı. ${newPomodoroState === 'shortBreak' ? '5 dakika kısa mola' : '30 dakika uzun mola'} zamanı!`,
            data: { type: 'pomodoro_skipped', screen: 'timer' },
          },
          trigger: null,
        });
      } else {
        // Mola oturumunu atla, çalışmaya geç
        newPomodoroState = 'work';
        newTotalTime = 25 * 60 * 1000; // 25 dakika çalışma
        
        // Bildirim gönder
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Mola Atlandı',
            body: 'Mola oturumunuz atlandı. Şimdi çalışma zamanı!',
            data: { type: 'break_skipped', screen: 'timer' },
          },
          trigger: null,
        });
      }
      
      const newData: TimerData = {
        ...prev,
        isActive: true, // Otomatik olarak başlat
        startTime: now,
        elapsedTime: 0,
        completedSessions: newCompletedSessions,
        pomodoroState: newPomodoroState,
        pomodoroCount: newPomodoroCount,
        totalTime: newTotalTime,
      };
      
      // Güncel verileri hemen kaydet
      setTimeout(() => {
        saveTimerData(newData);
      }, 0);
      
      return newData;
    });
  };
  
  // Çalışma süresini güncelle
  const updateStudyTime = async (additionalMinutes: number) => {
    if (additionalMinutes <= 0) return;
    
    try {
      // Şu anki tarih/saat
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      const currentWeek = getWeekNumber(now);
      const currentMonth = now.getMonth() + 1; // 1-12 arası
      const currentYear = now.getFullYear();
      
      // Son güncelleme tarihini al
      const lastUpdateStr = await AsyncStorage.getItem(LAST_UPDATE_KEY);
      let lastUpdate = lastUpdateStr ? new Date(lastUpdateStr) : null;
      
      // Toplam çalışma süresini güncelle
      const storedTime = await AsyncStorage.getItem(STUDY_TIME_KEY);
      let totalTime = storedTime ? parseInt(storedTime) : 0;
      totalTime += additionalMinutes;
      await AsyncStorage.setItem(STUDY_TIME_KEY, totalTime.toString());
      
      // Günlük çalışma süresini güncelle
      const dailyDataStr = await AsyncStorage.getItem(DAILY_STUDY_KEY);
      let dailyData = dailyDataStr ? JSON.parse(dailyDataStr) : {};
      
      if (!dailyData[today]) {
        dailyData[today] = 0;
      }
      dailyData[today] += additionalMinutes;
      await AsyncStorage.setItem(DAILY_STUDY_KEY, JSON.stringify(dailyData));
      
      // Haftalık çalışma süresini güncelle
      const weekKey = `${currentYear}-W${currentWeek}`;
      const weeklyDataStr = await AsyncStorage.getItem(WEEKLY_STUDY_KEY);
      let weeklyData = weeklyDataStr ? JSON.parse(weeklyDataStr) : {};
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = 0;
      }
      weeklyData[weekKey] += additionalMinutes;
      await AsyncStorage.setItem(WEEKLY_STUDY_KEY, JSON.stringify(weeklyData));
      
      // Aylık çalışma süresini güncelle
      const monthKey = `${currentYear}-${currentMonth}`;
      const monthlyDataStr = await AsyncStorage.getItem(MONTHLY_STUDY_KEY);
      let monthlyData = monthlyDataStr ? JSON.parse(monthlyDataStr) : {};
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += additionalMinutes;
      await AsyncStorage.setItem(MONTHLY_STUDY_KEY, JSON.stringify(monthlyData));
      
      // Son güncelleme tarihini kaydet
      await AsyncStorage.setItem(LAST_UPDATE_KEY, now.toISOString());
      
      // Çalışma süresi güncellendiğinde bir olay yayınla
      // Bu, profil sayfasının anında güncellenebilmesi için kullanılacak
      EventRegister.emit('studyTimeUpdated', {
        totalTime,
        dailyTime: dailyData[today],
        weeklyTime: weeklyData[weekKey],
        monthlyTime: monthlyData[monthKey]
      });
      
      console.log(`[TIMER_LOG] Çalışma süresi güncellendi: +${additionalMinutes} dakika, Toplam: ${totalTime} dakika`);
    } catch (error) {
      console.error('Çalışma süresi güncellenirken hata oluştu:', error);
    }
  };
  
  // Haftanın numarasını hesapla (1-53 arası)
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Pomodoro oturumu tamamlandığında çalışma süresini güncelle
  const handlePomodoroSessionComplete = async () => {
    // Bu fonksiyon artık başka yerde çağrıldığı için burayı boş bırakıyoruz
    // Çalışma süresine ekle işlemi diğer yerlerde yapılıyor
  };
  
  // Bildirim kanalı oluştur
  const setupNotifications = async () => {
    try {
      // Web platformunda bildirim izinlerini kontrol etme
      if (Platform.OS === 'web') {
        console.log('Web platformunda bildirimler farklı şekilde yapılandırılmalıdır.');
        return;
      }
      
      // İzinleri kontrol et
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // İzin yoksa iste
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // İzin verilmediyse çık
      if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi!');
        return;
      }
      
      // Android için bildirim kanalı oluştur
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(TIMER_NOTIFICATION_CHANNEL, {
          name: 'Timer Bildirimleri',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Bildirim ayarları yapılandırılırken hata oluştu:', error);
    }
  };
  
  // Arka plan görevini kaydet
  const registerBackgroundTask = async () => {
    try {
      // Web platformunda bu fonksiyonu çalıştırma
      if (Platform.OS === 'web') {
        console.log('Arka plan görevi web platformunda desteklenmiyor.');
        return;
      }
      
      // Foreground Service için bildirim kanalı oluştur
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('timer_foreground', {
          name: 'Timer Servisi',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          sound: 'default', // String olarak ayarla
          enableVibrate: false, // Titreşim kapalı
        });
      }
      
      // BackgroundFetch.registerTaskAsync için özel tip tanımlaması
      interface ExtendedBackgroundFetchOptions extends BackgroundFetch.BackgroundFetchOptions {
        foregroundService?: {
          notificationTitle: string;
          notificationBody: string;
          notificationColor?: string;
          icon?: string;
        };
      }
      
      const options: ExtendedBackgroundFetchOptions = {
        minimumInterval: 60, // 1 dakika (saniye cinsinden)
        stopOnTerminate: false,
        startOnBoot: true,
      };
      
      // Android için Foreground Service ekle
      if (Platform.OS === 'android') {
        options.foregroundService = {
          notificationTitle: 'MEB AGS Zamanlayıcı',
          notificationBody: 'Zamanlayıcı arka planda çalışıyor. Bildirimler sadece önemli anlarda gösterilecek.',
          notificationColor: '#3b82f6',
          icon: 'ic_launcher_foreground'
          // notificationIntent özelliği tanımlı olmadığı için kaldırıldı
        };
      }
      
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, options);
      console.log('Arka plan görevi kaydedildi');
      
      // Pil optimizasyonu muafiyeti için kullanıcıyı yönlendir
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        requestBatteryOptimizationExemption();
      }
    } catch (error) {
      console.error('Arka plan görevi kaydedilemedi:', error);
    }
  };
  
  return (
    <TimerContext.Provider
      value={{
        timerData,
        startTimer,
        pauseTimer,
        resetTimer,
        addLap,
        setTimerMode,
        setTotalTime,
        formatTime,
        getProgress,
        skipPomodoroSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

// Hook kullanımı için
export const useTimer = () => {
  const context = useContext(TimerContext);
  
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  
  return context;
}; 