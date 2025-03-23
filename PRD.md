# Ürün Gereksinimleri Dokümanı: MEB-AGS Çalışma Asistanı

## Genel Bakış
MEB-AGS, kullanıcıların Milli Eğitim Bakanlığı Akademik Giriş Sınavı'na (MEB Akademik Giriş Sınavı) hazırlanmalarına yardımcı olmak için tasarlanmış bir mobil uygulamadır. Uygulama, ilerlemeyi takip etme, çalışma oturumlarını yönetme ve konu materyallerini düzenleme özellikleriyle kapsamlı bir çalışma asistanı sunar.

## Hedef Kitle
- MEB Akademik Giriş Sınavı'na hazırlanan öğretmen adayları
- Belirli konu alanlarındaki bilgilerini geliştirmek isteyen eğitim profesyonelleri
- Sınav hazırlığı için yapılandırılmış bir yaklaşım arayan öğrenciler

## Temel Özellikler

### 1. Konu Yönetimi (Uygulandı)
- İki ana kategori:
  - MEB-AGS: 6 ana konu kategorisinde düzenlenmiş içerik:
    - Türkçe
    - Matematik
    - Tarih
    - Coğrafya
    - Mevzuat
    - Eğitimin Temelleri
  - ÖABT: Branşa özel konu kategorileri:
    - Türkçe Öğretmenliği
    - Matematik Öğretmenliği
    - Fen Bilimleri Öğretmenliği
    - Sosyal Bilgiler Öğretmenliği
    - İngilizce Öğretmenliği
    - Sınıf Öğretmenliği
    - Okul Öncesi Öğretmenliği
    - Din Kültürü ve Ahlak Bilgisi Öğretmenliği
    - Beden Eğitimi Öğretmenliği
    - Müzik Öğretmenliği
    - Görsel Sanatlar Öğretmenliği
- Her konu içinde detaylı başlık dökümü
- Her başlık için ilerleme takibi
- ÖABT dersleri için konu takibi ve filtreleme
- Konulara test ve tekrar ekleme özelliği
- Seçilen ÖABT branşının kalıcı olarak saklanması

### 2. Deneme Sınavı Takibi (Uygulandı)
- Her deneme için detaylı sonuç kaydı
- Yanlış yapılan soruların fotoğraflarını çekme ve not alma özelliği
- Deneme sonuçları için detaylı istatistikler
- Deneme türlerine göre filtreleme (MEB-AGS, ÖABT, Branş)
- Net hesaplama ve ilerleme analizi
- Fotoğrafların yerel depolamada kalıcı olarak saklanması

### 3. Pomodoro Zamanlayıcı (Uygulandı)
- Dahili Pomodoro tekniği uygulaması
- Özelleştirilebilir çalışma oturumları (varsayılan 25 dakika)
- Kısa mola (5 dakika) ve uzun mola (30 dakika) seçenekleri
- Detaylı istatistiklerle oturum takibi
- Esnek zamanlama için kronometre modu
- Oturum geçişleri için görsel ve dokunsal geri bildirim

### 4. Kullanıcı Profili (Uygulandı)
- Kişisel istatistik panosu
- Ayarlar yönetimi
- Destek erişimi
- Tamamlanan konuların gerçek zamanlı takibi
- Çalışma saatlerinin gerçek verilerle gösterimi

## Teknik Mimari

### Ön Uç
- Expo SDK 52 ile React Native 0.76.7
- Navigasyon için Expo Router 4.0.18
- İkonografi için Lucide React Native 0.475.0
- Görsel öğeler için Linear Gradient 14.0.2

### Navigasyon Yapısı
- Sekme tabanlı birincil navigasyon:
  - Konular/Dersler
  - İstatistik
  - Denemeler
  - Zamanlayıcı
  - Profil
- Modal tabanlı ikincil navigasyon

### Veri Yönetimi
- AsyncStorage ile yerel veri depolama
- Uygulama durumu için React Context ve Hooks
- OTA (Over-the-Air) güncellemeler için Expo Updates
- Preview ve Production dağıtım profilleri ile güncelleme kontrolü

## Kullanıcı Akışı

1. **Başlangıç**
   - Karşılama ekranı
   - Koyu tema arayüzü
   - Hızlı başlangıç seçenekleri

