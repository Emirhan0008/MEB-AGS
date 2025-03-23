@echo off
echo MEB-AGS Git Otomatik Commit ve Push işlemi başlatılıyor...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0auto-push.ps1"
echo.
echo İşlem tamamlandı.
pause 