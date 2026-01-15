# IT Deployment Guide

This guide explains the different deployment options for distributing the Engineering Olympics app to multiple laptops.

## Deployment Options

### Option 1: Portable Executable (Simplest - No Installation)

**Best for:** Quick deployment, no admin rights needed, no registry changes

**How it works:**
- Single `.exe` file that runs without installation
- Users can copy it to any location and run it
- No Windows registry entries or system changes

**Build command:**
```bash
npm run electron:build:win:portable
```

**Output:** `Engineering Olympics X.X.X.exe` in the `release` folder

**Deployment:**
1. Copy the `.exe` file to each laptop (USB drive, network share, etc.)
2. Users double-click to run - no installation needed
3. Can be placed anywhere (Desktop, Program Files, USB drive, etc.)

**Pros:**
- ✅ No installation required
- ✅ No admin rights needed
- ✅ Works from USB drives
- ✅ Easy to update (just replace the file)
- ✅ No system changes

**Cons:**
- ❌ No Start Menu shortcuts (can be created manually)
- ❌ No automatic updates
- ❌ Not registered with Windows (won't appear in "Add/Remove Programs")

---

### Option 2: Silent Installer (Automated Installation)

**Best for:** Proper installation with automation via scripts or Group Policy

**How it works:**
- Standard Windows installer (NSIS)
- Can be run silently from command line or scripts
- Creates Start Menu shortcuts and proper Windows integration

**Build command:**
```bash
npm run electron:build:win
```

**Output:** `Engineering Olympics Setup X.X.X.exe` in the `release` folder

**Silent Installation Command:**
```powershell
# Run as Administrator
.\"Engineering Olympics Setup X.X.X.exe" /S
```

**Deployment Methods:**

#### A. PowerShell Script (for IT to run on each laptop):
```powershell
# deploy.ps1
$installerPath = "\\server\share\Engineering Olympics Setup X.X.X.exe"
Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -Verb RunAs
```

#### B. Batch Script:
```batch
@echo off
"Engineering Olympics Setup X.X.X.exe" /S
```

#### C. Group Policy (Enterprise):
1. Create a Group Policy Object (GPO)
2. Navigate to: Computer Configuration → Policies → Software Settings → Software Installation
3. Add the `.exe` installer
4. Set deployment method to "Assigned"
5. The installer will run silently on all computers in the OU

**Pros:**
- ✅ Proper Windows integration
- ✅ Start Menu shortcuts created automatically
- ✅ Appears in "Add/Remove Programs"
- ✅ Can be automated via scripts
- ✅ Works with enterprise deployment tools

**Cons:**
- ❌ Requires admin rights
- ❌ More complex deployment
- ❌ Creates system changes

---

### Option 3: MSI Installer (Enterprise Deployment)

**Best for:** Large-scale enterprise deployment via SCCM, Group Policy, or Intune

**Note:** Requires additional electron-builder configuration. Currently not configured, but can be added if needed.

---

## Recommended Approach for IT

### For Quick Deployment (10-50 laptops):
**Use Portable Executable**
1. Build: `npm run electron:build:win:portable`
2. Copy the `.exe` to a network share or USB drive
3. Have users copy it to their Desktop or a shared location
4. Create a shortcut if needed

### For Proper Installation (50+ laptops, managed environment):
**Use Silent Installer**
1. Build: `npm run electron:build:win`
2. Place installer on network share
3. Deploy via:
   - PowerShell script (run on each laptop)
   - Group Policy (automated)
   - Remote deployment tool (PDQ, SCCM, etc.)

**Example PowerShell deployment script:**
```powershell
# Silent install script
$installer = "\\fileserver\apps\Engineering Olympics Setup X.X.X.exe"
$logFile = "$env:TEMP\engineering-olympics-install.log"

Write-Host "Installing Engineering Olympics..." -ForegroundColor Green
Start-Process -FilePath $installer -ArgumentList "/S" -Wait -Verb RunAs

if (Test-Path "C:\Program Files\Engineering Olympics\Engineering Olympics.exe") {
    Write-Host "Installation successful!" -ForegroundColor Green
} else {
    Write-Host "Installation may have failed. Check $logFile" -ForegroundColor Yellow
}
```

---

## Silent Installer Parameters

The NSIS installer supports these silent parameters:

- `/S` - Silent installation (no UI)
- `/D=<path>` - Custom installation directory (default: `C:\Program Files\Engineering Olympics`)
- `/NCRC` - Skip CRC check (faster, less secure)

**Example with custom directory:**
```powershell
.\"Engineering Olympics Setup X.X.X.exe" /S /D=C:\Apps\EngineeringOlympics
```

---

## Updating the App

### Portable Version:
- Simply replace the old `.exe` with the new one
- Users can continue using the old version until they get the update

### Installed Version:
- Build new installer
- Run silent installer again (it will update automatically)
- Or use uninstaller first: `"C:\Program Files\Engineering Olympics\uninstall.exe" /S`

---

## Troubleshooting

### Silent Installer Not Working
- Ensure running as Administrator
- Check Windows Event Viewer for errors
- Try running with `/NCRC` flag to skip CRC check

### Portable Version Won't Run
- Check if Windows Defender or antivirus is blocking it
- Ensure file isn't marked as "blocked" (right-click → Properties → Unblock)
- Check Windows Firewall settings

### Installation Fails
- Ensure sufficient disk space (app is ~100-200MB)
- Check user has admin rights
- Verify installer file isn't corrupted

---

## Build Output Location

All built files are in: `app/release/`

After building, you'll find:
- `Engineering Olympics Setup X.X.X.exe` - Installer version
- `Engineering Olympics X.X.X.exe` - Portable version

---

## Questions?

For IT support, provide:
1. Which deployment method you prefer
2. Number of laptops
3. Whether you have admin access/Group Policy
4. Preferred deployment method (manual, script, or automated)

