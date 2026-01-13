// Type definitions for Electron API exposed via preload script
interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximize: (callback: () => void) => void;
  onUnmaximize: (callback: () => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}


