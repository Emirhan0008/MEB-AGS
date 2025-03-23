import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatsProvider } from '../context/StatsContext';
import { NotificationProvider } from '../context/NotificationContext';
import { TimerProvider } from '../context/TimerContext';
import * as Updates from 'expo-updates';
import { Alert, AppState, Platform } from 'react-native';
import Constants from 'expo-constants';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.frameworkReady?.();
    }
    
    // Güncellemeleri kontrol et
    async function checkForUpdates() {
      try {
        // Expo Go'da çalışıyorsa güncelleme kontrolünü atla
        const isExpoGo = Constants.appOwnership === 'expo';
        if (isExpoGo) {
          console.log('Expo Go ortamında güncellemeler desteklenmez.');
          return;
        }
        
        console.log('Güncellemeler kontrol ediliyor... (Branch: production)');
        const update = await Updates.checkForUpdateAsync();
        console.log('Güncelleme mevcut mu:', update.isAvailable);
        
        if (update.isAvailable) {
          console.log('Güncelleme indiriliyor...');
          await Updates.fetchUpdateAsync();
          
          // Kullanıcıya bilgi ver ve yeniden başlatmayı onayla
          Alert.alert(
            'Güncelleme Hazır',
            'Yeni bir güncelleme indirildi. Uygulamayı yeniden başlatmak istiyor musunuz?',
            [
              {
                text: 'Daha Sonra',
                style: 'cancel',
              },
              {
                text: 'Şimdi Yenile',
                onPress: async () => {
                  console.log('Uygulama yeniden başlatılıyor...');
                  await Updates.reloadAsync();
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          console.log('Yeni güncelleme bulunamadı.');
        }
      } catch (error) {
        console.log('Güncelleme kontrolü sırasında hata oluştu:', error);
      }
    }
    
    // Uygulama başlatıldığında güncellemeleri kontrol et
    checkForUpdates();
    
    // Uygulama ön plana geldiğinde güncellemeleri kontrol et
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('Uygulama ön plana geldi, güncellemeler kontrol ediliyor...');
        checkForUpdates();
      }
    });
    
    // Temizleme fonksiyonu
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatsProvider>
        <NotificationProvider>
          <TimerProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ redirect: true }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="notification-settings" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  animationDuration: 300
                }} 
              />
              <Stack.Screen name="subjects" />
              <Stack.Screen name="subject-detail" />
            </Stack>
          </TimerProvider>
        </NotificationProvider>
      </StatsProvider>
    </SafeAreaProvider>
  );
}