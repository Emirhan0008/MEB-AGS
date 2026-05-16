import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import base64 from 'base-64';

// Yedeklenecek verilerin anahtarları
const BACKUP_KEYS = {
  // Study Time
  STUDY_TIME: 'meb-ags-study-time',
  DAILY_STUDY: 'meb-ags-daily-study',
  WEEKLY_STUDY: 'meb-ags-weekly-study',
  MONTHLY_STUDY: 'meb-ags-monthly-study',
  
  // Stats & Progress
  STATS: 'meb-ags-stats',
  SUBJECT_PROGRESS: 'meb-ags-subject-progress',
  COMPLETED_TOPICS: 'meb-ags-completed-topics',
  
  // Exams & Questions
  WRONG_QUESTIONS: 'meb-ags-wrong-questions',
  EXAM_RESULTS: '@meb_ags_exam_results',
  TEST_HISTORY: 'meb-ags-test-history',
  EXAMS: 'meb-ags-exams',
  
  // Notes
  NOTES: 'meb-ags-notes',
  
  // Profile & Settings
  PROFILE_IMAGE: 'meb-ags-profile-image',
  USER_SETTINGS: 'userSettings',
  NOTIFICATION_SETTINGS: 'meb-ags-notification-settings',
  
  // Timer
  TIMER: 'meb-ags-timer',
  
  // Other
  STUDY_GOALS: 'meb-ags-study-goals',
  LAST_BACKUP_DATE: 'meb-ags-last-backup-date',
  BACKUP_DATA: 'meb-ags-backup-data'
};

// Fotoğrafları içeren klasör
const MISTAKES_DIR = `${FileSystem.documentDirectory}mistakes/`;

// Fotoğrafları Base64'e çevirip veriye ekleyen yardımcı fonksiyon
const processImagesForBackup = async (data: any, key: string) => {
  try {
    if (key === 'EXAM_RESULTS' && typeof data === 'string') {
      const exams = JSON.parse(data);
      if (Array.isArray(exams)) {
        for (let exam of exams) {
          if (exam.mistakes && Array.isArray(exam.mistakes)) {
            for (let mistake of exam.mistakes) {
              if (mistake.uri && (mistake.uri.startsWith('file://') || mistake.uri.startsWith('/'))) {
                try {
                  const base64Content = await FileSystem.readAsStringAsync(mistake.uri, { 
                    encoding: FileSystem.EncodingType.Base64 
                  });
                  mistake.base64Data = base64Content;
                } catch (e) {
                  console.warn("Fotoğraf okunamadı:", mistake.uri);
                }
              }
            }
          }
        }
        return JSON.stringify(exams);
      }
    }
    
    if (key === 'PROFILE_IMAGE' && typeof data === 'string') {
      if (data.startsWith('file://') || data.startsWith('/')) {
        try {
          const base64Content = await FileSystem.readAsStringAsync(data, { 
            encoding: FileSystem.EncodingType.Base64 
          });
          return JSON.stringify({ uri: data, base64Data: base64Content });
        } catch (e) {
          console.warn("Profil resmi okunamadı:", data);
        }
      }
    }
  } catch (error) {
    console.error("Resim işleme hatası:", error);
  }
  return data;
};

