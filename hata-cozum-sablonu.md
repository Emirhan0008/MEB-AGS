# Hata Çözüm Şablonu

Bu dosya, projede karşılaşılan hataları ve çözümlerini içerir. Yeni bir hata ile karşılaştığınızda, önce bu dosyayı kontrol edin. Benzer bir hata varsa, çözümü uygulayın. Yoksa, hatayı çözün ve bu dosyaya ekleyin.

## Hata Kategorileri

### 1. Timer İşlemleri

#### Pil Optimizasyonu Muafiyeti İstenemedi
- **Hata Mesajı**: `Pil optimizasyonu muafiyeti istenemedi: [hata detayı]`
- **Nedeni**: Android cihazlarda pil optimizasyonu muafiyeti istenirken bir hata oluştu.
- **Çözüm**: 
  - Android sürümünün 23 veya üzeri olduğundan emin olun.
  - Uygulama izinlerinin doğru şekilde tanımlandığından emin olun.
  - Kullanıcıya manuel olarak pil optimizasyonu ayarlarını değiştirmesi için yönlendirme yapın.

#### Arka Plan Görevi Hatası
- **Hata Mesajı**: `Arka plan görevi hatası: [hata detayı]`
- **Nedeni**: BackgroundFetch işlemi sırasında bir hata oluştu.
- **Çözüm**: 
  - BackgroundFetch yapılandırmasını kontrol edin.
  - Minimum fetch aralığını artırın.
  - Arka plan görevinin basit ve hızlı çalışacak şekilde optimize edildiğinden emin olun.

#### Timer Verisi Yüklenirken Hata
- **Hata Mesajı**: `Timer verisi yüklenirken hata: [hata detayı]`
- **Nedeni**: AsyncStorage'dan timer verisi yüklenirken bir hata oluştu.
- **Çözüm**: 
  - AsyncStorage'ın düzgün çalıştığından emin olun.
  - Depolanan verilerin geçerli JSON formatında olduğunu kontrol edin.
  - Gerekirse, bozuk verileri temizleyin ve yeniden başlatın.

#### Timer Verileri Kaydedilirken Hata
- **Hata Mesajı**: `[TIMER_LOG] Timer verileri kaydedilirken hata oluştu: [hata detayı]`
- **Nedeni**: AsyncStorage'a timer verisi kaydedilirken bir hata oluştu.
- **Çözüm**: 
  - Cihazda yeterli depolama alanı olduğundan emin olun.
  - Kaydedilen verilerin boyutunu kontrol edin, çok büyükse optimize edin.
  - AsyncStorage'ın düzgün çalıştığından emin olun.

#### Arka Plan Görevleri Ayarlanırken Hata
- **Hata Mesajı**: `Arka plan görevleri ayarlanırken hata: [hata detayı]`
- **Nedeni**: Arka plan görevleri ve pil optimizasyonu muafiyeti ayarlanırken bir hata oluştu.
- **Çözüm**: 
  - Gerekli izinlerin tanımlandığından emin olun.
  - Expo'nun en son sürümünü kullandığınızdan emin olun.
  - BackgroundFetch ve pil optimizasyonu ayarlarını ayrı ayrı test edin.

#### Bildirim Ayarları Yapılandırılırken Hata
- **Hata Mesajı**: `Bildirim ayarları yapılandırılırken hata oluştu: [hata detayı]`
- **Nedeni**: Android için bildirim kanalı oluşturulurken bir hata oluştu.
- **Çözüm**: 
  - Android sürümünün uyumlu olduğundan emin olun.
  - Notifications API'sinin doğru şekilde kullanıldığından emin olun.
  - Bildirim kanalı yapılandırmasını basitleştirin.

#### Arka Plan Görevi Kaydedilemedi
- **Hata Mesajı**: `Arka plan görevi kaydedilemedi: [hata detayı]`
- **Nedeni**: BackgroundFetch görevi kaydedilirken bir hata oluştu.
- **Çözüm**: 
  - Expo'nun en son sürümünü kullandığınızdan emin olun.
  - BackgroundFetch yapılandırmasını kontrol edin.
  - Minimum fetch aralığını artırın (örn. 15 dakikadan fazla).

#### Bildirimde Gösterilen Kalan Süre Yanlış
- **Hata Mesajı**: `Bildirimde gösterilen kalan süre yanlış`
- **Nedeni**: Timer verilerinin hesaplanması sırasında kalan süre yanlış hesaplanıyor.
- **Çözüm**: 
  - Kalan süre hesaplamasını `Math.max(0, timerData.totalTime - elapsedTime)` şeklinde düzeltin.
  - `formatTime` fonksiyonunu güncelleyerek doğru süre formatını sağlayın.
  - Bildirim içeriğini güncelleyerek doğru süre bilgisini gösterin.

