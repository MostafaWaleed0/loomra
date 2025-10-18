'use strict';
const { app, BrowserWindow, session, nativeTheme, Tray, Menu, dialog, shell, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const { DatabaseManager } = require('./electron/database-manager');
const { setupIpcHandlers } = require('./electron/ipc-handlers');
const pathManager = require('./electron/path-manager');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configure logging
log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
log.transports.console.level = isDev ? 'debug' : 'info';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

class AdvancedApp {
  constructor() {
    this.mainWindow = null;
    this.databaseManager = null;
    this.tray = null;
    this.isQuitting = false;
    this.updateCheckFile = pathManager.getUpdateCheckPath();
    this.windowState = this.loadWindowState();

    // Hardware acceleration optimization
    if (!isDev) {
      app.commandLine.appendSwitch('enable-gpu-rasterization');
      app.commandLine.appendSwitch('enable-zero-copy');
    }

    // Single instance lock
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        if (!this.mainWindow.isVisible()) this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    // Setup IPC handlers
    this.setupIpcHandlers();

    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', () => {
      this.isQuitting = true;
      this.saveWindowState();
      this.cleanup();
    });

    // Setup auto-updater
    this.setupAutoUpdater();
  }

  loadWindowState() {
    try {
      const stateFile = pathManager.getWindowStatePath();
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        return state;
      }
    } catch (error) {
      log.error('Error loading window state:', error);
    }

    return {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      x: undefined,
      y: undefined,
      isMaximized: false
    };
  }

  validateWindowState() {
    // Validate state is within current screen bounds
    try {
      const displays = screen.getAllDisplays();
      const state = this.windowState;

      const isValid = displays.some((display) => {
        const { x, y, width, height } = display.bounds;
        return state.x >= x && state.y >= y && state.x + state.width <= x + width && state.y + state.height <= y + height;
      });

      if (!isValid) {
        // Reset to defaults if window is off-screen
        this.windowState = {
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          x: undefined,
          y: undefined,
          isMaximized: false
        };
      }
    } catch (error) {
      log.error('Error validating window state:', error);
    }
  }

  saveWindowState() {
    if (!this.mainWindow) return;

    try {
      const bounds = this.mainWindow.getBounds();
      const state = {
        ...bounds,
        isMaximized: this.mainWindow.isMaximized()
      };

      const stateFile = pathManager.getWindowStatePath();
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
      log.info('Window state saved');
    } catch (error) {
      log.error('Error saving window state:', error);
    }
  }

  setupIpcHandlers() {
    // Auto-updater handlers
    ipcMain.handle('check-for-updates', async () => {
      if (isDev) {
        return { available: false, isDev: true };
      }

      try {
        const result = await autoUpdater.checkForUpdates();
        this.saveLastUpdateCheckTime();
        return { available: true, info: result };
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const isNoReleasesError =
          errorMessage.includes('404') || errorMessage.includes('No published versions') || errorMessage.includes('Cannot find');

        if (isNoReleasesError) {
          log.info('Manual update check: No releases found');
          return { available: false, noReleases: true };
        }

        log.error('Manual update check failed:', error);
        return { available: false, error: errorMessage };
      }
    });

    ipcMain.handle('download-update', () => {
      if (isDev) return { success: false, error: 'Updates not available in dev mode' };
      autoUpdater.downloadUpdate();
      return { success: true };
    });

    ipcMain.handle('install-update', () => {
      if (isDev) return { success: false, error: 'Updates not available in dev mode' };
      this.isQuitting = true;
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    });

    ipcMain.handle('get-app-version', () => app.getVersion());

    // Window control handlers
    ipcMain.handle('window-minimize', () => {
      if (this.mainWindow) this.mainWindow.minimize();
      return { success: true };
    });

    ipcMain.handle('window-maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.unmaximize();
        } else {
          this.mainWindow.maximize();
        }
      }
      return { success: true };
    });

    ipcMain.handle('window-close', () => {
      if (this.mainWindow) this.mainWindow.close();
      return { success: true };
    });

    log.info('IPC handlers registered');
  }

  getLastUpdateCheckTime() {
    try {
      if (fs.existsSync(this.updateCheckFile)) {
        const data = fs.readFileSync(this.updateCheckFile, 'utf8');
        const json = JSON.parse(data);
        return json.lastCheck || 0;
      }
    } catch (error) {
      log.error('Error reading last update check time:', error);
    }
    return 0;
  }

  saveLastUpdateCheckTime() {
    try {
      const data = JSON.stringify({ lastCheck: Date.now() });
      fs.writeFileSync(this.updateCheckFile, data, 'utf8');
    } catch (error) {
      log.error('Error saving last update check time:', error);
    }
  }

  shouldCheckForUpdates() {
    const lastCheck = this.getLastUpdateCheckTime();
    const timeSinceLastCheck = Date.now() - lastCheck;
    return timeSinceLastCheck >= UPDATE_CHECK_INTERVAL;
  }

  setupAutoUpdater() {
    if (isDev) {
      log.info('Auto-updater disabled in development mode');
      return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;

    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);

      const dialogOpts = {
        type: 'info',
        buttons: ['Download', 'Later'],
        title: 'Update Available',
        message: `Version ${info.version} is available`,
        detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download the update now?`
      };

      dialog.showMessageBox(this.mainWindow, dialogOpts).then((result) => {
        if (result.response === 0) {
          log.info('User chose to download update');
          autoUpdater.downloadUpdate();
        }
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info(`Downloaded ${progressObj.percent.toFixed(2)}%`);

      if (this.mainWindow) {
        this.mainWindow.setProgressBar(progressObj.percent / 100);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);

      if (this.mainWindow) {
        this.mainWindow.setProgressBar(-1);
      }

      const dialogOpts = {
        type: 'info',
        buttons: ['Restart Now', 'Later'],
        title: 'Update Ready',
        message: 'Update downloaded successfully',
        detail: `Version ${info.version} has been downloaded and is ready to install.\n\nThe application will restart to complete the installation.`
      };

      dialog.showMessageBox(this.mainWindow, dialogOpts).then((result) => {
        if (result.response === 0) {
          log.info('User chose to restart and install update');
          this.isQuitting = true;
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });

    autoUpdater.on('error', (error) => {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      const isNoReleasesError =
        errorMessage.includes('404') || errorMessage.includes('No published versions') || errorMessage.includes('Cannot find');

      if (isNoReleasesError) {
        log.info('No releases found - this is expected for new repositories');
        return;
      }

      log.error('Update error:', error);

      if (this.mainWindow) {
        this.mainWindow.setProgressBar(-1);
      }
    });
  }

  async onReady() {
    try {
      // Validate window state now that screen module is available
      this.validateWindowState();

      // Initialize database
      this.databaseManager = new DatabaseManager();
      await this.databaseManager.initialize();
      log.info('Database initialized successfully');

      // Setup database IPC handlers
      setupIpcHandlers(this.databaseManager);
      log.info('Database IPC handlers registered');

      // Create main window
      this.createMainWindow();

      // Create tray
      this.createTray();

      // Check for updates on startup
      if (!isDev) {
        setTimeout(() => {
          if (this.shouldCheckForUpdates()) {
            log.info('Starting automatic update check');
            autoUpdater
              .checkForUpdates()
              .then(() => this.saveLastUpdateCheckTime())
              .catch((err) => log.error('Automatic update check failed:', err));
          }
        }, 5000);
      }

      log.info('App initialized successfully');
    } catch (error) {
      log.error('Failed to initialize app:', error);
      dialog.showErrorBox('Initialization Error', `Failed to start the application: ${error.message}`);
      app.quit();
    }
  }

  createMainWindow() {
    const isDarkMode = nativeTheme.shouldUseDarkColors;

    this.mainWindow = new BrowserWindow({
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      width: this.windowState.width,
      height: this.windowState.height,
      x: this.windowState.x,
      y: this.windowState.y,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, 'electron', 'preload.js'),
        backgroundThrottling: false
      },
      icon: path.join(__dirname, 'public', 'logo.ico'),
      backgroundColor: isDarkMode ? '#18181b' : '#fafafa',
      show: false,
      frame: true,
      titleBarStyle: 'default',
      autoHideMenuBar: true
    });

    // Restore maximized state
    if (this.windowState.isMaximized) {
      this.mainWindow.maximize();
    }

    // Enhanced CSP for production
    if (!isDev) {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob: file:; " +
                "font-src 'self' data:; " +
                "connect-src 'self';"
            ]
          }
        });
      });
    }

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
      log.info('Loaded development URL');
    } else {
      const indexPath = path.join(__dirname, 'out', 'index.html');

      log.info('Loading production file from:', indexPath);
      log.info('__dirname:', __dirname);

      // Check if file exists before loading
      if (!fs.existsSync(indexPath)) {
        log.error('index.html not found at:', indexPath);

        // List contents of out directory for debugging
        const outDir = path.join(__dirname, 'out');
        if (fs.existsSync(outDir)) {
          const files = fs.readdirSync(outDir);
          log.info('Files in out directory:', files);
        } else {
          log.error('out directory does not exist at:', outDir);
        }

        dialog.showErrorBox(
          'File Not Found',
          `Cannot find index.html at: ${indexPath}\n\nPlease run 'npm run build' before packaging the app.`
        );
        app.quit();
        return;
      }

      // Use loadFile instead of loadURL for better reliability
      this.mainWindow
        .loadFile(indexPath)
        .then(() => {
          log.info('Successfully loaded index.html');
        })
        .catch((err) => {
          log.error('Failed to load index.html:', err);
          dialog.showErrorBox('Load Error', `Failed to load app: ${err.message}`);
        });
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
        log.info('Window shown');
      }
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Log console messages in dev
    if (isDev) {
      this.mainWindow.webContents.on('console-message', (event, level, message) => {
        log.info(`Console [${level}]: ${message}`);
      });
    }

    // Log load failures
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log.error('Failed to load:', errorCode, errorDescription, validatedURL);
    });

    // Log when page finishes loading
    this.mainWindow.webContents.on('did-finish-load', () => {
      log.info('Page finished loading');
    });

    // Track window state changes
    this.mainWindow.on('resize', () => {
      if (!this.mainWindow.isMaximized()) {
        this.windowState = { ...this.windowState, ...this.mainWindow.getBounds() };
      }
    });

    this.mainWindow.on('move', () => {
      if (!this.mainWindow.isMaximized()) {
        this.windowState = { ...this.windowState, ...this.mainWindow.getBounds() };
      }
    });

    this.mainWindow.on('maximize', () => {
      this.windowState.isMaximized = true;
    });

    this.mainWindow.on('unmaximize', () => {
      this.windowState.isMaximized = false;
    });

    // Handle window close (minimize to tray on Windows)
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'win32') {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      log.info('Main window closed');
    });
  }

  createTray() {
    try {
      const trayIcon = path.join(__dirname, 'public', 'logo.ico');
      this.tray = new Tray(trayIcon);

      this.updateTrayMenu();
      this.tray.setToolTip('Loomra Desktop App');

      // Click to toggle window visibility
      this.tray.on('click', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide();
          } else {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      });

      log.info('Tray created successfully');
    } catch (error) {
      log.error('Failed to create tray:', error);
    }
  }

  updateTrayMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => this.checkForUpdates(true)
      },
      {
        label: `Version ${app.getVersion()}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Reload',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.reload();
          }
        }
      },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  checkForUpdates(manual = false) {
    if (isDev) {
      if (manual) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Updates',
          message: 'Updates are not available in development mode.',
          detail: `Current version: ${app.getVersion()}`
        });
      }
      return;
    }

    log.info('Checking for updates...');

    autoUpdater
      .checkForUpdates()
      .then((result) => {
        this.saveLastUpdateCheckTime();
        if (manual && result && !result.updateInfo) {
          dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version.',
            detail: `Current version: ${app.getVersion()}`
          });
        }
      })
      .catch((error) => {
        log.error('Error checking for updates:', error);
        if (manual) {
          dialog.showMessageBox(this.mainWindow, {
            type: 'error',
            title: 'Update Check Failed',
            message: 'Failed to check for updates.',
            detail: error ? error.toString() : 'Unknown error'
          });
        }
      });
  }

  cleanup() {
    log.info('Starting cleanup...');

    // Close database connection
    if (this.databaseManager) {
      try {
        this.databaseManager.close();
        log.info('Database connection closed');
      } catch (error) {
        log.error('Error closing database:', error);
      }
    }

    // Clear cache
    if (session.defaultSession) {
      session.defaultSession.clearCache().catch((err) => {
        log.error('Error clearing cache:', err);
      });
    }

    // Destroy tray
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }

    log.info('Cleanup completed');
  }

  onWindowAllClosed() {
    // On Windows, allow app to continue running in tray
    if (process.platform !== 'win32') {
      app.quit();
    }
  }

  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    } else if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }
}

// Create app instance
new AdvancedApp();

// Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Security: Prevent navigation to external sites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (isDev) {
      // In dev mode, only allow localhost
      if (parsedUrl.origin !== 'http://localhost:3000') {
        event.preventDefault();
        log.warn('Navigation blocked in dev:', navigationUrl);
      }
    } else {
      // In production, prevent all navigation
      event.preventDefault();
      log.warn('Navigation blocked in production:', navigationUrl);
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
