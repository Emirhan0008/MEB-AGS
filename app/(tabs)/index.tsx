import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TouchableWithoutFeedback, Platform, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { ArrowLeft, ChevronRight, Eye, EyeOff, RefreshCw, Search, X, Clock } from 'lucide-react-native';
import { Modal } from '../../components/Modal';
import { useStats } from '../../context/StatsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarı
const SELECTED_OABT_SUBJECT_KEY = 'meb-ags-selected-oabt-subject';

export default function SubjectsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ openSubjectId?: string, highlightTopic?: string }>();
  const openSubjectId = params.openSubjectId ? parseInt(params.openSubjectId, 10) : null;
  const highlightTopic = params.highlightTopic || null;
  
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topicStats, setTopicStats] = useState<{[key: string]: any}>({});
  const [selectedCategory, setSelectedCategory] = useState<'meb-ags' | 'oabt'>('meb-ags');
  const [selectedOabtSubject, setSelectedOabtSubject] = useState<number | null>(null);
  const [showAllOabtSubjects, setShowAllOabtSubjects] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);
  const { stats, updateStats, resetStats, isLoading } = useStats();
  const [highlightedTopic, setHighlightedTopic] = useState<string | null>(null);
  
  // Arama işlevi için state'ler
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // URL parametre ile gelen openSubjectId varsa ilgili dersi aç
  useEffect(() => {
    if (openSubjectId) {
      // Dersin hangi kategoriye ait olduğunu bul
      const mebAgsSubject = mebAgsSubjects.find(s => s.id === openSubjectId);
      const oabtSubject = oabtSubjects.find(s => s.id === openSubjectId);
      
      if (mebAgsSubject) {
        // MEB-AGS dersi ise
        setSelectedCategory('meb-ags');
        handleSubjectPress(mebAgsSubject);
      } else if (oabtSubject) {
        // ÖABT dersi ise
        setSelectedCategory('oabt');
        setSelectedOabtSubject(oabtSubject.id);
        setShowAllOabtSubjects(false);
        handleSubjectPress(oabtSubject);
      }

      // Vurgulanacak konu varsa ayarla
      if (highlightTopic) {
        setHighlightedTopic(highlightTopic);
      }
    }
  }, [openSubjectId, highlightTopic]);

  // AsyncStorage'dan arama geçmişini yükle
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Arama geçmişini yükle
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('meb-ags-search-history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Arama geçmişi yüklenirken hata oluştu:', error);
    }
  };

  // Arama geçmişini kaydet
  const saveSearchHistory = async (query: string) => {
    try {
      // Aynı sorguyu tekrar ekleme ve en son arama en üstte olsun
      const updatedHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('meb-ags-search-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Arama geçmişi kaydedilirken hata oluştu:', error);
    }
  };

  // Arama geçmişini temizle
  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem('meb-ags-search-history');
    } catch (error) {
      console.error('Arama geçmişi temizlenirken hata oluştu:', error);
    }
  };

  // Arama işlemini başlat
  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
      saveSearchHistory(searchQuery.trim());
    }
  };

  // Arama sorgusunun değiştirilmesi
  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    // Sadece kullanıcı arama yapmak istediğinde arama yapılacak
    // Metin girişi sırasında sonuçlar değişmeyecek
    if (text.trim() === '') {
      setSearchResults([]);
    }
  };

  // Arama işlemini gerçekleştir
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    setIsSearching(true);
    
    const results = [];
    
    // MEB-AGS derslerinde ara
    for (const subject of mebAgsSubjects) {
      // Ders başlığında ara
      if (subject.title.toLowerCase().includes(lowercaseQuery)) {
        results.push({
          type: 'subject',
          id: subject.id,
          title: subject.title,
          subtitle: subject.subtitle,
          category: 'meb-ags',
          color: subject.color
        });
      }
      
      // Konularda ara
      for (const topic of subject.topics) {
        if (topic.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            type: 'topic',
            id: subject.id,
            title: topic,
            parentTitle: subject.title,
            category: 'meb-ags',
            color: subject.color
          });
        }
      }
    }
    
    // ÖABT derslerinde ara
    for (const subject of oabtSubjects) {
      // Ders başlığında ara
      if (subject.title.toLowerCase().includes(lowercaseQuery)) {
        results.push({
          type: 'subject',
          id: subject.id,
          title: subject.title,
          subtitle: subject.subtitle,
          category: 'oabt',
          color: subject.color
        });
      }
      
      // Konularda ara
      for (const topic of subject.topics) {
        if (topic.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            type: 'topic',
            id: subject.id,
            title: topic,
            parentTitle: subject.title,
            category: 'oabt',
            color: subject.color
          });
        }
      }
    }
    
    setSearchResults(results);
    setIsSearching(false);
  };

  // Arama geçmişinden bir öğeyi seç
  const handleHistoryItemPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Sonuç öğesine tıklandığında
  const handleResultPress = (result: any) => {
    if (result.type === 'subject') {
      // Kategoriyi ayarla
      setSelectedCategory(result.category as 'meb-ags' | 'oabt');
      
      if (result.category === 'oabt') {
        setSelectedOabtSubject(result.id);
        setShowAllOabtSubjects(false);
      }
      
      // Ders detayını göster
      const subject = result.category === 'meb-ags' 
        ? mebAgsSubjects.find(s => s.id === result.id)
        : oabtSubjects.find(s => s.id === result.id);
      
      if (subject) {
        handleSubjectPress(subject);
      }
    } else if (result.type === 'topic') {
      // Kategoriyi ayarla
      setSelectedCategory(result.category as 'meb-ags' | 'oabt');
      
      if (result.category === 'oabt') {
        setSelectedOabtSubject(result.id);
        setShowAllOabtSubjects(false);
      }
      
      // Ders detayını göster ve konuyu vurgula
      const subject = result.category === 'meb-ags' 
        ? mebAgsSubjects.find(s => s.id === result.id)
        : oabtSubjects.find(s => s.id === result.id);
      
      if (subject) {
        setHighlightedTopic(result.title);
        handleSubjectPress(subject);
      }
    }
    
    // Arama görünümünü kapat
    setIsSearchVisible(false);
    setSearchResults([]);
  };

  // Vurgulanan konuya scroll yap
  useEffect(() => {
    if (selectedSubject && highlightedTopic) {
      // Kısa bir gecikme ile scrollview'ın render olmasını bekle
      const timer = setTimeout(() => {
        // Burada ref kullanarak ilgili konuya scroll yapılabilir
        // Ancak bu basit örnek için sadece vurguluyoruz
        setHighlightedTopic(highlightedTopic);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedSubject, highlightedTopic]);

  // Seçili ÖABT dersini AsyncStorage'dan yükle
  useEffect(() => {
    const loadSelectedOabtSubject = async () => {
      try {
        const savedSubject = await AsyncStorage.getItem(SELECTED_OABT_SUBJECT_KEY);
        if (savedSubject) {
          const parsedSubject = JSON.parse(savedSubject);
          setSelectedOabtSubject(parsedSubject.id);
          setShowAllOabtSubjects(false);
        }
      } catch (error) {
        console.error('Seçili ÖABT dersi yüklenirken hata oluştu:', error);
      }
    };
    
    // openSubjectId yoksa varsayılan yüklemeyi yap
    if (!openSubjectId) {
      loadSelectedOabtSubject();
    }
  }, [openSubjectId]);

  // Seçili ÖABT dersini AsyncStorage'a kaydet
  const saveSelectedOabtSubject = async (subject: any | null) => {
    try {
      if (subject) {
        await AsyncStorage.setItem(SELECTED_OABT_SUBJECT_KEY, JSON.stringify(subject));
      } else {
        await AsyncStorage.removeItem(SELECTED_OABT_SUBJECT_KEY);
      }
    } catch (error) {
      console.error('Seçili ÖABT dersi kaydedilirken hata oluştu:', error);
    }
  };

  // MEB-AGS subjects
  const mebAgsSubjects = [
    {
      id: 1,
      title: 'Türkçe',
      subtitle: '15 Soru',
      icon: 'book',
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
      icon: 'square-root-alt',
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
      icon: 'landmark',
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
      icon: 'globe',
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
      icon: 'gavel',
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
      icon: 'chalkboard-teacher',
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
      icon: 'book',
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
      icon: 'book',
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
      icon: 'landmark',
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
      icon: 'users',
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
      icon: 'school',
      color: '#14b8a6',
      topics: [
        'Temel Matematik',
        'Genel Biyoloji',
        'Genel Fizik',
        'Genel Kimya',
        'Türk Dili',
        'Cumhuriyet Dönemi Türk Edebiyatı',
        'Çocuk Edebiyatı',
        'Uygarlık Tarihi',
        'Türk Tarihi ve Kültürü',
        'Genel Coğrafya',
        'Türkiye Coğrafyası ve Jeopolitiği',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 106,
      title: 'Rehber Öğretmen (PDR)',
      subtitle: 'ÖABT',
      icon: 'compass',
      color: '#8b5cf6',
      topics: [
        'Temel Psikolojik Kavramlar',
        'Psikolojik Danışma Kuram İlke ve Teknikleri',
        'Davranış ve Uyum Problemleri',
        'Bireyi Tanıma Teknikleri',
        'Bireyle ve Grupla Psikolojik Danışma',
        'Mesleki Rehberlik ve Kariyer Danışmanlığı',
        'Psikolojik Danışma ve Rehberlikte Araştırma ve Program Geliştirme',
        'Meslek Etiği ve Yasal Konular',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 107,
      title: 'Okul Öncesi Öğretmenliği',
      subtitle: 'ÖABT',
      icon: 'child',
      color: '#06b6d4',
      topics: [
        'Okul Öncesi Eğitime Giriş',
        'İnsan Anatomisi ve Fizyolojisi',
        'Psikoloji',
        'Anne-Çocuk Sağlığı ve İlkyardım',
        'Anne-Çocuk Beslenmesi',
        'Erken Çocukluk Döneminde Gelişim',
        'Yaratıcılık ve Geliştirilmesi',
        'Çocukta Oyun Gelişimi',
        'Çocuk Edebiyatı',
        'Çocuk Ruh Sağlığı',
        'Drama',
        'Özel Öğretim Yöntemleri II',
        'Anne-Baba Eğitimi',
        'İlköğretime Hazırlık ve İlköğretim Programları',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 108,
      title: 'Kimya Öğretmenliği',
      subtitle: 'ÖABT',
      icon: 'flask',
      color: '#22c55e',
      topics: [
        'Analitik Kimya',
        'Anorganik Kimya',
        'Organik Kimya',
        'Fizikokimya',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 109,
      title: 'Matematik (Lise)',
      subtitle: 'ÖABT',
      icon: 'calculator',
      color: '#3b82f6',
      topics: [
        'Analiz',
        'Cebir',
        'Geometri',
        'Uygulamalı Matematik',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 110,
      title: 'İlköğretim Matematik',
      subtitle: 'ÖABT',
      icon: 'calculator',
      color: '#6366f1',
      topics: [
        'Analiz',
        'Cebir',
        'Geometri',
        'Uygulamalı Matematik',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 111,
      title: 'İngilizce Öğretmenliği',
      subtitle: 'ÖABT',
      icon: 'globe',
      color: '#0ea5e9',
      topics: [
        'Dil Yeterliği',
        'Dil Bilim',
        'Edebiyat',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 112,
      title: 'Fizik Öğretmenliği',
      subtitle: 'ÖABT',
      icon: 'atom',
      color: '#f59e0b',
      topics: [
        'Mekanik',
        'Elektrik ve Manyetizma',
        'Madde ve Özellikleri',
        'Dalgalar ve Optik',
        'Modern Fizik',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 113,
      title: 'Fen Bilimleri',
      subtitle: 'ÖABT',
      icon: 'microscope',
      color: '#10b981',
      topics: [
        'Fizik',
        'Kimya',
        'Biyoloji',
        'Yer Bilimi (Jeoloji)',
        'Astronomi',
        'Çevre Bilimi',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 114,
      title: 'Coğrafya Öğretmenliği',
      subtitle: 'ÖABT',
      icon: 'map',
      color: '#14b8a6',
      topics: [
        'Fiziki Coğrafya',
        'Beşeri ve Ekonomik Coğrafya',
        'Bölgeler ve Ülkeler',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 115,
      title: 'Biyoloji Öğretmenliği',
      subtitle: 'ÖABT',
      icon: 'leaf',
      color: '#22c55e',
      topics: [
        'Hücre ve Metabolizma',
        'Bitki Biyolojisi',
        'İnsan ve Hayvan Biyolojisi',
        'Ekoloji',
        'Canlıların Sınıflandırılması',
        'Genetik ve Evrim',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 116,
      title: 'Din Kültürü ve Ahlak Bilgisi',
      subtitle: 'ÖABT',
      icon: 'book',
      color: '#8b5cf6',
      topics: [
        'Hz. Muhammed\'in Hayatı ve Sünneti',
        'Kur\'an-ı Kerim\'in Muhtevasını Anlama',
        'Temel Dini Bilgiler (İslâm, İman Esasları ve İbadetler)',
        'İslam Ahlakı, Estetiği ve Felsefesi',
        'Günümüz Türkiye\'sindeki İslam Mezhep ve Yorumları',
        'Din Bilimleri',
        'Alan Eğitimi Testi'
      ]
    },
    {
      id: 117,
      title: 'Beden Eğitimi',
      subtitle: 'ÖABT',
      icon: 'activity',
      color: '#ef4444',
      topics: [
        'Beden Eğitimi ve Sporun Temelleri',
        'İnsan Anatomisi ve Kinesiyoloji',
        'Sağlık Bilgisi ve İlk Yardım',
        'Egzersiz Fizyolojisi',
        'Antrenman Bilgisi',
        'Fiziksel Uygunluk',
        'Egzersiz ve Beslenme',
        'Engelliler İçin Beden Eğitimi ve Spor',
        'Psikomotor Gelişim',
        'Beden Eğitimi ve Spor Yönetimi',
        'Beceri Öğrenimi',
        'Atletizm',
        'Takım Sporları',
        'Ritim Eğitimi ve Dans, Halk Oyunları',
        'Jimnastik',
        'Eğitsel Oyunlar',
        'Alan Eğitimi Testi'
      ]
    }
  ];

  // Get subjects based on selected category
  const getFilteredSubjects = () => {
    if (selectedCategory === 'meb-ags') {
      return mebAgsSubjects;
    } else {
      // ÖABT kategorisi seçiliyse
      if (showAllOabtSubjects || selectedOabtSubject === null) {
        return oabtSubjects;
      } else {
        // Sadece seçilen ÖABT dersini göster
        return oabtSubjects.filter(subject => subject.id === selectedOabtSubject);
      }
    }
  };

  // Kategori değiştiğinde seçili ÖABT dersini sıfırla
  const handleCategoryChange = (category: 'meb-ags' | 'oabt') => {
    setSelectedCategory(category);
    setSelectedSubject(null);
    setIsDialogOpen(false);
  };

  // ÖABT derslerini göster/gizle
  const toggleOabtSubjectsVisibility = () => {
    if (!showAllOabtSubjects) {
      setSelectedOabtSubject(null);
      saveSelectedOabtSubject(null);
    }
    setShowAllOabtSubjects(!showAllOabtSubjects);
  };

  // Bir derse tıklandığında
  const handleSubjectPress = (subject: any) => {
    setSelectedSubject(subject);
    setIsDialogOpen(true);
  };

  // ÖABT dersi seçildiğinde
  const handleOabtSubjectSelect = (subject: any) => {
    if (selectedCategory === 'oabt') {
      // Eğer zaten seçili olan derse tıklandıysa konuları göster
      if (selectedOabtSubject === subject.id) {
        handleSubjectPress(subject);
      } else {
        // Yeni bir ÖABT dersi seçildiğinde
        setSelectedOabtSubject(subject.id);
        setShowAllOabtSubjects(false);
        saveSelectedOabtSubject(subject);
      }
    } else {
      // MEB-AGS kategorisinde direkt konuları göster
      handleSubjectPress(subject);
    }
  };

  // İstatistikleri sıfırla
  const handleResetStats = async () => {
    setResetInProgress(true);
    try {
      await resetStats('all');
      // Denemeler tabını etkilememesi için AsyncStorage'dan ÖABT ders seçimini silme
      // await AsyncStorage.removeItem(SELECTED_OABT_SUBJECT_KEY);
      Alert.alert(
        "Başarılı",
        "Tüm çalışma istatistikleriniz sıfırlandı.",
        [{ text: "Tamam" }]
      );
    } catch (error) {
      console.error('İstatistikler sıfırlanırken hata oluştu:', error);
      Alert.alert(
        "Hata",
        "İstatistikler sıfırlanırken bir hata oluştu.",
        [{ text: "Tamam" }]
      );
    } finally {
      setResetInProgress(false);
      setIsResetModalOpen(false);
    }
  };

  // Belirli bir dersin istatistiklerini sıfırlama
  const handleResetSubjectStats = async (subjectId: number) => {
    setResetInProgress(true);
    try {
      await resetStats('subject', subjectId);
      Alert.alert('Başarılı', 'Ders istatistikleri başarıyla sıfırlandı.');
    } catch (error) {
      Alert.alert('Hata', 'Ders istatistikleri sıfırlanırken bir hata oluştu.');
      console.error(error);
    } finally {
      setResetInProgress(false);
    }
  };

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

  const updateTopicStats = (subjectId: number, topic: string, type: 'repetitions' | 'testAttempts') => {
    setTopicStats(prevStats => {
      const newStats = {
        ...prevStats,
        [subjectId]: {
          ...prevStats[subjectId],
          [topic]: {
            repetitions: ((prevStats[subjectId]?.[topic]?.repetitions || 0) + (type === 'repetitions' ? 1 : 0)),
            testAttempts: ((prevStats[subjectId]?.[topic]?.testAttempts || 0) + (type === 'testAttempts' ? 1 : 0))
          }
        }
      };
      
      // Seçili dersin bilgilerini al
      const currentSubject = selectedCategory === 'meb-ags' 
        ? mebAgsSubjects.find(s => s.id === subjectId)
        : oabtSubjects.find(s => s.id === subjectId);
      
      // Update the global stats through the context
      const statsType = type === 'repetitions' ? 'repetition' : 'test';
      
      // Ders bilgilerini de ilet
      if (currentSubject) {
        updateStats(statsType, subjectId, 1, {
          title: currentSubject.title,
          category: selectedCategory,
          color: currentSubject.color
        });
      } else {
        updateStats(statsType, subjectId);
      }
      
      console.log(`Updated ${statsType} for subject ${subjectId}`);
      
      return newStats;
    });
  };

  // Konu öğesini render et
  const renderTopicItem = (topic: string, index: number) => {
    const stats = topicStats[selectedSubject.id]?.[topic] || { repetitions: 0, testAttempts: 0 };
    const isHighlighted = highlightedTopic === topic;
    
    return (
      <View 
        key={index} 
        style={[
          styles.topicCard,
          isHighlighted && styles.highlightedTopic
        ]}
      >
        <Text style={[styles.topicTitle, isHighlighted && styles.highlightedTopicText]}>{topic}</Text>
        <View style={styles.topicStats}>
          <Text style={styles.topicStatText}>{stats.repetitions} tekrar</Text>
          <Text style={styles.topicStatText}>{stats.testAttempts} test</Text>
        </View>
        <View style={styles.topicActions}>
          <TouchableOpacity 
            style={[styles.topicButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => updateTopicStats(selectedSubject.id, topic, 'repetitions')}
          >
            <Text style={styles.topicButtonText}>+ Tekrar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topicButton, { backgroundColor: '#10b981' }]}
            onPress={() => updateTopicStats(selectedSubject.id, topic, 'testAttempts')}
          >
            <Text style={styles.topicButtonText}>+ Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Geri tuşu için işlev
  const handleBackPress = () => {
    // Eğer diyalog açıksa, önce onu kapatalım
    if (isDialogOpen) {
      setIsDialogOpen(false);
      return;
    }
    
    // Eğer arama açıksa, önce onu kapatalım
    if (isSearchVisible) {
      setIsSearchVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    
    // Kullanıcıyı ana taba geri döndür
    router.push('/');
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
          <TouchableOpacity onPress={handleBackPress}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Konular</Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Arama Butonu */}
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setIsSearchVisible(true)}
          >
            <Search color="#fff" size={20} />
          </TouchableOpacity>
          
          {/* İstatistikleri Sıfırla Butonu */}
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => setIsResetModalOpen(true)}
          >
            <RefreshCw color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Arama Çubuğu */}
      {isSearchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Konu veya içerik ara..."
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }} style={styles.clearButton}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.closeSearchButton}
            onPress={() => {
              setIsSearchVisible(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <X color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Arama Sonuçları */}
      {isSearchVisible && searchQuery.trim().length > 0 && (
        <ScrollView style={styles.content}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Aranıyor...</Text>
            </View>
          ) : (
            <>
              {searchResults.length > 0 ? (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsTitle}>Arama Sonuçları ({searchResults.length})</Text>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity 
                      key={`${result.id}-${result.type}-${index}`}
                      style={styles.resultItem}
                      onPress={() => handleResultPress(result)}
                    >
                      <View style={[styles.resultIconContainer, { backgroundColor: result.color || '#3498db' }]}>
                        <Text style={styles.iconText}>{result.title.charAt(0)}</Text>
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{result.title}</Text>
                        {result.type === 'topic' && (
                          <Text style={styles.resultSubtitle}>{result.parentTitle}</Text>
                        )}
                        {result.subtitle && (
                          <Text style={styles.resultCategory}>
                            {result.subtitle}
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={16} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    "{searchQuery}" ile ilgili sonuç bulunamadı.
                  </Text>
                  <Text style={styles.noResultsSubText}>
                    Farklı anahtar kelimeler deneyebilir veya daha genel terimler arayabilirsiniz.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
      
      {/* Arama geçmişi */}
      {isSearchVisible && !searchQuery.trim() && (
        <ScrollView style={styles.content}>
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Son Aramalar</Text>
              {searchHistory.length > 0 && (
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={styles.clearHistoryText}>Temizle</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {searchHistory.length > 0 ? (
              searchHistory.map((query, index) => (
                <TouchableOpacity 
                  key={`history-${index}`}
                  style={styles.historyItem}
                  onPress={() => handleHistoryItemPress(query)}
                >
                  <Clock size={18} color="#999" />
                  <Text style={styles.historyItemText}>{query}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyHistoryText}>
                Henüz arama geçmişiniz bulunmuyor.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
      
      {/* Ana içerik - Arama açık değilse */}
      {!isSearchVisible && (
        <>
          {/* Category Selector */}
          <View style={styles.categorySelector}>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'meb-ags' && styles.activeCategoryButton]}
              onPress={() => handleCategoryChange('meb-ags')}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'meb-ags' && styles.activeCategoryButtonText]}>
                MEB-AGS
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'oabt' && styles.activeCategoryButton]}
              onPress={() => handleCategoryChange('oabt')}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === 'oabt' && styles.activeCategoryButtonText]}>
                ÖABT
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* ÖABT için Göster/Gizle Butonu */}
          {selectedCategory === 'oabt' && selectedOabtSubject !== null && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={toggleOabtSubjectsVisibility}
              >
                {showAllOabtSubjects ? (
                  <>
                    <EyeOff color="#fff" size={18} />
                    <Text style={styles.toggleButtonText}>Diğer Dersleri Gizle</Text>
                  </>
                ) : (
                  <>
                    <Eye color="#fff" size={18} />
                    <Text style={styles.toggleButtonText}>Tüm Dersleri Göster</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Tüm Dersler</Text>
            
            {getFilteredSubjects().map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectCard,
                  selectedCategory === 'oabt' && selectedOabtSubject === subject.id && styles.selectedSubjectCard
                ]}
                onPress={() => handleOabtSubjectSelect(subject)}
              >
                <View style={styles.subjectCardContent}>
                  <View style={[styles.subjectIcon, { backgroundColor: subject.color }]}>
                    <Text style={styles.iconText}>{subject.title.charAt(0)}</Text>
                  </View>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectTitle}>{subject.title}</Text>
                    <Text style={styles.subjectSubtitle}>{subject.subtitle}</Text>
                  </View>
                  <ChevronRight color="#64748b" size={20} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
      
      {/* Subject Dialog */}
      <Modal
        visible={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedSubject?.title || ''}
      >
        {selectedSubject && (
          <ScrollView 
            style={styles.dialogContent}
            contentContainerStyle={styles.dialogContentContainer}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            overScrollMode="always"
            nestedScrollEnabled={true}
          >
            <TouchableWithoutFeedback>
              <View>
                {selectedSubject.topics.map((topic: string, index: number) => 
                  renderTopicItem(topic, index)
                )}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        )}
      </Modal>
      
      {/* İstatistikleri Sıfırlama Modal */}
      {isResetModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
              overScrollMode="always"
              nestedScrollEnabled={true}
            >
              <TouchableWithoutFeedback>
                <View>
                  <Text style={styles.modalTitle}>İstatistikleri Sıfırla</Text>
                  <Text style={styles.modalText}>
                    Tüm istatistikleriniz ve çalışma verileriniz sıfırlanacak. Bu işlem geri alınamaz.
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => setIsResetModalOpen(false)}
                      disabled={resetInProgress}
                    >
                      <Text style={styles.modalButtonText}>İptal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalResetButton]}
                      onPress={handleResetStats}
                      disabled={resetInProgress}
                    >
                      {resetInProgress ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.modalButtonText}>Sıfırla</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </View>
        </View>
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
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  subjectCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
  },
  subjectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subjectInfo: {
    flex: 1,
    marginLeft: 16,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  subjectSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dialogContent: {
    padding: 16,
    ...(Platform.OS === 'android' && {
      paddingBottom: 0,
    }),
  },
  dialogContentContainer: {
    paddingBottom: 24,
    ...(Platform.OS === 'android' && {
      flexGrow: 1,
    }),
  },
  topicCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  topicStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  topicStatText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  topicActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topicButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  topicButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  selectedSubjectCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  toggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: 20,
    ...(Platform.OS === 'android' && {
      flexGrow: 1,
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#334155',
  },
  modalResetButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightedTopic: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  highlightedTopicText: {
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  closeSearchButton: {
    marginLeft: 8,
    padding: 8,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  resultCategory: {
    fontSize: 14,
    color: '#9ca3af',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  historyContainer: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyItemText: {
    fontSize: 14,
    color: '#fff',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});