#### Bildirime Tıklandığında Yanlış Ekrana Yönlendirme
- **Hata Mesajı**: `Bildirime tıklandığında derslere gidiyor kronometrede işleyen sayaç kısmına gitsin`
- **Nedeni**: Bildirim verilerine doğru yönlendirme bilgisi eklenmemiş.
- **Çözüm**: 
  - Tüm bildirimlere `data: { screen: 'timer' }` şeklinde yönlendirme verisi ekleyin.
  - `NotificationContext.tsx` dosyasında bildirim yanıt dinleyicisi ekleyin.
  - Bildirime tıklandığında `router.push('/(tabs)/timer')` ile doğru ekrana yönlendirin.
  - Foreground Service bildirimi için `notificationIntent: { screen: 'timer' }` ekleyin.

### 2. İstatistik İşlemleri

#### Veriler Yüklenirken Hata
- **Hata Mesajı**: `Veriler yüklenirken hata oluştu: [hata detayı]`
- **Nedeni**: AsyncStorage'dan istatistik verileri yüklenirken bir hata oluştu.
- **Çözüm**: 
  - AsyncStorage'ın düzgün çalıştığından emin olun.
  - Depolanan verilerin geçerli JSON formatında olduğunu kontrol edin.
  - Gerekirse, bozuk verileri temizleyin ve yeniden başlatın.

### 3. Bildirim İşlemleri

#### Bildirim Ayarları Yüklenirken Hata
- **Hata Mesajı**: `Bildirim ayarları yüklenirken hata oluştu: [hata detayı]`
- **Nedeni**: AsyncStorage'dan bildirim ayarları yüklenirken bir hata oluştu.
- **Çözüm**: 
  - AsyncStorage'ın düzgün çalıştığından emin olun.
  - Depolanan verilerin geçerli JSON formatında olduğunu kontrol edin.
  - Varsayılan ayarları kullanarak devam edin.

#### Bildirim Ayarları Güncellenirken Hata
- **Hata Mesajı**: `Bildirim ayarları güncellenirken hata oluştu: [hata detayı]`
- **Nedeni**: AsyncStorage'a bildirim ayarları kaydedilirken bir hata oluştu.
- **Çözüm**: 
  - Cihazda yeterli depolama alanı olduğundan emin olun.
  - AsyncStorage'ın düzgün çalıştığından emin olun.
  - Ayarları daha küçük parçalar halinde kaydetmeyi deneyin.

#### Push Bildirimleri İçin Kayıt Olurken Hata
- **Hata Mesajı**: `Push bildirimleri için kayıt olurken hata oluştu: [hata detayı]`
- **Nedeni**: Expo Push Token alınırken veya bildirim kanalı oluşturulurken bir hata oluştu.
- **Çözüm**: 
  - app.json'da doğru projectId tanımlandığından emin olun.
  - İnternet bağlantısını kontrol edin.
  - Expo'nun en son sürümünü kullandığınızdan emin olun.

#### Bildirim İzinleri İstenirken Hata
- **Hata Mesajı**: `Bildirim izinleri istenirken hata oluştu: [hata detayı]`
- **Nedeni**: Kullanıcıdan bildirim izinleri istenirken bir hata oluştu.
- **Çözüm**: 
  - Uygulama izinlerinin doğru şekilde tanımlandığından emin olun.
  - Kullanıcıya manuel olarak izinleri değiştirmesi için yönlendirme yapın.
  - Bildirimleri geçici olarak devre dışı bırakın.

#### Çalışma Hatırlatıcısı Planlanırken Hata
- **Hata Mesajı**: `Çalışma hatırlatıcısı planlanırken hata oluştu: [hata detayı]`
- **Nedeni**: Tekrarlanan bildirim planlanırken bir hata oluştu.
- **Çözüm**: 
  - Bildirim tetikleyici yapılandırmasını kontrol edin.
  - Saat ve dakika değerlerinin geçerli olduğundan emin olun.
  - Daha basit bir bildirim planlaması kullanın.

#### Bildirim İptal Edilirken Hata
- **Hata Mesajı**: `Bildirim iptal edilirken hata oluştu: [hata detayı]`
- **Nedeni**: Belirli bir bildirim iptal edilirken bir hata oluştu.
- **Çözüm**: 
  - Bildirim tanımlayıcısının doğru olduğundan emin olun.
  - Tüm bildirimleri iptal etmeyi deneyin ve yeniden planlayın.
  - Expo'nun en son sürümünü kullandığınızdan emin olun.

### 4. Context Kullanım Hataları

