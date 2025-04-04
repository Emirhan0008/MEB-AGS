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

## Zamanlayıcı (Timer) Hataları ve Çözümleri

### Hata 1: Geri Sayım Başlatılamıyor / "Devam Et" Gerekiyor

**Sorun:** Geri sayım sayacına bir süre girilip "Başlat" butonuna tıklandığında sayaç hemen başlamıyor, önce duraklatılmış gibi görünüyor ve "Devam Et" butonuna basmak gerekiyor. "Lütfen geçerli bir süre girin" hatası alınabiliyor.

**Sebep:** `startTimer` ve `setTotalTime` fonksiyonları arasındaki senkronizasyon sorunu. Süre ayarlandıktan sonra başlatma komutunun state güncellemesini beklemeden çalışması veya `startTimer`'ın yeni ayarlanan süreyi hemen görmemesi.

**Çözüm:**
1.  `timer.tsx` (`CountdownTimer` içindeki `handleStartTimer`): Kullanıcı düzenleme modunda süre girdiğinde, `setTotalTime`'ı ayrıca çağırmak yerine, doğrudan `startTimer` fonksiyonunu hesaplanan yeni süre milisaniye cinsinden (`totalSeconds * 1000`) bir argüman olarak göndererek çağır.
2.  `TimerContext.tsx` (`startTimer`): Fonksiyona opsiyonel bir `newTotalTimeMs` parametresi ekle. Eğer bu parametre verilmişse ve 0'dan büyükse, bunun yeni bir geri sayım olduğunu anla, `mode`'u `'countdown'` yap, `totalTime`'ı bu yeni değerle ayarla ve `elapsedTime`'ı `0` yap. Eğer parametre verilmemişse, mevcut `timerData`'yı kullanarak devam etmeye çalış.
3.  `TimerContext.tsx` (`setTotalTime`): Bu fonksiyonun *sadece* süreyi ayarlamasını sağla, zamanlayıcıyı başlatma sorumluluğunu kaldır.

### Hata 2: Modlar Arası İstenmeyen Başlatma

**Sorun:** Bir zamanlayıcı modu (örn. Pomodoro) başlatıldıktan sonra başka bir moda (örn. Kronometre) geçildiğinde, yeni modun da otomatik olarak başlaması.

**Sebep:** `setTimerMode` fonksiyonunun, önceki modun `isActive` durumunu veya çalışan `interval`'ini temizlemeden yeni moda geçmesi.

**Çözüm:**
1.  `TimerContext.tsx` (`setTimerMode`): Fonksiyonun en başında, mevcut `timerRef.current` interval'i varsa `clearInterval` ile durdur ve `null` yap.
2.  Ardından, önceki state'e güvenmek yerine, hedef mod için *tamamen sıfırlanmış* yeni bir `TimerData` nesnesi oluştur (mode, isActive: false, startTime: null, elapsedTime: 0, laps: [], pomodoroState: 'work', totalTime: moda göre ayarla vb.).
3.  Bu yeni, temiz state'i `setTimerData` ile ayarla ve `saveTimerData` ile kaydet. `resetTimer` fonksiyonuna olan bağımlılığı kaldır.

### Hata 3: Arka Plana Alınca Sayaç Duruyor / Ön Planda Devam Etmiyor

**Sorun:** Uygulama arka plana alınıp tekrar ön plana getirildiğinde, zamanlayıcı arka planda ilerlemesi gereken süreyi ilerlememiş oluyor ve otomatik olarak devam etmiyor. Bazen "Devam Et" butonu da çalışmıyor.

**Sebep:** `AppState` değişikliklerinde zamanlayıcı durumunun (`isActive`, `startTime`, `elapsedTime`) ve fiziksel `setInterval`'in doğru yönetilememesi. Arka planda geçen sürenin hesaplanıp eklenmemesi veya interval'in ön plana dönüldüğünde yeniden başlatılmaması.

