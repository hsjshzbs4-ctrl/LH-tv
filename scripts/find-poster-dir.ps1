$appData = [Environment]::GetFolderPath('ApplicationData')
$dirs = @(
    "$appData\lh-tv",
    "$appData\LH",
    "$appData\Electron"
)

Write-Host "Searching for poster cache..."
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "FOUND: $dir"
        $files = Get-ChildItem -Path $dir -Recurse -Depth 2 -Filter "*poster*" -ErrorAction SilentlyContinue
        foreach ($f in $files) {
            Write-Host "  $($f.FullName) ($([math]::Round($f.Length/1KB,1)) KB)"
        }
    }
}

# Also check the old project downloads folder
$oldDir = "D:\L-H\LH-YS\downloads"
if (Test-Path $oldDir) {
    Write-Host "FOUND (old): $oldDir"
    $pfiles = Get-ChildItem -Path $oldDir -Recurse -Depth 1 -Filter "*poster*" -ErrorAction SilentlyContinue
    foreach ($f in $pfiles) {
        Write-Host "  $($f.FullName) ($([math]::Round($f.Length/1KB,1)) KB)"
    }
}

# Check LH-TV downloads
$newDir = "D:\L-H\LH-TV\downloads"
if (Test-Path $newDir) {
    Write-Host "FOUND (new): $newDir"
    $pfiles = Get-ChildItem -Path $newDir -Recurse -Depth 1 -Filter "*poster*" -ErrorAction SilentlyContinue
    foreach ($f in $pfiles) {
        Write-Host "  $($f.FullName) ($([math]::Round($f.Length/1KB,1)) KB)"
    }
}