#### Context Dışında Hook Kullanımı
- **Hata Mesajı**: `useTimer must be used within a TimerProvider` veya `useNotifications must be used within a NotificationProvider`
- **Nedeni**: Context hook'u, ilgili Provider dışında kullanılmaya çalışıldı.
- **Çözüm**: 
  - Hook'u kullanan bileşenlerin ilgili Provider içinde olduğundan emin olun.
  - _layout.tsx dosyasında Provider'ların doğru sırayla sarmalandığını kontrol edin.
  - Provider'ı daha üst seviyede tanımlayın.

### 5. Geliştirme Ortamı Hataları

#### Windows'ta chmod Komutu Çalışmıyor
- **Hata Mesajı**: `chmod : The term 'chmod' is not recognized as the name of a cmdlet, function, script file, or operable program.`
- **Nedeni**: Windows işletim sisteminde Unix/Linux komutu olan chmod bulunmuyor.
- **Çözüm**: 
  - Windows'ta dosya izinlerini değiştirmek için PowerShell komutlarını kullanın: `icacls "dosya_yolu" /grant "kullanıcı:F"`
  - Alternatif olarak, Git Bash veya WSL (Windows Subsystem for Linux) kullanabilirsiniz.
  - Node.js scriptleri için izinleri manuel olarak ayarlamak yerine, package.json içinde script komutları tanımlayın.

