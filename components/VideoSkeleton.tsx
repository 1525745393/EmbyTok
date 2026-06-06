import React from 'react';

const VideoSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full bg-zinc-900 animate-pulse">
      {/* 封面图占位 */}
      <div className="absolute inset-0 bg-zinc-800" />

      {/* 信息区域骨架 */}
      <div className="absolute bottom-20 left-4 right-4 space-y-3">
        <div className="h-5 bg-zinc-700 rounded w-3/4" />
        <div className="h-4 bg-zinc-700 rounded w-1/2" />
        <div className="h-4 bg-zinc-700 rounded w-2/3 mt-2" />
      </div>

      {/* 右侧操作按钮骨架 */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-zinc-700 rounded-full" />
            <div className="w-8 h-3 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoSkeleton;
