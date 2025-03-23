# Git Otomatik Commit ve Push Ayarları

Bu dosya, MEB-AGS projesi için otomatik Git commit ve push ayarlarını açıklar.

## Dosyalar

1. **auto-push.ps1**: Otomatik commit ve push işlemlerini gerçekleştiren PowerShell scripti
2. **run-auto-push.bat**: Manuel olarak auto-push.ps1 çalıştırmanızı sağlayan batch dosyası

## Kullanım

### Manuel Kullanım (Önerilen)
Otomatik commit ve push işlemini manuel olarak çalıştırmak için:
1. `run-auto-push.bat` dosyasına çift tıklayın, veya
2. PowerShell'de `.\auto-push.ps1` komutunu çalıştırın

### Otomatik Masaüstü Kısayolu Oluşturma
Masaüstüne bir kısayol oluşturabilirsiniz:
1. `run-auto-push.bat` dosyasına sağ tıklayın
2. "Gönder" > "Masaüstü (kısayol oluştur)" seçeneğini seçin
3. Masaüstündeki kısayola çift tıklayarak kolayca çalıştırabilirsiniz

## Dikkat Edilmesi Gerekenler

- Bu sistem, git kimlik bilgilerinizin önceden kaydedilmiş olduğunu varsayar.
- Git kimlik bilgilerinizi kaydetmek için, başarılı bir push işleminden sonra kimlik bilgileriniz kaydedilecektir.
- Script sadece değişiklik olduğunda commit oluşturur, değişiklik yoksa hiçbir işlem yapmaz.
- Önemli değişikliklerden sonra scripti çalıştırmayı alışkanlık haline getirmeniz önerilir. 