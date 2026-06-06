import React, { useState, useCallback } from 'react';
import { WatchHistoryItem, EmbyItem } from '../types';
import { MediaClient } from '../services/MediaClient';
import { Trash2, X, Play, Clock, History } from 'lucide-react';
import { useTranslation } from '../src/hooks';

interface WatchHistoryViewProps {
  history: WatchHistoryItem[];
  client: MediaClient | null;
  onSelectVideo: (itemId: string, positionTicks: number) => void;
  onRemoveFromHistory: (itemId: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

const WatchHistoryView: React.FC<WatchHistoryViewProps> = ({
  history,
  client,
  onSelectVideo,
  onRemoveFromHistory,
  onClearHistory,
  onClose,
}) => {
  const { t } = useTranslation();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemDetails, setItemDetails] = useState<Map<string, EmbyItem>>(new Map());

  const formatWatchedDate = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (hours < 1) {
        return t.watchHistory?.watched || '刚刚观看';
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else if (days < 7) {
        return `${days}天前`;
      } else {
        return date.toLocaleDateString();
      }
    },
    [t]
  );

  const formatProgress = useCallback((current: number, total: number) => {
    if (total === 0) return '0%';
    const percentage = Math.round((current / total) * 100);
    return `${percentage}%`;
  }, []);

  if (history.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-center p-8">
          <History className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {t.watchHistory?.noHistory || '暂无观看历史'}
          </h3>
          <p className="text-zinc-500">开始观看视频后，记录将显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">{t.watchHistory?.title || '观看历史'}</h2>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
        >
          {t.watchHistory?.clearHistory || '清空历史'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 rounded-xl overflow-hidden group hover:bg-zinc-800 transition-colors"
            >
              <div
                className="relative aspect-video cursor-pointer"
                onClick={() => onSelectVideo(item.itemId, item.positionTicks)}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Play className="w-12 h-12 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center">
                    <Play className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: formatProgress(item.positionTicks, item.totalTicks) }}
                  />
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-white font-medium text-sm truncate flex-1 mr-2">
                    {item.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromHistory(item.itemId);
                    }}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-zinc-500 text-xs">{formatWatchedDate(item.watchedAt)}</span>
                  <span className="text-zinc-600 text-xs">•</span>
                  <span className="text-zinc-500 text-xs">
                    {t.watchHistory?.continue || '继续观看'}{' '}
                    {formatProgress(item.positionTicks, item.totalTicks)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showClearConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">
              {t.watchHistory?.clearHistory || '清空历史'}
            </h3>
            <p className="text-zinc-400 mb-6">
              {t.watchHistory?.clearConfirm || '确定要清空所有观看历史吗？此操作无法撤销。'}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                {t.watchHistory?.cancel || '取消'}
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.watchHistory?.clear || '清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(WatchHistoryView);
