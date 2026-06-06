import React, { useState } from 'react';
import { X, Download, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { GitHubRelease } from '../types';

interface UpdateNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  latestVersion: string;
  release: GitHubRelease;
  language: 'zh' | 'en';
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isOpen,
  onClose,
  currentVersion,
  latestVersion,
  release,
  language,
}) => {
  const [copied, setCopied] = useState(false);

  const t = {
    zh: {
      newVersion: '发现新版本',
      currentVersion: '当前版本',
      latestVersion: '最新版本',
      updateNow: '立即更新',
      later: '稍后再说',
      whatNew: '更新内容',
      download: '下载',
    },
    en: {
      newVersion: 'New Version Available',
      currentVersion: 'Current Version',
      latestVersion: 'Latest Version',
      updateNow: 'Update Now',
      later: 'Later',
      whatNew: "What's New",
      download: 'Download',
    },
  }[language];

  if (!isOpen) return null;

  const apkAsset = release.assets.find((asset) => asset.name.toLowerCase().endsWith('.apk'));

  const handleDownload = () => {
    if (apkAsset) {
      window.open(apkAsset.browser_download_url, '_blank');
    } else {
      window.open(release.html_url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t.newVersion}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {t.currentVersion}: {currentVersion} → {t.latestVersion}: {latestVersion}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
              {t.whatNew}
            </h4>
            <div className="bg-zinc-800/50 rounded-xl p-4 max-h-48 overflow-y-auto border border-zinc-700">
              <pre className="text-sm text-white whitespace-pre-wrap font-sans">{release.body}</pre>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors"
            >
              {t.later}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {apkAsset ? t.download : t.updateNow}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
