# Email Response for IT Setup

**Subject:** Re: Engineering Olympics App Setup for Monday Event

---

Hi [IT Contact Name],

Thanks for reaching out about the laptop setup! I wanted to clarify a few things about the app:

**It's not a Java application** - The app is built as an **Electron application** (a standalone .exe file), not a .jar file. This means:

✅ **No Java installation needed** - The app doesn't require Java or JRE
✅ **No Chromium installation needed** - Chromium is bundled within the executable
✅ **No additional dependencies** - The app is completely self-contained

**System Requirements:**
- Windows 10 (version 1809 or later) or Windows 11
- 64-bit architecture
- ~200MB disk space
- Internet connection (for Firebase backend)

**Installation:**
Simply run the installer (`Engineering Olympics Setup 1.0.0.exe`) on each laptop. The installer is standard Windows NSIS format and can be:
- Run manually by double-clicking
- Deployed silently via script: `Engineering Olympics Setup 1.0.0.exe /S`
- Installed to a custom directory: `Engineering Olympics Setup 1.0.0.exe /S /D=C:\Program Files\Engineering Olympics`

I've attached a beta version of the installer for your testing. The final version will be ready by end of day Wednesday.

I've also included an IT Deployment Guide (IT_DEPLOYMENT_GUIDE.md) with detailed setup instructions, system requirements, and troubleshooting information.

Let me know if you have any questions or need anything else for the setup!

Best regards,
[Your Name]

---

**Alternative shorter version:**

Hi [IT Contact Name],

Thanks for reaching out! Just to clarify - the app is an **Electron application** (.exe), not a Java .jar file, so **no Java or Chromium installation is needed**. The app is self-contained with all dependencies bundled.

**Requirements:**
- Windows 10 (1809+) or Windows 11, 64-bit
- ~200MB disk space
- Internet connection

Simply run the attached installer on each laptop. I've included a detailed IT Deployment Guide with full instructions. The final version will be ready by end of day Wednesday.

Let me know if you need anything else!

Best,
[Your Name]


