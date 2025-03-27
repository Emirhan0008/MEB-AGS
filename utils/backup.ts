import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, Clipboard } from 'react-native';
import base64 from 'base-64';

// Yedeklenecek verilerin anahtarları
const BACKUP_KEYS = {
  STUDY_TIME: 'meb-ags-study-time',
  DAILY_STUDY: 'meb-ags-daily-study',
  WEEKLY_STUDY: 'meb-ags-weekly-study',
  MONTHLY_STUDY: 'meb-ags-monthly-study',
  WRONG_QUESTIONS: 'meb-ags-wrong-questions',
  USER_STATS: 'meb-ags-user-stats',
  TEST_HISTORY: 'meb-ags-test-history',
  PROFILE_IMAGE: 'meb-ags-profile-image',
  SUBJECT_PROGRESS: 'meb-ags-subject-progress',
  COMPLETED_TOPICS: 'meb-ags-completed-topics',
  USER_PREFERENCES: 'meb-ags-user-preferences',
  NOTIFICATION_SETTINGS: 'meb-ags-notification-settings',
  STUDY_GOALS: 'meb-ags-study-goals',
  LAST_BACKUP_DATE: 'meb-ags-last-backup-date',
  BACKUP_DATA: 'meb-ags-backup-data'
};

// Yedekleme fonksiyonu - AsyncStorage'a kaydeder
export const createBackup = async () => {
  try {
    const backupData: { [key: string]: any } = {
      version: '1.0.0',
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      data: {}
    };
    
    // Tüm verileri AsyncStorage'dan al
    for (const [key, value] of Object.entries(BACKUP_KEYS)) {
      try {
        // Yedekleme verisini atlayarak sonsuz döngü olmasını engelle
        if (key === 'BACKUP_DATA' || key === 'LAST_BACKUP_DATE') continue;
        
        const data = await AsyncStorage.getItem(value);
        if (data) {
          backupData.data[key] = data;
        }
      } catch (error) {
        console.warn(`${key} verisi alınırken hata:`, error);
      }
    }
    
    // Yedek verisini AsyncStorage'a kaydet
    const backupString = JSON.stringify(backupData);
    await AsyncStorage.setItem(BACKUP_KEYS.BACKUP_DATA, backupString);
    
    // Son yedekleme tarihini kaydet
    await AsyncStorage.setItem(BACKUP_KEYS.LAST_BACKUP_DATE, new Date().toISOString());
    
    return { success: true, message: "Veriler başarıyla yedeklendi" };
  } catch (error) {
    console.error('Yedekleme hatası:', error);
    return { success: false, message: "Veriler yedeklenirken bir hata oluştu" };
  }
};

// Geri yükleme fonksiyonu - AsyncStorage'dan okur
export const restoreBackup = async () => {
  try {
    // Yedek verisini oku
    const backupString = await AsyncStorage.getItem(BACKUP_KEYS.BACKUP_DATA);
    if (!backupString) {
      return { success: false, message: "Yedek bulunamadı" };
    }
    
    const backupData = JSON.parse(backupString);
    
    // Yedek dosyası versiyonunu kontrol et
    if (!backupData.version) {
      return { success: false, message: "Geçersiz yedek dosyası formatı" };
    }
    
    // Verileri AsyncStorage'a geri yükle
    for (const [key, value] of Object.entries(backupData.data)) {
      try {
        const storageKey = BACKUP_KEYS[key as keyof typeof BACKUP_KEYS];
        if (storageKey) {
          await AsyncStorage.setItem(storageKey, value as string);
        }
      } catch (error) {
        console.warn(`${key} verisi geri yüklenirken hata:`, error);
      }
    }
    
    return { success: true, message: "Veriler başarıyla geri yüklendi" };
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

// Yeni eklenen fonksiyonlar - cihazlar arası yedekleme için

// Yedeği metin olarak dışa aktar (panoya kopyalar)
export const exportBackupAsText = async () => {
  try {
    // Yedek verisini oku
    const backupString = await AsyncStorage.getItem(BACKUP_KEYS.BACKUP_DATA);
    if (!backupString) {
      return { success: false, message: "Yedek bulunamadı" };
    }
    
    // Base64 kodlaması yap (daha güvenli ve metin olarak paylaşılabilir)
    const base64Backup = base64.encode(backupString);
    
    // Panoya kopyala
    await Clipboard.setString(base64Backup);
    
    return { 
      success: true, 
      message: "Yedek kodu panoya kopyalandı. Bu kodu başka bir cihazda kullanabilirsiniz.", 
      backupCode: base64Backup 
    };
  } catch (error) {
    console.error('Yedek dışa aktarma hatası:', error);
    return { success: false, message: "Yedek dışa aktarılırken bir hata oluştu" };
  }
};

// Metin olarak alınan yedeği içe aktar
export const importBackupFromText = async (backupCode: string) => {
  try {
    if (!backupCode || backupCode.trim() === '') {
      return { success: false, message: "Geçerli bir yedek kodu girilmedi" };
    }
    
    // Base64 çözümle
    let backupString: string;
    try {
      backupString = base64.decode(backupCode.trim());
    } catch (e) {
      return { success: false, message: "Geçersiz yedek kodu formatı" };
    }
    
    // JSON formatını doğrula
    let backupData: any;
    try {
      backupData = JSON.parse(backupString);
    } catch (e) {
      return { success: false, message: "Yedek kodu doğru formatta değil" };
    }
    
    // Yedek dosyası versiyonunu kontrol et
    if (!backupData.version) {
      return { success: false, message: "Geçersiz yedek dosyası formatı" };
    }
    
    // AsyncStorage'a kaydet
    await AsyncStorage.setItem(BACKUP_KEYS.BACKUP_DATA, backupString);
    
    // Hemen geri yükle
    return await restoreBackup();
    
  } catch (error) {
    console.error('Yedek içe aktarma hatası:', error);
    return { success: false, message: "Yedek içe aktarılırken bir hata oluştu" };
  }
}; 