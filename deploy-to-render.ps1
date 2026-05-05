# ==========================================
# Script para preparar deploy en Render.com
# ==========================================

param(
    [Parameter()]
    [ValidateSet("init", "push", "instructions")]
    [string]$Command = "init"
)

$ErrorActionPreference = "Stop"

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
function Write-Info($msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor Blue
}
function Write-Warn($msg) {
    Write-Host "  [!] $msg" -ForegroundColor Yellow
}

# ==========================================
# INIT - Prepara repositorio Git local
# ==========================================
function Init-Repo {
    Write-Step "Preparando repositorio para Render..."

    Set-Location $RootDir

    # Verificar que tenemos todo
    $needed = @("engine", "api", "frontend", "render.yaml", "licitaciones.ps1", "README.md")
    foreach ($d in $needed) {
        if (-not (Test-Path (Join-Path $RootDir $d))) {
            Write-Host "  [ERR] Falta: $d" -ForegroundColor Red
            exit 1
        }
    }

    # Crear .gitignore
    $gitignore = @"
# Node
node_modules/
npm-debug.log*
package-lock.json

# Build outputs (ya compilados en dist)
# Dejamos dist para que Render no tenga que compilar
# Si queres que Render compile, descomenta las siguientes lineas:
# engine/dist/
# api/dist/

# Local
.env
.env.local
*.log
.DS_Store
Thumbs.db

# Test files
test-run.js
"@
    $gitignorePath = Join-Path $RootDir ".gitignore"
    [System.IO.File]::WriteAllText($gitignorePath, $gitignore, [System.Text.Encoding]::UTF8)
    Write-Ok ".gitignore creado"

    # Inicializar git
    if (-not (Test-Path (Join-Path $RootDir ".git"))) {
        & git init
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Git no esta instalado. Instala Git desde https://git-scm.com/download/win"
            exit 1
        }
        Write-Ok "Repositorio Git inicializado"
    } else {
        Write-Warn "Repositorio Git ya existe"
    }

    # Configurar git (basico)
    & git config user.email "deploy@assetpark.cl"
    & git config user.name "AssetPark Deploy"

    # Primer commit
    & git add -A
    & git commit -m "AssetPark Scraper MercadoPublico - ready for Render" --allow-empty
    Write-Ok "Commit inicial creado"

    Write-Host "" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "REPO LOCAL LISTO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pasos para deployar en Render (GRATIS):" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Crear repo en GitHub:" -ForegroundColor Yellow
    Write-Host "   - Ve a https://github.com/new" -ForegroundColor Blue
    Write-Host "   - Nombre: assetpark-scraper-mercadopublico" -ForegroundColor Blue
    Write-Host "   - Publico o Privado (da igual)" -ForegroundColor Blue
    Write-Host "   - NO inicializar con README (ya lo tenemos)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "2. Conectar tu repo local a GitHub:" -ForegroundColor Yellow
    Write-Host "   Ejecuta estos comandos en esta carpeta:" -ForegroundColor Gray
    Write-Host "   git remote add origin https://github.com/TU-USUARIO/assetpark-scraper-mercadopublico.git" -ForegroundColor Blue
    Write-Host "   git branch -M main" -ForegroundColor Blue
    Write-Host "   git push -u origin main" -ForegroundColor Blue
    Write-Host ""
    Write-Host "3. Crear cuenta en Render:" -ForegroundColor Yellow
    Write-Host "   - Ve a https://dashboard.render.com/register" -ForegroundColor Blue
    Write-Host "   - Registrate con tu cuenta de GitHub" -ForegroundColor Blue
    Write-Host ""
    Write-Host "4. Deploy con Blueprint:" -ForegroundColor Yellow
    Write-Host "   - En Render: Click 'New +' -> 'Blueprint'" -ForegroundColor Blue
    Write-Host "   - Selecciona tu repo 'assetpark-scraper-mercadopublico'" -ForegroundColor Blue
    Write-Host "   - Render lee automaticamente 'render.yaml' y configura todo" -ForegroundColor Blue
    Write-Host "   - Click 'Apply' -> espera 2-3 minutos" -ForegroundColor Blue
    Write-Host ""
    Write-Host "5. Listo! Tu app estara en:" -ForegroundColor Yellow
    Write-Host "   https://assetpark-scraper.onrender.com (o el nombre que elijas)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "NOTA IMPORTANTE:" -ForegroundColor Red
    Write-Host "   El tier gratis de Render 'se duerme' despues de 15 min sin uso." -ForegroundColor Red
    Write-Host "   La primera visita despues de dormir tarda ~30 segundos en despertar." -ForegroundColor Red
    Write-Host "   El portfolio (datos guardados) se pierde al reiniciar (es memoria)." -ForegroundColor Red
    Write-Host ""
}

# ==========================================
# MAIN
# ==========================================
Set-Location $RootDir

switch ($Command) {
    "init" { Init-Repo }
    "instructions" { Init-Repo }
    "push" {
        Write-Step "Pusheando a GitHub..."
        & git push -u origin main
        if ($LASTEXITCODE -eq 0) { Write-Ok "Pusheado exitoso! Ahora anda a Render y aplica el Blueprint." }
    }
}
