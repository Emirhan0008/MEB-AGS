import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, RotateCcw, AlertTriangle, Clock, BookOpen, Trash2 } from 'lucide-react-native';
import { Modal } from '../../components/Modal';
import { useStats } from '../../context/StatsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage key
const STORAGE_KEY = 'meb-ags-stats';

export default function ExploreScreen() {
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedSubjectForReset, setSelectedSubjectForReset] = useState<number | null>(null);
  const [lastResetData, setLastResetData] = useState<any>(null);
  const [showUndoButton, setShowUndoButton] = useState(false);
  
  // Get stats from context
  const { stats, updateStats, resetStats, isLoading, setStats } = useStats();
  
  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Az önce';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} dakika önce`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} saat önce`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} gün önce`;
    }
    
    // Format as date
    const date = new Date(timestamp);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };
  
  // Belirli bir dersin istatistiklerini sıfırlama
  const handleResetSubjectStats = async (subjectId: number) => {
    try {
      await resetStats('subject', subjectId);
      
      // Başarılı mesajı göster
      Alert.alert('Başarılı', 'Ders istatistikleri başarıyla sıfırlandı.');
      
      // Son çalışılan dersler listesinden kartı hemen kaldır
      // Bu, UI'ın hemen güncellenmesini sağlar
      setStats(prevStats => {
        return {
          ...prevStats,
          recentSubjects: prevStats.recentSubjects.filter(s => s.id !== subjectId)
        };
      });
    } catch (error) {
      Alert.alert('Hata', 'Ders istatistikleri sıfırlanırken bir hata oluştu.');
      console.error(error);
    }
  };
  
  // Stats are now managed by the context
  
  // Combined subjects from both MEB-AGS and ÖABT
  const subjects = [
    // MEB-AGS subjects
    { id: 1, title: 'Türkçe', topics: 6, category: 'meb-ags' },
    { id: 2, title: 'Matematik', topics: 17, category: 'meb-ags' },
    { id: 3, title: 'Tarih', topics: 11, category: 'meb-ags' },
    { id: 4, title: 'Coğrafya', topics: 12, category: 'meb-ags' },
    { id: 5, title: 'Mevzuat', topics: 4, category: 'meb-ags' },
    { id: 6, title: 'Eğitimin Temelleri', topics: 10, category: 'meb-ags' },
    
    // ÖABT subjects
    { id: 101, title: 'Türkçe Öğretmenliği', topics: 8, category: 'oabt' },
    { id: 102, title: 'Türk Dili ve Edebiyatı', topics: 5, category: 'oabt' },
    { id: 103, title: 'Tarih Öğretmenliği', topics: 9, category: 'oabt' },
    { id: 104, title: 'Sosyal Bilgiler', topics: 5, category: 'oabt' },
    { id: 105, title: 'Sınıf Öğretmenliği', topics: 12, category: 'oabt' },
    { id: 106, title: 'Rehber Öğretmen (PDR)', topics: 9, category: 'oabt' },
    { id: 107, title: 'Okul Öncesi Öğretmenliği', topics: 15, category: 'oabt' },
    { id: 108, title: 'Kimya Öğretmenliği', topics: 5, category: 'oabt' },
    { id: 109, title: 'Matematik (Lise)', topics: 5, category: 'oabt' },
    { id: 110, title: 'İlköğretim Matematik', topics: 5, category: 'oabt' },
    { id: 111, title: 'İngilizce Öğretmenliği', topics: 4, category: 'oabt' },
    { id: 112, title: 'Fizik Öğretmenliği', topics: 6, category: 'oabt' },
    { id: 113, title: 'Fen Bilimleri', topics: 7, category: 'oabt' },
    { id: 114, title: 'Coğrafya Öğretmenliği', topics: 4, category: 'oabt' },
    { id: 115, title: 'Biyoloji Öğretmenliği', topics: 7, category: 'oabt' },
    { id: 116, title: 'Din Kültürü ve Ahlak Bilgisi', topics: 7, category: 'oabt' },
    { id: 117, title: 'Beden Eğitimi', topics: 17, category: 'oabt' }
  ];
  
  // State for category filter
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'meb-ags' | 'oabt'>('all');
  
  // Filter subjects based on selected category
  const filteredSubjects = selectedCategory === 'all' 
    ? subjects 
    : subjects.filter(subject => subject.category === selectedCategory);
    
  // Reset all statistics
  const resetAllStats = async () => {
    try {
      // Store current stats for undo functionality
      setLastResetData({
        totalRepetitions: stats.totalRepetitions,
        totalTests: stats.totalTests,
        subjectProgress: {...stats.subjectProgress},
        recentSubjects: [...stats.recentSubjects]
      });
      
      // Tüm istatistikleri sıfırla
      await resetStats('all');
      
      setIsResetModalOpen(false);
      setShowUndoButton(true);
      
      // Hide undo button after 10 seconds
      setTimeout(() => {
        setShowUndoButton(false);
      }, 10000);
    } catch (error) {
      Alert.alert('Hata', 'İstatistikler sıfırlanırken bir hata oluştu.');
      console.error(error);
      setIsResetModalOpen(false);
    }
  };
  
  // Reset statistics for a specific subject
  const resetSubjectStats = (subjectId: number) => {
    // Store current stats for undo functionality
    setLastResetData({
      totalRepetitions: stats.totalRepetitions,
      totalTests: stats.totalTests,
      subjectProgress: {
        [subjectId]: stats.subjectProgress[subjectId] || 0
      }
    });
    
    // Reset stats for the selected subject through the context
    const currentProgress = stats.subjectProgress[subjectId] || 0;
    if (currentProgress > 0) {
      updateStats('repetition', subjectId, -currentProgress);
    }
    
    setIsResetModalOpen(false);
    setSelectedSubjectForReset(null);
    setShowUndoButton(true);
    
    // Hide undo button after 10 seconds
    setTimeout(() => {
      setShowUndoButton(false);
    }, 10000);
  };
  
  // Undo the last reset operation
  const undoLastReset = () => {
    if (!lastResetData) return;
    
    // Yeni bir stats objesi oluştur
    const restoredStats = {
      ...stats,
      totalRepetitions: lastResetData.totalRepetitions,
      totalTests: lastResetData.totalTests,
      subjectProgress: {...lastResetData.subjectProgress},
      recentSubjects: lastResetData.recentSubjects || []
    };
    
    // Context'teki stats'i güncelle
    setStats(restoredStats);
    
    // AsyncStorage'a kaydet
    AsyncStorage.setItem('meb-ags-stats', JSON.stringify(restoredStats))
      .then(() => {
        console.log('İstatistikler geri yüklendi');
        setShowUndoButton(false);
        setLastResetData(null);
      })
      .catch(error => {
        console.error('İstatistikler geri yüklenirken hata oluştu:', error);
        Alert.alert('Hata', 'İstatistikler geri yüklenirken bir hata oluştu.');
      });
  };
  
  // Example function to simulate adding a test or repetition (for demonstration)
  const addTestOrRepetition = (type: 'test' | 'repetition', subjectId: number) => {
    updateStats(type, subjectId);
    Alert.alert(
      type === 'test' ? 'Test Eklendi' : 'Tekrar Eklendi',
      `${subjects.find(s => s.id === subjectId)?.title} dersi için ${type === 'test' ? 'test' : 'tekrar'} kaydedildi.`,
      [{ text: 'Tamam', onPress: () => console.log('OK Pressed') }]
    );
  };

  // Son çalışılan dersler listesinden bir kartı kaldır
  const removeFromRecentSubjects = async (subjectId: number) => {
    try {
      // Son çalışılan dersler listesinden kartı kaldır ve AsyncStorage'a kaydet
      setStats(prevStats => {
        const newStats = {
          ...prevStats,
          recentSubjects: prevStats.recentSubjects.filter(s => s.id !== subjectId)
        };
        
        // AsyncStorage'a kaydet (async işlemi bir IIFE içinde çalıştır)
        (async () => {
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
            console.log(`${subjectId} ID'li ders son çalışılanlar listesinden kaldırıldı`);
            
            // Başarılı mesajı göster
            Alert.alert('Başarılı', 'Ders son çalışılanlar listesinden kaldırıldı.');
          } catch (error) {
            console.error('AsyncStorage kayıt hatası:', error);
          }
        })();
        
        return newStats;
      });
    } catch (error) {
      console.error('Ders kaldırılırken hata oluştu:', error);
      Alert.alert('Hata', 'Ders kaldırılırken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İstatistikler</Text>
        </View>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => setIsResetModalOpen(true)}
        >
          <RotateCcw color="#fff" size={20} />
          <Text style={styles.resetButtonText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>
      
      {/* Category Selector */}
      <View style={styles.categorySelector}>
        <TouchableOpacity 
          style={[styles.categoryButton, selectedCategory === 'all' && styles.activeCategoryButton]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.activeCategoryButtonText]}>
            Tümü
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.categoryButton, selectedCategory === 'meb-ags' && styles.activeCategoryButton]}
          onPress={() => setSelectedCategory('meb-ags')}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === 'meb-ags' && styles.activeCategoryButtonText]}>
            MEB-AGS
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.categoryButton, selectedCategory === 'oabt' && styles.activeCategoryButton]}
          onPress={() => setSelectedCategory('oabt')}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === 'oabt' && styles.activeCategoryButtonText]}>
            ÖABT
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Undo Button */}
        {showUndoButton && (
          <TouchableOpacity 
            style={styles.undoButton}
            onPress={undoLastReset}
          >
            <Text style={styles.undoButtonText}>Son işlemi geri al</Text>
          </TouchableOpacity>
        )}
        
        {/* Son Çalışılan Dersler */}
        <View style={styles.recentSubjectsContainer}>
          <View style={styles.sectionHeader}>
            <Clock color="#fff" size={20} />
            <Text style={styles.sectionTitle}>Son Çalışılan Dersler</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentSubjectsScroll}
          >
            {stats.recentSubjects.map((subject) => (
              <TouchableOpacity 
                key={`recent-${subject.id}-${subject.timestamp}`}
                style={styles.recentSubjectCard}
                onPress={() => {
                  // Konuya ait detaylı istatistiklere git yerine dersler tabına git
                  router.push({
                    pathname: "/(tabs)",
                    params: { openSubjectId: subject.id }
                  });
                }}
              >
                <View style={styles.recentSubjectActions}>
                  <TouchableOpacity 
                    style={styles.recentSubjectAction}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        'Kartı Kaldır',
                        `${subject.title} dersini son çalışılanlar listesinden kaldırmak istediğinize emin misiniz?`,
                        [
                          { text: 'İptal', style: 'cancel' },
                          { 
                            text: 'Kaldır', 
                            style: 'destructive',
                            onPress: () => removeFromRecentSubjects(subject.id)
                          }
                        ]
                      );
                    }}
                  >
                    <Trash2 color="#ef4444" size={16} />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.recentSubjectIcon, { backgroundColor: subject.color }]}>
                  <BookOpen color="#fff" size={18} />
                </View>
                <View style={styles.recentSubjectInfo}>
                  <Text style={styles.recentSubjectTitle} numberOfLines={1}>{subject.title}</Text>
                  <Text style={styles.recentSubjectCategory}>
                    {subject.category === 'meb-ags' ? 'MEB-AGS' : 'ÖABT'}
                  </Text>
                  <Text style={styles.recentSubjectTime}>{formatTimestamp(subject.timestamp)}</Text>
                  
                  <View style={styles.recentSubjectStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{subject.repetitions}</Text>
                      <Text style={styles.statLabel}>Tekrar</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{subject.tests}</Text>
                      <Text style={styles.statLabel}>Test</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {stats.recentSubjects.length === 0 && (
              <View style={styles.emptyRecentSubjects}>
                <Text style={styles.emptyRecentSubjectsText}>
                  Henüz hiçbir ders çalışmadınız.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* General Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Genel İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.totalRepetitions}</Text>
              <Text style={styles.statLabel}>Toplam Tekrar</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.totalTests}</Text>
              <Text style={styles.statLabel}>Toplam Test</Text>
            </View>
          </View>
        </View>
        
        {/* Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ders Bazlı İlerleme</Text>
          <View style={styles.progressList}>
            {filteredSubjects.map(subject => {
              const progress = stats.subjectProgress[subject.id] || 0;
              const maxProgress = subject.topics * 10; // Assuming target is 10 activities per topic
              const percentage = Math.min(Math.round((progress / maxProgress) * 100), 100);
              
              return (
                <View key={subject.id} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>{subject.title}</Text>
                    <View style={styles.progressActions}>
                      <Text style={styles.progressPercentage}>{percentage}%</Text>
                      <TouchableOpacity 
                        style={styles.subjectResetButton}
                        onPress={() => {
                          setSelectedSubjectForReset(subject.id);
                          setIsResetModalOpen(true);
                        }}
                      >
                        <RotateCcw color="#64748b" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${percentage}%` }
                      ]} 
                    />
                  </View>
                  
                  {/* Removed Test and Repetition buttons as per requirement */}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
      
      {/* Reset Modal */}
      <Modal
        visible={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setSelectedSubjectForReset(null);
        }}
        title={selectedSubjectForReset ? "Ders İstatistiklerini Sıfırla" : "Tüm İstatistikleri Sıfırla"}
      >
        <View style={styles.modalContent}>
          <View style={styles.warningBox}>
            <AlertTriangle color="#f59e0b" size={24} />
            <Text style={styles.warningText}>
              {selectedSubjectForReset 
                ? "Seçilen ders için tüm tekrar ve test kayıtları sıfırlanacaktır. Bu işlem geri alınamaz."
                : "Tüm dersler için tekrar ve test kayıtları sıfırlanacaktır. Bu işlem geri alınamaz."}
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setIsResetModalOpen(false);
                setSelectedSubjectForReset(null);
              }}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => {
                if (selectedSubjectForReset) {
                  resetSubjectStats(selectedSubjectForReset);
                } else {
                  resetAllStats();
                }
              }}
            >
              <Text style={styles.confirmButtonText}>Sıfırla</Text>
            </TouchableOpacity>
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  undoButton: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  undoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  categorySelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    margin: 16,
    padding: 4,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#0f172a',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeCategoryButtonText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressList: {
    marginTop: 8,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#9ca3af',
  },
  subjectResetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  modalContent: {
    padding: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Son çalışılan dersler için stil tanımlamaları
  recentSubjectsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  recentSubjectsScroll: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  recentSubjectCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentSubjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentSubjectInfo: {
    flex: 1,
  },
  recentSubjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  recentSubjectCategory: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  recentSubjectTime: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  recentSubjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  emptyRecentSubjects: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentSubjectsText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  recentSubjectActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
  },
  recentSubjectAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
});