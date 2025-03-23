import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Son çalışılan ders tipi
interface RecentSubject {
  id: number;
  title: string;
  timestamp: number;
  repetitions: number;
  tests: number;
  category: 'meb-ags' | 'oabt';
  color: string;
}

type StatsContextType = {
  stats: {
    totalRepetitions: number;
    totalTests: number;
    subjectProgress: { [key: number]: number };
    recentSubjects: RecentSubject[];
    subjectRepetitions: { [key: number]: number };
    subjectTests: { [key: number]: number };
  };
  updateStats: (type: 'test' | 'repetition', subjectId?: number, count?: number, subjectInfo?: Partial<RecentSubject>) => void;
  resetStats: (type?: 'all' | 'subject', subjectId?: number) => Promise<void>;
  isLoading: boolean;
  setStats: React.Dispatch<React.SetStateAction<{
    totalRepetitions: number;
    totalTests: number;
    subjectProgress: { [key: number]: number };
    recentSubjects: RecentSubject[];
    subjectRepetitions: { [key: number]: number };
    subjectTests: { [key: number]: number };
  }>>;
};

const defaultStats = {
  totalRepetitions: 0,
  totalTests: 0,
  subjectProgress: {},
  recentSubjects: [],
  subjectRepetitions: {},
  subjectTests: {}
};

export const STORAGE_KEY = 'meb-ags-stats';
export const EXAMS_STORAGE_KEY = 'meb-ags-exams'; // Denemeler için ayrı bir anahtar

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // İlk yüklemede AsyncStorage'dan verileri al
  useEffect(() => {
    const loadStats = async () => {
      try {
        const savedStats = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      } catch (error) {
        console.error('Veriler yüklenirken hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Stats değiştiğinde AsyncStorage'a kaydet
  useEffect(() => {
    const saveStats = async () => {
      try {
        if (!isLoading) { // İlk yükleme sırasında kaydetme
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
          console.log('Stats kaydedildi');
        }
      } catch (error) {
        console.error('Veriler kaydedilirken hata oluştu:', error);
      }
    };

    saveStats();
  }, [stats, isLoading]);

  // İstatistikleri güncelleme fonksiyonu
  const updateStats = (
    type: 'test' | 'repetition', 
    subjectId?: number, 
    count: number = 1,
    subjectInfo?: Partial<RecentSubject>
  ) => {
    setStats(prev => {
      const newStats = {...prev};
      
      // Update total counts
      if (type === 'test') {
        newStats.totalTests = Math.max(0, newStats.totalTests + count);
        
        // Update subject test count
        if (subjectId) {
          const currentTests = newStats.subjectTests[subjectId] || 0;
          newStats.subjectTests = {
            ...newStats.subjectTests,
            [subjectId]: Math.max(0, currentTests + count)
          };
        }
      } else {
        newStats.totalRepetitions = Math.max(0, newStats.totalRepetitions + count);
        
        // Update subject repetition count
        if (subjectId) {
          const currentRepetitions = newStats.subjectRepetitions[subjectId] || 0;
          newStats.subjectRepetitions = {
            ...newStats.subjectRepetitions,
            [subjectId]: Math.max(0, currentRepetitions + count)
          };
        }
      }
      
      // Update subject progress if a subject ID is provided
      if (subjectId) {
        const currentProgress = newStats.subjectProgress[subjectId] || 0;
        newStats.subjectProgress = {
          ...newStats.subjectProgress,
          [subjectId]: Math.max(0, currentProgress + count)
        };
        
        // Update recent subjects
        if (subjectInfo && subjectInfo.title) {
          const existingIndex = newStats.recentSubjects.findIndex(s => s.id === subjectId);
          const now = Date.now();
          
          if (existingIndex >= 0) {
            // Update existing subject
            const updatedSubject = {
              ...newStats.recentSubjects[existingIndex],
              timestamp: now,
              repetitions: type === 'repetition' 
                ? newStats.recentSubjects[existingIndex].repetitions + count 
                : newStats.recentSubjects[existingIndex].repetitions,
              tests: type === 'test' 
                ? newStats.recentSubjects[existingIndex].tests + count 
                : newStats.recentSubjects[existingIndex].tests,
              ...subjectInfo
            };
            
            // Remove the existing entry
            const filteredSubjects = newStats.recentSubjects.filter(s => s.id !== subjectId);
            
            // Add the updated entry at the beginning
            newStats.recentSubjects = [updatedSubject, ...filteredSubjects];
          } else {
            // Add new subject to recent list
            const newSubject: RecentSubject = {
              id: subjectId,
              title: subjectInfo.title,
              timestamp: now,
              repetitions: type === 'repetition' ? count : 0,
              tests: type === 'test' ? count : 0,
              category: subjectInfo.category || 'meb-ags',
              color: subjectInfo.color || '#3b82f6'
            };
            
            // Keep only the most recent 10 subjects
            newStats.recentSubjects = [newSubject, ...newStats.recentSubjects].slice(0, 10);
          }
        }
      }
      
      return newStats;
    });
  };

  // İstatistikleri sıfırlama fonksiyonu
  const resetStats = async (type: 'all' | 'subject' = 'all', subjectId?: number) => {
    try {
      if (type === 'all') {
        // Tüm istatistikleri sıfırla
        const emptyStats = {
          totalRepetitions: 0,
          totalTests: 0,
          subjectProgress: {},
          recentSubjects: [], // Son çalışılan dersleri de sıfırla
          subjectRepetitions: {},
          subjectTests: {}
        };
        
        setStats(emptyStats);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStats));
        
        // Denemeler tabını etkilememek için EXAMS_STORAGE_KEY'i silmiyoruz
        // Eğer denemeler tabı verilerini de silmek istersek:
        // await AsyncStorage.removeItem(EXAMS_STORAGE_KEY);
        
        console.log('Tüm istatistikler sıfırlandı (denemeler hariç)');
      } else if (type === 'subject' && subjectId) {
        // Sadece belirli bir dersin istatistiklerini sıfırla
        let updatedStats;
        
        setStats(prev => {
          const newStats = {...prev};
          
          // Ders ilerleme durumunu sıfırla
          if (newStats.subjectProgress[subjectId]) {
            newStats.totalRepetitions -= newStats.subjectRepetitions[subjectId] || 0;
            newStats.totalTests -= newStats.subjectTests[subjectId] || 0;
            
            // Ders istatistiklerini sıfırla
            delete newStats.subjectProgress[subjectId];
            delete newStats.subjectRepetitions[subjectId];
            delete newStats.subjectTests[subjectId];
            
            // Son çalışılan derslerden kaldır
            newStats.recentSubjects = newStats.recentSubjects.filter(s => s.id !== subjectId);
          }
          
          updatedStats = newStats;
          return newStats;
        });
        
        // AsyncStorage'a güncellenmiş verileri kaydet
        if (updatedStats) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
          console.log(`${subjectId} ID'li dersin istatistikleri sıfırlandı`);
        }
      }
    } catch (error) {
      console.error('İstatistikler sıfırlanırken hata oluştu:', error);
    }
  };

  return (
    <StatsContext.Provider value={{ stats, updateStats, resetStats, isLoading, setStats }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};