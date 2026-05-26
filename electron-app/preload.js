const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
  changeTheme: (theme) => ipcRenderer.send('change-theme', theme),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
});