**Çözüm:**
1.  **`useRef` Kullanımı:** `TimerContext` içinde `timerData` state'inin en güncel değerini tutmak için bir `timerDataRef = useRef<TimerData>(timerData)` oluştur ve `useEffect(() => { timerDataRef.current = timerData; }, [timerData]);` ile senkronize et. Bu, state güncellemelerinin asenkron doğasından kaynaklanabilecek sorunları azaltır.
2.  **`handleAppStateChange` (Arka Plan):**
    *   `currentState === 'active'` ve `nextAppState` `inactive` veya `background` ise:
    *   Önce `timerRef.current` interval'ini `clearInterval` ile durdur.
    *   `timerDataRef.current` ile en güncel durumu al.
    *   Eğer `currentTimerData.isActive` ise:
        *   `now = Date.now()` al.
        *   O ana kadar geçen süreyi (`elapsedSinceStart = now - currentTimerData.startTime`) hesapla.
        *   Yeni `elapsedTime`'ı (`currentTimerData.elapsedTime + elapsedSinceStart`) bul.
        *   Kaydedilecek yeni durumu (`dataToSave`) oluştur: `{ ...currentTimerData, elapsedTime: finalElapsedTime, startTime: now, isActive: true, pausedTime: null }`. `isActive` **true** kalmalı, `startTime` arka plana gitme anı olarak güncellenmeli.
        *   `saveTimerData(dataToSave)` ile kaydet.
        *   `setTimerData(dataToSave)` ile state'i de güncelle.
    *   Eğer `isActive` değilse (duraklatılmışsa), sadece `saveTimerData(currentTimerData)` ile mevcut durumu kaydet.
