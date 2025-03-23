import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LogOut, Settings, Bell, CircleHelp as HelpCircle, Shield, Star, Camera, Globe, Palette, MessageSquare, Award, BookOpen, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStats } from '../../context/StatsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import theme from '../../constants/theme';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { SharedElement } from 'react-navigation-shared-element';
import { EventRegister } from 'react-native-event-listeners';

// AsyncStorage anahtarı
const PROFILE_IMAGE_KEY = 'meb-ags-profile-image';
const STUDY_TIME_KEY = 'meb-ags-study-time'; // Çalışma süresi için anahtar
const DAILY_STUDY_KEY = 'meb-ags-daily-study'; // Günlük çalışma süresi için anahtar
const WEEKLY_STUDY_KEY = 'meb-ags-weekly-study'; // Haftalık çalışma süresi için anahtar
const MONTHLY_STUDY_KEY = 'meb-ags-monthly-study'; // Aylık çalışma süresi için anahtar

export default function ProfileScreen() {
  const router = useRouter();
  const { stats } = useStats();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [studyTimeMinutes, setStudyTimeMinutes] = useState<number>(0);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(0);
  const [weekStudyMinutes, setWeekStudyMinutes] = useState<number>(0);
  const [monthStudyMinutes, setMonthStudyMinutes] = useState<number>(0);
  // Interval için ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Profil fotoğrafını AsyncStorage'dan yükle
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
        if (savedImage) {
          setProfileImage(savedImage);
        } else {
          // Varsayılan profil fotoğrafı yok, null olarak bırak
          setProfileImage(null);
        }
      } catch (error) {
        console.error('Profil fotoğrafı yüklenirken hata oluştu:', error);
        // Hata durumunda null olarak bırak
        setProfileImage(null);
      }
    };
    
    loadProfileImage();
  }, []);

  // Çalışma süresini yükle
  const loadStudyTime = async () => {
    try {
      // Toplam çalışma süresi
      const storedTime = await AsyncStorage.getItem(STUDY_TIME_KEY);
      if (storedTime) {
        setStudyTimeMinutes(parseInt(storedTime));
      }
      
      // Bugünkü çalışma süresi
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı
      const dailyDataStr = await AsyncStorage.getItem(DAILY_STUDY_KEY);
      if (dailyDataStr) {
        const dailyData = JSON.parse(dailyDataStr);
        setTodayStudyMinutes(dailyData[today] || 0);
      }
      
      // Bu haftaki çalışma süresi
      const currentWeek = getWeekNumber(new Date());
      const currentYear = new Date().getFullYear();
      const weekKey = `${currentYear}-W${currentWeek}`;
      const weeklyDataStr = await AsyncStorage.getItem(WEEKLY_STUDY_KEY);
      if (weeklyDataStr) {
        const weeklyData = JSON.parse(weeklyDataStr);
        setWeekStudyMinutes(weeklyData[weekKey] || 0);
      }
      
      // Bu ayki çalışma süresi
      const currentMonth = new Date().getMonth() + 1; // 1-12 arası
      const monthKey = `${currentYear}-${currentMonth}`;
      const monthlyDataStr = await AsyncStorage.getItem(MONTHLY_STUDY_KEY);
      if (monthlyDataStr) {
        const monthlyData = JSON.parse(monthlyDataStr);
        setMonthStudyMinutes(monthlyData[monthKey] || 0);
      }
    } catch (error) {
      console.error('Çalışma süresi yüklenirken hata oluştu:', error);
    }
  };

  // İlk yüklemede çalışma süresini al
  useEffect(() => {
    // İlk yükleme
    loadStudyTime();
    
    // EventRegister dinleyicisi ekle - çalışma süresi güncellendiğinde tetiklenecek
    const studyTimeListener = EventRegister.addEventListener('studyTimeUpdated', (data: any) => {
      console.log('[PROFILE] Çalışma süresi olayı alındı:', data);
      if (data) {
        // Gelen verileri doğrudan state'e uygula - AsyncStorage'dan tekrar yüklemeye gerek kalmadan
        setStudyTimeMinutes(data.totalTime || 0);
        setTodayStudyMinutes(data.dailyTime || 0);
        setWeekStudyMinutes(data.weeklyTime || 0);
        setMonthStudyMinutes(data.monthlyTime || 0);
        console.log('[PROFILE] Çalışma süresi EventRegister ile güncellendi');
      }
    });
    
    // Timer duraklatıldığında veya sıfırlandığında güncelleme al
    const forceReloadListener = EventRegister.addEventListener('forceReloadStudyTime', () => {
      console.log('[PROFILE] Çalışma süresi zorla güncelleniyor');
      loadStudyTime();
    });
    
    // Başlangıçta verileri yükle
    const loadInitialData = async () => {
      await loadStudyTime();
      console.log('[PROFILE] İlk veri yüklendi');
    };

    loadInitialData();
    
    // Bileşen kaldırıldığında dinleyicileri temizle
    return () => {
      EventRegister.removeEventListener(studyTimeListener as unknown as string);
      EventRegister.removeEventListener(forceReloadListener as unknown as string);
    };
  }, []);

  // Periyodik olarak çalışma sürelerini güncelle (60 saniyede bir)
  useEffect(() => {
    // Interval başlat
    timerRef.current = setInterval(() => {
      loadStudyTime();
    }, 60000); // 60 saniyede bir çalışma sürelerini güncelle
    
    // Sayfa kapatıldığında interval'ı temizle
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Haftanın numarasını hesapla (1-53 arası)
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Tamamlanan konular sayısını hesapla
  const completedTopics = useMemo(() => {
    // Konu ilerlemesi olan derslerin sayısı
    return Object.keys(stats.subjectProgress).length;
  }, [stats.subjectProgress]);
  
  // Toplam çalışma saatini hesapla
  const totalStudyHours = useMemo(() => {
    // Dakikayı saate çevir (aşağı yuvarlama)
    return Math.floor(studyTimeMinutes / 60);
  }, [studyTimeMinutes]);
  
  const handleLogout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      // Navigate to login screen
      router.replace('/');
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleChangeProfilePhoto = async () => {
    // Kullanıcıya kamera veya galeri seçeneği sun
    Alert.alert(
      "Profil Fotoğrafı",
      "Profil fotoğrafınızı nasıl değiştirmek istersiniz?",
      [
        { 
          text: "Kamera", 
          onPress: async () => {
            // Kamera izinlerini kontrol et
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
              return;
            }
            
            // Kamerayı başlat
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const newProfileImage = result.assets[0].uri;
              setProfileImage(newProfileImage);
              
              // AsyncStorage'a kaydet
              try {
                await AsyncStorage.setItem(PROFILE_IMAGE_KEY, newProfileImage);
              } catch (error) {
                console.error('Profil fotoğrafı kaydedilirken hata oluştu:', error);
              }
            }
          }
        },
        { 
          text: "Galeri", 
          onPress: async () => {
            // Galeri izinlerini kontrol et
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
              return;
            }
            
            // Galeriyi başlat
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const newProfileImage = result.assets[0].uri;
              setProfileImage(newProfileImage);
              
              // AsyncStorage'a kaydet
              try {
                await AsyncStorage.setItem(PROFILE_IMAGE_KEY, newProfileImage);
              } catch (error) {
                console.error('Profil fotoğrafı kaydedilirken hata oluştu:', error);
              }
            }
          }
        },
        { 
          text: "İptal", 
          style: "cancel" 
        }
      ]
    );
  };

  // Rozet hesaplama
  const calculateBadge = () => {
    // Toplam çalışma saati üzerinden rozet belirle
    if (studyTimeMinutes >= 50 * 60) { // 50 saat ve üzeri
      return {
        text: "Efsane",
        color: "#f43f5e",
        icon: "Award"
      };
    } else if (studyTimeMinutes >= 25 * 60) { // 25 saat ve üzeri
      return {
        text: "Usta",
        color: "#8b5cf6",
        icon: "Shield"
      };
    } else if (studyTimeMinutes >= 10 * 60) { // 10 saat ve üzeri
      return {
        text: "Tecrübeli",
        color: "#10b981",
        icon: "BookOpen"
      };
    } else {
      return {
        text: "Çaylak",
        color: "#3b82f6",
        icon: "Star"
      };
    }
  };

  const badge = calculateBadge();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerButton}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerButton}
        >
          <LogOut color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'android' ? 32 : 16 }
        ]}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        overScrollMode="always"
        bounces={true}
        alwaysBounceVertical={true}
        decelerationRate="normal"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.profileImage, styles.defaultProfileImage]}>
                  <Text style={styles.defaultProfileImageText}>Fotoğraf Ekle</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleChangeProfilePhoto}
              >
                <Camera color="#fff" size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Misafir Kullanıcı</Text>
              <Text style={styles.profileEmail}>misafir@example.com</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: badge.color }]}>
                  {badge.icon === "Award" && <Award color="#fff" size={12} style={{ marginRight: 4 }} />}
                  {badge.icon === "Shield" && <Shield color="#fff" size={12} style={{ marginRight: 4 }} />}
                  {badge.icon === "BookOpen" && <BookOpen color="#fff" size={12} style={{ marginRight: 4 }} />}
                  {badge.icon === "Star" && <Star color="#fff" size={12} style={{ marginRight: 4 }} />}
                  <Text style={styles.badgeText}>{badge.text}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{completedTopics}</Text>
              <Text style={styles.statsLabel}>Çalışılan{'\n'}Konular</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{totalStudyHours}</Text>
              <Text style={styles.statsLabel}>Toplam{'\n'}Çalışma Saati</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{Math.round((stats.totalRepetitions || 0) / 10)}</Text>
              <Text style={styles.statsLabel}>Seviye</Text>
            </View>
          </View>
          
          {/* Çalışma Süreleri */}
          <View style={styles.studyTimeContainer}>
            <Text style={styles.studyTimeTitle}>Çalışma Sürelerim</Text>
            <View style={styles.studyTimeGrid}>
              <View style={[styles.studyTimeCard, {borderColor: '#10b981'}]}>
                <View style={styles.timeValueContainer}>
                  <Text style={[styles.studyTimeValue, { color: '#10b981' }]}>{Math.floor(todayStudyMinutes / 60)}</Text>
                  <Text style={styles.timeUnitSuffix}>saat</Text>
                  
                  <Text style={[styles.studyTimeValue, { color: '#10b981', marginTop: 4 }]}>{Math.floor(todayStudyMinutes % 60)}</Text>
                  <Text style={styles.timeUnitSuffix}>dakika</Text>
                </View>
                <Text style={styles.studyTimeLabel}>Bugün</Text>
              </View>
              
              <View style={[styles.studyTimeCard, {borderColor: '#3b82f6'}]}>
                <View style={styles.timeValueContainer}>
                  <Text style={[styles.studyTimeValue, { color: '#3b82f6' }]}>{Math.floor(weekStudyMinutes / 60)}</Text>
                  <Text style={styles.timeUnitSuffix}>saat</Text>
                  
                  <Text style={[styles.studyTimeValue, { color: '#3b82f6', marginTop: 4 }]}>{Math.floor(weekStudyMinutes % 60)}</Text>
                  <Text style={styles.timeUnitSuffix}>dakika</Text>
                </View>
                <Text style={styles.studyTimeLabel}>Hafta</Text>
              </View>
              
              <View style={[styles.studyTimeCard, {borderColor: '#8b5cf6'}]}>
                <View style={styles.timeValueContainer}>
                  <Text style={[styles.studyTimeValue, { color: '#8b5cf6' }]}>{Math.floor(monthStudyMinutes / 60)}</Text>
                  <Text style={styles.timeUnitSuffix}>saat</Text>
                  
                  <Text style={[styles.studyTimeValue, { color: '#8b5cf6', marginTop: 4 }]}>{Math.floor(monthStudyMinutes % 60)}</Text>
                  <Text style={styles.timeUnitSuffix}>dakika</Text>
                </View>
                <Text style={styles.studyTimeLabel}>Ay</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#3b82f6' }]}>
                <Settings color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Uygulama Ayarları</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/notification-settings')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#f59e0b' }]}>
                <Bell color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Bildirim Ayarları</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert("Yardım Merkezi", "Bu özellik yakında kullanıma sunulacaktır.")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#10b981' }]}>
                <HelpCircle color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Yardım Merkezi</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert("Gizlilik Politikası", "Bu özellik yakında kullanıma sunulacaktır.")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#6366f1' }]}>
                <Shield color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Gizlilik Politikası</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert("Geri Bildirim", "Görüşleriniz bizim için değerli. Yakında bu özellik aktif olacaktır.")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#0ea5e9' }]}>
                <MessageSquare color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Geri Bildirim Gönder</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert("Uygulama Değerlendirme", "Bu özellik yakında kullanıma sunulacaktır.")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#ef4444' }]}>
                <Star color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Uygulamayı Değerlendir</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Versiyon 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.select({ 
      android: 32,
      ios: 16 
    }),
  },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  cameraButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
    }),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
  studyTimeContainer: {
    backgroundColor: '#273549',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  studyTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  studyTimeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studyTimeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    height: 170,
    justifyContent: 'space-between',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
    }),
  },
  timeValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyTimeValue: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeUnitSuffix: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  studyTimeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 12,
    textAlign: 'center',
  },
  versionInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#64748b',
  },
  headerButton: {
    padding: 8,
  },
  defaultProfileImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfileImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});