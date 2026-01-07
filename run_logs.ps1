adb logcat -v threadtime > lifetag_full_logs.txt
Start-Sleep -Seconds 2
Write-Host "Launching app..." -ForegroundColor Yellow
adb shell am start -n com.egbaki.LifeTag/com.egbaki.LifeTag.MainActivity
Start-Sleep -Seconds 5
Write-Host "Stopping log capture..." -ForegroundColor Yellow
Write-Host "Searching for JavaScript error..." -ForegroundColor Cyan
Select-String -Path lifetag_full_logs.txt -Pattern "Exception|Error|FATAL|Throwable" | Select-Object -First 50
Write-Host "Full logs saved to lifetag_full_logs.txt" -ForegroundColor Green
notepad lifetag_full_logs.txt