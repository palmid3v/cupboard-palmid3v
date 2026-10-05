# Cupboard validation runner
# Run from the repository root:
#   .\scripts\validate.ps1
#
# This runner is the evolving validation entry point for Cupboard.
# It validates the current project structure, phase contracts, automated
# checks, and records runtime checks that source/build tooling cannot prove.

$ErrorActionPreference = "Continue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppRoot = Join-Path $RepoRoot "app"
Set-Location $RepoRoot

$Results = New-Object System.Collections.Generic.List[object]

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Add-Result([string]$Name, [string]$Status, [timespan]$Duration) {
    $Results.Add([pscustomobject]@{
        Name = $Name
        Status = $Status
        Duration = $Duration
    })
}

function Run-Check([string]$Name, [scriptblock]$Action) {
    Write-Step $Name
    $started = Get-Date

    try {
        $global:LASTEXITCODE = 0
        & $Action

        if ($LASTEXITCODE -ne 0) {
            throw "$Name failed with exit code $LASTEXITCODE."
        }

        $duration = (Get-Date) - $started
        Add-Result $Name "PASS" $duration
        Write-Host "[PASS] $Name" -ForegroundColor Green
        return $true
    }
    catch {
        $duration = (Get-Date) - $started
        Add-Result $Name "FAIL" $duration
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

function Run-SourceCheck([string]$Name, [scriptblock]$Action) {
    Write-Step $Name
    $started = Get-Date

    try {
        & $Action
        $duration = (Get-Date) - $started
        Add-Result $Name "PASS" $duration
        Write-Host "[PASS] $Name" -ForegroundColor Green
        return $true
    }
    catch {
        $duration = (Get-Date) - $started
        Add-Result $Name "FAIL" $duration
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

function Add-Skip([string]$Name, [string]$Reason) {
    Write-Host "[SKIP] $Name - $Reason" -ForegroundColor Yellow
    Add-Result $Name "SKIP" ([timespan]::Zero)
}

function Has-NpmScript([string]$ScriptName) {
    $packageJson = Join-Path $AppRoot "package.json"
    if (-not (Test-Path $packageJson)) {
        return $false
    }

    $package = Get-Content $packageJson -Raw | ConvertFrom-Json
    return $null -ne $package.scripts -and
        ($package.scripts.PSObject.Properties.Name -contains $ScriptName)
}

function Assert-Path([string]$RelativePath) {
    if (-not (Test-Path (Join-Path $RepoRoot $RelativePath))) {
        throw "Required path not found: $RelativePath"
    }
}

function Assert-Text([string]$RelativePath, [string]$Pattern) {
    $fullPath = Join-Path $RepoRoot $RelativePath
    Assert-Path $RelativePath

    $content = Get-Content $fullPath -Raw
    if ($content -notmatch $Pattern) {
        throw "Required source contract not found in ${RelativePath}: $Pattern"
    }
}

Write-Host "========================================" -ForegroundColor White
Write-Host " CUPBOARD VALIDATION RUNNER" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host "Repository: $RepoRoot"
Write-Host "Application: $AppRoot"
Write-Host ""

if (-not (Test-Path (Join-Path $AppRoot "package.json"))) {
    throw "app/package.json was not found. The repository structure is invalid."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found in PATH."
}

# ---------------------------------------------------------------------------
# FASE 13-16
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 13-16 implementation contracts" {
    @(
        "app\src\App.jsx",
        "app\src\components\ProductDetail.jsx",
        "app\src\components\WorkspacePanel.jsx",
        "app\src\services\products.js",
        "app\vite.config.js"
    ) | ForEach-Object { Assert-Path $_ }

    Assert-Text "app\src\App.jsx" "canWriteInventory"
    Assert-Text "app\src\App.jsx" "saveState"
    Assert-Text "app\src\services\products.js" "catalogCache"
    Assert-Text "app\vite.config.js" "cleanupOutdatedCaches"
}

# ---------------------------------------------------------------------------
# FASE 17
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 17 regression infrastructure" {
    @(
        ".github\workflows\regression.yml",
        "app\scripts\regression-tests.mjs",
        "app\scripts\run-regression.mjs",
        "app\src\services\regressionContracts.js"
    ) | ForEach-Object { Assert-Path $_ }

    if (-not (Has-NpmScript "test:regression")) {
        throw "app/package.json does not define test:regression."
    }

    Assert-Text "app\scripts\regression-tests.mjs" "regressionContracts"
}

# ---------------------------------------------------------------------------
# FASE 18
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 18 architecture extraction" {
    @(
        "app\src\components\InventoryView.jsx",
        "app\src\components\ProductForm.jsx",
        "app\src\components\ScannerView.jsx",
        "app\src\hooks\useInventorySubscription.js"
    ) | ForEach-Object { Assert-Path $_ }

    Assert-Text "app\src\App.jsx" "InventoryView"
    Assert-Text "app\src\App.jsx" "ScannerView"
    Assert-Text "app\src\App.jsx" "useInventorySubscription"
    Assert-Text "app\src\components\ScannerView.jsx" "ProductForm"
}

# ---------------------------------------------------------------------------
# FASE 19-20
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 19-20 settings and preferences" {
    @(
        "app\src\components\SettingsPanel.jsx",
        "app\src\hooks\useCupboardSettings.js"
    ) | ForEach-Object { Assert-Path $_ }

    Assert-Text "app\src\App.jsx" "SettingsPanel"
    Assert-Text "app\src\App.jsx" "useCupboardSettings"
    Assert-Text "app\src\hooks\useCupboardSettings.js" "cupboard.settings"
    Assert-Text "app\src\index.css" "Retro-Digital"
}

