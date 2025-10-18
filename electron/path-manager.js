'use strict';

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

class PathManager {
  constructor() {
    this._userDataPath = null;
    this._devDataPath = null;
  }

  /**
   * Get the user data directory path
   * @returns {string} User data directory path
   */
  getUserDataPath() {
    if (!this._userDataPath) {
      if (isDev) {
        // In development, use a separate 'dev-data' folder
        this._userDataPath = this.getDevDataPath();
      } else {
        // In production, use the standard userData path
        this._userDataPath = app.getPath('userData');
      }
    }
    return this._userDataPath;
  }

  /**
   * Get the development data directory path
   * @returns {string} Development data directory path
   */
  getDevDataPath() {
    if (!this._devDataPath) {
      // Use 'dev' folder in the standard userData path
      const baseUserDataPath = app.getPath('userData');
      this._devDataPath = path.join(baseUserDataPath, 'dev-data');

      // Ensure the directory exists
      if (!fs.existsSync(this._devDataPath)) {
        fs.mkdirSync(this._devDataPath, { recursive: true });
        console.log('Created development data directory at:', this._devDataPath);
      }
    }
    return this._devDataPath;
  }

  /**
   * Get path to user configuration file
   * @returns {string} Path to user-config.json
   */
  getUserConfigPath() {
    return path.join(this.getUserDataPath(), 'user-config.json');
  }

  /**
   * Get path to database file
   * @returns {string} Path to goals-tracker.db
   */
  getDatabasePath() {
    return path.join(this.getUserDataPath(), 'goals-tracker.db');
  }

  /**
   * Get path to last update check file
   * @returns {string} Path to last-update-check.json
   */
  getUpdateCheckPath() {
    return path.join(this.getUserDataPath(), 'last-update-check.json');
  }

  /**
   * Get a custom file path in user data directory
   * @param {string} filename - File name
   * @returns {string} Full path to file
   */
  getFilePath(filename) {
    return path.join(this.getUserDataPath(), filename);
  }

  /**
   * Get path to window state file.
   * @returns {string} Path to window-state.json.
   */
  getWindowStatePath() {
    return path.join(this.getUserDataPath(), 'window-state.json');
  }
}

// Export singleton instance
module.exports = new PathManager();
