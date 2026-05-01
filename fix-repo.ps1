# AssetPark Scraper - Script de reparacion completa
# Ejecutar desde: C:\Users\csilv\licitaciones-engine

param(
    [string]$ZipPath = "$PSScriptRoot\..\licitaciones-engine.zip"
)

$Repo = "C:\Users\csilv\licitaciones-engine"
Set-Location $Repo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ASSETPARK SCRAPER - REPARACION COMPLETA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Verificar que estamos en el repo correcto
if (-not (Test-Path "$Repo\.git")) {
    Write-Host "[ERR] No se encontro .git en $Repo" -ForegroundColor Red
    exit 1
}

# 2. Buscar el ZIP si no se paso
if (-not (Test-Path $ZipPath)) {
    $ZipPath = "$env:USERPROFILE\Downloads\licitaciones-engine.zip"
    if (-not (Test-Path $ZipPath)) {
        Write-Host "[ERR] No se encontro licitaciones-engine.zip" -ForegroundColor Red
        Write-Host "      Descargalo primero desde el link que te dio Kimi" -ForegroundColor Yellow
        exit 1
    }
}

# 3. Backup de .git
Write-Host "[STEP] Respaldando .git..." -ForegroundColor Cyan
$GitBackup = "$env:TEMP\assetpark-git-backup"
if (Test-Path $GitBackup) { Remove-Item $GitBackup -Recurse -Force }
Copy-Item "$Repo\.git" $GitBackup -Recurse
Write-Host "[OK] .git respaldado" -ForegroundColor Green

# 4. Borrar TODO excepto .git
Write-Host "[STEP] Limpiando repo (dejando solo .git)..." -ForegroundColor Cyan
Get-ChildItem $Repo -Exclude .git | Remove-Item -Recurse -Force
Write-Host "[OK] Repo limpio" -ForegroundColor Green

# 5. Descomprimir ZIP
Write-Host "[STEP] Descomprimiendo ZIP..." -ForegroundColor Cyan
Expand-Archive -Path $ZipPath -DestinationPath $Repo -Force

# Mover contenido de subcarpeta si quedo anidada
$Nested = "$Repo\licitaciones-engine"
if (Test-Path $Nested) {
    Write-Host "[INFO] Moviendo archivos de subcarpeta..." -ForegroundColor Yellow
    Get-ChildItem $Nested | Move-Item -Destination $Repo -Force
    Remove-Item $Nested -Recurse -Force
}

# 6. Restaurar .git
Write-Host "[STEP] Restaurando .git..." -ForegroundColor Cyan
Copy-Item "$GitBackup\*" "$Repo\.git" -Recurse -Force
Remove-Item $GitBackup -Recurse -Force
Write-Host "[OK] .git restaurado" -ForegroundColor Green

# 7. Instalar dependencias
Write-Host "[STEP] Instalando dependencias..." -ForegroundColor Cyan
cd "$Repo\engine"
if (Test-Path "package.json") { & npm install --silent 2>$null }
cd "$Repo\api"
if (Test-Path "package.json") { & npm install --silent 2>$null }
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green

# 8. Compilar
Write-Host "[STEP] Compilando engine..." -ForegroundColor Cyan
cd "$Repo\engine"
& node node_modules/typescript/bin/tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] Engine no compila" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Engine compilado" -ForegroundColor Green

Write-Host "[STEP] Compilando api..." -ForegroundColor Cyan
cd "$Repo\api"
& node node_modules/typescript/bin/tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] API no compila" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] API compilada" -ForegroundColor Green

# 9. Git push
Write-Host "[STEP] Git push..." -ForegroundColor Cyan
cd $Repo
& git add -A
& git commit -m "v3.3-fix: sin demo data, URL ficha publica, perfiles ok"
& git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DONE - Render va a redeployar en 2 min" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