# ---------------------------------------------------------------------------
# Dependencies and automated checks
# ---------------------------------------------------------------------------

if (Test-Path (Join-Path $AppRoot "package-lock.json")) {
    Run-Check "Frontend dependencies (npm ci)" {
        Push-Location $AppRoot
        try {
            npm ci
        }
        finally {
            Pop-Location
        }
    }
}
else {
    Add-Skip "Frontend dependencies (npm ci)" "app/package-lock.json not found."
}

foreach ($scriptName in @("test:regression", "test", "lint", "build")) {
    if (Has-NpmScript $scriptName) {
        Run-Check "Frontend npm run $scriptName" {
            Push-Location $AppRoot
            try {
                npm run $scriptName
            }
            finally {
                Pop-Location
            }
        }
    }
    else {
        Add-Skip "Frontend npm run $scriptName" "script is not defined in app/package.json."
    }
}

# ---------------------------------------------------------------------------
# PWA / Firebase configuration
# ---------------------------------------------------------------------------

Run-SourceCheck "PWA configuration" {
    Assert-Text "app\vite.config.js" "VitePWA"
    Assert-Text "app\vite.config.js" "cleanupOutdatedCaches"
}

if (Get-Command firebase -ErrorAction SilentlyContinue) {
    if (Test-Path (Join-Path $RepoRoot "firebase.json")) {
        Run-SourceCheck "Firebase CLI configuration" {
            Assert-Path "firebase.json"
        }
    }
    else {
        Add-Skip "Firebase CLI configuration" "Firebase CLI is installed but firebase.json is not present at repository root."
    }
}
else {
    Add-Skip "Firebase CLI configuration" "Firebase CLI is not installed; frontend validation does not require it."
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host " AUTOMATED VALIDATION SUMMARY" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White

$Results | Format-Table -AutoSize

$failed = @($Results | Where-Object { $_.Status -eq "FAIL" }).Count
$passed = @($Results | Where-Object { $_.Status -eq "PASS" }).Count
$skipped = @($Results | Where-Object { $_.Status -eq "SKIP" }).Count

Write-Host ""
Write-Host "PASS : $passed" -ForegroundColor Green
Write-Host "FAIL : $failed" -ForegroundColor Red
Write-Host "SKIP : $skipped" -ForegroundColor Yellow

Write-Host ""
Write-Host "MANUAL VALIDATION" -ForegroundColor Yellow
Write-Host "-----------------"
Write-Host "These checks remain manual because source/build tooling cannot prove them:"
Write-Host "  - Owner/editor/member role paths and deployed Firestore Rules"
Write-Host "  - Barcode scanner on a real device"
Write-Host "  - Camera permission and scanner recovery"
Write-Host "  - Offline / reconnect / pending-write synchronization"
Write-Host "  - PWA installation/update on target devices"
Write-Host "  - Responsive mobile/desktop behavior"
Write-Host "  - Accessibility / keyboard / focus-visible behavior"
Write-Host "  - Settings persistence across a real user session"
Write-Host ""

if ($failed -gt 0) {
    Write-Host "STATUS: AUTOMATED VALIDATION FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "STATUS: AUTOMATED VALIDATION PASSED" -ForegroundColor Green
Write-Host "STATUS: RUNTIME VALIDATION REMAINS MANUAL" -ForegroundColor Yellow
