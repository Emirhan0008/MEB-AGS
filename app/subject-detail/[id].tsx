import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { ArrowLeft, BookOpen, CheckCircle, PlusCircle } from 'lucide-react-native';
import { useStats } from '../../context/StatsContext';

export default function SubjectDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const subjectId = parseInt(id as string, 10);
  const { stats, updateStats } = useStats();
  const [subject, setSubject] = useState<any>(null);
  
  // MEB-AGS subjects
  const mebAgsSubjects = [
    {
      id: 1,
      title: 'Türkçe',
      subtitle: '15 Soru',
      color: '#f43f5e',
      topics: [
        'Sözcükte Anlam',
        'Cümlede Anlam',
        'Paragrafta Anlam',
        'Paragrafta Anlatım Biçimleri',
        'Anlatımın Oluşması',
        'Sözel Mantık'
      ]
    },
    {
      id: 2,
      title: 'Matematik',
      subtitle: '15 Soru',
      color: '#3b82f6',
      topics: [
        'Temel Kavramlar – Çözümleme',
        'Rasyonel Sayılar – Ondalık Sayılar',
        'Basit Eşitsizlikler',
        'Mutlak Değer',
        'Üslü Sayılar',
        'Köklü Sayılar',
        'Çarpanlara Ayırma',
        'Denklem Çözme',
        'Sayı Problemleri',
        'Yaş Problemleri',
        'Hareket Problemleri',
        'İşçi-Havuz Problemleri',
        'Yüzde Kar-Zarar, Faiz Problemleri',
        'Bağıntı ve Fonksiyon',
        'İşlem',
        'Olasılık',
        'Sayısal Mantık'
      ]
    },
    {
      id: 3,
      title: 'Tarih',
      subtitle: '10 Soru',
      color: '#f59e0b',
      topics: [
        'İslamiyet Öncesi Türk Tarihi',
        'İslamiyet Öncesi Türk Devletlerinde Kültür ve Uygarlık',
        'İlk Türk İslam Devletleri',
        'İlk Türk İslam Devletlerinde Kültür ve Uygarlık',
        'Osmanlı Devleti Siyaseti',
        'Osmanlı Devleti Kültür ve Uygarlık',
        'Yüzyıl Osmanlı Devleti',
        'Kurtuluş Savaşı Cepheler',
        'İnkılap Tarihi',
        'Atatürk Dönemi Türk Politikası',
        'Atatürk\'ün İlke ve İnkılapları'
      ]
    },
    {
      id: 4,
      title: 'Coğrafya',
      subtitle: '10 Soru',
      color: '#10b981',
      topics: [
        'Doğal Sistemler',
        'Beşeri Sistemler',
        'Mekansal Bir Sentez: Türkiye',
        'Küresel Ortam: Bölgeler ve Ülkeler',
        'Çevre ve Toplum',
        'İklim Bilgisi',
        'Yerşekilleri',
        'Türkiye Fiziki Coğrafyası',
        'Türkiye Beşeri ve Ekonomik Coğrafyası',
        'Türkiye Bölgeleri',
        'Dünya\'nın Şekli ve Hareketleri',
        'Harita Bilgisi'
      ]
    },
    {
      id: 5,
      title: 'Mevzuat',
      subtitle: '8 Soru',
      color: '#8b5cf6',
      topics: [
        '222 sayılı İlköğretim ve Eğitim Kanunu',
        '1739 sayılı Milli Eğitim Temel Kanunu',
        '7528 sayılı Öğretmenlik Mesleği Kanunu',
        '1982 Anayasası'
      ]
    },
    {
      id: 6,
      title: 'Eğitimin Temelleri',
      subtitle: '24 Soru',
      color: '#6366f1',
      topics: [
        'Eğitimin Felsefi Temelleri',
        'Eğitimin Psikolojik Temelleri',
        'Eğitimin Sosyolojik Temelleri',
        'Eğitimin Tarihsel Temelleri',
        'Eğitimin Siyasi Temelleri',
        'Eğitimin Ekonomik Temelleri',
        'Eğitimde Temel Kavramlar ve Kuramlar',
        'Etik ve Eğitim',
        'Eğitim Öğretim Teknolojileri',
        'Türk Eğitim Sisteminin Genel Yapısı'
      ]
    }
  ];

  // ÖABT subjects
  const oabtSubjects = [
    {
      id: 101,
      title: 'Türkçe Öğretmenliği',
      subtitle: 'ÖABT',
      color: '#f43f5e',
      topics: [
        'Anlama ve Anlatma Teknikleri',
        'Dil Bilgisi ve Dil Bilimi',
        'Çocuk Edebiyatı',
        'Türk Halk Edebiyatı',
        'Yeni Türk Edebiyatı',
        'Eski Türk Edebiyatı',
        'Edebiyat Bilgi ve Kuramları',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 102,
      title: 'Türk Dili ve Edebiyatı',
      subtitle: 'ÖABT',
      color: '#ec4899',
      topics: [
        'Eski Türk Dili ve Yeni Türk Dili',
        'Yeni Türk Edebiyatı',
        'Eski Türk Edebiyatı',
        'Türk Halk Edebiyatı',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 103,
      title: 'Tarih Öğretmenliği',
      subtitle: 'ÖABT',
      color: '#f59e0b',
      topics: [
        'Tarih Metodu',
        'Eski Çağ Tarihi',
        'İslamiyet Öncesi Türk Tarihi',
        'Orta Çağ İslam Tarihi',
        'Osmanlı Tarihi',
        'Türkiye Cumhuriyeti Tarihi',
        'Ortaçağ\'dan 20. Yüzyıl\'a Dünya Tarihi',
        'Yüzyıl Türk ve Dünya Tarihi',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 104,
      title: 'Sosyal Bilgiler',
      subtitle: 'ÖABT',
      color: '#0ea5e9',
      topics: [
        'Tarih',
        'Coğrafya',
        'Siyaset Bilimi',
        'Diğer sosyal bilim alanları',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 105,
      title: 'Sınıf Öğretmenliği',
      subtitle: 'ÖABT',
      color: '#10b981',
      topics: [
        'Matematik ve Matematik Öğretimi',
        'Fen ve Teknoloji/Fen Bilimleri ve Öğretimi',
        'Türkçe ve Türkçe Öğretimi',
        'Sosyal Bilgiler ve Sosyal Bilgiler Öğretimi',
        'Hayat Bilgisi ve Hayat Bilgisi Öğretimi',
        'Din Kültürü ve Ahlak Bilgisi',
        'Yabancı Dil',
        'Güzel Sanatlar',
        'Beden Eğitimi ve Oyun Öğretimi',
        'Trafik Güvenliği',
        'İnsan Hakları ve Vatandaşlık',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 106,
      title: 'Rehber Öğretmen (PDR)',
      subtitle: 'ÖABT',
      color: '#8b5cf6',
      topics: [
        'Rehberlik ve Psikolojik Danışma',
        'Gelişim Psikolojisi',
        'Öğrenme Psikolojisi',
        'Psikolojik Ölçme Araçları',
        'Mesleki Rehberlik',
        'Özel Eğitim',
        'Grup Rehberliği',
        'Aile Danışmanlığı',
        'Alan Eğitimi Testi'
      ]
    }
  ];

  // Tüm dersleri birleştir
  const allSubjects = [...mebAgsSubjects, ...oabtSubjects];

  // ID'ye göre dersi bul
  useEffect(() => {
    const foundSubject = allSubjects.find(s => s.id === subjectId);
    if (foundSubject) {
      setSubject(foundSubject);
    }
  }, [subjectId]);

  // Tekrar ekle
  const handleAddRepetition = () => {
    updateStats('repetition', subjectId);
    Alert.alert(
      'Tekrar Eklendi',
      `${subject?.title} dersi için tekrar kaydedildi.`,
      [{ text: 'Tamam', onPress: () => console.log('OK Pressed') }]
    );
  };

  // Test ekle
  const handleAddTest = () => {
    updateStats('test', subjectId);
    Alert.alert(
      'Test Eklendi',
      `${subject?.title} dersi için test kaydedildi.`,
      [{ text: 'Tamam', onPress: () => console.log('OK Pressed') }]
    );
  };

  // Geri tuşuna basıldığında ana tab'a dön
  const handleBackPress = () => {
    router.push('/');
  };

  if (!subject) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Ders bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // İlerleme hesaplama
  const progress = stats.subjectProgress[subjectId] || 0;
  const maxProgress = subject.topics.length * 10; // Her konu için 10 aktivite hedefi
  const percentage = Math.min(Math.round((progress / maxProgress) * 100), 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{subject.title}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { flexGrow: 1, paddingBottom: Platform.OS === 'android' ? 32 : 16 }
        ]}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        overScrollMode="always"
        android_disableSound={true}
        bounces={true}
        alwaysBounceVertical={true}
        decelerationRate="normal"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
      >
        {/* Subject Info Card */}
        <View 
          style={[styles.card, { borderLeftColor: subject.color, borderLeftWidth: 4 }]}
          pointerEvents="box-none"
        >
          <View style={styles.cardHeader}>
            <View style={[styles.subjectIcon, { backgroundColor: subject.color }]}>
              <BookOpen color="#fff" size={24} />
            </View>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectTitle}>{subject.title}</Text>
              <Text style={styles.subjectSubtitle}>{subject.subtitle}</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>İlerleme</Text>
              <Text style={styles.progressPercentage}>{percentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: subject.color }]} 
              />
            </View>
          </View>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: subject.color }]}
              onPress={handleAddRepetition}
              activeOpacity={0.7}
              pressRetentionOffset={{ top: 20, left: 20, right: 20, bottom: 20 }}
            >
              <PlusCircle color="#fff" size={20} />
              <Text style={styles.actionButtonText}>Tekrar Ekle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: subject.color }]}
              onPress={handleAddTest}
              activeOpacity={0.7}
              pressRetentionOffset={{ top: 20, left: 20, right: 20, bottom: 20 }}
            >
              <CheckCircle color="#fff" size={20} />
              <Text style={styles.actionButtonText}>Test Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Topics List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Konular</Text>
          <View style={styles.topicsList} pointerEvents="box-none">
            {subject.topics.map((topic: string, index: number) => (
              <View 
                key={index} 
                style={styles.topicItem}
                pointerEvents="box-none"
              >
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.select({ 
      android: 32,
      ios: 16 
    }),
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subjectSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
  },
  topicText: {
    color: '#fff',
    fontSize: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});