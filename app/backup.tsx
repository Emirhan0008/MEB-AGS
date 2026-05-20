import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Share, 
  ActivityIndicator, 
  Platform, 
  TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  createBackup, 
  restoreBackup, 
  getLastBackupDate, 
  exportBackupAsText, 
  importBackupFromText,
  exportBackupAsFile,
  importBackupFromFile
} from '../utils/backup';
import { 
  ChevronLeft, 
  Download, 
  Upload, 
  Copy, 
  RefreshCw, 
  Database, 
  Info,
  TriangleAlert,
  ExternalLink,
  Smartphone,
  Share2,
  FileJson,
  Mail,
  Lock,
  LogOut,
  Cloud,
  CloudUpload,
  CloudDownload
} from 'lucide-react-native';

// Firebase & Cloud Sync
import { auth } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  User 
} from 'firebase/auth';
import { 
  uploadBackupToCloud, 
  restoreBackupFromCloud, 
  checkCloudBackupInfo, 
  getLastCloudSyncDate,
  CloudBackupInfo 
} from '../services/cloudSync';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';


export default function BackupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupCode, setBackupCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Firebase / Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [cloudBackupInfo, setCloudBackupInfo] = useState<CloudBackupInfo | null>(null);
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    loadLastBackupDate();
    
    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadCloudBackupData();
        setShowAuthForm(false);
      } else {
        setCloudBackupInfo(null);
        setLastCloudSync(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadLastBackupDate = async () => {
    const date = await getLastBackupDate();
    setLastBackup(date);
  };

  const loadCloudBackupData = async () => {
    setLoading(true);
    const info = await checkCloudBackupInfo();
    const syncDate = await getLastCloudSyncDate();
    setCloudBackupInfo(info);
    setLastCloudSync(syncDate);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || response.idToken;
      
      if (!idToken) {
        throw new Error("Google Kimlik Belgesi (ID Token) alınamadı.");
      }
      
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      Alert.alert("Başarılı", "Google ile başarıyla giriş yapıldı.");
      setShowAuthForm(false);
    } catch (error: any) {
      console.error("Google Auth hatası:", error);
      let errorMessage = "Google ile giriş yapılırken bir sorun oluştu.";
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = "Giriş işlemi iptal edildi.";
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = "Giriş işlemi zaten devam ediyor.";
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = "Google Play Hizmetleri cihazınızda bulunmuyor veya güncel değil.";
      } else if (error.message) {
        errorMessage = `Hata: ${error.message}`;
      }
      Alert.alert("Google Giriş Hatası", errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthAction = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert("Başarılı", "Hesabınız başarıyla oluşturuldu ve giriş yapıldı.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert("Başarılı", "Başarıyla giriş yapıldı.");
      }
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Kimlik doğrulama hatası:", error);
      let errorMessage = "Bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Bu e-posta adresi zaten kullanımda.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Geçersiz e-posta adresi.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Şifre çok zayıf (en az 6 karakter olmalıdır).";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "E-posta veya şifre hatalı.";
      }
      Alert.alert("Hata", errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              Alert.alert("Başarılı", "Hesabınızdan güvenli bir şekilde çıkış yapıldı.");
            } catch (error) {
              Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu.");
            }
          }
        }
      ]
    );
  };

  const handleCloudBackup = async () => {
    setLoading(true);
    const result = await uploadBackupToCloud();
    setLoading(false);
    
    if (result.success) {
      loadCloudBackupData();
      Alert.alert("Başarılı", result.message);
    } else {
      Alert.alert("Hata", result.message);
    }
  };

  const handleCloudRestore = async () => {
    if (!cloudBackupInfo?.exists) {
      Alert.alert("Hata", "Bulutta geri yüklenecek yedek bulunamadı.");
      return;
    }

    Alert.alert(
      "Buluttan Geri Yükle",
      "Cihazınızdaki mevcut veriler silinecek ve buluttaki verileriniz yüklenecek. Devam etmek istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Geri Yükle", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await restoreBackupFromCloud();
            setLoading(false);
            
            if (result.success) {
              loadLastBackupDate();
              Alert.alert("Başarılı", result.message);
            } else {
              Alert.alert("Hata", result.message);
            }
          }
        }
      ]
    );
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    const result = await createBackup();
    setLoading(false);
    
    if (result.success) {
      loadLastBackupDate();
      Alert.alert("Başarılı", result.message);
    } else {
      Alert.alert("Hata", result.message);
    }
  };

  const handleRestoreBackup = async () => {
    Alert.alert(
      "Geri Yükle",
      "Cihazınızdaki mevcut veriler silinecek ve yedeklenen veriler yüklenecek. Devam etmek istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Geri Yükle", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await restoreBackup();
            setLoading(false);
            
            if (result.success) {
              Alert.alert("Başarılı", "Veriler başarıyla geri yüklendi.");
            } else {
              Alert.alert("Hata", result.message);
            }
          }
        }
      ]
    );
  };

  const handleExportText = async () => {
    setLoading(true);
    const result = await exportBackupAsText();
    setLoading(false);
    
    if (result.success) {
      Alert.alert(
        "Yedek Kodu Kopyalandı",
        "Tüm verileriniz (fotoğraflar dahil) kopyalandı. Bu kod çok uzun olabilir, doğrudan başka bir cihaza yapıştırabilirsiniz.",
        [
          { 
            text: "Paylaş", 
            onPress: () => Share.share({ message: result.backupCode || '' }) 
          },
          { text: "Tamam" }
        ]
      );
    } else {
      Alert.alert("Hata", result.message);
    }
  };

  const handleExportFile = async () => {
    setLoading(true);
    const result = await exportBackupAsFile();
    setLoading(false);
    
    if (!result.success) {
      Alert.alert("Hata", result.message);
    }
  };

  const handleImportFile = async () => {
    Alert.alert(
      "Dosyadan Yükle",
      "Bir yedek dosyası (.ags) seçerek verilerinizi geri yükleyebilirsiniz. Mevcut verileriniz silinecektir.",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Dosya Seç", 
          onPress: async () => {
            setLoading(true);
            const result = await importBackupFromFile();
            setLoading(false);
            
            if (result.success) {
              Alert.alert("Başarılı", "Veriler dosyadan başarıyla geri yüklendi.");
            } else {
              Alert.alert("Hata", result.message || "Dosya yüklenirken hata oluştu.");
            }
          }
        }
      ]
    );
  };

  const handleImportText = async () => {
    if (!backupCode.trim()) {
      Alert.alert("Hata", "Lütfen bir yedek kodu girin.");
      return;
    }

    Alert.alert(
      "Verileri İçe Aktar",
      "Bu işlem mevcut tüm verilerinizi silecek ve yedek kodundaki verileri yükleyecektir. Emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "İçe Aktar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await importBackupFromText(backupCode);
            setLoading(false);
            
            if (result.success) {
              setBackupCode('');
              setIsImporting(false);
              Alert.alert("Başarılı", "Veriler başarıyla içe aktarıldı.");
            } else {
              Alert.alert("Hata", result.message);
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veri Yedekleme</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Database color="#3b82f6" size={24} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Neden Yedeklemelisiniz?</Text>
            <Text style={styles.infoDescription}>
              Uygulama verileriniz (hatalı soruların fotoğrafları dahil) sadece bu cihazda saklanır. Cihazınızı değiştirirseniz verileriniz kaybolabilir.
            </Text>
          </View>
        </View>

        {/* Cloud Backup (Firestore) Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bulut Yedekleme (Eşitleme)</Text>
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#8b5cf6' }]}>
            
            {!user ? (
              // Case 1: NOT Logged In
              <View>
                <View style={styles.transferInfo}>
                  <Cloud color="#8b5cf6" size={24} />
                  <Text style={styles.transferDescription}>
                    Hesap oluşturarak verilerinizi buluta güvenle yedekleyebilir, telefonunuz kaybolsa bile verilerinize başka bir cihazdan anında erişebilirsiniz.
                  </Text>
                </View>

                {!showAuthForm ? (
                  <View style={{ gap: 12 }}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.googleButton]}
                      onPress={handleGoogleSignIn}
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#0f172a" size="small" />
                      ) : (
                        <>
                          <View style={styles.googleIconContainer}>
                            <Text style={styles.googleG}>G</Text>
                          </View>
                          <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 }]}
                      onPress={() => setShowAuthForm(true)}
                    >
                      <Mail color="#cbd5e1" size={20} style={styles.buttonIcon} />
                      <Text style={[styles.buttonText, { color: '#cbd5e1' }]}>E-posta ile Giriş/Kayıt Yap</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Sign In / Sign Up Form
                  <View style={styles.authContainer}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.googleButton, { marginBottom: 16 }]}
                      onPress={handleGoogleSignIn}
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#0f172a" size="small" />
                      ) : (
                        <>
                          <View style={styles.googleIconContainer}>
                            <Text style={styles.googleG}>G</Text>
                          </View>
                          <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>veya e-posta ile</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Text style={styles.authTitle}>{isSignUp ? "Yeni Bulut Hesabı Oluştur" : "Bulut Hesabına Giriş Yap"}</Text>
                    
                    <View style={styles.inputContainer}>
                      <Mail color="#64748b" size={18} style={styles.inputIcon} />
                      <TextInput
                        style={styles.authInput}
                        placeholder="E-posta Adresi"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Lock color="#64748b" size={18} style={styles.inputIcon} />
                      <TextInput
                        style={styles.authInput}
                        placeholder="Şifre (En az 6 karakter)"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>

                    {isSignUp && (
                      <View style={styles.inputContainer}>
                        <Lock color="#64748b" size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.authInput}
                          placeholder="Şifreyi Tekrar Girin"
                          placeholderTextColor="#64748b"
                          secureTextEntry
                          autoCapitalize="none"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                        />
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#8b5cf6', marginTop: 8 }]}
                      onPress={handleAuthAction}
                      disabled={authLoading}
                    >
                      {authLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                        <Text style={styles.buttonText}>{isSignUp ? "Kayıt Ol ve Eşitle" : "Giriş Yap ve Eşitle"}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.switchAuthButton}
                      onPress={() => setIsSignUp(!isSignUp)}
                    >
                      <Text style={styles.switchAuthText}>
                        {isSignUp ? "Zaten bir hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Hesap Oluşturun"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cancelAuthButton}
                      onPress={() => setShowAuthForm(false)}
                    >
                      <Text style={styles.cancelAuthText}>Vazgeç</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              // Case 2: User Logged In
              <View>
                <View style={styles.cloudUserContainer}>
                  <View style={styles.cloudUserInfo}>
                    <Cloud color="#10b981" size={24} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.cloudUserEmail}>{user.email}</Text>
                      <Text style={styles.cloudUserStatus}>Bulut Yedekleme Aktif</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <LogOut color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>

                {cloudBackupInfo?.exists ? (
                  <View style={styles.cloudBackupStatus}>
                    <Text style={styles.statusLabelText}>
                      Buluttaki Son Yedek:{" "}
                      <Text style={styles.statusValueText}>
                        {cloudBackupInfo.timestamp ? formatDate(new Date(cloudBackupInfo.timestamp)) : "Bilinmiyor"}
                      </Text>
                    </Text>
                    <Text style={styles.statusLabelText}>
                      Eşitleme Cihazı: <Text style={styles.statusValueText}>{cloudBackupInfo.platform === 'android' ? 'Android' : cloudBackupInfo.platform === 'ios' ? 'iOS' : 'Web/Diğer'}</Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cloudBackupStatus}>
                    <Text style={styles.statusLabelText}>Bulutta henüz hiç yedeğiniz bulunmuyor.</Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]} 
                    onPress={handleCloudBackup}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <CloudUpload color="#fff" size={20} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Buluta Yedekle</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton, { borderColor: '#8b5cf6' }, !cloudBackupInfo?.exists && styles.disabledButton]} 
                    onPress={handleCloudRestore}
                    disabled={loading || !cloudBackupInfo?.exists}
                  >
                    <CloudDownload color={cloudBackupInfo?.exists ? "#8b5cf6" : "#475569"} size={20} style={styles.buttonIcon} />
                    <Text style={[styles.secondaryButtonText, { color: '#8b5cf6' }, !cloudBackupInfo?.exists && styles.disabledButtonText]}>Buluttan Geri Yükle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>

        {/* Local Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yerel Yedekleme</Text>
          <View style={styles.card}>
            <View style={styles.lastBackupContainer}>
              <RefreshCw color={lastBackup ? "#10b981" : "#94a3b8"} size={20} />
              <Text style={styles.lastBackupText}>
                {lastBackup ? `Son Yedek: ${formatDate(lastBackup)}` : "Henüz yedek alınmadı"}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]} 
                onPress={handleCreateBackup}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Download color="#fff" size={20} style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Şimdi Yedekle</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton, !lastBackup && styles.disabledButton]} 
                onPress={handleRestoreBackup}
                disabled={loading || !lastBackup}
              >
                <Upload color={lastBackup ? "#3b82f6" : "#475569"} size={20} style={styles.buttonIcon} />
                <Text style={[styles.secondaryButtonText, !lastBackup && styles.disabledButtonText]}>Yedeği Geri Yükle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cross-Device Transfer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cihazlar Arası Aktarım</Text>
          <View style={styles.card}>
            <View style={styles.transferInfo}>
              <Smartphone color="#8b5cf6" size={24} />
              <Text style={styles.transferDescription}>
                Verilerinizi (fotoğraflar dahil) başka bir cihaza taşımak için aşağıdaki yöntemleri kullanın.
              </Text>
            </View>

            {/* Dosya Paylaş - Recommended */}
            <TouchableOpacity 
              style={[styles.transferOption, { marginBottom: 12, borderColor: '#3b82f6', borderWidth: 1 }]}
              onPress={handleExportFile}
              disabled={loading}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#3b82f622' }]}>
                <Share2 color="#3b82f6" size={20} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Yedek Dosyası Paylaş (Önerilen)</Text>
                <Text style={styles.optionSubtitle}>WhatsApp, Email veya Bulut ile gönder</Text>
              </View>
              <ExternalLink color="#3b82f6" size={18} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.transferOption, { marginBottom: 12 }]}
              onPress={handleImportFile}
              disabled={loading}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#10b98122' }]}>
                <FileJson color="#10b981" size={20} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Dosyadan İçe Aktar</Text>
                <Text style={styles.optionSubtitle}>Cihazdan .ags dosyası seç</Text>
              </View>
              <Upload color="#10b981" size={18} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 12 }} />

            {/* Metin Kodu - Alternative */}
            <TouchableOpacity 
              style={[styles.transferOption, { marginBottom: 12 }]}
              onPress={handleExportText}
              disabled={loading}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#8b5cf622' }]}>
                <Copy color="#8b5cf6" size={20} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Yedek Kodu Oluştur</Text>
                <Text style={styles.optionSubtitle}>Tüm verileri metin olarak kopyalar</Text>
              </View>
              <Copy color="#8b5cf6" size={18} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.transferOption}
              onPress={() => setIsImporting(!isImporting)}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#f59e0b22' }]}>
                <Smartphone color="#f59e0b" size={20} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Yedek Kodunu İçe Aktar</Text>
                <Text style={styles.optionSubtitle}>Metin kodunu yapıştırarak yükle</Text>
              </View>
              <ChevronLeft color="#475569" size={20} style={{ transform: [{ rotate: isImporting ? '90deg' : '180deg' }] }} />
            </TouchableOpacity>

            {isImporting && (
              <View style={styles.importContainer}>
                <Text style={styles.importLabel}>Yedek Kodunu Buraya Yapıştırın:</Text>
                <TextInput
                  style={styles.importInput}
                  placeholder="Kodu buraya yapıştırın..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={4}
                  value={backupCode}
                  onChangeText={setBackupCode}
                />
                <TouchableOpacity 
                  style={styles.importButton} 
                  onPress={handleImportText}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <Text style={styles.importButtonText}>Verileri Yükle</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Security Warning */}
        <View style={styles.warningCard}>
          <TriangleAlert color="#f59e0b" size={20} />
          <Text style={styles.warningText}>
            Yedek kodunuz kişisel verilerinizi içerir. Lütfen bu kodu güvenmediğiniz kişilerle paylaşmayın.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lastBackupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
  },
  lastBackupText: {
    color: '#cbd5e1',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  disabledButton: {
    borderColor: '#334155',
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButtonText: {
    color: '#475569',
  },
  transferInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  transferDescription: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  transferOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  optionSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  importContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  importLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  importInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  importButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#422006',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#92400e',
  },
  warningText: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 12,
    marginLeft: 10,
    lineHeight: 18,
  },
  authContainer: {
    paddingVertical: 8,
  },
  authTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  authInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    fontSize: 15,
  },
  switchAuthButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  switchAuthText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelAuthButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  cancelAuthText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  cloudUserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  cloudUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudUserEmail: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cloudUserStatus: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
  },
  cloudBackupStatus: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  statusLabelText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
  statusValueText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  googleG: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '500',
  }
});
