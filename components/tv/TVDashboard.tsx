import React, { useEffect, useState, useMemo } from 'react';
import { EmbyItem, EmbyLibrary } from '../../types';
import { MediaClient } from '../../services/MediaClient';
import { Play, PlayCircle, Folder, LayoutGrid, ChevronRight } from 'lucide-react';

interface TVDashboardProps {
  client: MediaClient;
  libraries: EmbyLibrary[];
  onSelectVideo: (item: EmbyItem) => void;
  onSelectLibrary: (lib: EmbyLibrary) => void;
  language: 'zh' | 'en';
}

const TVDashboard: React.FC<TVDashboardProps> = ({
  client,
  libraries,
  onSelectVideo,
  onSelectLibrary,
  language,
}) => {
  const [latestItems, setLatestItems] = useState<EmbyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    zh: {
      libs: '我的媒体库',
      added: '最近添加',
      enter: '进入浏览',
    },
    en: {
      libs: 'My Libraries',
      added: 'Recently Added',
      enter: 'Enter',
    },
  }[language];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const includeIds = libraries.map((l) => l.Id).join(',');
        const latest = await client.getVideos(
          undefined,
          null,
          'latest',
          0,
          15,
          'horizontal',
          includeIds
        );
        setLatestItems(latest.items);
      } catch (e) {
        console.error('Dashboard Load Error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [client, libraries]);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-20 pt-4 animate-in fade-in duration-1000">
      {/* 1. 我的媒体库 */}
      <section className="mb-10 animate-in slide-in-from-bottom-4 duration-700">
        <div className="px-8 mb-3">
          <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em]">{t.libs}</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-8 py-2">
          {libraries.map((lib) => {
            const coverSrc = client.getImageUrl(lib.Id, (lib as any).ImageTags?.Primary, 'Primary');
            return (
              <button
                key={lib.Id}
                tabIndex={0}
                onClick={() => onSelectLibrary(lib)}
                className="tv-focusable-card shrink-0 w-64 h-36 bg-zinc-900 rounded-[16px] overflow-hidden relative border border-white/5 outline-none group"
              >
                {coverSrc ? (
                  <>
                    <img
                      src={coverSrc}
                      className="w-full h-full object-cover transition-transform duration-1000 group-focus:scale-110"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Folder size={24} className="text-white/10" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                  <span className="font-black text-sm text-white/90 tracking-tight group-focus:text-white transition-all drop-shadow-lg">
                    {lib.Name}
                  </span>
                  <div className="opacity-0 group-focus:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase">{t.enter}</span>
                    <ChevronRight size={12} className="text-white/60" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 最近添加 */}
      <section className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="px-8 mb-3">
          <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em]">
            {t.added}
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-8 py-2">
          {latestItems.map((item) => (
            <DashboardCard
              key={item.Id}
              item={item}
              client={client}
              onClick={() => onSelectVideo(item)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

function DashboardCard({
  item,
  client,
  onClick,
}: {
  item: EmbyItem;
  client: any;
  onClick: () => void;
}) {
  const posterSrc = item.ImageTags?.Primary
    ? client.getImageUrl(item.Id, item.ImageTags.Primary, 'Primary')
    : null;
  return (
    <button
      tabIndex={0}
      onClick={onClick}
      className="tv-focusable-card shrink-0 w-28 aspect-[2/3] bg-zinc-900 rounded-[12px] overflow-hidden relative outline-none border border-white/5"
    >
      {posterSrc ? (
        <img src={posterSrc} className="w-full h-full object-cover" alt="" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[6px] text-white/20 uppercase font-black p-2 text-center">
          {item.Name}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-focus:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-focus:translate-y-0 group-focus:opacity-100 transition-all text-left">
        <p className="text-[8px] font-black line-clamp-2 leading-tight text-white drop-shadow-lg">
          {item.Name}
        </p>
      </div>
    </button>
  );
}

export default TVDashboard;
