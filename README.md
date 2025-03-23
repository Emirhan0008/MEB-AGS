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

## Özellikler

- Konu Yönetimi
- Deneme Sınavı Takibi
- Pomodoro Zamanlayıcı
- Kullanıcı Profili
- Ve daha fazlası...

Daha detaylı bilgi için [PRD.md](./PRD.md) dosyasına bakabilirsiniz. 

## Son Güncellemeler

- Bildirim davranışı iyileştirildi (sadece önemli anlarda bildirim gönderiliyor)
- Bildirime tıklandığında doğru ekrana yönlendirme eklendi
- Kalan süre hesaplaması düzeltildi
- Foreground Service bildirimi iyileştirildi 