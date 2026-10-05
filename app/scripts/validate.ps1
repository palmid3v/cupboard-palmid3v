# Cupboard validation runner
# Run from the application root:
#   .\scripts\validate.ps1
#
# This runner is intentionally capability-driven. It validates the tools and
# scripts that actually exist in the current Cupboard checkout and can evolve
# with future phases.

$ErrorActionPreference = "Stop"

$AppRoot = Split-Path -Parent $PSScriptRoot
Set-Location $AppRoot

$Results = New-Object System.Collections.Generic.List[object]

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Run-Check([string]$Name, [scriptblock]$Action) {
    Write-Step $Name
    $started = Get-Date

    try {
        & $Action
        if ($LASTEXITCODE -ne 0) {
            throw "$Name failed with exit code $LASTEXITCODE."
        }

        $duration = (Get-Date) - $started
        $Results.Add([pscustomobject]@{
            Name = $Name
            Status = "PASS"
            Duration = $duration
        })

        Write-Host "[PASS] $Name" -ForegroundColor Green
    }
    catch {
        $duration = (Get-Date) - $started
        $Results.Add([pscustomobject]@{
            Name = $Name
            Status = "FAIL"
            Duration = $duration
        })

        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        throw
    }
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

function Add-Skip([string]$Name, [string]$Reason) {
    Write-Host "[SKIP] $Name - $Reason" -ForegroundColor Yellow
    $Results.Add([pscustomobject]@{
        Name = $Name
        Status = "SKIP"
        Duration = [timespan]::Zero
    })
}

Write-Host "========================================" -ForegroundColor White
Write-Host " CUPBOARD VALIDATION RUNNER" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host "Application: $AppRoot"
Write-Host ""

# Repository structure
if (-not (Test-Path "package.json")) {
    throw "package.json was not found. Run this script from the Cupboard app root."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found in PATH."
}

# Dependencies
if (Test-Path "package-lock.json") {
    Run-Check "Frontend dependencies (npm ci)" {
        npm ci
    }
}
else {
    Add-Skip "Frontend dependencies (npm ci)" "package-lock.json not found."
}

# Available npm validation scripts
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

# PWA source/build validation
$manifestCandidates = @(
    "public\manifest.webmanifest",
    "public\manifest.json",
    "manifest.webmanifest"
)

$manifestFound = $false
foreach ($manifest in $manifestCandidates) {
    if (Test-Path $manifest) {
        $manifestFound = $true
        break
    }
}

if ($manifestFound) {
    Write-Step "PWA manifest source"
    Write-Host "[PASS] PWA manifest found" -ForegroundColor Green
    $Results.Add([pscustomobject]@{
        Name = "PWA manifest source"
        Status = "PASS"
        Duration = [timespan]::Zero
    })
}
else {
    Add-Skip "PWA manifest source" "No known manifest path found."
}

if (Test-Path "vite.config.js" -or Test-Path "vite.config.mjs" -or Test-Path "vite.config.ts") {
    Write-Step "Vite configuration"
    Write-Host "[PASS] Vite configuration found" -ForegroundColor Green
    $Results.Add([pscustomobject]@{
        Name = "Vite configuration"
        Status = "PASS"
        Duration = [timespan]::Zero
    })
}
else {
    Add-Skip "Vite configuration" "No Vite config file found."
}

# Optional Firebase tooling
if (Get-Command firebase -ErrorAction SilentlyContinue) {
    if (Test-Path "firebase.json") {
        Write-Step "Firebase configuration"
        Write-Host "[PASS] Firebase CLI and firebase.json found" -ForegroundColor Green
        $Results.Add([pscustomobject]@{
            Name = "Firebase configuration"
            Status = "PASS"
            Duration = [timespan]::Zero
        })
    }
    else {
        Add-Skip "Firebase configuration" "Firebase CLI exists but firebase.json was not found."
    }
}
else {
    Add-Skip "Firebase configuration" "Firebase CLI not installed; not required for frontend validation."
}

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
Write-Host "Validate the flows that automated checks cannot prove:"
Write-Host "  - Barcode scanner on a real device"
Write-Host "  - Camera permission and scanner recovery"
Write-Host "  - Offline / reconnect / pending-write behavior"
Write-Host "  - PWA installation and runtime"
Write-Host "  - Responsive mobile/desktop behavior"
Write-Host "  - Accessibility and focus-visible behavior"
Write-Host "  - Firebase Auth / Firestore role boundaries when deployed"
Write-Host ""

if ($failed -gt 0) {
    Write-Host "STATUS: AUTOMATED VALIDATION FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "STATUS: AUTOMATED VALIDATION COMPLETED" -ForegroundColor Green
Write-Host "STATUS: RUNTIME VALIDATION REMAINS MANUAL" -ForegroundColor Yellow