#### Dosya Yolu Hatası
- **Hata Mesajı**: `Could not find file 'c:\D\-Projeler-\MEB-AGSv1.2\MEB-AGSBolt\project\hata-cozum-sablonu.md'`
- **Nedeni**: Mutlak dosya yolu kullanıldığında, çalışma dizini farklı olabilir veya Windows/Unix yol ayırıcıları uyumsuzluğu olabilir.
- **Çözüm**: 
  - Göreceli dosya yolları kullanın (örn. `MEB-AGSBolt/project/hata-cozum-sablonu.md`)
  - Yol ayırıcıları için platform bağımsız çözümler kullanın (Node.js'de `path.join()` veya `path.resolve()`)
  - Dosya varlığını kontrol etmek için önce `fs.existsSync()` kullanın.

#### Scripts Dizini Zaten Var
- **Hata Mesajı**: `mkdir : An item with the specified name C:\D\-Projeler-\MEB-AGSv1.2\MEB-AGSBolt\project\scripts already exists.`
- **Nedeni**: Oluşturulmaya çalışılan dizin zaten mevcut.
- **Çözüm**: 
  - Dizin oluşturmadan önce varlığını kontrol edin: `if (!(Test-Path "dizin_yolu")) { mkdir "dizin_yolu" }`
  - Veya `-p` parametresi yerine PowerShell'de `-Force` parametresini kullanın: `mkdir -Force "dizin_yolu"`
  - Node.js'de `fs.mkdirSync(path, { recursive: true })` kullanın.

### 6. Güncelleme ve Dağıtım Hataları

#### Production Kanalına Geçiş Onayı Hatası
- **Hata Mesajı**: `❌ Production kanalına geçiş iptal edildi.`
- **Nedeni**: Production kanalına geçiş için onay scripti doğru çalışmıyor veya onay verilmedi.
- **Çözüm**: 
  - Doğrudan `node scripts/switch-channel.js production` komutunu çalıştırın.
  - Veya app.json dosyasında `"channel": "production"` değerini manuel olarak ayarlayın.
  - Onay scriptini düzenleyerek doğru çalışmasını sağlayın.

#### Expo CLI Punycode Modülü Uyarısı
- **Hata Mesajı**: `[DEP0040] DeprecationWarning: The punycode module is deprecated. Please use a userland alternative instead.`
- **Nedeni**: Expo CLI, kullanımdan kaldırılmış punycode modülünü kullanıyor.
- **Çözüm**: 
  - Bu sadece bir uyarıdır, işlevselliği etkilemez.
  - Expo CLI'nin en son sürümünü kullanın.
  - Uyarıyı görmezden gelebilirsiniz, gelecekteki Expo sürümlerinde düzeltilecektir.

#### EAS Update Komutu Yanıt Vermiyor
- **Hata Mesajı**: Komut çalışıyor gibi görünüyor ancak yanıt vermiyor veya tamamlanmıyor.
- **Nedeni**: EAS CLI'da bir sorun olabilir veya internet bağlantısı yavaş olabilir.
- **Çözüm**: 
  - Komutu Ctrl+C ile iptal edip tekrar deneyin.
  - Alternatif olarak `npx expo publish --release-channel production` komutunu kullanın.
  - İnternet bağlantınızı kontrol edin.
  - EAS CLI'yı güncelleyin: `npm install -g eas-cli@latest`

#### Expo Go Uyumluluğu Hatası
- **Hata Mesajı**: `Expo Go ortamında güncellemeler desteklenmez.`
- **Nedeni**: Expo Go, OTA güncellemelerini desteklemiyor.
- **Çözüm**: 
  - Geliştirme için Expo Go kullanabilirsiniz, ancak güncellemeleri test etmek için gerçek bir build gereklidir.
  - Development build oluşturun: `eas build --profile development`
  - Veya preview build oluşturun: `eas build --profile preview`
  - Güncellemeleri bu buildlerde test edin.

#### Güncelleme Uygulanmıyor
- **Hata Mesajı**: Güncelleme başarıyla yayınlandı ancak cihazlarda görünmüyor.
- **Nedeni**: Runtime version uyumsuzluğu, güncelleme kontrolü yapılmaması veya önbellek sorunları.
- **Çözüm**: 
  - app.json'da `"runtimeVersion"` ve `"updates"` ayarlarını kontrol edin.
  - Uygulamayı tamamen kapatıp yeniden açın.
  - Uygulama başlatıldığında güncelleme kontrolü yapıldığından emin olun.
  - Gerekirse, uygulamayı yeniden yükleyin veya önbelleği temizleyin.

### 7. Git ve Versiyon Kontrol Hataları

#### Git Pull Çakışması Hatası
- **Hata Mesajı**: `error: You have not concluded your merge (MERGE_HEAD exists).`
- **Nedeni**: Git pull işlemi sırasında çakışma oluştu ve merge işlemi tamamlanmadı.
- **Çözüm**: 
  - Çakışmaları çözün ve `git commit` ile merge işlemini tamamlayın.
  - Alternatif olarak, `git merge --abort` ile merge işlemini iptal edin ve tekrar deneyin.
  - Gerekirse, değişiklikleri kaybetmek istemiyorsanız, önce değişiklikleri stash'e alın: `git stash`

#### Untracked Files Git Push Hatası
- **Hata Mesajı**: `error: failed to push some refs to [repository]`
- **Nedeni**: Uzak depoda sizin lokal deponuzda olmayan değişiklikler var.
- **Çözüm**: 
  - Önce `git pull origin [branch]` ile uzak depodaki değişiklikleri çekin.
  - Çakışmaları çözün ve `git commit` ile değişiklikleri kaydedin.
  - Sonra `git push origin [branch]` ile değişiklikleri gönderin.

#### Git Hook PowerShell Hatası
- **Hata Mesajı**: `The argument '[path]/post-commit.ps1' to the -File parameter does not exist.`
- **Nedeni**: Git hook içinde belirtilen PowerShell dosyası bulunamadı.
- **Çözüm**: 
  - Hook dosyasındaki dosya yolunu düzeltin, tam yolu kullanın.
  - Windows'ta, yolları tanımlarken çift ters slash kullanın: `C:\\path\\to\\file.ps1`
  - Alternatif olarak, hook dosyalarında dosya yolunu `.git/hooks/post-commit.ps1` şeklinde belirtin.

#### Git Post-Commit Hook Çalışmıyor
- **Hata Mesajı**: Hook çalışmıyor, otomatik push gerçekleşmiyor.
- **Nedeni**: Post-commit hook dosyasının çalıştırma izni yok veya yanlış formatlanmış.
- **Çözüm**: 
  - Hook dosyasının çalıştırma iznini kontrol edin ve gerekirse ekleyin: `chmod +x .git/hooks/post-commit`
  - Windows'ta, `.bat` dosyası kullanmayı deneyin veya PowerShell scriptini manuel olarak çalıştırın.
  - Otomatik commit ve push işlemi için `run-auto-push.bat` dosyasını kullanın.

#### Git Credential Helper Hatası
- **Hata Mesajı**: Sürekli kullanıcı adı ve şifre isteniyor.
- **Nedeni**: Git kimlik bilgileri kaydedilmemiş.
- **Çözüm**: 
  - `git config credential.helper store` komutunu çalıştırın.
  - Bir kez daha push yapın ve kimlik bilgilerinizi girin, bundan sonra kaydedilecektir.
  - Windows Kimlik Bilgileri Yöneticisi'nde GitHub kimlik bilgilerinizin kaydedildiğinden emin olun.

#### Scheduled Task PowerShell Hatası
- **Hata Mesajı**: `Cannot validate argument on parameter 'Trigger'. The argument is null or empty.`
- **Nedeni**: Görev zamanlayıcısında tanımlanan trigger (tetikleyici) geçersiz.
- **Çözüm**: 
  - Trigger parametrelerini düzeltin, geçerli bir zaman aralığı belirtin.
  - Windows'ta, PowerShell görev zamanlayıcı yerine manuel çalıştırma yöntemini kullanın.
  - `run-auto-push.bat` dosyasını kullanarak gerektiğinde manuel olarak çalıştırın.
