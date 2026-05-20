import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { createBackup, restoreBackup } from '../utils/backup';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLOUD_SYNC_KEYS = {
  LAST_CLOUD_SYNC_DATE: 'meb-ags-last-cloud-sync-date'
};

export interface CloudBackupInfo {
  exists: boolean;
  timestamp?: string;
  platform?: string;
  version?: string;
}

/**
 * Gets the current user's UID. Throws an error if not logged in.
 */
const getUidOrThrow = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Kullanıcı girişi yapılmamış.");
  }
  return user.uid;
};

/**
 * Uploads local exam, settings, and stats data to Firebase Firestore
 */
export const uploadBackupToCloud = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const uid = getUidOrThrow();
    
    // Create backup (exclude images to prevent OOM / large payload issues on the database)
    const backupResult = await createBackup(false);
    if (!backupResult.success || !backupResult.backupString) {
      return { 
        success: false, 
        message: backupResult.message || "Yerel yedek hazırlanırken hata oluştu." 
      };
    }
    
    const parsedBackup = JSON.parse(backupResult.backupString);
    
    // Reference to the user's backup document in Firestore: backups/{uid}
    const backupDocRef = doc(db, 'backups', uid);
    
    // Store in Firestore
    await setDoc(backupDocRef, {
      uid,
      email: auth.currentUser?.email || '',
      version: parsedBackup.version || '2.0.0',
      platform: parsedBackup.platform || 'unknown',
      timestamp: parsedBackup.timestamp || new Date().toISOString(),
      data: parsedBackup.data || {},
      updatedAt: new Date().toISOString()
    });
    
    // Save last sync date locally
    const now = new Date().toISOString();
    await AsyncStorage.setItem(CLOUD_SYNC_KEYS.LAST_CLOUD_SYNC_DATE, now);
    
    return { 
      success: true, 
      message: "Verileriniz başarıyla buluta yedeklendi." 
    };
  } catch (error: any) {
    console.error("Buluta yedekleme hatası:", error);
    return { 
      success: false, 
      message: error.message || "Buluta yedeklenirken bir hata oluştu." 
    };
  }
};

/**
 * Checks if a cloud backup exists for the current user and returns metadata
 */
export const checkCloudBackupInfo = async (): Promise<CloudBackupInfo> => {
  try {
    const user = auth.currentUser;
    if (!user) return { exists: false };
    
    const backupDocRef = doc(db, 'backups', user.uid);
    const docSnap = await getDoc(backupDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        exists: true,
        timestamp: data.timestamp,
        platform: data.platform,
        version: data.version
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Bulut yedeği kontrol hatası:", error);
    return { exists: false };
  }
};

/**
 * Downloads and restores backup from Firestore
 */
export const restoreBackupFromCloud = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const uid = getUidOrThrow();
    const backupDocRef = doc(db, 'backups', uid);
    const docSnap = await getDoc(backupDocRef);
    
    if (!docSnap.exists()) {
      return { 
        success: false, 
        message: "Bulutta herhangi bir yedeğiniz bulunamadı." 
      };
    }
    
    const cloudData = docSnap.data();
    
    // Reconstruct the backup format
    const backupObject = {
      version: cloudData.version || '2.0.0',
      platform: cloudData.platform || 'unknown',
      timestamp: cloudData.timestamp || new Date().toISOString(),
      data: cloudData.data || {}
    };
    
    const backupString = JSON.stringify(backupObject);
    
    // Restore using the existing local restore logic
    const restoreResult = await restoreBackup(backupString);
    
    if (restoreResult.success) {
      // Save last sync date
      await AsyncStorage.setItem(CLOUD_SYNC_KEYS.LAST_CLOUD_SYNC_DATE, new Date().toISOString());
      return { 
        success: true, 
        message: "Veriler buluttan başarıyla geri yüklendi!" 
      };
    } else {
      return { 
        success: false, 
        message: restoreResult.message || "Veriler yüklenirken yerel hata oluştu." 
      };
    }
  } catch (error: any) {
    console.error("Buluttan geri yükleme hatası:", error);
    return { 
      success: false, 
      message: error.message || "Buluttan geri yüklenirken hata oluştu." 
    };
  }
};

/**
 * Gets the last cloud sync date from local storage
 */
export const getLastCloudSyncDate = async (): Promise<Date | null> => {
  try {
    const syncDate = await AsyncStorage.getItem(CLOUD_SYNC_KEYS.LAST_CLOUD_SYNC_DATE);
    return syncDate ? new Date(syncDate) : null;
  } catch {
    return null;
  }
};
