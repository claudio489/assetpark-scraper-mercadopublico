# ==========================================
# Licitaciones Intelligence - Script PowerShell
# Compatible con Windows PowerShell 5.1
# ==========================================

param(
    [Parameter()]
    [ValidateSet("install", "build", "dev", "start", "test", "clean")]
    [string]$Command = "dev"
)

$ErrorActionPreference = "Stop"

# Resolve root directory
if ($PSScriptRoot) {
    $RootDir = $PSScriptRoot
} else {
    $RootDir = (Get-Location).Path
}

function Write-Step($msg) {
    Write-Host "" -ForegroundColor Cyan
    Write-Host "[STEP] $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "  [!] $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "  [ERR] $msg" -ForegroundColor Red
}

# ==========================================
# INSTALL
# ==========================================
function Install-All {
    Write-Step "Instalando dependencias..."

    $dirs = @("engine", "api", "frontend")
    foreach ($d in $dirs) {
        $path = Join-Path $RootDir $d
        if (-not (Test-Path $path)) {
            Write-Err "Directorio no encontrado: $path"
            exit 1
        }
        if (Test-Path (Join-Path $path "node_modules")) {
            Write-Warn "$d ya tiene node_modules (skipping)"
            continue
        }
        Write-Host "  -> Instalando $d..." -ForegroundColor Gray
        Set-Location $path
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Error instalando $d"
            exit 1
        }
        Set-Location $RootDir
        Write-Ok "$d listo"
    }
}

# ==========================================
# BUILD
# ==========================================
function Build-All {
    Write-Step "Compilando proyecto..."

    # Engine
    Set-Location (Join-Path $RootDir "engine")
    Write-Host "  -> Compilando engine..." -ForegroundColor Gray
    & node node_modules/typescript/bin/tsc
    if ($LASTEXITCODE -ne 0) { throw "Error compilando engine" }
    Set-Location $RootDir
    Write-Ok "Engine compilado"

    # API
    Set-Location (Join-Path $RootDir "api")
    Write-Host "  -> Compilando api..." -ForegroundColor Gray
    & node node_modules/typescript/bin/tsc
    if ($LASTEXITCODE -ne 0) { throw "Error compilando api" }
    Set-Location $RootDir
    Write-Ok "API compilada"

    # Frontend
    Set-Location (Join-Path $RootDir "frontend")
    Write-Host "  -> Compilando frontend..." -ForegroundColor Gray
    & node node_modules/vite/bin/vite.js build
    if ($LASTEXITCODE -ne 0) { throw "Error compilando frontend" }
    Set-Location $RootDir
    Write-Ok "Frontend compilado"

    Write-Host "" -ForegroundColor Green
    Write-Host "[BUILD COMPLETO]" -ForegroundColor Green
}

# ==========================================
# DEV
# ==========================================
function Start-Dev {
    Write-Step "Iniciando modo desarrollo..."

    # Ensure engine compiled
    $engineDist = Join-Path $RootDir "engine\dist"
    if (-not (Test-Path $engineDist)) {
        Write-Warn "Engine no compilado. Compilando primero..."
        Set-Location (Join-Path $RootDir "engine")
        & node node_modules/typescript/bin/tsc
        Set-Location $RootDir
    }

    $apiDir = Join-Path $RootDir "api"
    $frontendDir = Join-Path $RootDir "frontend"

    Write-Host "  -> Iniciando API en puerto 3001..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$apiDir'; Write-Host '=== API LICITACIONES (puerto 3001) ===' -ForegroundColor Green; node node_modules/ts-node/dist/bin.js src/index.ts"
    )

    Start-Sleep -Seconds 2

    Write-Host "  -> Iniciando Frontend en puerto 3000..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$frontendDir'; Write-Host '=== FRONTEND LICITACIONES (puerto 3000) ===' -ForegroundColor Green; node node_modules/vite/bin/vite.js"
    )

    Write-Host "" -ForegroundColor Green
    Write-Host "  API:      http://localhost:3001" -ForegroundColor Blue
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Blue
}

# ==========================================
# START (production)
# ==========================================
function Start-Production {
    Write-Step "Iniciando modo produccion..."

    if (-not (Test-Path "$RootDir\engine\dist")) {
        Write-Err "Engine no compilado. Ejecute primero: .\licitaciones.ps1 -Command build"
        exit 1
    }
    if (-not (Test-Path "$RootDir\api\dist")) {
        Write-Err "API no compilada. Ejecute primero: .\licitaciones.ps1 -Command build"
        exit 1
    }

    Set-Location (Join-Path $RootDir "api")
    Write-Host "Iniciando API en puerto 3001..." -ForegroundColor Green
    & node dist/index.js
}

# ==========================================
# TEST
# ==========================================
function Test-Engine {
    Write-Step "Ejecutando tests del engine..."

    if (-not (Test-Path "$RootDir\engine\dist")) {
        Write-Warn "Compilando engine primero..."
        Set-Location (Join-Path $RootDir "engine")
        & node node_modules/typescript/bin/tsc
        Set-Location $RootDir
    }

    $testScript = @"
const { runPipeline, getProfile, calculateStats } = require('./engine/dist');

async function test() {
    console.log('Perfiles disponibles: constructora, tecnologia, salud, general');

    const techProfile = getProfile('tecnologia');
    const techResult = await runPipeline({ profile: techProfile, limit: 5 });
    console.log('\n--- Tecnologia ---');
    console.log('Total:', techResult.total);
    console.log('Alta:', techResult.alta, 'Media:', techResult.media, 'Baja:', techResult.baja);
    console.log('Score promedio:', techResult.averageScore);
    console.log('Top:', techResult.opportunities[0]?.title, '- Score:', techResult.opportunities[0]?.score);

    const stats = calculateStats(techResult.opportunities);
    console.log('\n--- Stats ---');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n[OK] Todos los tests pasaron!');
}

test().catch(e => { console.error(e); process.exit(1); });
"@

    $testFile = Join-Path $RootDir "test-run.js"
    [System.IO.File]::WriteAllText($testFile, $testScript, [System.Text.Encoding]::UTF8)

    try {
        Set-Location $RootDir
        & node $testFile
    } finally {
        if (Test-Path $testFile) {
            Remove-Item $testFile -ErrorAction SilentlyContinue
        }
    }
}

# ==========================================
# CLEAN
# ==========================================
function Clean-All {
    Write-Step "Limpiando compilados..."

    $paths = @(
        "$RootDir\engine\dist",
        "$RootDir\api\dist",
        "$RootDir\frontend\dist"
    )

    foreach ($p in $paths) {
        if (Test-Path $p) {
            Remove-Item $p -Recurse -Force
            Write-Host "  Eliminado: $p" -ForegroundColor Gray
        }
    }

    Write-Ok "Limpieza completa"
}

# ==========================================
# MAIN
# ==========================================
Set-Location $RootDir

switch ($Command) {
    "install" { Install-All }
    "build" { Build-All }
    "dev" { Start-Dev }
    "start" { Start-Production }
    "test" { Test-Engine }
    "clean" { Clean-All }
}
