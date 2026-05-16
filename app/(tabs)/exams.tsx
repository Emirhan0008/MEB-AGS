import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert, TouchableWithoutFeedback, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, CreditCard as Edit2, Camera, X, Image as ImageIcon, Trash } from 'lucide-react-native';
import { Modal } from '../../components/Modal';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useStats } from '../../context/StatsContext';

// Define the exam result type
interface ExamResult {
  id: string;
  date: string;
  title: string;
  subject: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  blank: number;
  net: number;
  examType: 'meb-ags' | 'oabt' | 'branch';
  mistakes?: MistakePhoto[];
}

// Define mistake photo type
interface MistakePhoto {
  id: string;
  uri: string;
  note?: string;
  createdAt: string;
}

// Define exam types
const EXAM_TYPES = [
  { id: 'meb-ags', name: 'MEB-AGS Denemesi', questionCount: 80 },
  { id: 'oabt', name: 'ÖABT Denemesi', questionCount: 50 },
  { id: 'branch', name: 'Branş Denemesi', questionCount: null }
];

// AsyncStorage key for exam results
const EXAMS_STORAGE_KEY = '@meb_ags_exam_results';

// Fullscreen Image Viewer Component
const FullscreenImageViewer = ({ 
  visible, 
  onClose, 
  imageUri, 
  ensureValidUri 
}: { 
  visible: boolean; 
  onClose: () => void; 
  imageUri: string | null;
  ensureValidUri: (uri: string | null) => string;
}) => (
  <Modal
    visible={visible}
    onClose={onClose}
    title="Fotoğrafı İncele"
  >
    <View style={styles.fullscreenContainer}>
      <ScrollView
        contentContainerStyle={styles.fullscreenImageWrapper}
        maximumZoomScale={4}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {imageUri && (
          <Image
            source={{ uri: ensureValidUri(imageUri) }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        )}
      </ScrollView>
      <TouchableOpacity 
        style={styles.fullscreenCloseButton}
        onPress={onClose}
      >
        <Text style={styles.fullscreenCloseButtonText}>Kapat</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

// Helper function to ensure URI is properly formatted for Android
const ensureValidUri = (uri: string | null): string => {
  if (!uri) return ''; // Return empty string for null or undefined
  
  if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('http')) {
    // Add file:// prefix if it's a local path without proper protocol
    return `file://${uri}`;
  }
  return uri;
};

export default function ExamsScreen() {
  const router = useRouter();
  const { updateStats } = useStats();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMistakesModalOpen, setIsMistakesModalOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<ExamResult | null>(null);
  const [mistakeNote, setMistakeNote] = useState('');
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formTotalQuestions, setFormTotalQuestions] = useState('');
  const [formCorrect, setFormCorrect] = useState('');
  const [formIncorrect, setFormIncorrect] = useState('');
  const [formBlank, setFormBlank] = useState('');
  const [formExamType, setFormExamType] = useState<'meb-ags' | 'oabt' | 'branch'>('meb-ags');
  const [autoCalculateField, setAutoCalculateField] = useState<'correct' | 'incorrect' | 'blank' | null>(null);
  
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  
  // Fullscreen image state
  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  
  // Load saved exam results
  useEffect(() => {
    loadExamResults();
  }, []);
  
  // Load exam results from AsyncStorage
  const loadExamResults = async () => {
    try {
      const savedExams = await AsyncStorage.getItem(EXAMS_STORAGE_KEY);
      
      if (savedExams) {
        const parsedExams: ExamResult[] = JSON.parse(savedExams);
        setExamResults(parsedExams);
        console.log('Deneme sonuçları başarıyla yüklendi:', parsedExams.length);
      } else {
        // Eğer kayıtlı veri yoksa boş bir dizi başlat
        setExamResults([]);
        console.log('Kayıtlı deneme sonucu bulunamadı, boş liste başlatıldı');
      }
    } catch (error) {
      console.error('Error loading exam results:', error);
      Alert.alert('Hata', 'Deneme sonuçları yüklenirken bir hata oluştu.');
      // Hata durumunda da boş bir dizi başlat
      setExamResults([]);
    }
  };
  
  // Save exam results to AsyncStorage
  const saveExamResults = async (exams: ExamResult[]) => {
    try {
      await AsyncStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
    } catch (error) {
      console.error('Error saving exam results:', error);
      Alert.alert('Hata', 'Deneme sonuçları kaydedilirken bir hata oluştu.');
    }
  };
  
  // Save photo to local storage and return the local URI
  const savePhotoToLocalStorage = async (uri: string | null): Promise<string> => {
    try {
      // Check if URI is valid
      if (!uri) {
        throw new Error('Invalid URI: URI is null or undefined');
      }
      
      // Create a unique filename
      const filename = `mistake_${Date.now()}.jpg`;
      
      // Use documentDirectory for persistent study data (mistakes)
      // This matches backup.ts MISTAKES_DIR logic
      const baseDir = FileSystem.documentDirectory;
      if (!baseDir) {
        throw new Error('FileSystem.documentDirectory is null');
      }
      
      const directory = `${baseDir}mistakes/`;
      const fileUri = `${directory}${filename}`;
      
      // Ensure the directory exists
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
      
      // Ensure the source URI is valid
      const validSourceUri = ensureValidUri(uri);
      if (!validSourceUri) {
        throw new Error('Invalid URI after validation');
      }
      
      // Copy the file to local storage
      await FileSystem.copyAsync({
        from: validSourceUri,
        to: fileUri
      });
      
      // For Android, we need to ensure the file is accessible
      if (Platform.OS === 'android') {
        // Check if the file exists after copying
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('File was not copied successfully');
        }
      }
      
      return fileUri;
    } catch (error) {
      console.error('Error saving photo:', error);
      // If there's an error, return the original URI or empty string if URI is null
      return uri || '';
    }
  };
  
  const resetForm = () => {
    setFormTitle('');
    setFormSubject('');
    setFormTotalQuestions('');
    setFormCorrect('');
    setFormIncorrect('');
    setFormBlank('');
    setFormExamType('meb-ags');
    setAutoCalculateField(null);
  };
  
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };
  
  const openEditModal = (exam: ExamResult) => {
    setCurrentExam(exam);
    setFormTitle(exam.title);
    setFormSubject(exam.subject);
    setFormTotalQuestions(exam.totalQuestions.toString());
    setFormCorrect(exam.correct.toString());
    setFormIncorrect(exam.incorrect.toString());
    setFormBlank(exam.blank.toString());
    setFormExamType(exam.examType);
    setAutoCalculateField(null);
    setIsEditModalOpen(true);
  };
  
  // Calculate net score based on the formula: Net = Correct - (Incorrect / 4)
  const calculateNetScore = (correct: number, incorrect: number): number => {
    return correct - (incorrect / 4);
  };

  // Form validation helper
  const validateExamForm = (
    correct: number, 
    incorrect: number, 
    blank: number, 
    total: number
  ): boolean => {
    if (correct < 0 || incorrect < 0 || blank < 0 || total <= 0) {
      Alert.alert('Hata', 'Soru sayıları negatif veya toplam sıfır olamaz.');
      return false;
    }
    
    if (correct + incorrect + blank > total) {
      Alert.alert('Hata', `Girdiğiniz sayılar (${correct + incorrect + blank}) toplam soru sayısını (${total}) aşıyor.`);
      return false;
    }
    
    return true;
  };

  const handleAddExam = () => {
    // Get the selected exam type
    const examTypeConfig = EXAM_TYPES.find(type => type.id === formExamType);
    
    // Determine total questions based on exam type config
    let totalQuestions = examTypeConfig?.questionCount || parseInt(formTotalQuestions) || 0;
    
    const correct = parseInt(formCorrect) || 0;
    const incorrect = parseInt(formIncorrect) || 0;
    const blank = parseInt(formBlank) || 0;
    
    // Validate form
    if (!validateExamForm(correct, incorrect, blank, totalQuestions)) return;
    
    // Calculate net score using the formula
    const net = calculateNetScore(correct, incorrect);
    
    // Determine subject based on exam type
    let subject = formSubject;
    if (formExamType !== 'branch') {
      subject = 'Genel';
    }
    
    const newExam: ExamResult = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: formTitle || `${examType?.name || 'Adsız Deneme'} ${examResults.length + 1}`,
      subject: subject || 'Genel',
      totalQuestions,
      correct,
      incorrect,
      blank,
      net,
      examType: formExamType
    };
    
    const updatedExams = [newExam, ...examResults];
    setExamResults(updatedExams);
    saveExamResults(updatedExams);
    
    // Deneme sınavını son çalışılanlar listesine ekle
    addExamToRecentSubjects(newExam);
    
    setIsAddModalOpen(false);
    resetForm();
  };
  
  // Deneme sınavını son çalışılanlar listesine ekle
  const addExamToRecentSubjects = (exam: ExamResult) => {
    // Deneme türüne göre ID ve renk belirle
    let subjectId = 0;
    let color = '#3b82f6';
    
    if (exam.examType === 'meb-ags') {
      subjectId = 1000; // MEB-AGS denemeleri için özel ID
      color = '#f43f5e';
    } else if (exam.examType === 'oabt') {
      subjectId = 1001; // ÖABT denemeleri için özel ID
      color = '#8b5cf6';
    } else {
      subjectId = 1002; // Branş denemeleri için özel ID
      color = '#10b981';
    }
    
    // Son çalışılanlar listesine ekle
    updateStats('test', subjectId, 1, {
      id: subjectId,
      title: `${exam.title} (${exam.subject})`,
      category: exam.examType === 'meb-ags' ? 'meb-ags' : 'oabt',
      color: color,
      timestamp: Date.now()
    });
  };
  
  const handleEditExam = () => {
    if (!currentExam) return;
    
    // Get the selected exam type config
    const examTypeConfig = EXAM_TYPES.find(type => type.id === formExamType);
    
    // Determine total questions based on exam type config
    let totalQuestions = examTypeConfig?.questionCount || parseInt(formTotalQuestions) || 0;
    
    const correct = parseInt(formCorrect) || 0;
    const incorrect = parseInt(formIncorrect) || 0;
    const blank = parseInt(formBlank) || 0;
    
    // Validate form
    if (!validateExamForm(correct, incorrect, blank, totalQuestions)) return;
    
    // Calculate net score using the formula
    const net = calculateNetScore(correct, incorrect);
    
    // Determine subject based on exam type
    let subject = formSubject;
    if (formExamType !== 'branch') {
      subject = 'Genel';
    }
    
    const updatedExam: ExamResult = {
      ...currentExam,
      title: formTitle || `${examType?.name || 'Adsız Deneme'}`,
      subject: subject || 'Genel',
      totalQuestions,
      correct,
      incorrect,
      blank,
      net,
      examType: formExamType
    };
    
    const updatedExams = examResults.map(exam => 
      exam.id === currentExam.id ? updatedExam : exam
    );
    
    setExamResults(updatedExams);
    saveExamResults(updatedExams);
    
    // Düzenlenen deneme sınavını son çalışılanlar listesine ekle
    addExamToRecentSubjects(updatedExam);
    
    setIsEditModalOpen(false);
    setCurrentExam(null);
    resetForm();
  };
  
  const handleDeleteExam = (id: string) => {
    Alert.alert(
      'Denemeyi Sil',
      'Bu deneme sonucunu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            const updatedExams = examResults.filter(exam => exam.id !== id);
            setExamResults(updatedExams);
            saveExamResults(updatedExams);
          }
        }
      ]
    );
  };

  const handleClearAllExams = () => {
    if (examResults.length === 0) return;
    
    Alert.alert(
      'Tüm Denemeleri Sil',
      'Tüm deneme sonuçlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Hepsini Sil', 
          style: 'destructive',
          onPress: () => {
            setExamResults([]);
            saveExamResults([]);
          }
        }
      ]
    );
  };
  
  // Calculate missing values based on other inputs
  const calculateMissingValue = (changedField: 'correct' | 'incorrect' | 'blank', value: string) => {
    // Get total questions based on exam type or user input
    let total = parseInt(formTotalQuestions) || 0;
    if (formExamType === 'meb-ags') {
      total = 80;
    } else if (formExamType === 'oabt') {
      total = 50;
    }
    
    if (total === 0) return; // Can't calculate if we don't know total
    
    // Parse the current values, using the new value for the changed field
    const correct = changedField === 'correct' ? parseInt(value) || 0 : parseInt(formCorrect) || 0;
    const incorrect = changedField === 'incorrect' ? parseInt(value) || 0 : parseInt(formIncorrect) || 0;
    const blank = changedField === 'blank' ? parseInt(value) || 0 : parseInt(formBlank) || 0;
    
    // Determine which fields have values (non-empty strings)
    const hasCorrect = changedField === 'correct' ? value !== '' : formCorrect !== '';
    const hasIncorrect = changedField === 'incorrect' ? value !== '' : formIncorrect !== '';
    const hasBlank = changedField === 'blank' ? value !== '' : formBlank !== '';
    
    // Count filled fields
    const filledFields = [hasCorrect, hasIncorrect, hasBlank].filter(Boolean).length;
    
    // If we have total and 2 of the 3 values, calculate the third
    if (filledFields >= 2) {
      const sum = correct + incorrect + blank;
      
      // If sum exceeds total, don't auto-calculate
      if (sum > total) {
        setAutoCalculateField(null);
        return;
      }
      
      // Always calculate blank when correct or incorrect changes
      if (changedField === 'correct' || changedField === 'incorrect') {
        // Calculate blank
        const newBlank = Math.max(0, total - correct - incorrect);
        setFormBlank(newBlank.toString());
        setAutoCalculateField('blank');
      }
      // If blank was changed, decide which other field to update
      else if (changedField === 'blank') {
        // Determine which field to auto-calculate based on previous auto-calculated field
        if (!hasCorrect || autoCalculateField === 'correct') {
          // Calculate correct
          const newCorrect = Math.max(0, total - incorrect - blank);
          setFormCorrect(newCorrect.toString());
          setAutoCalculateField('correct');
        } else {
          // Calculate incorrect
          const newIncorrect = Math.max(0, total - correct - blank);
          setFormIncorrect(newIncorrect.toString());
          setAutoCalculateField('incorrect');
        }
      }
    } else {
      // Not enough info to calculate
      setAutoCalculateField(null);
    }
  }
  
  // Handle exam type change
  const handleExamTypeChange = (type: 'meb-ags' | 'oabt' | 'branch') => {
    setFormExamType(type);
    
    // Set default values based on exam type
    if (type === 'meb-ags') {
      setFormTotalQuestions('80');
      setFormSubject('Genel');
      // Immediately recalculate missing values after changing total questions
      calculateMissingValue('correct', formCorrect);
    } else if (type === 'oabt') {
      setFormTotalQuestions('50');
      setFormSubject('Genel');
      // Immediately recalculate missing values after changing total questions
      calculateMissingValue('correct', formCorrect);
    } else {
      setFormTotalQuestions('');
      setFormSubject('');
      // Reset auto-calculation when switching to branch type
      setAutoCalculateField(null);
    }
  };

  // Update the delete mistake handler
  const handleDeleteMistake = async (mistakeId: string) => {
    if (currentExam) {
      try {
        // Find the mistake to delete
        const mistakeToDelete = currentExam.mistakes?.find(m => m.id === mistakeId);
        
        // If we found the mistake and it has a local URI, try to delete the file
        if (mistakeToDelete && mistakeToDelete.uri && 
            (mistakeToDelete.uri.startsWith('file://') || 
             mistakeToDelete.uri.includes(FileSystem.cacheDirectory) || 
             mistakeToDelete.uri.includes(FileSystem.documentDirectory))) {
          
          // Get valid URI for the file
          const validUri = ensureValidUri(mistakeToDelete.uri);
          
          // Check if file exists before attempting to delete
          const fileInfo = await FileSystem.getInfoAsync(validUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(validUri, { idempotent: true });
            console.log('Deleted file:', validUri);
          }
        }
        
        // Update the mistakes list
        const updatedMistakes = currentExam.mistakes?.filter(m => m.id !== mistakeId) || [];
        
        const updatedExam = {
          ...currentExam,
          mistakes: updatedMistakes
        };
        
        const updatedExams = examResults.map(exam => 
          exam.id === currentExam.id ? updatedExam : exam
        );
        
        setExamResults(updatedExams);
        setCurrentExam(updatedExam);
        saveExamResults(updatedExams);
      } catch (error) {
        console.error('Error deleting mistake:', error);
        
        // Even if file deletion fails, still remove from the list
        const updatedMistakes = currentExam.mistakes?.filter(m => m.id !== mistakeId) || [];
        
        const updatedExam = {
          ...currentExam,
          mistakes: updatedMistakes
        };
        
        const updatedExams = examResults.map(exam => 
          exam.id === currentExam.id ? updatedExam : exam
        );
        
        setExamResults(updatedExams);
        setCurrentExam(updatedExam);
        saveExamResults(updatedExams);
      }
    }
  };
  
  // Update the save button onPress handler in the mistakes modal
  const handleSaveMistake = async () => {
    if (currentExam && selectedPhotoUri) {
      try {
        // Save the photo to local storage
        const localUri = await savePhotoToLocalStorage(selectedPhotoUri);
        
        // Check if we got a valid URI back
        if (!localUri) {
          throw new Error('Failed to get a valid URI after saving');
        }
        
        // For Android, verify the file exists and is accessible
        if (Platform.OS === 'android') {
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (!fileInfo.exists) {
            throw new Error('Saved file does not exist or is not accessible');
          }
        }
        
        const newMistake: MistakePhoto = {
          id: Date.now().toString(),
          uri: localUri,
          note: mistakeNote,
          createdAt: new Date().toISOString()
        };
        
        const updatedMistakes = [...(currentExam.mistakes || []), newMistake];
        
        const updatedExam = {
          ...currentExam,
          mistakes: updatedMistakes
        };
        
        const updatedExams = examResults.map(exam => 
          exam.id === currentExam.id ? updatedExam : exam
        );
        
        setExamResults(updatedExams);
        setCurrentExam(updatedExam);
        saveExamResults(updatedExams);
        setMistakeNote('');
        setShowNoteInput(false);
        setSelectedPhotoUri(null);
      } catch (error) {
        console.error('Error saving mistake:', error);
        Alert.alert('Hata', 'Yanlış kaydedilirken bir hata oluştu.');
      }
    }
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
          <Text style={styles.headerTitle}>Denemeler</Text>
        </View>
        <View style={styles.headerRight}>
          {examResults.length > 0 && (
            <TouchableOpacity 
              style={[styles.headerIconButton, { marginRight: 12 }]}
              onPress={handleClearAllExams}
            >
              <Trash color="#ef4444" size={24} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        overScrollMode="always"
        nestedScrollEnabled={true}
      >
        <TouchableWithoutFeedback>
          <View>
            <Text style={styles.sectionTitle}>Deneme Sonuçları ({examResults.length})</Text>
            
            {examResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Henüz deneme sonucu eklenmemiş.</Text>
                <TouchableOpacity style={styles.emptyStateButton} onPress={openAddModal}>
                  <Text style={styles.emptyStateButtonText}>Deneme Ekle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              examResults.map(exam => (
                <View key={exam.id} style={styles.examCard}>
                  <View style={styles.examHeader}>
                    <View>
                      <Text style={styles.examTitle}>{exam.title}</Text>
                      <Text style={styles.examSubtitle}>{exam.subject}</Text>
                    </View>
                    <View style={styles.examActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#1e40af' }]}
                        onPress={() => openEditModal(exam)}
                      >
                        <Edit2 color="#fff" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#991b1b' }]}
                        onPress={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 color="#fff" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* İstatistik Bilgileri */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Doğru</Text>
                      <Text style={[styles.statValue, styles.correctValue]}>{exam.correct}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Yanlış</Text>
                      <Text style={[styles.statValue, styles.incorrectValue]}>{exam.incorrect}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Boş</Text>
                      <Text style={[styles.statValue, styles.blankValue]}>{exam.blank}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Net</Text>
                      <Text style={[styles.statValue, styles.netValue]}>{exam.net.toFixed(2)}</Text>
                    </View>
                  </View>
                  
                  {/* Yanlışlarım Butonu */}
                  <TouchableOpacity 
                    style={styles.mistakesButton}
                    onPress={() => {
                      setCurrentExam(exam);
                      setIsMistakesModalOpen(true);
                    }}
                  >
                    <Text style={styles.mistakesButtonText}>Yanlışlarım {exam.mistakes?.length ? `(${exam.mistakes.length})` : ''}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      
      {/* Add Exam Modal */}
      <Modal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Deneme Ekle"
      >
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          <TouchableWithoutFeedback>
            <View>
              {/* Exam Type Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deneme Türü</Text>
                <View style={styles.examTypeContainer}>
                  {EXAM_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.examTypeButton,
                        formExamType === type.id && styles.examTypeButtonActive
                      ]}
                      onPress={() => handleExamTypeChange(type.id as 'meb-ags' | 'oabt' | 'branch')}
                    >
                      <Text 
                        style={[
                          styles.examTypeButtonText,
                          formExamType === type.id && styles.examTypeButtonTextActive
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deneme Adı</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Örn: MEB Deneme 1"
                  placeholderTextColor="#64748b"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>
              
              {formExamType === 'branch' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Ders</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Örn: Türkçe, Matematik"
                      placeholderTextColor="#64748b"
                      value={formSubject}
                      onChangeText={setFormSubject}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Toplam Soru</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Örn: 20"
                      placeholderTextColor="#64748b"
                      value={formTotalQuestions}
                      onChangeText={setFormTotalQuestions}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}
              
              {formExamType !== 'branch' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Toplam Soru: {EXAM_TYPES.find(t => t.id === formExamType)?.questionCount}
                  </Text>
                  <View style={styles.fixedValueBox}>
                    <Text style={styles.fixedValueText}>
                      {EXAM_TYPES.find(t => t.id === formExamType)?.questionCount} Soru
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Doğru</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={formCorrect}
                    onChangeText={(text) => {
                      setFormCorrect(text);
                      calculateMissingValue('correct', text);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Yanlış</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={formIncorrect}
                    onChangeText={(text) => {
                      setFormIncorrect(text);
                      calculateMissingValue('incorrect', text);
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Boş</Text>
                <TextInput
                  style={[styles.formInput, autoCalculateField === 'blank' && { backgroundColor: '#263548' }]}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={formBlank}
                  onChangeText={(text) => {
                    setFormBlank(text);
                    calculateMissingValue('blank', text);
                  }}
                  keyboardType="numeric"
                />
                {autoCalculateField === 'blank' && (
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Otomatik hesaplanıyor
                  </Text>
                )}
              </View>
              
              {/* Net Score Preview */}
              {(formCorrect !== '' || formIncorrect !== '') && (
                <View style={styles.netScorePreview}>
                  <Text style={styles.netScoreLabel}>Hesaplanan Net:</Text>
                  <Text style={styles.netScoreValue}>
                    {calculateNetScore(
                      parseInt(formCorrect) || 0, 
                      parseInt(formIncorrect) || 0
                    ).toFixed(2)}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleAddExam}
              >
                <Text style={styles.submitButtonText}>Deneme Ekle</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </Modal>
      
      {/* Mistakes Modal */}
      <Modal
        visible={isMistakesModalOpen}
        onClose={() => setIsMistakesModalOpen(false)}
        title={`${currentExam?.title || ''} - Yanlışlarım`}
      >
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          <TouchableWithoutFeedback>
            <View>
              {currentExam?.mistakes && currentExam.mistakes.length > 0 ? (
                <View style={styles.mistakesContainer}>
                  {currentExam.mistakes.map((mistake) => (
                    <View key={mistake.id} style={styles.mistakeItem}>
                      {mistake.uri ? (
                        <TouchableOpacity 
                          onPress={() => {
                            setFullscreenImageUri(mistake.uri);
                            setIsFullscreenImageOpen(true);
                          }}
                          activeOpacity={0.9}
                        >
                          <Image 
                            source={{ uri: ensureValidUri(mistake.uri) }} 
                            style={styles.mistakeImage} 
                            resizeMode="cover"
                            onError={(e) => {
                              console.error('Error loading image:', e.nativeEvent.error);
                              // If there's an error loading the image, we could show a placeholder or error message
                              if (Platform.OS === 'android') {
                                Alert.alert('Uyarı', 'Fotoğraf yüklenirken bir hata oluştu. Fotoğraf erişilemez olabilir.');
                              }
                            }}
                          />
                          <View style={styles.zoomHint}>
                            <Text style={styles.zoomHintText}>Büyütmek için dokun</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.mistakeImage, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ color: '#94a3b8' }}>Fotoğraf bulunamadı</Text>
                        </View>
                      )}
                      {mistake.note && (
                        <Text style={styles.mistakeNote}>{mistake.note}</Text>
                      )}
                      <View style={styles.mistakeActions}>
                        <TouchableOpacity 
                          style={[styles.mistakeActionButton, { backgroundColor: '#ef4444' }]}
                          onPress={() => handleDeleteMistake(mistake.id)}
                        >
                          <X color="#fff" size={16} />
                          <Text style={styles.mistakeActionText}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Henüz yanlış fotoğrafı eklenmemiş.</Text>
                </View>
              )}
              
              {/* Add New Mistake */}
              <View style={styles.addMistakeSection}>
                <Text style={styles.sectionTitle}>Yeni Yanlış Ekle</Text>
                
                <View style={styles.photoButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={async () => {
                      // Request camera permissions
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      
                      if (status !== 'granted') {
                        Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
                        return;
                      }
                      
                      // Launch camera
                      const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
                        base64: false,
                        exif: false
                      });
                      
                      if (!result.canceled && result.assets && result.assets.length > 0) {
                        // Show note input after taking photo
                        setSelectedPhotoUri(result.assets[0].uri);
                        setShowNoteInput(true);
                      }
                    }}
                  >
                    <Camera color="#fff" size={24} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={async () => {
                      // Request media library permissions
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      
                      if (status !== 'granted') {
                        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
                        return;
                      }
                      
                      // Launch image picker
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.8,
                        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
                        base64: false,
                        exif: false
                      });
                      
                      if (!result.canceled && result.assets && result.assets.length > 0) {
                        // Show note input after selecting photo
                        setSelectedPhotoUri(result.assets[0].uri);
                        setShowNoteInput(true);
                      }
                    }}
                  >
                    <ImageIcon color="#fff" size={24} />
                  </TouchableOpacity>
                </View>
                
                {showNoteInput && selectedPhotoUri ? (
                  <View style={styles.noteInputContainer}>
                    <Image 
                      source={{ uri: ensureValidUri(selectedPhotoUri) }} 
                      style={styles.selectedPhotoPreview} 
                      resizeMode="cover"
                    />
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Not (İsteğe Bağlı)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Yanlışınız hakkında not ekleyin"
                        placeholderTextColor="#64748b"
                        value={mistakeNote}
                        onChangeText={setMistakeNote}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                    
                    <View style={styles.noteActionButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowNoteInput(false);
                          setSelectedPhotoUri(null);
                          setMistakeNote('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>İptal</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSaveMistake}
                      >
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : showNoteInput ? (
                  <View style={styles.noteInputContainer}>
                    <View style={[styles.selectedPhotoPreview, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#94a3b8' }}>Fotoğraf seçilmedi</Text>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Not (İsteğe Bağlı)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Yanlışınız hakkında not ekleyin"
                        placeholderTextColor="#64748b"
                        value={mistakeNote}
                        onChangeText={setMistakeNote}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                    
                    <View style={styles.noteActionButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowNoteInput(false);
                          setSelectedPhotoUri(null);
                          setMistakeNote('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>İptal</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSaveMistake}
                      >
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </Modal>
      
      {/* Edit Exam Modal */}
      <Modal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Deneme Düzenle"
      >
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          <TouchableWithoutFeedback>
            <View>
              {/* Exam Type Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deneme Türü</Text>
                <View style={styles.examTypeContainer}>
                  {EXAM_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.examTypeButton,
                        formExamType === type.id && styles.examTypeButtonActive
                      ]}
                      onPress={() => handleExamTypeChange(type.id as 'meb-ags' | 'oabt' | 'branch')}
                    >
                      <Text 
                        style={[
                          styles.examTypeButtonText,
                          formExamType === type.id && styles.examTypeButtonTextActive
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Deneme Adı</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Örn: MEB Deneme 1"
                  placeholderTextColor="#64748b"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>
              
              {formExamType === 'branch' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Ders</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Örn: Türkçe, Matematik"
                      placeholderTextColor="#64748b"
                      value={formSubject}
                      onChangeText={setFormSubject}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Toplam Soru</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Örn: 20"
                      placeholderTextColor="#64748b"
                      value={formTotalQuestions}
                      onChangeText={setFormTotalQuestions}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}
              
              {formExamType !== 'branch' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Toplam Soru: {EXAM_TYPES.find(t => t.id === formExamType)?.questionCount}
                  </Text>
                  <View style={styles.fixedValueBox}>
                    <Text style={styles.fixedValueText}>
                      {EXAM_TYPES.find(t => t.id === formExamType)?.questionCount} Soru
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Doğru</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={formCorrect}
                    onChangeText={(text) => {
                      setFormCorrect(text);
                      calculateMissingValue('correct', text);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Yanlış</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={formIncorrect}
                    onChangeText={(text) => {
                      setFormIncorrect(text);
                      calculateMissingValue('incorrect', text);
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Boş</Text>
                <TextInput
                  style={[styles.formInput, autoCalculateField === 'blank' && { backgroundColor: '#263548' }]}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={formBlank}
                  onChangeText={(text) => {
                    setFormBlank(text);
                    calculateMissingValue('blank', text);
                  }}
                  keyboardType="numeric"
                />
                {autoCalculateField === 'blank' && (
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Otomatik hesaplanıyor
                  </Text>
                )}
              </View>
              
              {/* Net Score Preview */}
              {(formCorrect !== '' || formIncorrect !== '') && (
                <View style={styles.netScorePreview}>
                  <Text style={styles.netScoreLabel}>Hesaplanan Net:</Text>
                  <Text style={styles.netScoreValue}>
                    {calculateNetScore(
                      parseInt(formCorrect) || 0, 
                      parseInt(formIncorrect) || 0
                    ).toFixed(2)}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleEditExam}
              >
                <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </Modal>
      <FullscreenImageViewer 
        visible={isFullscreenImageOpen} 
        onClose={() => setIsFullscreenImageOpen(false)}
        imageUri={fullscreenImageUri}
        ensureValidUri={ensureValidUri}
      />
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
    color: '#e2e8f0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    ...(Platform.OS === 'android' && {
      paddingBottom: 0,
    }),
  },
  contentContainer: {
    paddingBottom: 24,
    ...(Platform.OS === 'android' && {
      flexGrow: 1,
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  examCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  examSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  examActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mistakesButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  mistakesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContent: {
    padding: 16,
    ...(Platform.OS === 'android' && {
      paddingBottom: 0,
    }),
  },
  modalContentContainer: {
    paddingBottom: 24,
    ...(Platform.OS === 'android' && {
      flexGrow: 1,
    }),
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    color: '#94a3b8',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  examTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  examTypeButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  examTypeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  examTypeButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  examTypeButtonTextActive: {
    color: '#fff',
  },
  fixedValueBox: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  fixedValueText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  netScorePreview: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netScoreLabel: {
    color: '#9ca3af',
    fontSize: 16,
  },
  netScoreValue: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  mistakesContainer: {
    gap: 16,
  },
  mistakeItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mistakeImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mistakeNote: {
    padding: 12,
    fontSize: 14,
    color: '#94a3b8',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  mistakeActions: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'flex-end',
  },
  mistakeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  mistakeActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  addMistakeSection: {
    marginTop: 24,
    gap: 16,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
  },
  noteInputContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  selectedPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  correctValue: {
    color: '#22c55e',
    fontSize: 18,
  },
  incorrectValue: {
    color: '#dc2626',
    fontSize: 18,
  },
  blankValue: {
    color: '#94a3b8',
    fontSize: 18,
  },
  netValue: {
    color: '#60a5fa',
    fontSize: 20,
    fontWeight: '700',
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullscreenImageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  fullscreenCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  zoomHintText: {
    color: '#fff',
    fontSize: 10,
  },
});