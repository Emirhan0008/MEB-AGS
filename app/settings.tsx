import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Moon, Bell, Globe, Save, Clock, Lock, Volume2, Vibrate, Target, Bookmark } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  
  // State for settings
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('Türkçe');
  const [autoSync, setAutoSync] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [autoBookmark, setAutoBookmark] = useState(false);
  
  // Load settings from AsyncStorage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings !== null) {
          const settings = JSON.parse(savedSettings);
          setDarkMode(settings.darkMode || false);
          setNotifications(settings.notifications !== undefined ? settings.notifications : true);
          setLanguage(settings.language || 'Türkçe');
          setAutoSync(settings.autoSync !== undefined ? settings.autoSync : true);
          setSoundEnabled(settings.soundEnabled !== undefined ? settings.soundEnabled : true);
          setVibrationEnabled(settings.vibrationEnabled !== undefined ? settings.vibrationEnabled : true);
          setStudyReminders(settings.studyReminders !== undefined ? settings.studyReminders : true);
          setAutoBookmark(settings.autoBookmark || false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to AsyncStorage
  const saveSettings = async () => {
    try {
      const settings = {
        darkMode,
        notifications,
        language,
        autoSync,
        soundEnabled,
        vibrationEnabled,
        studyReminders,
        autoBookmark
      };
      
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      Alert.alert(
        "Ayarlar Kaydedildi",
        "Uygulama ayarlarınız başarıyla kaydedildi.",
        [{ text: "Tamam", onPress: () => console.log("Settings saved") }]
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        "Hata",
        "Ayarlar kaydedilirken bir hata oluştu.",
        [{ text: "Tamam", onPress: () => console.log("Error saving settings") }]
      );
    }
  };
  
  const handleLanguageChange = () => {
    Alert.alert(
      "Dil Seçimi",
      "Bu özellik yakında kullanıma sunulacaktır.",
      [{ text: "Tamam", onPress: () => console.log("Language selection coming soon") }]
    );
  };
  
  const handleStudyReminderSettings = () => {
    Alert.alert(
      "Çalışma Hatırlatıcıları",
      "Çalışma hatırlatıcı ayarları yakında kullanıma sunulacaktır.",
      [{ text: "Tamam", onPress: () => console.log("Study reminder settings coming soon") }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Uygulama Ayarları</Text>
        <TouchableOpacity onPress={saveSettings} style={styles.saveButton}>
          <Save color="#fff" size={20} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#8b5cf6' }]}>
                <Moon color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Karanlık Mod</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={darkMode ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setDarkMode}
              value={darkMode}
            />
          </View>
        </View>
        
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#f59e0b' }]}>
                <Bell color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Bildirimleri Etkinleştir</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setNotifications}
              value={notifications}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, !notifications && styles.disabledSetting]}
            onPress={() => router.push('notification-settings')}
            disabled={!notifications}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#f59e0b', opacity: notifications ? 1 : 0.5 }]}>
                <Bell color="#fff" size={20} />
              </View>
              <Text style={[styles.settingItemText, !notifications && styles.disabledText]}>Bildirim Tercihleri</Text>
            </View>
            <Text style={[styles.settingItemArrow, !notifications && styles.disabledText]}>›</Text>
          </TouchableOpacity>
          
          <View style={[styles.settingItem, !notifications && styles.disabledSetting]}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#10b981', opacity: notifications ? 1 : 0.5 }]}>
                <Target color="#fff" size={20} />
              </View>
              <Text style={[styles.settingItemText, !notifications && styles.disabledText]}>Çalışma Hatırlatıcıları</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={studyReminders ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setStudyReminders}
              value={studyReminders}
              disabled={!notifications}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, !(notifications && studyReminders) && styles.disabledSetting]}
            onPress={handleStudyReminderSettings}
            disabled={!(notifications && studyReminders)}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#10b981', opacity: (notifications && studyReminders) ? 1 : 0.5 }]}>
                <Clock color="#fff" size={20} />
              </View>
              <Text style={[styles.settingItemText, !(notifications && studyReminders) && styles.disabledText]}>Hatırlatıcı Ayarları</Text>
            </View>
            <Text style={[styles.settingItemArrow, !(notifications && studyReminders) && styles.disabledText]}>›</Text>
          </TouchableOpacity>
        </View>
        
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dil</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleLanguageChange}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#ec4899' }]}>
                <Globe color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Uygulama Dili</Text>
            </View>
            <View style={styles.languageSelector}>
              <Text style={styles.languageText}>{language}</Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Data & Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri ve Senkronizasyon</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#3b82f6' }]}>
                <Save color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Otomatik Senkronizasyon</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={autoSync ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setAutoSync}
              value={autoSync}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#0ea5e9' }]}>
                <Bookmark color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Otomatik Yer İmi</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={autoBookmark ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setAutoBookmark}
              value={autoBookmark}
            />
          </View>
        </View>
        
        {/* Sound & Vibration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ses ve Titreşim</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#6366f1' }]}>
                <Volume2 color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Ses Efektleri</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setSoundEnabled}
              value={soundEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingItemIcon, { backgroundColor: '#8b5cf6' }]}>
                <Vibrate color="#fff" size={20} />
              </View>
              <Text style={styles.settingItemText}>Titreşim</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor={vibrationEnabled ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#334155"
              onValueChange={setVibrationEnabled}
              value={vibrationEnabled}
            />
          </View>
        </View>
        
        {/* Veri Saklama Bilgisi */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Veri Saklama Hakkında</Text>
          <Text style={styles.infoText}>
            Uygulamadaki tüm verileriniz (deneme sonuçları, çalışma istatistikleri, profil bilgileri, ayarlar vb.) 
            cihazınızda güvenli bir şekilde saklanmaktadır. Uygulama kapatılıp açıldığında bile verileriniz korunur.
          </Text>
          <Text style={styles.infoText}>
            Verilerinizi tamamen silmek için "Çıkış Yap" butonunu kullanabilirsiniz.
          </Text>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  disabledSetting: {
    opacity: 0.7,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingItemText: {
    fontSize: 16,
    color: '#fff',
  },
  disabledText: {
    color: '#64748b',
  },
  settingItemArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    color: '#9ca3af',
    marginRight: 8,
  },
  versionInfo: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
  },
})