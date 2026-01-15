# Silent Installation Script for Engineering Olympics
# Run this script as Administrator on each laptop, or deploy via Group Policy

param(
    [string]$InstallerPath = ".\Engineering Olympics Setup X.X.X.exe",
    [string]$InstallPath = "C:\Program Files\Engineering Olympics"
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Check if installer exists
if (-not (Test-Path $InstallerPath)) {
    Write-Host "Installer not found at: $InstallerPath" -ForegroundColor Red
    Write-Host "Please update the InstallerPath parameter or place the installer in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Engineering Olympics - Silent Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if already installed
$installedPath = "$InstallPath\Engineering Olympics.exe"
if (Test-Path $installedPath) {
    Write-Host "Engineering Olympics is already installed." -ForegroundColor Yellow
    Write-Host "Updating to new version..." -ForegroundColor Yellow
}

Write-Host "Installing Engineering Olympics..." -ForegroundColor Green
Write-Host "Installer: $InstallerPath" -ForegroundColor Gray
Write-Host "Install Path: $InstallPath" -ForegroundColor Gray
Write-Host ""

# Run silent installer
try {
    $process = Start-Process -FilePath $InstallerPath -ArgumentList "/S", "/D=$InstallPath" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✓ Installation completed successfully!" -ForegroundColor Green
        
        # Verify installation
        if (Test-Path $installedPath) {
            Write-Host "✓ Installation verified at: $installedPath" -ForegroundColor Green
            Write-Host ""
            Write-Host "Engineering Olympics has been installed successfully!" -ForegroundColor Green
            Write-Host "Users can find it in the Start Menu." -ForegroundColor Gray
        } else {
            Write-Host "⚠ Installation completed but verification failed." -ForegroundColor Yellow
            Write-Host "Please check if the app is installed manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Installation error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

