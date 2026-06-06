import { useState, useCallback } from 'react';
import { GitHubRelease, UpdateCheckResult } from '../../types';

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.9.3';
const GITHUB_REPO_OWNER = '1525745393';
const GITHUB_REPO_NAME = 'embytok';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

export function useUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [checkError, setCheckError] = useState<string | null>(null);

  const parseVersion = (version: string): number[] => {
    const cleanVersion = version.replace(/^v/i, '');
    return cleanVersion.split('.').map(Number);
  };

  const isVersionNewer = (current: string, latest: string): boolean => {
    const currentParts = parseVersion(current);
    const latestParts = parseVersion(latest);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  };

  const checkForUpdates = useCallback(async (): Promise<UpdateCheckResult> => {
    setIsChecking(true);
    setCheckError(null);

    try {
      const response = await fetch(GITHUB_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const release: GitHubRelease = await response.json();
      const latestVersion = release.tag_name;
      const hasUpdate = isVersionNewer(CURRENT_VERSION, latestVersion);

      setLastCheckTime(Date.now());

      return {
        hasUpdate,
        latestVersion,
        release,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setCheckError(errorMsg);
      console.error('Check for updates failed:', error);
      return {
        hasUpdate: false,
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    currentVersion: CURRENT_VERSION,
    isChecking,
    lastCheckTime,
    checkError,
    checkForUpdates,
  };
}
