# Otomatik Commit ve Push PowerShell Scripti
Write-Host "Otomatik Commit ve Push İşlemi Başlatılıyor..." -ForegroundColor Cyan

# Değişiklikleri kontrol et
$status = git status --porcelain
if (-not $status) {
    Write-Host "Değişiklik bulunmadı." -ForegroundColor Yellow
    exit 0
}

# Güncel branch'i al
$branch = git symbolic-ref --short HEAD

# Önce uzak depodaki değişiklikleri çek
Write-Host "Uzak depodaki değişiklikler çekiliyor..." -ForegroundColor Blue
git pull origin $branch

# Eğer pull işleminde çakışma olursa
if ($LASTEXITCODE -ne 0) {
    Write-Host "Uzak depodaki değişiklikler çekilirken çakışma oluştu!" -ForegroundColor Red
    Write-Host "Lütfen çakışmaları manuel olarak çözün ve sonra yeniden deneyin." -ForegroundColor Red
    exit 1
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
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "İşlem başarıyla tamamlandı!" -ForegroundColor Green
} else {
    Write-Host "Push işlemi başarısız oldu. Hata kodu: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Manuel olarak çözmeniz gerekebilir." -ForegroundColor Yellow
}

exit 0 