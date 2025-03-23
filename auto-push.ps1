# Otomatik Commit ve Push PowerShell Scripti
Write-Host "Otomatik Commit ve Push İşlemi Başlatılıyor..." -ForegroundColor Cyan

# Değişiklikleri kontrol et
$status = git status --porcelain
if (-not $status) {
    Write-Host "Değişiklik bulunmadı." -ForegroundColor Yellow
    exit 0
}

# Tüm değişiklikleri ekle
Write-Host "Değişiklikler tespit edildi. Ekleniyor..." -ForegroundColor Blue
git add .

# Commit oluştur
$tarih = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Otomatik commit: $tarih"
git commit -m $commitMessage

# Push işlemi
Write-Host "Değişiklikler uzak sunucuya gönderiliyor..." -ForegroundColor Blue
$branch = git symbolic-ref --short HEAD
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "İşlem başarıyla tamamlandı!" -ForegroundColor Green
} else {
    Write-Host "Push işlemi başarısız oldu. Hata kodu: $LASTEXITCODE" -ForegroundColor Red
}

exit 0 