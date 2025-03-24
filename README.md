# MEB-AGS Çalışma Asistanı

MEB-AGS, kullanıcıların Milli Eğitim Bakanlığı Akademik Giriş Sınavı'na (MEB Akademik Giriş Sınavı) hazırlanmalarına yardımcı olmak için tasarlanmış bir mobil uygulamadır.

## Geliştirme

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

### Build ve Dağıtım

Uygulama, güncellemeleri test etmek için "preview" ve son kullanıcılara dağıtmak için "production" olmak üzere iki farklı dağıtım kanalına sahiptir.

#### Preview Kanalı (Varsayılan)

Preview kanalı, güncellemeleri son kullanıcılara dağıtmadan önce test etmek için kullanılır. Bu kanal varsayılan olarak kullanılır.

```bash
# Preview kanalına geçiş yap (varsayılan)
npm run use:preview

# Preview kanalı için build oluştur
npm run build:preview

# Preview kanalına güncelleme yayınla
npm run update:preview
# veya sadece
npm run update
```

#### Production Kanalı

Production kanalı, güncellemeleri son kullanıcılara dağıtmak için kullanılır. Bu kanal sadece preview kanalında test edildikten sonra kullanılmalıdır.

```bash
# Production kanalına geçiş yap
npm run use:production

# Production kanalı için build oluştur
npm run build:production

# Production kanalına güncelleme yayınla
npm run update:production
```

### Güncelleme Akışı

1. Yeni özellikler geliştir
2. Preview kanalına güncelleme yayınla (`npm run update` veya `npm run update:preview`)
3. Preview kanalında test et
4. Sorun yoksa, production kanalına güncelleme yayınla (`npm run update:production`)

> **Not:** Güvenlik için, tüm güncellemeler önce otomatik olarak preview kanalına gönderilir. Eğer kanal belirtilmezse, varsayılan olarak preview kanalı kullanılır.

## Otomatik Git Commit ve Push Sistemi

Bu proje için otomatik Git commit ve push sistemi oluşturulmuştur. Bu sistem, değişikliklerinizi kolayca GitHub'a göndermenizi sağlar.

### Sistem Dosyaları

1. **auto-push.ps1**: Otomatik commit ve push işlemlerini gerçekleştiren PowerShell scripti
2. **run-auto-push.bat**: Manuel olarak auto-push.ps1 çalıştırmanızı sağlayan batch dosyası

### Kullanım

Otomatik commit ve push işlemini başlatmak için aşağıdaki adımları izleyin:

1. Projenin ana dizininde `run-auto-push.bat` dosyasına çift tıklayın, veya
2. PowerShell'de `.\auto-push.ps1` komutunu çalıştırın

### Masaüstü Kısayolu Oluşturma

Daha kolay erişim için masaüstüne bir kısayol oluşturabilirsiniz:
1. `run-auto-push.bat` dosyasına sağ tıklayın
2. "Gönder" > "Masaüstü (kısayol oluştur)" seçeneğini seçin

### Nasıl Çalışır?

Script şu adımları otomatik olarak gerçekleştirir:
1. Değişiklikleri kontrol eder
2. Değişiklik varsa, önce uzak depodaki (GitHub) değişiklikleri çeker (`git pull`)
3. Yerel değişiklikleri ekler (`git add .`)
4. Tarih/saat içeren bir commit oluşturur
5. Değişiklikleri GitHub'a gönderir (`git push`)

### Önemli Notlar

- Bu sistem, git kimlik bilgilerinizin önceden kaydedilmiş olduğunu varsayar
- Script sadece değişiklik olduğunda commit oluşturur, değişiklik yoksa hiçbir işlem yapmaz
- Çakışma durumunda script durur ve manuel müdahale gerektiğini belirtir
- Önemli değişikliklerden sonra scripti çalıştırmayı alışkanlık haline getirmeniz önerilir

## Özellikler

- Konu Yönetimi
- Deneme Sınavı Takibi
- Pomodoro Zamanlayıcı
- Kullanıcı Profili
- Ve daha fazlası...

Daha detaylı bilgi için [PRD.md](./PRD.md) dosyasına bakabilirsiniz. 

## Son Güncellemeler

- Otomatik Git commit ve push sistemi eklendi
- Bildirim davranışı iyileştirildi (sadece önemli anlarda bildirim gönderiliyor)
- Bildirime tıklandığında doğru ekrana yönlendirme eklendi
- Kalan süre hesaplaması düzeltildi
- Foreground Service bildirimi iyileştirildi 
- **Cihazlar arası yedekleme sistemi eklendi** (kullanıcılar verilerini metin kodu aracılığıyla farklı cihazlar arasında aktarabilir)
- Native kütüphaneler kullanılarak yedekleme sistemi daha kararlı hale getirildi 