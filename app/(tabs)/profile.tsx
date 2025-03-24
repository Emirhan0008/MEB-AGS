import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform, ActivityIndicator, Modal, TextInput, Clipboard, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LogOut, Settings, Bell, CircleHelp as HelpCircle, Shield, Star, Camera, Globe, Palette, MessageSquare, Award, BookOpen, ArrowLeft, Download, Upload, Save } from 'lucide-react-native';
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';

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
  
  // Yedekleme durumunu takip eden state
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
  
  // Yedek içe aktarma modal'ı için state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [backupJsonText, setBackupJsonText] = useState('');
  const [backupFilePath, setBackupFilePath] = useState('');
  
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

  // AsyncStorage'daki tüm verileri yedekle
  const backupAllData = async () => {
    try {
      setIsBackupInProgress(true);
      
      // Yedekleme dizini oluştur
      const backupDate = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const backupFileName = `meb-ags-yedek-${backupDate}.mebags`;
      const tempBackupDir = FileSystem.cacheDirectory + backupFileName + '/';
      
      // Dizini temizle ve yeniden oluştur
      const dirInfo = await FileSystem.getInfoAsync(tempBackupDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(tempBackupDir);
      }
      await FileSystem.makeDirectoryAsync(tempBackupDir, { intermediates: true });
      
      // 1. AsyncStorage verilerini yedekle
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToExclude = ['@battery_warning_shown']; // Yedeklenmesi gerekmeyen anahtarlar
      const keysToBackup = allKeys.filter(key => !keysToExclude.includes(key));
      const allData = await AsyncStorage.multiGet(keysToBackup);
      
      // Verileri JSON'a dönüştür - güvenli bir şekilde parse etmeye çalış
      const safeData = allData.map(([key, value]) => {
        try {
          if (value === null || value === undefined) {
            return { key, value: null };
          }
          
          const parsedValue = JSON.parse(value);
          return { key, value: parsedValue };
        } catch (parseError) {
          console.log(`${key} için JSON parse hatası, orijinal değer kullanılıyor:`, parseError);
          return { key, value: value };
        }
      });
      
      const backupData = {
        timestamp: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version || '1.0.0',
        platform: Platform.OS,
        data: safeData
      };
      
      // Meta veri dosyasını oluştur
      const metaFilePath = tempBackupDir + 'meta.json';
      await FileSystem.writeAsStringAsync(metaFilePath, JSON.stringify(backupData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      // 2. Profil fotoğrafını yedekle
      let backupImageList = [];
      if (profileImage) {
        const profileImgExt = profileImage.split('.').pop() || 'jpg';
        const profileImgDestPath = tempBackupDir + `profile.${profileImgExt}`;
        
        try {
          await FileSystem.copyAsync({
            from: profileImage,
            to: profileImgDestPath
          });
          backupImageList.push({
            type: 'profile',
            originalPath: profileImage,
            backupPath: `profile.${profileImgExt}`
          });
        } catch (imgError) {
          console.error('Profil fotoğrafı yedeklenirken hata oluştu:', imgError);
        }
      }
      
      // 3. Deneme fotoğraflarını yedekle
      try {
        const examsStorageKey = '@meb_ags_exam_results';
        const examsDataStr = await AsyncStorage.getItem(examsStorageKey);
        
        if (examsDataStr) {
          const examsData = JSON.parse(examsDataStr);
          
          // Fotoğrafları ara ve yedekle
          const photoPromises = [];
          
          for (let examIndex = 0; examIndex < examsData.length; examIndex++) {
            const exam = examsData[examIndex];
            
            if (exam.mistakes && exam.mistakes.length > 0) {
              // Sınav yanlışları dizini oluştur
              const examDir = tempBackupDir + `exam_${examIndex}/`;
              await FileSystem.makeDirectoryAsync(examDir, { intermediates: true });
              
              // Her hata fotoğrafını yedekle
              for (let mistakeIndex = 0; mistakeIndex < exam.mistakes.length; mistakeIndex++) {
                const mistake = exam.mistakes[mistakeIndex];
                if (mistake.uri) {
                  const imgExt = mistake.uri.split('.').pop() || 'jpg';
                  const destFileName = `mistake_${mistakeIndex}.${imgExt}`;
                  const destPath = examDir + destFileName;
                  
                  photoPromises.push(
                    FileSystem.copyAsync({
                      from: mistake.uri,
                      to: destPath
                    }).then(() => {
                      backupImageList.push({
                        type: 'mistake',
                        examId: exam.id,
                        mistakeId: mistake.id,
                        originalPath: mistake.uri,
                        backupPath: `exam_${examIndex}/${destFileName}`
                      });
                    }).catch(err => {
                      console.error(`Hata fotoğrafı yedeklenirken hata: ${mistake.uri}`, err);
                    })
                  );
                }
              }
            }
          }
          
          // Tüm fotoğraf kopyalama işlemlerini bekle
          await Promise.all(photoPromises);
        }
      } catch (examsError) {
        console.error('Deneme fotoğrafları yedeklenirken hata oluştu:', examsError);
      }
      
      // 4. Görüntü haritası oluştur
      const imageMapPath = tempBackupDir + 'images.json';
      await FileSystem.writeAsStringAsync(imageMapPath, JSON.stringify(backupImageList, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      // 5. Tüm dosyaları bir zip dosyasına dönüştür (aslında bu bir klasör)
      const backupPath = FileSystem.documentDirectory + backupFileName;
      
      // Dizinin var olduğundan emin ol
      const docDirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      if (!docDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true });
      }
      
      // Geçici dizini kopyala
      await FileSystem.copyAsync({
        from: tempBackupDir,
        to: backupPath
      });
      
      // Geçici dizini temizle
      await FileSystem.deleteAsync(tempBackupDir, { idempotent: true });
      
      // Yedek dosyasının URI'sini al
      const backupURI = Platform.OS === 'ios' ? backupPath : `file://${backupPath}`;
      
      try {
        // Paylaşım izinlerini kontrol et ve yedek dosyasını paylaş
        const canShare = await Sharing.isAvailableAsync();
        
        if (canShare) {
          await Sharing.shareAsync(backupURI, {
            mimeType: 'application/octet-stream',
            UTI: 'com.mebags.archive',
            dialogTitle: 'MEB AGS Veri Yedeği'
          });
          
          Alert.alert(
            'Yedekleme Başarılı',
            'Yedek dosyası başarıyla oluşturuldu ve paylaşıldı. Bu dosyayı güvenli bir yerde saklayın.'
          );
        } else {
          // Paylaşım mümkün değilse, kullanıcıya dosya yolu gösterilir
          Alert.alert(
            'Yedekleme Başarılı',
            `Yedek dosyası oluşturuldu: ${backupPath}\n\nBu dosyayı manuel olarak cihazınızdan kopyalayabilirsiniz.`
          );
        }
      } catch (shareError) {
        console.error('Paylaşım hatası:', shareError);
        
        // Paylaşım API'si hata verirse MediaLibrary'ye kaydet
        try {
          const mediaPerms = await MediaLibrary.requestPermissionsAsync();
          
          if (mediaPerms.granted) {
            const asset = await MediaLibrary.createAssetAsync(backupURI);
            const album = await MediaLibrary.getAlbumAsync('MEB AGS Yedekleri');
            
            if (album) {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
              await MediaLibrary.createAlbumAsync('MEB AGS Yedekleri', asset, false);
            }
            
            Alert.alert(
              'Yedekleme Başarılı',
              'Yedek dosyası fotoğraf galerinize kaydedildi. "MEB AGS Yedekleri" klasöründe bulabilirsiniz.'
            );
          } else {
            Alert.alert(
              'Yedekleme Başarılı',
              `Yedek dosyası şu konumda oluşturuldu: ${backupPath}\n\nBu dosyayı manuel olarak cihazınızdan kopyalayabilirsiniz.`
            );
          }
        } catch (mediaError) {
          Alert.alert(
            'Yedekleme Başarılı',
            `Yedek dosyası şu konumda oluşturuldu: ${backupPath}\n\nBu dosyayı manuel olarak cihazınızdan kopyalayabilirsiniz.`
          );
        }
      }
    } catch (error) {
      console.error('Yedekleme hatası:', error);
      Alert.alert('Hata', `Veriler yedeklenirken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsBackupInProgress(false);
    }
  };
  
  // Yedekten verileri geri yükle
  const restoreFromBackup = async () => {
    try {
      setIsRestoreInProgress(true);
      
      // Döküman seçiciyi kullanarak yedek dosyasını seç
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['*/*']  // tüm dosya tiplerini kabul et (özel uzantı .mebags)
      });
      
      if (result.canceled) {
        setIsRestoreInProgress(false);
        return;
      }
      
      const selectedFile = result.assets?.[0];
      if (!selectedFile || !selectedFile.uri) {
        Alert.alert('Hata', 'Seçilen dosya okunamadı.');
        setIsRestoreInProgress(false);
        return;
      }
      
      // Yolu al
      const backupPath = selectedFile.uri;
      const fileName = selectedFile.name || '';
      
      // .mebags uzantısı kontrolü
      if (!fileName.endsWith('.mebags') && !backupPath.endsWith('.mebags')) {
        Alert.alert(
          'Geçersiz Dosya', 
          'Seçilen dosya bir MEB AGS yedek dosyası değil (.mebags uzantılı olmalı).',
          [
            { text: 'Yine de Dene', onPress: () => processBackupFile(backupPath) },
            { text: 'İptal', style: 'cancel', onPress: () => setIsRestoreInProgress(false) }
          ]
        );
      } else {
        // Geçerli yedek dosyası
        await processBackupFile(backupPath);
      }
    } catch (error) {
      console.error('Geri yükleme hatası:', error);
      Alert.alert('Hata', 'Veriler geri yüklenirken bir hata oluştu.');
      setIsRestoreInProgress(false);
    }
  };

  // Yedek dosyasını işle
  const processBackupFile = async (backupPath: string) => {
    try {
      // İndirme klasörünü temizle
      const tempDir = FileSystem.cacheDirectory + 'mebags_restore/';
      const tempDirInfo = await FileSystem.getInfoAsync(tempDir);
      if (tempDirInfo.exists) {
        await FileSystem.deleteAsync(tempDir);
      }
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      
      // Dosyayı bir klasör olarak işlemeye çalış
      let isDirectory = false;
      let metaFilePath = '';
      let imagesMapPath = '';
      
      try {
        // Önce bir dosya olarak okumaya çalış
        const fileContent = await FileSystem.readAsStringAsync(backupPath);
        // Eğer buraya kadar gelebildiyse, bu bir metin dosyası
        // Geçici dizine meta.json olarak kaydet
        metaFilePath = tempDir + 'meta.json';
        await FileSystem.writeAsStringAsync(metaFilePath, fileContent);
      } catch (fileError) {
        console.log('Dosya olarak okunamadı, klasör olarak denenecek', fileError);
        
        // Klasör olarak işlemeye çalış
        try {
          // Dosyayı geçici dizine kopyala ve içeriğini oku
          if (backupPath.startsWith('file://')) {
            // Klasör kopyalama işlemi
            isDirectory = true;
            
            // Tüm içeriği kopyala
            const backupContentDir = backupPath.endsWith('/') ? backupPath : backupPath + '/';
            const metaFileExists = await FileSystem.getInfoAsync(backupContentDir + 'meta.json');
            
            if (metaFileExists.exists) {
              // Meta dosyasını oku
              metaFilePath = backupContentDir + 'meta.json';
              imagesMapPath = backupContentDir + 'images.json';
            } else {
              throw new Error('Yedek klasöründe meta.json dosyası bulunamadı');
            }
          } else {
            throw new Error('Geçersiz dosya yolu formatı');
          }
        } catch (dirError) {
          console.error('Klasör olarak işlenemedi:', dirError);
          Alert.alert('Hata', 'Yedek dosyası/klasörü okunamadı veya geçersiz format.');
          setIsRestoreInProgress(false);
          return;
        }
      }
      
      // meta.json dosyasını oku
      if (!metaFilePath) {
        Alert.alert('Hata', 'meta.json dosyası bulunamadı.');
        setIsRestoreInProgress(false);
        return;
      }
      
      const metaContent = await FileSystem.readAsStringAsync(metaFilePath);
      const backupData = JSON.parse(metaContent);
      
      // Görüntü haritasını oku (varsa)
      let imagesMap = [];
      if (imagesMapPath) {
        try {
          const imagesMapContent = await FileSystem.readAsStringAsync(imagesMapPath);
          imagesMap = JSON.parse(imagesMapContent);
        } catch (imgMapError) {
          console.log('Görüntü haritası okunamadı:', imgMapError);
        }
      }
      
      // Sürüm kontrolü
      const backupVersion = backupData.appVersion || '1.0.0';
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      
      if (backupVersion !== currentVersion) {
        Alert.alert(
          'Sürüm Farklılığı',
          `Yedek dosyası ${backupVersion} sürümünden, mevcut uygulama sürümü ise ${currentVersion}. Bazı veriler uyumlu olmayabilir. Devam etmek istiyor musunuz?`,
          [
            { text: 'İptal', style: 'cancel', onPress: () => setIsRestoreInProgress(false) },
            { 
              text: 'Devam Et', 
              onPress: async () => {
                // Verileri geri yükle
                await applyBackup(backupData, imagesMap, backupPath, isDirectory);
                setIsRestoreInProgress(false);
              }
            }
          ]
        );
      } else {
        // Verileri geri yükle
        await applyBackup(backupData, imagesMap, backupPath, isDirectory);
        setIsRestoreInProgress(false);
      }
    } catch (error) {
      console.error('Yedek işleme hatası:', error);
      Alert.alert('Hata', 'Yedek dosyası işlenirken bir hata oluştu.');
      setIsRestoreInProgress(false);
    }
  };

  // Yedeği uygula - JSON verilerini ve fotoğrafları işle
  const applyBackup = async (
    backupData: {
      timestamp: string;
      appVersion: string;
      platform: string;
      data: Array<{ key: string; value: any }>;
    }, 
    imagesMap: Array<{
      type: string;
      originalPath: string;
      backupPath: string;
      examId?: string;
      mistakeId?: string;
    }>,
    backupPath: string,
    isDirectory: boolean
  ) => {
    try {
      // Mevcut verileri temizle
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToExclude = ['@battery_warning_shown']; // Silinmemesi gereken anahtarlar
      const keysToRemove = allKeys.filter(key => !keysToExclude.includes(key));
      
      await AsyncStorage.multiRemove(keysToRemove);
      
      // Yedekten gelen verileri geri yükle
      for (const item of backupData.data) {
        if (item.key && item.value !== null) {
          await AsyncStorage.setItem(item.key, JSON.stringify(item.value));
        }
      }
      
      // Fotoğrafları geri yükle
      if (imagesMap && imagesMap.length > 0) {
        const photoRestoreDir = FileSystem.documentDirectory + 'photos/';
        
        // Dizini oluştur
        const photoDirInfo = await FileSystem.getInfoAsync(photoRestoreDir);
        if (!photoDirInfo.exists) {
          await FileSystem.makeDirectoryAsync(photoRestoreDir, { intermediates: true });
        }
        
        // Yanıp kalmış eski fotoğrafları temizle
        try {
          await FileSystem.deleteAsync(photoRestoreDir, { idempotent: true });
          await FileSystem.makeDirectoryAsync(photoRestoreDir, { intermediates: true });
        } catch (cleanError) {
          console.error('Eski fotoğraflar temizlenirken hata:', cleanError);
        }
        
        // Yedek klasör yolunu düzelt
        const backupContentDir = isDirectory 
          ? (backupPath.endsWith('/') ? backupPath : backupPath + '/') 
          : (backupPath.replace('.mebags', '.mebags/'));
        
        // Profil fotoğrafını geri yükle
        const profileImage = imagesMap.find(img => img.type === 'profile');
        if (profileImage && profileImage.backupPath) {
          try {
            const profileDir = photoRestoreDir + 'profile/';
            await FileSystem.makeDirectoryAsync(profileDir, { intermediates: true });
            
            const profileExt = profileImage.backupPath.split('.').pop() || 'jpg';
            const newProfilePath = profileDir + `profile.${profileExt}`;
            
            // Profil fotoğrafını kopyala
            await FileSystem.copyAsync({
              from: backupContentDir + profileImage.backupPath,
              to: newProfilePath
            });
            
            // AsyncStorage'daki yolu güncelle
            await AsyncStorage.setItem(PROFILE_IMAGE_KEY, newProfilePath);
            
            // State'i güncelle
            setProfileImage(newProfilePath);
          } catch (profileError) {
            console.error('Profil fotoğrafı geri yüklenirken hata:', profileError);
          }
        }
        
        // Deneme fotoğraflarını geri yükle
        const mistakeImages = imagesMap.filter(img => img.type === 'mistake');
        if (mistakeImages.length > 0) {
          try {
            // Deneme sonuçlarını al
            const examsStorageKey = '@meb_ags_exam_results';
            const examsDataStr = await AsyncStorage.getItem(examsStorageKey);
            
            if (examsDataStr) {
              let examsData = JSON.parse(examsDataStr);
              
              // Her deneme için
              for (const img of mistakeImages) {
                if (img.examId && img.mistakeId) {
                  // Denemeyi bul
                  const examIndex = examsData.findIndex(exam => exam.id === img.examId);
                  
                  if (examIndex !== -1) {
                    // Hatayı bul
                    const mistakeIndex = examsData[examIndex].mistakes.findIndex(
                      mistake => mistake.id === img.mistakeId
                    );
                    
                    if (mistakeIndex !== -1) {
                      // Hata dizinini oluştur
                      const mistakeDir = photoRestoreDir + `exam_${img.examId}/`;
                      await FileSystem.makeDirectoryAsync(mistakeDir, { intermediates: true });
                      
                      const imgExt = img.backupPath.split('.').pop() || 'jpg';
                      const newMistakePath = mistakeDir + `mistake_${img.mistakeId}.${imgExt}`;
                      
                      // Hata fotoğrafını kopyala
                      await FileSystem.copyAsync({
                        from: backupContentDir + img.backupPath,
                        to: newMistakePath
                      });
                      
                      // URI'yi güncelle
                      examsData[examIndex].mistakes[mistakeIndex].uri = newMistakePath;
                    }
                  }
                }
              }
              
              // Güncellenmiş verileri kaydet
              await AsyncStorage.setItem(examsStorageKey, JSON.stringify(examsData));
            }
          } catch (mistakesError) {
            console.error('Deneme fotoğrafları geri yüklenirken hata:', mistakesError);
          }
        }
      }
      
      // Uygulama içi verileri yenile
      await loadStudyTime();
      
      // EventRegister ile diğer bileşenlere bildir
      EventRegister.emit('forceReloadStudyTime', true);
      
      Alert.alert(
        'Geri Yükleme Başarılı',
        'Verileriniz başarıyla geri yüklendi. Uygulamayı yeniden başlatmanız önerilir.'
      );
    } catch (error) {
      console.error('Yedek uygulama hatası:', error);
      Alert.alert('Hata', 'Yedek uygulanırken bir hata oluştu.');
    }
  };

  // Modal'da dosya yolu veya JSON içeriğini manuel olarak girme
  const handleManualImport = async () => {
    try {
      let backupData;
      let imagesMap;
      
      if (backupJsonText) {
        // JSON metni girilmiş, doğrudan parse et
        backupData = JSON.parse(backupJsonText);
      } else if (backupFilePath) {
        try {
          // Dosya yolu girilmiş, klasör mü yoksa dosya mı kontrol et
          const fileInfo = await FileSystem.getInfoAsync(backupFilePath);
          
          if (!fileInfo.exists) {
            Alert.alert('Hata', 'Belirtilen dosya veya klasör bulunamadı.');
            return;
          }
          
          // .mebags uzantılı klasör mü kontrol et
          if (backupFilePath.endsWith('.mebags') || fileInfo.isDirectory) {
            // Klasör olarak işle
            const metaFilePath = backupFilePath.endsWith('/') 
              ? `${backupFilePath}meta.json`
              : `${backupFilePath}/meta.json`;
            
            const imageMapPath = backupFilePath.endsWith('/') 
              ? `${backupFilePath}images.json`
              : `${backupFilePath}/images.json`;
            
            // Meta dosyasını oku
            const metaFileInfo = await FileSystem.getInfoAsync(metaFilePath);
            if (!metaFileInfo.exists) {
              Alert.alert('Hata', 'Geçersiz yedek klasörü. meta.json dosyası bulunamadı.');
              return;
            }
            
            const metaContent = await FileSystem.readAsStringAsync(metaFilePath);
            backupData = JSON.parse(metaContent);
            
            // Resim haritasını kontrol et
            const imageMapInfo = await FileSystem.getInfoAsync(imageMapPath);
            if (imageMapInfo.exists) {
              const imageMapContent = await FileSystem.readAsStringAsync(imageMapPath);
              imagesMap = JSON.parse(imageMapContent);
            }
          } else {
            // Dosya olarak işle
            const backupString = await FileSystem.readAsStringAsync(backupFilePath);
            backupData = JSON.parse(backupString);
          }
        } catch (fileError) {
          console.error('Dosya okuma hatası:', fileError);
          Alert.alert('Hata', 'Dosya okunurken bir hata oluştu. Geçerli bir yedek dosyası mı kontrol edin.');
          return;
        }
      } else {
        Alert.alert('Bilgi Gerekli', 'Lütfen yedek içeriğini veya dosya yolunu girin.');
        return;
      }
      
      // Uygulamanın sürüm uyumluluğunu kontrol et
      const backupVersion = backupData.appVersion || '1.0.0';
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      
      // Modal'ı kapat
      setIsImportModalVisible(false);
      setBackupJsonText('');
      setBackupFilePath('');
      
      if (backupVersion !== currentVersion) {
        // Sürüm farklılığı varsa uyarı göster ama devam et
        Alert.alert(
          'Sürüm Farklılığı',
          `Yedek dosyası ${backupVersion} sürümünden, mevcut uygulama sürümü ise ${currentVersion}. Bazı veriler uyumlu olmayabilir. Devam etmek istiyor musunuz?`,
          [
            { text: 'İptal', style: 'cancel', onPress: () => setIsRestoreInProgress(false) },
            { 
              text: 'Devam Et', 
              onPress: async () => {
                await applyBackup(backupData, imagesMap, '', false);
                setIsRestoreInProgress(false);
              }
            }
          ]
        );
      } else {
        // Sürümler aynıysa doğrudan uygula
        await applyBackup(backupData, imagesMap, '', false);
        setIsRestoreInProgress(false);
      }
    } catch (error) {
      console.error('Manuel içe aktarma hatası:', error);
      Alert.alert('Hata', 'Yedek verisi işlenirken bir hata oluştu. Geçerli bir JSON formatında olduğundan emin olun.');
      setIsRestoreInProgress(false);
    }
  };

  // Panoya kopyala
  const copyToClipboard = async (text: string | null) => {
    if (text) {
      await Clipboard.setString(text);
      Alert.alert('Başarılı', 'Metin panoya kopyalandı.');
    } else {
      Alert.alert('Hata', 'Kopyalanacak metin bulunamadı.');
    }
  };

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
            onPress={backupAllData}
            disabled={isBackupInProgress}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#3b82f6' }]}>
                <Download color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Verileri Yedekle</Text>
            </View>
            {isBackupInProgress ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Text style={styles.menuItemArrow}>›</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={restoreFromBackup}
            disabled={isRestoreInProgress}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#8b5cf6' }]}>
                <Upload color="#fff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Yedekten Geri Yükle</Text>
            </View>
            {isRestoreInProgress ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Text style={styles.menuItemArrow}>›</Text>
            )}
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
        </View>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Versiyon 1.0.0</Text>
        </View>
      </ScrollView>
      
      {/* Yedek İçe Aktarma Modal */}
      <Modal
        visible={isImportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsImportModalVisible(false);
          setIsRestoreInProgress(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yedekten Geri Yükle</Text>
            
            <Text style={styles.modalLabel}>Yedek Dosya Yolu:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn: /data/user/0/com.example.app/files/yedek.json"
              placeholderTextColor="#94a3b8"
              value={backupFilePath}
              onChangeText={setBackupFilePath}
              multiline={false}
            />
            
            <Text style={styles.modalLabel}>VEYA</Text>
            
            <Text style={styles.modalLabel}>Yedek JSON İçeriği:</Text>
            <TextInput
              style={[styles.modalInput, { height: 100 }]}
              placeholder="JSON içeriğini yapıştırın..."
              placeholderTextColor="#94a3b8"
              value={backupJsonText}
              onChangeText={setBackupJsonText}
              multiline={true}
              numberOfLines={5}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsImportModalVisible(false);
                  setIsRestoreInProgress(false);
                }}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleManualImport}
              >
                <Text style={styles.modalButtonText}>Geri Yükle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal stilleri
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#273549',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    color: '#fff',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#475569',
  },
  modalSubmitButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});