import React, { useRef } from 'react';
import { ServerConfig, EmbyLibrary, OrientationMode } from '../../types';
import {
  User,
  Library,
  Monitor,
  Info,
  Globe,
  Smartphone,
  Square,
  LogOut,
  EyeOff,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface TVSettingsProps {
  config: ServerConfig;
  libraries: EmbyLibrary[];
  hiddenLibIds: Set<string>;
  onToggleHidden: (id: string) => void;
  orientationMode: OrientationMode;
  onOrientationChange: (mode: OrientationMode) => void;
  language: 'zh' | 'en';
  onToggleLanguage: () => void;
  onToggleMode: () => void;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  version: string;
}

const TVSettings: React.FC<TVSettingsProps> = ({
  config,
  libraries,
  hiddenLibIds,
  onToggleHidden,
  orientationMode,
  onOrientationChange,
  language,
  onToggleLanguage,
  onToggleMode,
  onLogout,
  activeTab,
  onTabChange,
  version,
}) => {
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabFocus = (tab: string) => {
    if (switchTimer.current) clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(() => {
      onTabChange(tab);
    }, 200); // 200ms 防抖
  };

  const t = {
    zh: {
      account: '账户',
      libs: '媒体库',
      display: '显示',
      about: '关于',
      logout: '退出登录',
      lang: '界面语言',
      switch: '标准模式',
    },
    en: {
      account: 'Account',
      libs: 'Libraries',
      display: 'Display',
      about: 'About',
      logout: 'Logout',
      lang: 'Language',
      switch: 'Standard',
    },
  }[language];

  return (
    <div className="absolute inset-0 flex animate-in fade-in duration-300 z-40 bg-black settings-panel h-full">
      {/* 1. 左侧精致 Tab 栏 */}
      <div className="w-40 sm:w-48 lg:w-56 bg-white/5 p-4 sm:p-6 space-y-2 border-r border-white/5 settings-tabs h-full shrink-0">
        <h2 className="text-xs sm:text-sm font-black mb-4 sm:mb-6 opacity-20 uppercase tracking-widest px-2">
          Settings
        </h2>
        <TabButton
          label={t.account}
          active={activeTab === 'account'}
          onFocus={() => handleTabFocus('account')}
          icon={<User size={14} />}
        />
        <TabButton
          label={t.libs}
          active={activeTab === 'libraries'}
          onFocus={() => handleTabFocus('libraries')}
          icon={<Library size={14} />}
        />
        <TabButton
          label={t.display}
          active={activeTab === 'display'}
          onFocus={() => handleTabFocus('display')}
          icon={<Monitor size={14} />}
        />
        <TabButton
          label={t.about}
          active={activeTab === 'about'}
          onFocus={() => handleTabFocus('about')}
          icon={<Info size={14} />}
        />
      </div>

      {/* 2. 右侧精致内容区 */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar settings-content h-full bg-gradient-to-br from-zinc-900/10 to-transparent">
        {activeTab === 'account' && (
          <div className="space-y-4 sm:space-y-6 max-w-md sm:max-w-lg animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-lg sm:text-xl font-black opacity-40 uppercase tracking-widest">
              {t.account}
            </h3>
            <div className="bg-zinc-900/80 p-4 sm:p-6 rounded-xl sm:rounded-[24px] border border-white/5 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-lg sm:text-xl font-black">
                  {config.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-white">{config.username}</div>
                  <div className="text-[10px] text-white/20 font-mono">{config.url}</div>
                </div>
              </div>
              <button
                tabIndex={0}
                onClick={onLogout}
                className="w-full p-2 sm:p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg sm:rounded-xl font-bold text-xs transition-all outline-none focus:ring-2 focus:ring-red-500"
              >
                {t.logout}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'libraries' && (
          <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-4 duration-500">
            <h3 className="text-lg sm:text-xl font-black opacity-40 uppercase tracking-widest">
              {t.libs}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-w-md sm:max-w-2xl">
              {libraries.map((lib) => {
                const isHidden = hiddenLibIds.has(lib.Id);
                return (
                  <button
                    key={lib.Id}
                    tabIndex={0}
                    onClick={() => onToggleHidden(lib.Id)}
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-2xl border transition-all flex items-center justify-between outline-none focus:ring-2 focus:ring-white ${isHidden ? 'bg-zinc-900 border-white/5 opacity-30' : 'bg-white/5 border-white/5'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold text-white">
                      <Library
                        size={14}
                        className={isHidden ? 'text-zinc-600' : 'text-indigo-400'}
                      />
                      <span className="truncate max-w-[100px] sm:max-w-[120px]">{lib.Name}</span>
                    </div>
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-4 duration-500 max-w-md sm:max-w-lg">
            <h3 className="text-lg sm:text-xl font-black opacity-40 uppercase tracking-widest">
              {t.lang}
            </h3>
            <button
              tabIndex={0}
              onClick={onToggleLanguage}
              className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-lg sm:rounded-xl text-left transition-all outline-none focus:ring-2 focus:ring-white flex items-center justify-between group"
            >
              <div className="text-sm font-bold text-white">
                {language === 'zh' ? '当前：简体中文' : 'Current: English'}
              </div>
              <Globe size={18} className="text-indigo-400 sm:w-4 sm:h-4" />
            </button>

            <h3 className="text-lg sm:text-xl font-black opacity-40 uppercase tracking-widest pt-3 sm:pt-4">
              {t.display}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <FilterCard
                label="竖屏"
                active={orientationMode === 'vertical'}
                onClick={() => onOrientationChange('vertical')}
                icon={<Smartphone size={14} />}
              />
              <FilterCard
                label="横屏"
                active={orientationMode === 'horizontal'}
                onClick={() => onOrientationChange('horizontal')}
                icon={<Monitor size={14} />}
              />
              <FilterCard
                label="全部"
                active={orientationMode === 'both'}
                onClick={() => onOrientationChange('both')}
                icon={<Square size={14} />}
              />
            </div>
            <button
              tabIndex={0}
              onClick={onToggleMode}
              className="p-3 sm:p-4 bg-zinc-900 border border-white/5 rounded-lg sm:rounded-xl text-left transition-all outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between group shadow-lg text-white mt-3 sm:mt-4"
            >
              <div className="text-sm font-bold">{t.switch}</div>
              <Monitor size={18} className="text-indigo-500 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-4 duration-500 max-w-md sm:max-w-lg">
            <div className="bg-gradient-to-br from-indigo-600/10 to-transparent p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-3xl border border-white/5 text-white">
              <div className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tighter">
                EmbyTok <span className="text-indigo-400 font-mono text-xs">TV</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed mb-4 sm:mb-6">
                极致的大屏媒体体验。为智能电视与大尺寸显示器进行深度像素优化。
              </p>
              <div className="flex gap-2 sm:gap-3">
                <div className="bg-white/5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] font-black border border-white/5 uppercase tracking-widest">
                  V {version}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function TabButton({
  label,
  active,
  onFocus,
  icon,
}: {
  label: string;
  active: boolean;
  onFocus: () => void;
  icon: any;
}) {
  return (
    <button
      tabIndex={0}
      onFocus={onFocus}
      className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all outline-none focus:ring-2 focus:ring-white focus:bg-white focus:text-black focus:scale-105
                ${active ? 'bg-white/10 text-white font-black' : 'text-white/30 hover:bg-white/5 text-xs sm:text-sm'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
function FilterCard({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: any;
}) {
  return (
    <button
      tabIndex={0}
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all text-left outline-none focus:ring-2 focus:ring-white ${active ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/5 border-white/5 text-white opacity-40'}`}
    >
      <div className={`mb-1 sm:mb-2 ${active ? 'text-black' : 'text-indigo-400'}`}>{icon}</div>
      <div className="text-xs font-black">{label}</div>
    </button>
  );
}

export default TVSettings;
