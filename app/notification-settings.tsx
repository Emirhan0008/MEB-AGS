import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Clock, Calendar, BarChart } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, requestPermissions } = useNotifications();
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Uygulama açıldığında, mevcut ayarlardaki zamanı ayarla
  useEffect(() => {
    if (settings.studyReminderTime) {
      const [hours, minutes] = settings.studyReminderTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      setSelectedTime(date);
    }
  }, [settings.studyReminderTime]);

  // Bildirim izinlerini kontrol et ve gerekirse iste
  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const permissionGranted = await requestPermissions();
      if (permissionGranted) {
        updateSettings({ enabled: true });
      }
    } else {
      updateSettings({ enabled: false });
    }
  };

  // Çalışma hatırlatıcılarını aç/kapat
  const handleToggleStudyReminders = (value: boolean) => {
    updateSettings({ studyReminders: value });
  };

  // Sınav hatırlatıcılarını aç/kapat
  const handleToggleExamReminders = (value: boolean) => {
    updateSettings({ examReminders: value });
  };

  // Haftalık raporları aç/kapat
  const handleToggleWeeklyReports = (value: boolean) => {
    updateSettings({ weeklyReports: value });
  };

  // Zaman seçiciyi göster
  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  // Zaman değiştiğinde
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    // Android için picker otomatik kapanır, iOS için manuel kapatmamız gerekiyor
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    } else {
      setShowTimePicker(false); // Android için de kapatıyoruz
    }
    
    // Kullanıcı iptal ederse (Android), selectedDate undefined olacaktır
    // Sadece geçerli bir tarih varsa güncelleme yap
    if (selectedDate) {
      setSelectedTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      updateSettings({ studyReminderTime: `${hours}:${minutes}` });
    }
  };

  // Zaman formatını düzenle (12:30 gibi)
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'ÖS' : 'ÖÖ';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Ana Bildirim Ayarı */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
                <Bell color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Bildirimleri Etkinleştir</Text>
                <Text style={styles.settingDescription}>Tüm uygulama bildirimlerini aç veya kapat</Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#374151', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>
        
        {/* Bildirim Türleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim Türleri</Text>
          
          {/* Çalışma Hatırlatıcıları */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#10b981' }]}>
                <Clock color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Çalışma Hatırlatıcıları</Text>
                <Text style={styles.settingDescription}>Günlük çalışma hatırlatmaları al</Text>
              </View>
            </View>
            <Switch
              value={settings.studyReminders}
              onValueChange={handleToggleStudyReminders}
              trackColor={{ false: '#374151', true: '#10b981' }}
              thumbColor="#fff"
              disabled={!settings.enabled}
            />
          </View>
          
          {/* Çalışma Zamanı Ayarı */}
          {settings.enabled && settings.studyReminders && (
            <TouchableOpacity 
              style={styles.timePickerButton} 
              onPress={showTimePickerModal}
              disabled={!settings.enabled || !settings.studyReminders}
            >
              <Text style={styles.timePickerButtonText}>
                Hatırlatma Zamanı: {formatTime(settings.studyReminderTime)}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Sınav Hatırlatıcıları */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#f59e0b' }]}>
                <Calendar color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Sınav Hatırlatıcıları</Text>
                <Text style={styles.settingDescription}>Yaklaşan sınavlar için hatırlatmalar al</Text>
              </View>
            </View>
            <Switch
              value={settings.examReminders}
              onValueChange={handleToggleExamReminders}
              trackColor={{ false: '#374151', true: '#f59e0b' }}
              thumbColor="#fff"
              disabled={!settings.enabled}
            />
          </View>
          
          {/* Haftalık Raporlar */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#8b5cf6' }]}>
                <BarChart color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Haftalık Raporlar</Text>
                <Text style={styles.settingDescription}>Haftalık ilerleme özetleri al</Text>
              </View>
            </View>
            <Switch
              value={settings.weeklyReports}
              onValueChange={handleToggleWeeklyReports}
              trackColor={{ false: '#374151', true: '#8b5cf6' }}
              thumbColor="#fff"
              disabled={!settings.enabled}
            />
          </View>
        </View>
        
        {/* Bilgi Notu */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Çalışma hatırlatıcıları, belirlediğiniz saatte günlük olarak gönderilir. 
            Sınav hatırlatıcıları, sınav tarihinden bir gün önce ve sınav günü gönderilir.
            Haftalık raporlar her Pazar günü gönderilir.
          </Text>
        </View>
      </ScrollView>
      
      {/* Zaman Seçici (iOS için modal, Android için inline) */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  timePickerButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  timePickerButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
});