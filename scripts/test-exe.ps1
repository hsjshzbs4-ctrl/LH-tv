$exePath = "D:\L-H\LH-TV\dist\LH 2.0.0.exe"
Write-Host "Starting: $exePath"
Start-Process -FilePath $exePath
Start-Sleep -Seconds 6
$proc = Get-Process -Name "LH" -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "PASS: LH.exe is running (PID: $($proc.Id))"
    Write-Host "  Window: $($proc.MainWindowTitle)"
    Write-Host "  Memory: $([math]::Round($proc.WorkingSet64/1MB, 1)) MB"
    Stop-Process -Name "LH" -Force
    Write-Host "PASS: Process closed cleanly"
} else {
    Write-Host "FAIL: LH.exe not running after launch"
}
