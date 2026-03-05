# Start Ollama with CORS allowed for the Angular dev server (localhost:4200).
# Run this before or while running "ng serve" so the app can call the Ollama API.
# Usage: .\scripts\ollama-serve-cors.ps1

$env:OLLAMA_ORIGINS = "http://localhost:4200"
Write-Host "OLLAMA_ORIGINS set to http://localhost:4200 for this session."
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaPath) {
    $localPath = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
    if (Test-Path $localPath) {
        Write-Host "Starting Ollama from $localPath ..."
        & $localPath serve
    } else {
        Write-Host "Ollama not found in PATH or at $localPath. Install from https://ollama.com and run 'ollama serve' manually."
    }
} else {
    Write-Host "Starting ollama serve ..."
    ollama serve
}
