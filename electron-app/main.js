const { app, BrowserWindow, shell, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');
const os = require('os');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let localServer;
let serverPort;

// LAN WiFi Registry & States
const activeInstances = new Map();
const pendingSyncs = new Map();

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// ── Local HTTP server ────────────────────────────────────────────────────────
// Serves the Vite build over http://127.0.0.1:<random-port>
// Firebase Auth always allows 127.0.0.1, resolving auth/unauthorized-domain.
// ─────────────────────────────────────────────────────────────────────────────
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimes = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.eot':  'application/vnd.ms-fontobject',
    '.webp': 'image/webp',
  };
  return mimes[ext] || 'application/octet-stream';
}

function startLocalServer() {
  return new Promise((resolve) => {
    const webDir = path.join(__dirname, 'web');

    localServer = http.createServer((req, res) => {
      // Decode and sanitize the request path
      let reqPath = url.parse(req.url).pathname;

      // ── API Endpoints for LAN CrossSync ─────────────────────────────────────
      if (reqPath.startsWith('/api/sync/')) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });

        if (req.method === 'OPTIONS') {
          res.end();
          return;
        }

        const parsedUrl = url.parse(req.url, true);
        const endpoint = reqPath.replace('/api/sync/', '');

        if (endpoint === 'status') {
          res.end(JSON.stringify({
            status: 'online',
            port: serverPort,
            localIPs: getLocalIPs()
          }));
          return;
        }

        if (endpoint === 'register') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const { instanceId, isScanning, name, habits, tasks, profile, deviceType } = data;
                if (instanceId) {
                  if (isScanning) {
                    activeInstances.set(instanceId, {
                      id: instanceId,
                      name: name || 'Peer Sanctuary',
                      isScanning: true,
                      habits: habits || [],
                      tasks: tasks || [],
                      profile: profile || {},
                      deviceType: deviceType || 'Desktop',
                      lastSeen: Date.now()
                    });
                  } else {
                    activeInstances.delete(instanceId);
                  }
                }
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (endpoint === 'peers') {
          const requesterId = parsedUrl.query.exclude;
          const peers = [];
          const now = Date.now();
          for (const [id, inst] of activeInstances.entries()) {
            if (now - inst.lastSeen > 15000) {
              activeInstances.delete(id);
            } else if (id !== requesterId && inst.isScanning) {
              peers.push({
                id: inst.id,
                name: inst.name,
                type: inst.deviceType,
                iconName: inst.deviceType === 'Desktop' ? 'dashboard' : 'mind',
                synced: false,
                mockData: {
                  habits: inst.habits,
                  tasks: inst.tasks,
                  profile: inst.profile
                }
              });
            }
          }
          res.end(JSON.stringify({ peers }));
          return;
        }

        if (endpoint === 'push') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const { targetId, senderId, habits, tasks, profile, overwrite } = data;
                if (targetId) {
                  pendingSyncs.set(targetId, {
                    senderId,
                    habits,
                    tasks,
                    profile,
                    overwrite: !!overwrite
                  });
                }
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (endpoint === 'poll') {
          const instanceId = parsedUrl.query.instanceId;
          if (instanceId && pendingSyncs.has(instanceId)) {
            const syncData = pendingSyncs.get(instanceId);
            pendingSyncs.delete(instanceId);
            res.end(JSON.stringify({ pending: true, data: syncData }));
          } else {
            res.end(JSON.stringify({ pending: false }));
          }
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      // Prevent directory traversal
      reqPath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');

      let filePath = path.join(webDir, reqPath);

      // Serve index.html for root or missing files (SPA fallback)
      if (reqPath === '/' || reqPath === '' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(webDir, 'index.html');
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': getMimeType(filePath),
          // Allow Firebase auth popup to use window.closed — disable strict COOP
          'Cross-Origin-Opener-Policy': 'unsafe-none',
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        res.end(data);
      });
    });

    const preferredPort = 18280;

    const tryListen = (port) => {
      localServer.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Habitor] Port ${port} is in use, trying port ${port + 1}...`);
          tryListen(port + 1);
        } else {
          console.error(`[Habitor] Server error: ${err.message}. Falling back to random port.`);
          // Other error, fallback to random port
          localServer.listen(0, '0.0.0.0', () => {
            serverPort = localServer.address().port;
            console.log(`[Habitor] Local server fallback running at http://localhost:${serverPort}`);
            resolve(serverPort);
          });
        }
      });

      localServer.listen(port, '0.0.0.0', () => {
        serverPort = port;
        console.log(`[Habitor] Local server running at http://localhost:${serverPort}`);
        resolve(serverPort);
      });
    };

    tryListen(preferredPort);
  });
}

// ── Window creation ──────────────────────────────────────────────────────────
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: 'Habitor',
    backgroundColor: '#0B0F19',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0B0F19',
      symbolColor: '#F3F4F6',
      height: 35,
    },
    autoHideMenuBar: true,
  });

  // ✅ Load via http://localhost — treated as a Secure Context by Chromium!
  mainWindow.loadURL(`http://localhost:${port}`);

  // Allow F12 or Ctrl+Shift+I to open developer tools in the packaged app for diagnostics
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    }
  });

  // Show window once fully ready — prevents white/black flash on startup
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Allow Firebase / Google OAuth popups to open as child windows inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    if (
      popupUrl.includes('__/auth/') ||
      popupUrl.includes('firebaseapp.com') ||
      popupUrl.includes('accounts.google.com') ||
      popupUrl.includes('google.com/o/oauth2/')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 650,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }
    // All other external links open in the system browser
    shell.openExternal(popupUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Intercept headers from all responses to disable strict COOP/COEP.
  // This is required so that the main window (running on localhost) can read `popup.closed` 
  // on cross-origin Google OAuth popups (which otherwise return strict same-origin COOP).
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    for (const key of Object.keys(responseHeaders)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'cross-origin-opener-policy' || lowerKey === 'cross-origin-embedder-policy') {
        delete responseHeaders[key];
      }
    }
    callback({ responseHeaders });
  });

  const port = await startLocalServer();
  createWindow(port);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(port);
    }
  });
});

app.on('window-all-closed', () => {
  // Shut down the local server when all windows are closed
  if (localServer) localServer.close();
  if (process.platform !== 'darwin') app.quit();
});

// ── Security: prevent main window from navigating away ───────────────────────
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    // Only restrict the main app window — auth popups must navigate freely
    if (mainWindow && contents === mainWindow.webContents) {
      const parsedUrl = new URL(navigationUrl);
      // Allow navigation within our local server only
      if (parsedUrl.hostname !== '127.0.0.1' && parsedUrl.hostname !== 'localhost') {
        event.preventDefault();
      }
    }
  });
});

// ── Dynamic title bar theme sync ─────────────────────────────────────────────
ipcMain.on('change-theme', (event, theme) => {
  if (!mainWindow) return;
  const isDark = theme === 'dark';
  try {
    mainWindow.setTitleBarOverlay({
      color: isDark ? '#0B0F19' : '#ECEEF4',
      symbolColor: isDark ? '#F3F4F6' : '#1C1E22',
      height: 35,
    });
  } catch (e) {
    console.error('Failed to set title bar overlay:', e);
  }
});

// ── LAN Sync Local IP / Port handlers ──────────────────────────────────────
ipcMain.handle('get-local-ips', () => {
  return getLocalIPs();
});

ipcMain.handle('get-server-port', () => {
  return serverPort;
});
