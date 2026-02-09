
import React, { useState, useEffect } from 'react';
import { EmbyLibrary, OrientationMode } from '../types';
import { X, Folder, Settings, LogOut, Eye, EyeOff, ChevronLeft, Server, User, Info, ExternalLink, Monitor, Globe } from 'lucide-react';

interface LibrarySelectProps {
  libraries: EmbyLibrary[];
  onSelect: (lib: EmbyLibrary | null) => void;
  selectedId: string | null;
  onClose: () => void;
  isOpen: boolean;
  hiddenLibIds: Set<string>;
  onToggleHidden: (libId: string) => void;
  onLogout: () => void;
  serverUrl: string;
  username: string;
  orientationMode: OrientationMode;
  onOrientationChange: (mode: OrientationMode) => void;
  onToggleMode?: () => void;
  // 新增：语言支持
  language: 'zh' | 'en';
  onToggleLanguage: () => void;
}

type MenuMode = 'list' | 'settings' | 'about';

const LibrarySelect: React.FC<LibrarySelectProps> = ({ 
    libraries, onSelect, selectedId, onClose, isOpen,
    hiddenLibIds, onToggleHidden, onLogout, serverUrl, username,
    orientationMode, onOrientationChange, onToggleMode,
    language, onToggleLanguage
}) => {
  const [mode, setMode] = useState<MenuMode>('list');

  useEffect(() => { if (!isOpen) setTimeout(() => setMode('list'), 300); }, [isOpen]);

  const t = {
      zh: {
          title: '媒体库', settings: '设置', about: '关于', all: '所有媒体',
          display: '显示偏好', vertical: '竖屏', horizontal: '横屏', both: '全部',
          account: '当前账户', logout: '退出当前登录', visibility: '媒体库可见性',
          language: '界面语言', langName: '简体中文',
          tvMode: '切换到电视模式', tvDesc: '体验专为遥控器设计的布局',
          version: '版本 1.2.0'
      },
      en: {
          title: 'Libraries', settings: 'Settings', about: 'About', all: 'All Media',
          display: 'Content Filter', vertical: 'Vertical', horizontal: 'Horizontal', both: 'Both',
          account: 'Account', logout: 'Logout', visibility: 'Library Visibility',
          language: 'Language', langName: 'English',
          tvMode: 'Switch to TV Mode', tvDesc: 'Layout optimized for remote control',
          version: 'V 1.2.0'
      }
  }[language];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
      <div className="w-3/4 max-w-sm h-full bg-zinc-900 border-r border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 overflow-hidden">
        
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 z-10">
          {mode === 'list' ? (
              <h2 className="text-white font-bold text-xl">{t.title}</h2>
          ) : (
              <div className="flex items-center gap-2">
                  <button onClick={() => setMode('list')} className="p-1 -ml-2 text-zinc-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
                  <h2 className="text-white font-bold text-xl">{mode === 'settings' ? t.settings : t.about}</h2>
              </div>
          )}
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="w-6 h-6" /></button>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700`}>
          
          {mode === 'list' && (
              <>
                <button onClick={() => { onSelect(null); onClose(); }} className={`w-full text-left p-4 rounded-xl mb-2 flex items-center gap-3 transition-colors ${selectedId === null ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                    <Folder className="w-5 h-5 shrink-0" /><span>{t.all}</span>
                </button>
                {libraries.filter(lib => !hiddenLibIds.has(lib.Id)).map((lib) => (
                    <button key={lib.Id} onClick={() => { onSelect(lib); onClose(); }} className={`w-full text-left p-4 rounded-xl mb-2 flex items-center gap-3 transition-colors ${selectedId === lib.Id ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Folder className="w-5 h-5 shrink-0" /><span className="truncate">{lib.Name}</span>
                    </button>
                ))}
              </>
          )}

          {mode === 'settings' && (
              <div className="space-y-6 p-2">
                  {/* 模式切换 */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.display}</h3>
                      <button onClick={onToggleMode} className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Monitor className="w-5 h-5 text-indigo-400" />
                              <div className="text-left">
                                  <div className="text-sm font-bold text-white">{t.tvMode}</div>
                                  <div className="text-[10px] text-zinc-500">{t.tvDesc}</div>
                              </div>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-zinc-600 rotate-180" />
                      </button>
                  </div>

                  {/* 语言切换 */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.language}</h3>
                      <button onClick={onToggleLanguage} className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5 text-indigo-400" />
                              <div className="text-sm font-bold text-white">{t.langName}</div>
                          </div>
                          <div className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-zinc-400 font-bold uppercase">Toggle</div>
                      </button>
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.display}</h3>
                      <div className="bg-zinc-800 rounded-xl p-1 flex">
                           {['vertical', 'horizontal', 'both'].map((m) => (
                             <button key={m} onClick={() => onOrientationChange(m as OrientationMode)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${orientationMode === m ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}>
                               {t[m as keyof typeof t]}
                             </button>
                           ))}
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.visibility}</h3>
                      <div className="space-y-1">
                          {libraries.map((lib) => {
                              const isHidden = hiddenLibIds.has(lib.Id);
                              return (
                                  <div key={lib.Id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                                      <div className="flex items-center gap-3 text-zinc-200 overflow-hidden">
                                          <Folder className={`w-4 h-4 shrink-0 ${isHidden ? 'text-zinc-600' : 'text-indigo-400'}`} />
                                          <span className={`text-sm truncate ${isHidden ? 'text-zinc-500 line-through opacity-50' : 'font-medium'}`}>{lib.Name}</span>
                                      </div>
                                      <button onClick={() => onToggleHidden(lib.Id)} className={`p-2 rounded-lg ${isHidden ? 'bg-zinc-800 text-zinc-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.account}</h3>
                      <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                          <div className="text-xs text-zinc-400 truncate">{serverUrl}</div>
                          <div className="text-sm font-bold text-white truncate">{username}</div>
                          <button onClick={onLogout} className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold">{t.logout}</button>
                      </div>
                  </div>
              </div>
          )}
        </div>

        {mode === 'list' && (
            <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex gap-2">
                <button onClick={() => setMode('settings')} className="flex-1 flex items-center justify-center gap-2 p-3 text-zinc-400 bg-zinc-800/50 rounded-xl transition-colors"><Settings className="w-5 h-5" /><span className="font-bold text-sm">{t.settings}</span></button>
                <button onClick={() => setMode('about')} className="flex items-center justify-center w-14 p-3 text-zinc-400 bg-zinc-800/50 rounded-xl transition-colors"><Info className="w-5 h-5" /></button>
            </div>
        )}
      </div>
       <div className="flex-grow h-full" onClick={onClose}></div>
    </div>
  );
};

export default LibrarySelect;