2. **Ana Ekran**
   - Temel özelliklere hızlı erişim
   - Ana bölümlere kolay navigasyon
   - Güncel istatistikler

3. **Deneme Takibi**
   - Deneme sonuçlarını kaydetme
   - Yanlış soru fotoğrafları çekme
   - Detaylı istatistikler görüntüleme

4. **Çalışma Oturumları**
   - Pomodoro zamanlayıcısı kullanımı
   - Oturum istatistikleri
   - Mola yönetimi

5. **Konu Takibi**
   - MEB-AGS ve ÖABT kategorileri arasında geçiş
   - ÖABT dersleri için filtreleme
   - Konulara test ve tekrar ekleme
   - İlerleme durumunu görüntüleme

## Teknik Bağımlılıklar

### Temel Bağımlılıklar
- React: 18.3.1
- React Native: 0.76.7
- Expo: 52.0.38
- Expo Router: 4.0.18

### UI ve Etkileşim
- expo-linear-gradient: 14.0.2
- lucide-react-native: 0.475.0
- expo-blur: 14.0.3
- react-native-reanimated: 3.17.1
- react-native-gesture-handler: 2.20.2

### Sistem Entegrasyonu
- expo-image-picker: 16.0.6
- expo-notifications: 0.29.14
- expo-background-fetch: 13.0.5
- expo-task-manager: 12.0.5
- expo-updates: 0.24.12
- @react-native-async-storage/async-storage: 1.22.1

### Geliştirme Araçları
- TypeScript: 5.3.3
- ESLint: 8.57.0
- Prettier: 3.2.5

## Uygulama Durumu

### Tamamlanan Özellikler
- ✅ Sekme tabanlı navigasyon sistemi
- ✅ Pomodoro zamanlayıcısı
- ✅ Deneme sonuçları takibi
- ✅ Yanlış soru fotoğrafı çekme
- ✅ Koyu tema arayüzü
- ✅ Temel istatistikler
- ✅ ÖABT dersleri için konu takibi
- ✅ Konulara test ve tekrar ekleme
- ✅ Fotoğrafların yerel depolamada kalıcı olarak saklanması
- ✅ OTA güncellemeler
- ✅ Push bildirimleri
- ✅ Profil sayfasında gerçek verilerle istatistik gösterimi
- ✅ ÖABT ders seçiminin kalıcı olarak saklanması
- ✅ Bildirim davranışı iyileştirmeleri (sadece önemli anlarda bildirim)
- ✅ Bildirime tıklandığında doğru ekrana yönlendirme

### Devam Eden Çalışmalar
- 🔄 Gelişmiş istatistik görselleştirmeleri
- 🔄 Performans analiz panosu
- 🔄 Kullanıcı arayüzü iyileştirmeleri

### Kısa Vadede Yapılacaklar
- 📌 Geri sayım ve pomodoro sayaçları bittiğinde kullanıcının dikkatini çekmek için ekranda görsel efekt gösterilmesi
- 📌 Kullanıcıların formül, notlar ve benzeri bilgileri kaydedebilecekleri özel bir bölüm eklenmesi
- 📌 Konular ve içerikler arasında arama yapma özelliği
- 📌 Tekrar sarmalı veya aylık ders çalışma planı oluşturma seçeneği
- 📌 Bulut yedekleme ve senkronizasyon çözümleri

### Planlanan Özellikler
- ⏳ Sidebar Desteği
- ⏳ Kişiselleştirilmiş çalışma önerileri
- ⏳ Harici kaynak entegrasyonu
- ⏳ Gelişmiş analitikler

## Başarı Metrikleri
- Günlük aktif kullanıcı sayısı
- Deneme girme sıklığı
- Pomodoro oturumu tamamlama oranı
- Kullanıcı memnuniyeti
- Uygulama kararlılığı

## Son Güncellemeler
- Expo Go uyumluluğu sağlandı
- Güncelleme sistemi iyileştirildi
- Navbardaki gereksiz tab'lar kaldırıldı
- ÖABT derslerindeki konuların kalıcı olarak kaydedilmesi sağlandı
- Profil sayfasındaki tamamlanan konular ve çalışma saatleri gerçek verilerle gösteriliyor
- İstatistik sıfırlama işlemi artık deneme verilerini silmiyor
- Preview ve Production dağıtım profilleri eklendi (güncellemeleri önce test edip sonra yayınlamak için)