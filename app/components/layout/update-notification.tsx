'use client';

import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UpdateStatus {
  status: string;
  data?: any;
}

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [showNotification, setShowNotification] = useState(true);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    // Check if window.electronAPI exists (running in electronAPI)
    if (typeof window !== 'undefined' && window.electronAPI?.updater) {
      // Get current app version
      window.electronAPI.updater.getAppVersion().then((version: string) => {
        setCurrentVersion(version);
      });

      // Listen for update status
      const cleanupStatus = window.electronAPI.updater.onUpdateStatus((data: UpdateStatus) => {
        setUpdateStatus(data);

        if (data.status === 'update-available' || data.status === 'downloading-update' || data.status === 'update-downloaded') {
          setShowNotification(true);
        }
      });

      // Listen for download progress
      const cleanupProgress = window.electronAPI.updater.onDownloadProgress((progress: any) => {
        setDownloadProgress(Math.round(progress.percent));
      });

      // Cleanup listeners on unmount
      return () => {
        cleanupStatus();
        cleanupProgress();
      };
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (window.electronAPI?.updater) {
      const result = await window.electronAPI.updater.checkForUpdates();
      if (!result.available) {
        setUpdateStatus({ status: 'update-not-available' });
        setShowNotification(true);
      }
    }
  };

  const handleDownloadUpdate = () => {
    if (window.electronAPI?.updater) {
      window.electronAPI.updater.downloadUpdate();
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI?.updater) {
      window.electronAPI.updater.installUpdate();
    }
  };

  if (!showNotification) {
    return null;
  }

  const getNotificationContent = () => {
    switch (updateStatus?.status) {
      case 'update-available':
        return {
          icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
          title: 'Update Available',
          message: `Version ${updateStatus.data?.version} is available. Current: ${currentVersion}`,
          action: (
            <button
              onClick={handleDownloadUpdate}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Download Update
            </button>
          )
        };

      case 'downloading-update':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
          title: 'Downloading Update',
          message: `Progress: ${downloadProgress}%`,
          action: (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )
        };

      case 'update-downloaded':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: 'Update Ready',
          message: 'The update has been downloaded and is ready to install.',
          action: (
            <button
              onClick={handleInstallUpdate}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
            >
              Restart & Install
            </button>
          )
        };

      case 'update-not-available':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: 'Up to Date',
          message: `You're running the latest version (${currentVersion})`,
          action: null
        };

      case 'update-error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          title: 'Update Error',
          message: 'An error occurred while updating. Please try again later.',
          action: (
            <button
              onClick={handleCheckForUpdates}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          )
        };

      default:
        return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          {content.icon}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{content.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{content.message}</p>
            {content.action && <div className="mt-3">{content.action}</div>}
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
