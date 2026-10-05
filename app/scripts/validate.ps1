# Cupboard validation runner
# Run from the application root:
#   .\scripts\validate.ps1
#
# This runner is the project's evolving validation entry point.
# It validates the current stack, phase artifacts, automated checks, build,
# and records manual runtime checks that cannot be proven from source alone.

$ErrorActionPreference = "Continue"

$AppRoot = Split-Path -Parent $PSScriptRoot
Set-Location $AppRoot

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
    if (-not (Test-Path $RelativePath)) {
        throw "Required path not found: $RelativePath"
    }
}

function Assert-Text([string]$RelativePath, [string]$Pattern) {
    Assert-Path $RelativePath
    $content = Get-Content $RelativePath -Raw
    if ($content -notmatch $Pattern) {
        throw "Required source contract not found in $RelativePath: $Pattern"
    }
}

Write-Host "========================================" -ForegroundColor White
Write-Host " CUPBOARD VALIDATION RUNNER" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host "Application: $AppRoot"
Write-Host ""

if (-not (Test-Path "package.json")) {
    throw "package.json was not found. Run this script from the Cupboard app root."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found in PATH."
}

# ---------------------------------------------------------------------------
# Project baseline / phase 13-16
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 13-16 implementation contracts" {
    @(
        "src\App.jsx",
        "src\components\ProductDetail.jsx",
        "src\components\WorkspacePanel.jsx",
        "src\services\products.js",
        "vite.config.js"
    ) | ForEach-Object { Assert-Path $_ }

    Assert-Text "src\App.jsx" "canWriteInventory"
    Assert-Text "src\App.jsx" "saveState"
    Assert-Text "src\services\products.js" "catalogCache"
    Assert-Text "vite.config.js" "cleanupOutdatedCaches"
}

# ---------------------------------------------------------------------------
# FASE 17
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 17 regression infrastructure" {
    @(
        ".github\workflows\regression.yml",
        "scripts\regression-tests.mjs",
        "scripts\run-regression.mjs",
        "src\services\regressionContracts.js"
    ) | ForEach-Object { Assert-Path $_ }

    if (-not (Has-NpmScript "test:regression")) {
        throw "package.json does not define test:regression."
    }

    Assert-Text "scripts\regression-tests.mjs" "regressionContracts"
}

# ---------------------------------------------------------------------------
# FASE 18
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 18 architecture extraction" {
    @(
        "src\components\InventoryView.jsx",
        "src\components\ProductForm.jsx",
        "src\components\ScannerView.jsx",
        "src\hooks\useInventorySubscription.js"
    ) | ForEach-Object { Assert-Path $_ }

    Assert-Text "src\App.jsx" "InventoryView"
    Assert-Text "src\App.jsx" "ScannerView"
    Assert-Text "src\App.jsx" "ProductForm"
    Assert-Text "src\App.jsx" "useInventorySubscription"
}

# ---------------------------------------------------------------------------
# FASE 19-20
# ---------------------------------------------------------------------------

Run-SourceCheck "FASE 19-20 settings and preferences" {
    @(
        "src\components\SettingsPanel.jsx",
        "src\hooks\useCupboardSettings.js"
    ) | ForEach-Object { Assert-Path $_ }

    Assert-Text "src\App.jsx" "SettingsPanel"
    Assert-Text "src\App.jsx" "useCupboardSettings"
    Assert-Text "src\hooks\useCupboardSettings.js" "cupboard.settings"
    Assert-Text "src\index.css" "--cupboard-primary"
}

# ---------------------------------------------------------------------------
# Dependencies and automated checks
# ---------------------------------------------------------------------------

if (Test-Path "package-lock.json") {
    Run-Check "Frontend dependencies (npm ci)" {
        npm ci
    }
}
else {
    Add-Skip "Frontend dependencies (npm ci)" "package-lock.json not found."
}

foreach ($scriptName in @("test:regression", "test", "lint", "build")) {
    if (Has-NpmScript $scriptName) {
        Run-Check "npm run $scriptName" {
            npm run $scriptName
        }
    }
    else {
        Add-Skip "npm run $scriptName" "script is not defined in package.json."
    }
}

# ---------------------------------------------------------------------------
# PWA / Firebase configuration checks
# ---------------------------------------------------------------------------

Run-SourceCheck "PWA configuration" {
    Assert-Text "vite.config.js" "VitePWA"
    Assert-Text "vite.config.js" "cleanupOutdatedCaches"
}

if (Get-Command firebase -ErrorAction SilentlyContinue) {
    if (Test-Path "firebase.json") {
        Run-SourceCheck "Firebase CLI configuration" {
            Assert-Path "firebase.json"
        }
    }
    else {
        Add-Skip "Firebase CLI configuration" "Firebase CLI is installed but firebase.json is not part of the current frontend workspace."
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
Write-Host "These checks remain manual because source/build checks cannot prove them:"
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