// Base64 verileri tekrar fiziksel dosyalara dönüştüren yardımcı fonksiyon
const restoreImagesFromBackup = async (data: string, key: string) => {
  try {
    // Klasörün varlığından emin ol
    const dirInfo = await FileSystem.getInfoAsync(MISTAKES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MISTAKES_DIR, { intermediates: true });
    }

    if (key === 'EXAM_RESULTS') {
      const exams = JSON.parse(data);
      if (Array.isArray(exams)) {
        for (let exam of exams) {
          if (exam.mistakes && Array.isArray(exam.mistakes)) {
            for (let mistake of exam.mistakes) {
              if (mistake.base64Data) {
                const filename = `mistake_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
                const newUri = `${MISTAKES_DIR}${filename}`;
                await FileSystem.writeAsStringAsync(newUri, mistake.base64Data, { 
                  encoding: FileSystem.EncodingType.Base64 
                });
                mistake.uri = newUri;
                delete mistake.base64Data; // Temizlik
              }
            }
          }
        }
        return JSON.stringify(exams);
      }
    }

    if (key === 'PROFILE_IMAGE') {
      try {
        const profileData = JSON.parse(data);
        if (profileData.base64Data) {
          const newUri = `${FileSystem.documentDirectory}profile_image.jpg`;
          await FileSystem.writeAsStringAsync(newUri, profileData.base64Data, { 
            encoding: FileSystem.EncodingType.Base64 
          });
          return newUri;
        }
      } catch (e) {
        // Eğer JSON değilse eski usul devam et
        return data;
      }
    }
  } catch (error) {
    console.error("Resim geri yükleme hatası:", error);
  }
  return data;
};

// Yedekleme fonksiyonu - AsyncStorage'a kaydeder (Fotoğraflar dahil)
export const createBackup = async () => {
  try {
    const backupData: { [key: string]: any } = {
      version: '2.0.0', // Fotoğraf desteği ile versiyon atladı
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      data: {}
    };
    
    // Tüm verileri AsyncStorage'dan al
    for (const [key, value] of Object.entries(BACKUP_KEYS)) {
      try {
        if (key === 'BACKUP_DATA' || key === 'LAST_BACKUP_DATE') continue;
        
        let data = await AsyncStorage.getItem(value);
        if (data) {
          // Özel anahtarlar için fotoğraf işleme
          if (key === 'EXAM_RESULTS' || key === 'PROFILE_IMAGE') {
            data = await processImagesForBackup(data, key);
          }
          backupData.data[key] = data;
        }
      } catch (error) {
        console.warn(`${key} verisi alınırken hata:`, error);
      }
    }
    
    const backupString = JSON.stringify(backupData);
    await AsyncStorage.setItem(BACKUP_KEYS.BACKUP_DATA, backupString);
    await AsyncStorage.setItem(BACKUP_KEYS.LAST_BACKUP_DATE, new Date().toISOString());
    
    return { success: true, message: "Veriler (fotoğraflar dahil) başarıyla yedeklendi", backupString };
  } catch (error) {
    console.error('Yedekleme hatası:', error);
    return { success: false, message: "Veriler yedeklenirken bir hata oluştu" };
  }
};

// Geri yükleme fonksiyonu
export const restoreBackup = async (customBackupString?: string) => {
  try {
    const backupString = customBackupString || await AsyncStorage.getItem(BACKUP_KEYS.BACKUP_DATA);
    if (!backupString) {
      return { success: false, message: "Yedek bulunamadı" };
    }
    
    const backupData = JSON.parse(backupString);
    
    // Verileri AsyncStorage'a geri yükle
    for (const [key, value] of Object.entries(backupData.data)) {
      try {
        const storageKey = BACKUP_KEYS[key as keyof typeof BACKUP_KEYS];
        if (storageKey) {
          let dataToRestore = value as string;
          
          // Fotoğrafları geri yükle
          if (key === 'EXAM_RESULTS' || key === 'PROFILE_IMAGE') {
            dataToRestore = await restoreImagesFromBackup(dataToRestore, key);
          }
          
          await AsyncStorage.setItem(storageKey, dataToRestore);
        }
      } catch (error) {
        console.warn(`${key} verisi geri yüklenirken hata:`, error);
      }
    }
    
    return { success: true, message: "Veriler ve fotoğraflar başarıyla geri yüklendi" };
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    return { success: false, message: "Veriler geri yüklenirken bir hata oluştu" };
  }
};

// Son yedekleme tarihini kontrol et
export const getLastBackupDate = async () => {
  try {
    const lastBackupDate = await AsyncStorage.getItem(BACKUP_KEYS.LAST_BACKUP_DATE);
    return lastBackupDate ? new Date(lastBackupDate) : null;
  } catch (error) {
    console.error('Son yedekleme tarihi alınırken hata:', error);
    return null;
  }
};

// Yedeği metin olarak dışa aktar (Pano)
export const exportBackupAsText = async () => {
  try {
    const result = await createBackup();
    if (!result.success || !result.backupString) return result;
    
    const base64Backup = base64.encode(result.backupString);
    await Clipboard.setStringAsync(base64Backup);
    
    return { 
      success: true, 
      message: "Tam yedek kodu panoya kopyalandı. (Fotoğraflar dahil)", 
      backupCode: base64Backup 
    };
  } catch (error) {
    console.error('Dışa aktarma hatası:', error);
    return { success: false, message: "Dışa aktarılırken hata oluştu" };
  }
};

// Dosya olarak dışa aktar (WhatsApp, Email vb.)
export const exportBackupAsFile = async () => {
  try {
    const result = await createBackup();
    if (!result.success || !result.backupString) return result;
    
    const filename = `MEB_AGS_Yedek_${new Date().toISOString().split('T')[0]}.ags`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, result.backupString);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Yedek Dosyasını Paylaş',
        UTI: 'com.mebags.backup'
      });
      return { success: true, message: "Yedek dosyası hazırlandı ve paylaşım ekranı açıldı" };
    } else {
      return { success: false, message: "Paylaşım bu cihazda desteklenmiyor" };
    }
  } catch (error) {
    console.error('Dosya dışa aktarma hatası:', error);
    return { success: false, message: "Dosya oluşturulurken hata oluştu" };
  }
};

// Dosyadan içe aktar
export const importBackupFromFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: '*/*'
    });
    
    if (result.canceled) return { success: false, message: "İşlem iptal edildi" };
    
    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);
    
    // Basit bir JSON doğrulama
    JSON.parse(content);
    
    return await restoreBackup(content);
  } catch (error) {
    console.error('Dosya içe aktarma hatası:', error);
    return { success: false, message: "Geçersiz yedek dosyası" };
  }
};

// Metinden içe aktar
export const importBackupFromText = async (backupCode: string) => {
  try {
    if (!backupCode || backupCode.trim() === '') {
      return { success: false, message: "Geçerli bir kod girilmedi" };
    }
    
    const backupString = base64.decode(backupCode.trim());
    return await restoreBackup(backupString);
  } catch (error) {
    console.error('Metin içe aktarma hatası:', error);
    return { success: false, message: "Geçersiz yedek kodu" };
  }
};