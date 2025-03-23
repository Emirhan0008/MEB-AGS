import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';

// Bildirim ayarları için tip tanımlaması
type NotificationSettings = {
  enabled: boolean;
  studyReminders: boolean;
  studyReminderTime: string; // HH:MM formatında
  examReminders: boolean;
  weeklyReports: boolean;
};

// Context için tip tanımlaması
type NotificationContextType = {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  scheduleStudyReminder: (time: string) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
};

// Varsayılan bildirim ayarları
const defaultSettings: NotificationSettings = {
  enabled: true,
  studyReminders: false,
  studyReminderTime: '18:00',
  examReminders: false,
  weeklyReports: false,
};

// Context oluşturma
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Bildirim yapılandırması
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  // Uygulama başladığında ayarları yükle
  useEffect(() => {
    loadSettings();
    registerForPushNotifications();
    
    // Bildirim dinleyicilerini ayarla
    setupNotificationListeners();
    
    return () => {
      // Temizleme işlemleri
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // AsyncStorage'dan ayarları yükle
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Bildirim ayarları yüklenirken hata oluştu:', error);
    }
  };

  // Ayarları güncelle ve kaydet
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));

      // Bildirimler devre dışı bırakıldıysa tüm bildirimleri iptal et
      if (newSettings.enabled === false) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      // Çalışma hatırlatıcıları devre dışı bırakıldıysa ilgili bildirimleri iptal et
      else if (newSettings.studyReminders === false) {
        // Burada sadece çalışma hatırlatıcılarını iptal etmek için bir mekanizma gerekebilir
        // Şu an için basitlik adına tüm bildirimleri iptal edip, diğerlerini yeniden planlayabiliriz
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (updatedSettings.enabled) {
          if (updatedSettings.studyReminders) {
            await scheduleStudyReminder(updatedSettings.studyReminderTime);
          }
          // Diğer bildirim türlerini de burada yeniden planlayabiliriz
        }
      }
      // Çalışma hatırlatıcıları etkinleştirildi veya zamanı değiştiyse yeniden planla
      else if (newSettings.studyReminders === true || newSettings.studyReminderTime) {
        if (updatedSettings.enabled && updatedSettings.studyReminders) {
          await scheduleStudyReminder(updatedSettings.studyReminderTime);
        }
      }
    } catch (error) {
      console.error('Bildirim ayarları güncellenirken hata oluştu:', error);
    }
  };

  // Push bildirimleri için izin iste ve token al
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Eğer izin yoksa, izin iste
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // İzin verilmediyse çık
      if (finalStatus !== 'granted') {
        setSettings(prev => ({ ...prev, enabled: false }));
        return;
      }

      // Expo push token al
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: '33db789f-0343-400e-9f61-1f2a780f1486', // app.json'dan alınan projectId
      })).data;
      setExpoPushToken(token);

      // Android için kanal oluştur
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Push bildirimleri için kayıt olurken hata oluştu:', error);
    }
  };

  // Bildirim izinlerini iste
  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setSettings(prev => ({ ...prev, enabled: granted }));
      return granted;
    } catch (error) {
      console.error('Bildirim izinleri istenirken hata oluştu:', error);
      return false;
    }
  };

  // Çalışma hatırlatıcısı planla
  const scheduleStudyReminder = async (time: string) => {
    try {
      // Önceki çalışma hatırlatıcılarını iptal et
      // İdeal olarak, her bildirim türü için ayrı bir tanımlayıcı kullanılmalıdır
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Zamanı parçala
      const [hours, minutes] = time.split(':').map(Number);

      // Bildirim tetikleyicisini DailyTriggerInput tipinde oluştur
      const trigger: Notifications.DailyTriggerInput = {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes
      };

      // Bildirimi planla
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Çalışma Zamanı!',
          body: 'Bugünkü çalışma planınızı tamamlamak için harika bir zaman. Hemen başlayın!',
          data: { type: 'study_reminder' },
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('Çalışma hatırlatıcısı planlanırken hata oluştu:', error);
      return '';
    }
  };

  // Belirli bir bildirimi iptal et
  const cancelNotification = async (id: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Bildirim iptal edilirken hata oluştu:', error);
    }
  };

  // Bildirim dinleyicilerini ayarla
  const setupNotificationListeners = () => {
    // Bildirim alındığında
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    // Bildirime yanıt verildiğinde (tıklandığında)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirime tıklandı:', response);
      
      const data = response.notification.request.content.data;
      
      // Bildirim verilerine göre yönlendirme yap
      if (data && data.screen) {
        if (data.screen === 'timer') {
          router.push({
            pathname: '/(tabs)/timer' as any
          });
        } else if (data.screen === 'subjects') {
          router.push({
            pathname: '/(tabs)' as any
          });
        } else if (data.screen === 'stats') {
          router.push({
            pathname: '/(tabs)/stats' as any
          });
        }
      }
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        settings,
        updateSettings,
        scheduleStudyReminder,
        cancelNotification,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Context hook'u
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};