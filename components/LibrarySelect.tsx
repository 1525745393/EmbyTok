import React, { useState, useEffect } from 'react';
import { EmbyLibrary, OrientationMode } from '../types';
import { Translations } from '../src/locales';
import { X, Folder, Settings, Eye, EyeOff, ChevronLeft, Info, ExternalLink, Monitor, Globe } from 'lucide-react';

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
  t: Translations;
  toggleLanguage: () => void;
  language: 'zh' | 'en';
  // 新增：版本号
  version: string;
}

type MenuMode = 'list' | 'settings' | 'about' | 'sponsor';

const LibrarySelect: React.FC<LibrarySelectProps> = ({ 
    libraries, onSelect, selectedId, onClose, isOpen,
    hiddenLibIds, onToggleHidden, onLogout, serverUrl, username,
    orientationMode, onOrientationChange, onToggleMode,
    t, toggleLanguage, language,
    version
}) => {
  const [mode, setMode] = useState<MenuMode>('list');

  useEffect(() => { if (!isOpen) setTimeout(() => setMode('list'), 300); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
      <div className="w-3/4 max-w-sm h-full bg-zinc-900 border-r border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 overflow-hidden">
        
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 z-10">
          {mode === 'list' ? (
              <h2 className="text-white font-bold text-xl">{t.librarySelect.title}</h2>
          ) : (
              <div className="flex items-center gap-2">
                  <button onClick={() => setMode(mode === 'sponsor' ? 'about' : 'list')} className="p-1 -ml-2 text-zinc-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
                  <h2 className="text-white font-bold text-xl">{mode === 'settings' ? t.librarySelect.settings : mode === 'sponsor' ? t.librarySelect.sponsorPage : t.librarySelect.about}</h2>
              </div>
          )}
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="w-6 h-6" /></button>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700`}>
          
          {mode === 'list' && (
              <>
                <button onClick={() => { onSelect(null); onClose(); }} className={`w-full text-left p-4 rounded-xl mb-2 flex items-center gap-3 transition-colors ${selectedId === null ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                    <Folder className="w-5 h-5 shrink-0" /><span>{t.librarySelect.all}</span>
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
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.librarySelect.display}</h3>
                      <button onClick={onToggleMode} className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Monitor className="w-5 h-5 text-indigo-400" />
                              <div className="text-left">
                                  <div className="text-sm font-bold text-white">{t.librarySelect.tvMode}</div>
                                  <div className="text-[10px] text-zinc-500">{t.librarySelect.tvDesc}</div>
                              </div>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-zinc-600 rotate-180" />
                      </button>
                  </div>

                  {/* 语言切换 */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.librarySelect.language}</h3>
                      <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5 text-indigo-400" />
                              <div className="text-sm font-bold text-white">{t.librarySelect.langName}</div>
                          </div>
                          <div className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-zinc-400 font-bold uppercase">Toggle</div>
                      </button>
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.librarySelect.display}</h3>
                      <div className="bg-zinc-800 rounded-xl p-1 flex">
                           {['vertical', 'horizontal', 'both'].map((m) => (
                             <button key={m} onClick={() => onOrientationChange(m as OrientationMode)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${orientationMode === m ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}>
                               {m === 'vertical' ? t.librarySelect.vertical : m === 'horizontal' ? t.librarySelect.horizontal : t.librarySelect.both}
                             </button>
                           ))}
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.librarySelect.visibility}</h3>
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
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">{t.librarySelect.account}</h3>
                      <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                          <div className="text-xs text-zinc-400 truncate">{serverUrl}</div>
                          <div className="text-sm font-bold text-white truncate">{username}</div>
                          <button onClick={onLogout} className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold">{t.librarySelect.logout}</button>
                      </div>
                  </div>
              </div>
          )}

          {mode === 'about' && (
              <div className="space-y-6 p-4">
                  <div className="bg-gradient-to-br from-indigo-600/10 to-transparent p-6 rounded-2xl border border-white/5">
                      <div className="text-xl font-black text-white mb-2 tracking-tighter">EmbyTok</div>
                      <div className="text-sm font-bold text-indigo-400 mb-4">{t.librarySelect.version(version)}</div>
                      <p className="text-xs text-white/70 leading-relaxed mb-6">{t.librarySelect.aboutDesc}</p>
                      <div className="flex gap-2 flex-wrap mb-6">
                          <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black border border-white/5 uppercase tracking-widest">React 18</div>
                          <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black border border-white/5 uppercase tracking-widest">TypeScript</div>
                          <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black border border-white/5 uppercase tracking-widest">Vite</div>
                      </div>
                      <a href="https://gitee.com/miguyomi/embytok" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                          <span>{t.librarySelect.projectLink}</span>
                      </a>
                      <button onClick={() => setMode('sponsor')} className="flex items-center gap-2 text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors mt-4">
                          <ExternalLink className="w-4 h-4" />
                          <span>{t.librarySelect.sponsor}</span>
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">特色功能</h3>
                      <div className="space-y-2">
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature1}</div>
                           </div>
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature2}</div>
                           </div>
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature3}</div>
                           </div>
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature4}</div>
                           </div>
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature5}</div>
                           </div>
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature6}</div>
                           </div>
                           <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                               <div className="text-indigo-400 font-bold text-sm mt-0.5">•</div>
                               <div className="text-sm text-white">{t.librarySelect.feature7}</div>
                           </div>
                       </div>
                  </div>
              </div>
          )}

          {mode === 'sponsor' && (
              <div className="space-y-6 p-4">
                  <div className="bg-gradient-to-br from-indigo-600/10 to-transparent p-6 rounded-2xl border border-white/5">
                      <div className="text-xl font-black text-white mb-2 tracking-tighter">{t.librarySelect.sponsorPage}</div>
                      <p className="text-xs text-white/70 leading-relaxed mb-6">{t.librarySelect.sponsorText}</p>
                      <div className="text-xs text-white/70 leading-relaxed mb-6">
                          <p>{t.librarySelect.sponsorPoint1}</p>
                          <p>{t.librarySelect.sponsorPoint2}</p>
                          <p>{t.librarySelect.sponsorPoint3}</p>
                      </div>
                      <p className="text-xs text-indigo-400 leading-relaxed mb-6">{t.librarySelect.sponsorThanks}</p>
                  </div>
                  
                  <div className="space-y-6">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">选择你的赞助方式</h3>
                      
                      <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                          <h4 className="text-sm font-bold text-white mb-3">支付宝</h4>
                          <div className="flex justify-center mb-3">
                              <img src="tmp/alipay.jpg" alt="支付宝付款码" className="max-w-full h-auto rounded-lg" />
                          </div>
                          <p className="text-xs text-white/70 text-center">扫描二维码进行赞助</p>
                      </div>
                      
                      <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                          <h4 className="text-sm font-bold text-white mb-3">微信支付</h4>
                          <div className="flex justify-center mb-3">
                              <img src="tmp/wechat.jpg" alt="微信付款码" className="max-w-full h-auto rounded-lg" />
                          </div>
                          <p className="text-xs text-white/70 text-center">扫描二维码进行赞助</p>
                      </div>
                  </div>
                  
                  <button onClick={() => setMode('about')} className="w-full py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-bold text-sm transition-colors hover:bg-indigo-600/20">
                      {t.librarySelect.back}
                  </button>
              </div>
          )}
        </div>

        {mode === 'list' && (
            <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex gap-2">
                <button onClick={() => setMode('settings')} className="flex-1 flex items-center justify-center gap-2 p-3 text-zinc-400 bg-zinc-800/50 rounded-xl transition-colors"><Settings className="w-5 h-5" /><span className="font-bold text-sm">{t.librarySelect.settings}</span></button>
                <button onClick={() => setMode('about')} className="flex items-center justify-center w-14 p-3 text-zinc-400 bg-zinc-800/50 rounded-xl transition-colors"><Info className="w-5 h-5" /></button>
            </div>
        )}
      </div>
       <div className="flex-grow h-full" onClick={onClose}></div>
    </div>
  );
};

export default LibrarySelect;