3.  **`handleAppStateChange` (Ön Plan):**
    *   `currentState` `inactive` veya `background` ve `nextAppState === 'active'` ise:
    *   `loadedData = await loadTimerData()` ile son kaydedilen durumu yükle (bu `setTimerData`'yı da çağırır).
    *   *Hemen ardından* `loadedData`'yı kontrol et:
    *   Eğer `loadedData.isActive` ve `loadedData.startTime` varsa:
        *   `now = Date.now()` al.
        *   Arka planda geçen süreyi (`timeElapsedInBackground = now - loadedData.startTime`) hesapla.
        *   Yeni `elapsedTime`'ı (`loadedData.elapsedTime + timeElapsedInBackground`) bul.
        *   Güncellenmiş durumu (`updatedData`) oluştur: `{ ...loadedData, elapsedTime: newElapsedTime, startTime: now, pausedTime: null }`.
        *   `setTimerData(updatedData)` ile state'i güncelle.
        *   `saveTimerData(updatedData)` ile kaydet.
        *   **Manuel Interval Başlatma:** `if (timerRef.current) clearInterval(timerRef.current); timerRef.current = setInterval(updateElapsedTime, 1000);` ile interval'i hemen yeniden başlat.
    *   Eğer `isActive` değilse, interval'in durduğundan emin ol (`if (timerRef.current) clearInterval...`).
4.  **`useEffect[isActive]` Kaldırılması:** Interval yönetimini `startTimer`, `pauseTimer` ve `handleAppStateChange` içine taşıdığımız için, sadece `isActive` durumuna bağlı olan `useEffect` kancasını kaldır veya sadece component unmount temizliği için bırak.

### Hata 4: Arka Plan/Ön Plan Geçişinde 4-5 Saniye Sapma

**Sorun:** Uygulama ön plana döndüğünde, arka planda geçen süre doğru hesaplansa bile gösterilen sürede küçük (birkaç saniye) ileri veya geri sapmalar olması.

**Sebep:** `updateElapsedTime` fonksiyonunun her tikte sabit 1000ms eklemesi. `setInterval`'in zamanlaması veya `AppState` olaylarının tetiklenme anındaki küçük gecikmeler nedeniyle, iki tik arasında geçen gerçek sürenin tam olarak 1000ms olmaması.

**Çözüm:**
1.  `TimerContext.tsx` (`updateElapsedTime`):
    *   Fonksiyonun başında `now = Date.now()` al.
    *   Eğer `prev.startTime` varsa, son güncellemeden bu yana geçen *gerçek* süreyi hesapla: `timeDiff = Math.max(0, now - prev.startTime)`.
    *   Yeni `elapsedTime`'ı `prev.elapsedTime + timeDiff` olarak hesapla.
    *   State'i güncellerken sadece `elapsedTime`'ı değil, aynı zamanda `startTime`'ı da `now` olarak güncelle. Bu, bir sonraki `updateElapsedTime` çağrısının doğru `timeDiff` hesaplamasını sağlar.
    *   State güncellemesini (`setTimerData`) ve kaydetmeyi (`saveTimerData`) sadece hesaplanan `nextData` gerçekten `prev`'den farklıysa yap (gereksiz güncellemeleri önlemek için).
2.  `handleAppStateChange` (Ön Plan): Arka planda geçen süreyi hesaplarken `Math.max(0, now - loadedData.startTime)` kullanarak negatif süreleri engelle.
3.  `handleAppStateChange` (Arka Plan): Arka plana giderken aktif timer için `elapsedTime`'ı hesaplarken yine `Math.max(0, now - currentTimerData.startTime)` kullan.

### Hata 5: Linter Hataları ve Fonksiyon Sırası

**Sorun:** `useCallback` bağımlılıkları, fonksiyonların tanımlanma sırası, eksik/yanlış dönüş tipleri veya argümanlar nedeniyle oluşan çeşitli TypeScript linter hataları.

**Sebep:** Özellikle `useCallback` kullanırken fonksiyonların birbirine olan bağımlılıklarının doğru yönetilmemesi veya fonksiyonların kullanılmadan önce tanımlanmaması.

**Çözüm:**
1.  **Sıralama:** Fonksiyonları mantıksal bağımlılıklarına göre tanımla. Örneğin, `handlePomodoroCompletion` `updateStudyTime`'ı kullanıyorsa, `updateStudyTime` önce tanımlanmalı.
2.  **`useCallback` Bağımlılıkları:** Her `useCallback` kancasının bağımlılık dizisini dikkatlice kontrol et. Kanca içinde kullanılan ancak dış kapsamdan gelen tüm değişkenler ve fonksiyonlar (diğer `useCallback` ile sarılmış olanlar dahil) bağımlılık dizisine eklenmeli.
3.  **`useRef` Kullanımı:** State'in en güncel değerine anlık olarak erişmek gerektiğinde (özellikle state güncellemelerinin asenkron olduğu durumlarda veya `useCallback` bağımlılıklarını azaltmak için) `useRef` kullan. Ref'i `useEffect` içinde state ile senkronize et.
4.  **Tipler ve Argümanlar:** Fonksiyonların dönüş tiplerini (`: number`, `: string`, `: Promise<void>`, `: TimerData` vb.) doğru şekilde belirt. Fonksiyon çağrılarında beklenen argümanların doğru sayıda ve tipte verildiğinden emin ol.
5.  **Boş Nesnelerden Kaçınma:** Tip beklenen yerlerde `{}` gibi boş nesneler kullanmaktan kaçın, bunun yerine gerekli özelliklere sahip nesneler oluştur.

## Sorun: Çalışma Süresi Sadece Oturum Sonunda Ekleniyor

**Tarih:** 2024-07-27
**Dosya:** `context/TimerContext.tsx`

**Açıklama:**
Zamanlayıcılarda (Pomodoro-Çalışma, Kronometre, Geri Sayım) geçen süreler, profil sekmesindeki toplam çalışma süresine sadece zamanlayıcı duraklatıldığında, sıfırlandığında, tamamlandığında veya arka plana alındığında ekleniyordu. Kullanıcı, zamanlayıcı çalışırken de (örneğin her dakika) bu sürenin eklenmesini ve ilerlemeyi görmeyi talep etti.

**Neden:**
`updateStudyTime` fonksiyonu sadece zamanlayıcının durumunu kesin olarak değiştiren olaylarda (pause, reset, complete, skip, background) çağrılıyordu. Zamanlayıcının aktif olarak çalıştığı anlarda periyodik bir güncelleme mekanizması yoktu.

**Çözüm:**
1.  **Periyodik Güncelleme Ref'i:** Zamanlayıcının state'inden bağımsız olarak son periyodik güncellemenin yapıldığı `elapsedTime` değerini (milisaniye cinsinden) tutmak için `lastPeriodicUpdateElapsedTimeRef` adında bir `useRef` eklendi.
2.  **`updateElapsedTime` İçinde Kontrol:** Her saniye çalışan `updateElapsedTime` fonksiyonuna bir kontrol eklendi. Bu kontrol, mevcut `newElapsedTime` ile `lastPeriodicUpdateElapsedTimeRef.current` arasındaki farkın 60000 milisaniyeyi (1 dakika) aşıp aşmadığını kontrol eder.
3.  **Dakika Ekleme ve Ref Güncelleme:** Eğer fark 1 dakikayı aştıysa, geçen tam dakika sayısı hesaplanır (`Math.floor(fark / 60000)`), `updateStudyTime` bu dakika sayısı ile çağrılır ve `lastPeriodicUpdateElapsedTimeRef.current` değeri eklenen dakika kadar (milisaniye cinsinden) artırılır.
4.  **Diğer Fonksiyonlarda Kalan Süre Ekleme:** `pauseTimer`, `resetTimer`, `handlePomodoroCompletion`, `skipPomodoroSession` ve `handleAppStateChange` fonksiyonlarındaki `updateStudyTime` çağrıları değiştirildi. Bu fonksiyonlar artık doğrudan tüm süreyi eklemek yerine, olayın gerçekleştiği andaki `finalElapsedTime` ile `lastPeriodicUpdateElapsedTimeRef.current` arasındaki farkı hesaplayıp, sadece *henüz periyodik olarak eklenmemiş olan kalan* tam dakikaları `updateStudyTime`'a gönderir.
5.  **Ref Yönetimi:** `lastPeriodicUpdateElapsedTimeRef`, zamanlayıcı tamamen yeniden başladığında (pasif durumdan), sıfırlandığında, mod değiştirildiğinde, süre/oturum tamamlandığında veya duraklatıldığında `0`'a ayarlanır. Zamanlayıcı devam ettiğinde (örn. `startTimer` ile aktifken veya ön plana gelince) mevcut `elapsedTime` değerine ayarlanır. Arka plana giderken kalan süre eklendikten sonra ref değeri *güncellenir ama sıfırlanmaz*, böylece ön plana dönüldüğünde doğru yerden devam edebilir.

**Kod Değişiklikleri Özeti:**
*   `TimerProvider` içine `lastPeriodicUpdateElapsedTimeRef` eklendi.
*   `updateElapsedTime` içine periyodik kontrol ve `updateStudyTime` çağrısı eklendi.
*   `handlePomodoroCompletion`, `pauseTimer`, `resetTimer`, `skipPomodoroSession`, `handleAppStateChange` fonksiyonlarındaki süre ekleme mantığı, ref'i dikkate alacak şekilde güncellendi.
*   `startTimer`, `resetTimer`, `pauseTimer`, `setTimerMode`, `setTotalTime`, `handleAppStateChange` fonksiyonlarına `lastPeriodicUpdateElapsedTimeRef`'i uygun şekilde ayarlama/sıfırlama mantığı eklendi.

```typescript
// updateElapsedTime içinde periyodik kontrol örneği
if (prev.mode === 'stopwatch' || prev.mode === 'countdown' || (prev.mode === 'pomodoro' && prev.pomodoroState === 'work')) {
  const elapsedSinceLastPeriodicUpdate = newElapsedTime - lastPeriodicUpdateElapsedTimeRef.current;
  if (elapsedSinceLastPeriodicUpdate >= 60000) {
    const minutesToAdd = Math.floor(elapsedSinceLastPeriodicUpdate / 60000);
    if (minutesToAdd > 0) {
      updateStudyTime(minutesToAdd);
      lastPeriodicUpdateElapsedTimeRef.current += minutesToAdd * 60000; // Ref'i güncelle
    }
  }
}

// pauseTimer içinde kalan süreyi ekleme örneği
const remainingTimeSinceLastUpdate = finalElapsedTime - lastPeriodicUpdateElapsedTimeRef.current;
const minutesToAdd = Math.floor(remainingTimeSinceLastUpdate / 60000);
if (minutesToAdd > 0) {
    updateStudyTime(minutesToAdd);
}
lastPeriodicUpdateElapsedTimeRef.current = 0; // Duraklatınca ref'i sıfırla
```
