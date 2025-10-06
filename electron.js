'use strict';
const { app, BrowserWindow, session, nativeTheme, Tray, Menu, dialog, shell, protocol, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const { DatabaseManager } = require('./electron/database-manager');
const { setupIpcHandlers } = require('./electron/ipc-handlers');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;

class App {
  constructor() {
    this.mainWindow = null;
    this.databaseManager = null;
    this.tray = null;
    this.isQuitting = false;

    // Single instance lock
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', () => {
      this.isQuitting = true;
      // Close database connection before quitting
      if (this.databaseManager) {
        try {
          this.databaseManager.close();
          log.info('Database connection closed');
        } catch (error) {
          log.error('Error closing database:', error);
        }
      }
    });

    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    // Skip auto-updater entirely in development
    if (isDev) {
      log.info('Auto-updater disabled in development mode');
      return;
    }

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;

    // Check for updates every 4 hours
    setInterval(() => {
      log.info('Running periodic update check');
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Periodic update check failed:', err);
      });
    }, 4 * 60 * 60 * 1000);

    // Update available
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatusToWindow('update-available', info);
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
          this.sendStatusToWindow('downloading-update');
        }
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatusToWindow('update-not-available', info);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download speed: ${(progressObj.bytesPerSecond / 1024 / 1024).toFixed(
        2
      )} MB/s - Downloaded ${progressObj.percent.toFixed(2)}% (${(progressObj.transferred / 1024 / 1024).toFixed(2)}/${(
        progressObj.total /
        1024 /
        1024
      ).toFixed(2)} MB)`;
      log.info(message);
      this.sendStatusToWindow('download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendStatusToWindow('update-downloaded', info);
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

      // Check if it's a "no releases" error (404, 403, or specific messages)
      const isNoReleasesError =
        errorMessage.includes('404') ||
        errorMessage.includes('No published versions') ||
        errorMessage.includes('Cannot find') ||
        error?.statusCode === 404 ||
        error?.statusCode === 403;

      if (isNoReleasesError) {
        log.info('No releases found on GitHub - this is expected for new repositories');
        // Don't show error dialog for "no releases" scenario
        return;
      }

      // Log actual errors
      log.error('Update error:', error);
      this.sendStatusToWindow('update-error', error);

      // Only show error dialog for actual errors
      const dialogOpts = {
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while updating',
        detail: errorMessage
      };
      dialog.showMessageBox(this.mainWindow, dialogOpts);
    });

    // IPC handlers for update
    ipcMain.handle('check-for-updates', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
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
      autoUpdater.downloadUpdate();
      return { success: true };
    });

    ipcMain.handle('install-update', () => {
      this.isQuitting = true;
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    });

    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });
  }

  sendStatusToWindow(status, data = null) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('update-status', { status, data });
    }
  }

  async onReady() {
    try {
      // Register file protocol for production
      if (!isDev) {
        protocol.registerFileProtocol('file', (request, callback) => {
          const pathname = decodeURI(request.url.replace('file:///', ''));
          callback(pathname);
        });
      }

      // Initialize database FIRST
      this.databaseManager = new DatabaseManager();
      await this.databaseManager.initialize();
      log.info('Database initialized successfully');

      // Create window
      this.createMainWindow();

      // Setup IPC handlers AFTER database and window are ready
      setupIpcHandlers(this.databaseManager, this.mainWindow);

      this.createTray();

      // Check for updates after app is ready (delay for better UX)
      if (!isDev) {
        setTimeout(() => {
          log.info('Initial update check');
          autoUpdater.checkForUpdates().catch((err) => {
            log.error('Initial update check failed:', err);
          });
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
    const isDarkMode =
      nativeTheme.shouldUseDarkColors || nativeTheme.shouldUseHighContrastColors || nativeTheme.shouldUseInvertedColorScheme;

    this.mainWindow = new BrowserWindow({
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, 'electron', 'preload.js')
      },
      icon: path.join(__dirname, 'public', 'logo.ico'),
      backgroundColor: isDarkMode ? '#18181b' : '#fafafa',
      show: false,
      titleBarStyle: 'default',
      autoHideMenuBar: true
    });

    // Set up CSP for production
    if (!isDev) {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file:; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob: file:; " +
                "font-src 'self' data:;"
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
      log.info('Loading production file:', indexPath);
      this.mainWindow.loadFile(indexPath).catch((err) => {
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

    // Log console messages for debugging
    this.mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      log.info(`Console [${level}]: ${message}`);
    });

    // Log load failures
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log.error('Failed to load:', errorCode, errorDescription, validatedURL);
    });

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      log.info('Main window closed');
    });
  }

  createTray() {
    try {
      const trayIcon = path.join(__dirname, 'public', 'logo.ico');
      this.tray = new Tray(trayIcon);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show App',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            } else {
              this.createMainWindow();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            this.checkForUpdates(true);
          }
        },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            this.isQuitting = true;
            app.quit();
          }
        }
      ]);

      this.tray.setToolTip('Loomra');
      this.tray.setContextMenu(contextMenu);

      // Restore app on tray click
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

  onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    } else if (this.mainWindow) {
      this.mainWindow.show();
    }
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
}

new App();
app.setAsDefaultProtocolClient('loomra');
