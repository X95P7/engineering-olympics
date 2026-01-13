# IT Deployment Guide - Engineering Olympics App

## Important: No Additional Software Required

**The Electron app is completely self-contained.** It includes Chromium and Node.js bundled within the executable. **IT does NOT need to install Chromium, Node.js, or any other dependencies.**

## System Requirements

### Windows Laptops
- **Operating System:** Windows 10 (version 1809 or later) or Windows 11
- **Architecture:** 64-bit (x64) only
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** ~150-200MB for installation
- **Network:** Internet connection required (for Firebase backend)

### Installation Options

You will receive one of the following:

1. **Installer Version (Recommended for IT deployment)**
   - File: `Engineering Olympics Setup X.X.X.exe`
   - Type: NSIS installer
   - Installation: Standard Windows installer with custom installation directory option
   - Location: Can be installed to Program Files or user directory

2. **Portable Version (Alternative)**
   - File: `Engineering Olympics X.X.X.exe` (portable)
   - Type: Standalone executable
   - Installation: No installation needed - just run the .exe
   - Location: Can be placed anywhere (USB drive, network share, etc.)

## Deployment Instructions

### Option 1: Using the Installer (Recommended)

1. **Distribute the installer file** (`Engineering Olympics Setup X.X.X.exe`) to target laptops
2. **Run the installer** (may require administrator rights)
3. **Follow the installation wizard:**
   - Choose installation directory (default: `C:\Program Files\Engineering Olympics`)
   - Complete installation
4. **Launch the app** from Start Menu or desktop shortcut
5. **No additional configuration needed**

### Option 2: Using Portable Version

1. **Copy the portable .exe file** to desired location (e.g., `C:\Program Files\Engineering Olympics\` or network share)
2. **Create a shortcut** to the .exe file (optional, for convenience)
3. **Run the executable** - no installation required
4. **No additional configuration needed**

## Silent Installation (For IT Automation)

If you need to deploy via Group Policy, SCCM, or other IT management tools:

```powershell
# Silent installation command
Engineering Olympics Setup X.X.X.exe /S

# Silent installation to specific directory
Engineering Olympics Setup X.X.X.exe /S /D=C:\Program Files\Engineering Olympics
```

## Network Requirements

- **Outbound HTTPS connections** to Firebase servers
- **Ports:** Standard HTTPS (443)
- **Firewall:** May need to allow the app through Windows Firewall if strict policies are in place

## Security Considerations

- The app does NOT require administrator privileges to run (only to install)
- The app does NOT modify system settings or registry
- The app uses standard Electron security practices (context isolation, no node integration)
- No antivirus exclusions needed (standard Electron app)

## Troubleshooting

### App Won't Start
- Check Windows version compatibility (Windows 10 1809+)
- Verify the laptop is 64-bit architecture
- Check Windows Event Viewer for error details

### Network/Firebase Connection Issues
- Verify internet connectivity
- Check firewall rules allow outbound HTTPS
- Test Firebase connectivity: `https://firebase.google.com`

### Installation Fails
- Ensure administrator rights for installer version
- Check available disk space (200MB minimum)
- Verify the installer file is not corrupted (re-download if needed)

## File Locations

### Installer Version
- **Installation:** `C:\Program Files\Engineering Olympics\` (default)
- **User Data:** `%APPDATA%\Engineering Olympics\`
- **Shortcuts:** Start Menu and Desktop

### Portable Version
- **Application:** Wherever you place the .exe file
- **User Data:** `%APPDATA%\Engineering Olympics\`

## Uninstallation

### Installer Version
- Use Windows "Add or Remove Programs" (Settings > Apps)
- Or run: `C:\Program Files\Engineering Olympics\Uninstall Engineering Olympics.exe`

### Portable Version
- Simply delete the .exe file
- Optionally delete user data: `%APPDATA%\Engineering Olympics\`

## Support Contact

For technical issues during deployment, contact:
[Your contact information here]

## Version Information

- **App Version:** 1.0.0
- **Electron Version:** 28.0.0
- **Build Date:** [Will be included in build]

---

## Quick Checklist for IT

- [ ] Verify Windows 10 (1809+) or Windows 11
- [ ] Verify 64-bit architecture
- [ ] Distribute installer or portable .exe
- [ ] Install/place application
- [ ] Test launch
- [ ] Verify internet connectivity
- [ ] Create shortcuts (if needed)
- [ ] **No additional software installation required!**


