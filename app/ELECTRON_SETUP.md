# Electron App Setup Guide

This guide will help you set up and build your Engineering Olympics app as an Electron executable.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation Steps

1. **Install Dependencies**

   Navigate to the `app` directory and install all dependencies:
   ```bash
   cd app
   npm install
   ```

   This will install:
   - Electron
   - electron-builder (for creating executables)
   - cross-env (for cross-platform environment variables)
   - All existing React/Vite dependencies

## Development

### Running in Development Mode

To run the app in development mode with hot-reload:

1. **Terminal 1** - Start the Vite dev server:
   ```bash
   npm run dev
   ```

2. **Terminal 2** - Start Electron:
   ```bash
   npm run electron:dev
   ```

The Electron window will open and connect to the Vite dev server running on `http://localhost:3000`.

## Building Executables

### Build for Windows

To create a Windows executable (.exe installer):
```bash
npm run electron:build:win
```

This creates both:
- **Installer version** (`Engineering Olympics Setup X.X.X.exe`) - Standard Windows installer
- **Portable version** (`Engineering Olympics X.X.X.exe`) - Standalone executable, no installation needed

The executables will be created in the `app/release` directory.

To build only the portable version:
```bash
npm run electron:build:win:portable
```

### Build for macOS

To create a macOS app (.dmg):
```bash
npm run electron:build:mac
```

### Build for Linux

To create a Linux executable (AppImage or .deb):
```bash
npm run electron:build:linux
```

### Build for All Platforms

To build for the current platform:
```bash
npm run electron:build
```

## Project Structure

```
app/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script (security bridge)
├── src/                 # React application source
├── dist/                # Built React app (created after `npm run build`)
└── release/             # Built executables (created after `npm run electron:build`)
```

## Configuration

### App Icons

To add custom app icons, place them in a `build` directory:
- Windows: `build/icon.ico`
- macOS: `build/icon.icns`
- Linux: `build/icon.png`

If icons are not provided, Electron will use default icons.

### Build Configuration

The build configuration is in `package.json` under the `"build"` section. You can customize:
- App ID
- Product name
- Output directory
- Installer options
- Platform-specific settings

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Make sure you've run `npm install` in the `app` directory
   - Ensure all dependencies are installed

2. **Electron window shows blank page**
   - Make sure the Vite dev server is running (`npm run dev`)
   - Check that port 3000 is not blocked

3. **Build fails**
   - Ensure you've built the React app first: `npm run build`
   - Check that all files in the `dist` directory are present

4. **Windows-specific issues**
   - If you get errors about environment variables, make sure `cross-env` is installed
   - Some Windows systems may require running PowerShell as Administrator for builds

## Security Notes

- The app uses `contextIsolation: true` and `nodeIntegration: false` for security
- The preload script (`electron/preload.js`) is the secure bridge between the renderer and main process
- If you need to expose Node.js APIs to your React app, do it through the preload script

## Next Steps

1. Add app icons to the `build` directory (optional but recommended)
2. Customize the app metadata in `package.json`
3. Test the app in development mode
4. Build and test the executable on your target platform

