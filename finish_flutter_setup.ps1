$ErrorActionPreference = "Stop"

$jobId = "ff3ff7e4-97eb-4103-aea2-0d05b18321f5"
Write-Host "Waiting for Dart SDK BITS transfer job $jobId to complete..."

$job = Get-BitsTransfer -JobId $jobId -ErrorAction SilentlyContinue
while ($job -and $job.JobState -eq "Transferring") {
    if ($job.TotalBytes -and $job.TotalBytes -gt 0) {
        $pct = [math]::Round(($job.BytesTransferred / $job.TotalBytes) * 100, 1)
        Write-Host "Progress: $($job.BytesTransferred) / $($job.TotalBytes) bytes ($pct %)"
    } else {
        $mb = [math]::Round($job.BytesTransferred / 1MB, 2)
        Write-Host "Transferred: $mb MB..."
    }
    Start-Sleep -Seconds 5
    $job = Get-BitsTransfer -JobId $jobId -ErrorAction SilentlyContinue
}

if ($job -and $job.JobState -eq "Transferred") {
    Write-Host "Transfer complete! Finalizing BITS job..."
    Complete-BitsTransfer -BitsJob $job
} else {
    Write-Host "Current job state: $($job.JobState)"
}

$cachePath = "C:\Users\sanje\flutter\bin\cache"
$dartZip = "$cachePath\dart-sdk-windows-x64.zip"

if (Test-Path $dartZip) {
    Write-Host "Extracting Dart SDK archive: $dartZip..."
    Expand-Archive -Path $dartZip -DestinationPath $cachePath -Force
    Write-Host "Dart SDK extracted successfully!"
    
    $engineVersion = (Get-Content "C:\Users\sanje\flutter\bin\cache\engine.stamp").Trim()
    $engineVersion | Out-File "$cachePath\engine-dart-sdk.stamp" -Encoding ASCII
    Write-Host "Engine stamp updated to $engineVersion"
    
    Remove-Item $dartZip -Force
}

Write-Host "Verifying Dart SDK execution..."
& "C:\Users\sanje\flutter\bin\cache\dart-sdk\bin\dart.exe" --version

Write-Host "Verifying Flutter version..."
& "C:\Users\sanje\flutter\bin\flutter.bat" --version
