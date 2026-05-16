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
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Share2,
  FileJson
} from 'lucide-react-native';

export default function BackupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupCode, setBackupCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadLastBackupDate();
  }, []);

  const loadLastBackupDate = async () => {
    const date = await getLastBackupDate();
    setLastBackup(date);
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
          <AlertTriangle color="#f59e0b" size={20} />
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
  }
});
