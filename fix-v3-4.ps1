# AssetPark Scraper v3.4 - Script de reparacion
# Ejecutar desde: C:\Users\csilv\licitaciones-engine

$ErrorActionPreference = "Stop"
$Repo = "C:\Users\csilv\licitaciones-engine"
Set-Location $Repo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ASSETPARK SCRAPER v3.4 - REPARACION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# -------------------------------------------------
# FIX 1: Arreglar analyzeLicitacion.ts (regex \n partido)
# -------------------------------------------------
Write-Host "[FIX 1] Arreglando analyzeLicitacion.ts..." -ForegroundColor Yellow
$path = Join-Path $Repo "engine\src\analyzer\analyzeLicitacion.ts"
if (Test-Path $path) {
    $content = Get-Content $path -Raw -Encoding UTF8
    # Une las lineas partidas por \n literal en los regex
    $content = $content -replace '\(\[\^\.[\r\n]+\]\{10,200\}\)/gi,', '([^\n]{10,200})/gi,'
    Set-Content $path $content -Encoding UTF8 -NoNewline
    Write-Host "  [OK] Regex arreglados" -ForegroundColor Green
} else {
    Write-Host "  [WARN] No existe analyzeLicitacion.ts" -ForegroundColor Yellow
}

# -------------------------------------------------
# FIX 2: Arreglar engine/src/analyzer/index.ts (HistoricalPattern)
# -------------------------------------------------
Write-Host "[FIX 2] Arreglando analyzer/index.ts..." -ForegroundColor Yellow
$path2 = Join-Path $Repo "engine\src\analyzer\index.ts"
if (Test-Path $path2) {
    $content = Get-Content $path2 -Raw -Encoding UTF8
    $old = @"
export interface HistoricalPattern {
  totalAdjudicated: number;
  uniqueWinners: number;
  sameWinnerCount: number;
  mostFrequentWinner: string;
  averageBidders: number;
  winRateEstimate: number;  // 0-100 probabilidad de ganar
}
"@
    $new = @"
export interface HistoricalPattern {
  totalAdjudicated: number;
  uniqueWinners: number;
  sameWinnerCount: number;
  mostFrequentWinner: string;
  averageBidders: number;
  winRateEstimate: number;  // 0-100 probabilidad de ganar
  reasons: string[];
  competitionScore: number;
}
"@
    if ($content.Contains($old)) {
        $content = $content.Replace($old, $new)
        Set-Content $path2 $content -Encoding UTF8 -NoNewline
        Write-Host "  [OK] HistoricalPattern arreglado" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] HistoricalPattern ya tenia reasons" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] No existe analyzer/index.ts" -ForegroundColor Yellow
}

# -------------------------------------------------
# FIX 3: render.yaml con build command de compilacion
# -------------------------------------------------
Write-Host "[FIX 3] Actualizando render.yaml..." -ForegroundColor Yellow
$yaml = @"
services:
  - type: web
    name: assetpark-scraper
    runtime: node
    plan: free
    region: oregon
    buildCommand: |
      set -e
      echo "=== Instalando Engine ==="
      cd engine && npm install && cd ..
      echo "=== Compilando Engine ==="
      cd engine && node node_modules/typescript/bin/tsc && cd ..
      echo "=== Instalando API ==="
      cd api && npm install && cd ..
      echo "=== Compilando API ==="
      cd api && node node_modules/typescript/bin/tsc && cd ..
      echo "=== Build OK ==="
    startCommand: cd api && NODE_ENV=production node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MP_TICKET
        value: 8BBCAB7E-0911-4E40-BD68-C56A0A33FF78
      - key: PORT
        value: 10000
    healthCheckPath: /api/health
    autoDeploy: true
"@
Set-Content "$Repo\render.yaml" $yaml -Encoding UTF8
Write-Host "  [OK] render.yaml actualizado" -ForegroundColor Green

# -------------------------------------------------
# COMPILAR ENGINE
# -------------------------------------------------
Write-Host "[STEP] Compilando engine..." -ForegroundColor Cyan
cd "$Repo\engine"
& node node_modules/typescript/bin/tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] Engine no compila. Revisa los errores arriba." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Engine compilado" -ForegroundColor Green

# -------------------------------------------------
# COMPILAR API
# -------------------------------------------------
Write-Host "[STEP] Compilando api..." -ForegroundColor Cyan
cd "$Repo\api"
& node node_modules/typescript/bin/tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] API no compila. Revisa los errores arriba." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] API compilada" -ForegroundColor Green

# -------------------------------------------------
# GIT PUSH (con dist/ forzado)
# -------------------------------------------------
Write-Host "[STEP] Git push..." -ForegroundColor Cyan
cd $Repo
& git add -A
# Forzar dist/ aunque este en .gitignore
& git add -f engine/dist/ api/dist/
& git commit -m "v3.4: build compila en Render, regex fix, dist incluido"
& git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DONE! Render va a redeployar en 2 min" -ForegroundColor Green
Write-Host "El nuevo build command compila TypeScript en el servidor" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
