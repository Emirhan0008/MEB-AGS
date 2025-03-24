import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

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
  LAST_BACKUP_DATE: 'meb-ags-last-backup-date'
};

// Yedekleme fonksiyonu
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
        const data = await AsyncStorage.getItem(value);
        if (data) {
          backupData.data[key] = data;
        }
      } catch (error) {
        console.warn(`${key} verisi alınırken hata:`, error);
      }
    }
    
    // Yanlış sorular için fotoğrafları da yedekle
    try {
      const wrongQuestionsData = await AsyncStorage.getItem(BACKUP_KEYS.WRONG_QUESTIONS);
      if (wrongQuestionsData) {
        const wrongQuestions = JSON.parse(wrongQuestionsData);
        const images: { [key: string]: string } = {};
        
        // Her bir yanlış soru için fotoğrafı base64'e çevir
        for (const question of wrongQuestions) {
          if (question.imageUri) {
            try {
              const base64 = await FileSystem.readAsStringAsync(question.imageUri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              images[question.id] = base64;
            } catch (error) {
              console.warn(`Fotoğraf okunamadı (${question.id}):`, error);
            }
          }
        }
        
        backupData.data.wrongQuestionImages = images;
      }
    } catch (error) {
      console.warn('Yanlış soru fotoğrafları yedeklenirken hata:', error);
    }
    
    // Yedek dosyasını oluştur
    const backupString = JSON.stringify(backupData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `meb-ags-yedek-${timestamp}.json`;
    
    // Dosyayı kaydet
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, backupString);
    
    // Son yedekleme tarihini kaydet
    await AsyncStorage.setItem(BACKUP_KEYS.LAST_BACKUP_DATE, new Date().toISOString());
    
    // Dosyayı paylaş
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'MEB AGS Yedek Dosyası',
        UTI: 'public.json'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Yedekleme hatası:', error);
    throw new Error('Veriler yedeklenirken bir hata oluştu.');
  }
};

// Geri yükleme fonksiyonu
export const restoreBackup = async () => {
  try {
    // Dosya seçiciyi aç
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true
    });
    
    if (result.type === 'success') {
      // Dosyayı oku
      const backupString = await FileSystem.readAsStringAsync(result.uri);
      const backupData = JSON.parse(backupString);
      
      // Yedek dosyası versiyonunu kontrol et
      if (!backupData.version) {
        throw new Error('Geçersiz yedek dosyası formatı.');
      }
      
      // Verileri AsyncStorage'a geri yükle
      for (const [key, value] of Object.entries(backupData.data)) {
        if (key === 'wrongQuestionImages') continue; // Fotoğrafları ayrı işle
        try {
          await AsyncStorage.setItem(BACKUP_KEYS[key as keyof typeof BACKUP_KEYS], value);
        } catch (error) {
          console.warn(`${key} verisi geri yüklenirken hata:`, error);
        }
      }
      
      // Yanlış soru fotoğraflarını geri yükle
      if (backupData.data.wrongQuestionImages) {
        try {
          const wrongQuestionsData = await AsyncStorage.getItem(BACKUP_KEYS.WRONG_QUESTIONS);
          if (wrongQuestionsData) {
            const wrongQuestions = JSON.parse(wrongQuestionsData);
            
            // Her bir fotoğrafı dosya sistemine kaydet
            for (const question of wrongQuestions) {
              if (backupData.data.wrongQuestionImages[question.id]) {
                try {
                  const base64 = backupData.data.wrongQuestionImages[question.id];
                  const fileName = `wrong-question-${question.id}.jpg`;
                  const filePath = `${FileSystem.documentDirectory}${fileName}`;
                  
                  await FileSystem.writeAsStringAsync(filePath, base64, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  
                  question.imageUri = filePath;
                } catch (error) {
                  console.warn(`Fotoğraf kaydedilemedi (${question.id}):`, error);
                }
              }
            }
            
            // Güncellenmiş yanlış soruları kaydet
            await AsyncStorage.setItem(BACKUP_KEYS.WRONG_QUESTIONS, JSON.stringify(wrongQuestions));
          }
        } catch (error) {
          console.warn('Yanlış soru fotoğrafları geri yüklenirken hata:', error);
        }
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    throw new Error('Veriler geri yüklenirken bir hata oluştu.');
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