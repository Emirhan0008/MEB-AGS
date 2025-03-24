# Bu script otomatik commit ve push için bir Windows görev zamanlayıcısı oluşturur
Write-Host "Git Otomatik Commit ve Push için planlı görev oluşturuluyor..." -ForegroundColor Cyan

# Mevcut dizin yolunu al
$workingDir = Get-Location
$scriptPath = Join-Path -Path $workingDir -ChildPath "auto-push.ps1"

# Script dosyasının varlığını kontrol et
if (-not (Test-Path $scriptPath)) {
    Write-Host "Hata: $scriptPath bulunamadı!" -ForegroundColor Red
    exit 1
}

# Görev adı ve açıklaması
$taskName = "GitAutoPush-MEB-AGS"
$taskDescription = "MEB-AGS projesi için her 30 dakikada bir otomatik git commit ve push yapar"

# Görevi oluştur (administrator ayrıcalıkları gerekir)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`"" -WorkingDirectory $workingDir

# Trigger ayarları (Her 30 dakikada bir)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date)
$trigger.Repetition.Interval = "PT30M"

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $taskDescription -Force
    Write-Host "Görev başarıyla oluşturuldu! Her 30 dakikada bir otomatik commit ve push işlemi gerçekleştirilecek." -ForegroundColor Green
    Write-Host "Not: Bu görev, bilgisayarınız açık olduğunda çalışacaktır." -ForegroundColor Yellow
} catch {
    Write-Host "Görev oluşturulurken hata oluştu: $_" -ForegroundColor Red
    Write-Host "Not: Bu komutu yönetici olarak çalıştırmanız gerekebilir." -ForegroundColor Yellow
} 