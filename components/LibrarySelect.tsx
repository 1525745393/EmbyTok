import React, { useState, useEffect } from 'react';
import { EmbyLibrary, OrientationMode, GitHubRelease } from '../types';
import {
  X,
  Folder,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  ChevronLeft,
  Server,
  User,
  Info,
  ExternalLink,
  Monitor,
  Globe,
  Download,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Zap,
  Infinity,
  Heart,
  Tv,
  Star,
  Code2,
  ShieldCheck,
  FileText,
  Users,
  Shield,
  FileCode,
  Terminal,
  ExternalLink as ExternalLinkIcon,
  Smile,
} from 'lucide-react';

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
  // 新增：版本号
  version: string;
  // 新增：检查更新
  onCheckUpdates?: () => void;
  isCheckingUpdates?: boolean;
  updateCheckResult?: { hasUpdate: boolean; latestVersion?: string; release?: GitHubRelease };
  onShowUpdateDialog?: () => void;
}

type MenuMode = 'list' | 'settings' | 'about' | 'sponsor';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-2 min-h-[80px]">
    <div className="text-indigo-400">{icon}</div>
    <span className="text-xs text-white/80 leading-tight line-clamp-2">{title}</span>
  </div>
);

const LibrarySelect: React.FC<LibrarySelectProps> = ({
  libraries,
  onSelect,
  selectedId,
  onClose,
  isOpen,
  hiddenLibIds,
  onToggleHidden,
  onLogout,
  serverUrl,
  username,
  orientationMode,
  onOrientationChange,
  onToggleMode,
  language,
  onToggleLanguage,
  version,
  onCheckUpdates,
  isCheckingUpdates,
  updateCheckResult,
  onShowUpdateDialog,
}) => {
  const [mode, setMode] = useState<MenuMode>('list');

  useEffect(() => {
    if (!isOpen) setTimeout(() => setMode('list'), 300);
  }, [isOpen]);

  const t = {
    zh: {
      title: '媒体库',
      settings: '设置',
      about: '关于',
      all: '所有媒体',
      display: '显示偏好',
      vertical: '竖屏',
      horizontal: '横屏',
      both: '全部',
      account: '当前账户',
      logout: '退出当前登录',
      visibility: '媒体库可见性',
      language: '界面语言',
      langName: '简体中文',
      tvMode: '切换到电视模式',
      tvDesc: '体验专为遥控器设计的布局',
      version: `版本 ${version}`,
      sponsor: '欢迎赞助',
      sponsorPage: '赞助支持',
      sponsorText:
        '如果你觉得这个项目对你有帮助，不妨请开发者喝杯咖啡吧！你的支持将帮助项目持续改进和维护，让更多人享受到更好的 Emby 浏览体验。',
      sponsorThanks: '感谢你的支持！每一分钱都将用于项目的发展和维护。',
      back: '返回',
      aboutDesc:
        '为 Emby 媒体服务器设计的竖屏视频浏览客户端，提供类似 TikTok 的体验，让用户能够以更现代、便捷的方式浏览个人媒体库。',
      feature1: 'TikTok 式竖屏视频浏览体验',
      feature2: '多视图切换（流视图/网格视图）',
      feature3: '无限连播 + 纯净模式',
      feature4: '智能方向适配（垂直/水平）',
      feature5: '增强手势控制与 2 倍速播放',
      feature6: '电视模式，专为遥控器设计的布局',
      feature7: '电视APK下载（Gitee发行版）',
      sponsorPoint1: '💰 一杯咖啡 = 开发者的动力',
      sponsorPoint2: '🚀 你的支持 = 项目的未来',
      sponsorPoint3: '🎉 每一分钱都值得感谢',
      checkUpdates: '检查更新',
      checkingUpdates: '正在检查更新...',
      updateAvailable: '有新版本',
      noUpdate: '已是最新版本',
      checkFailed: '检查失败',
    },
    en: {
      title: 'Libraries',
      settings: 'Settings',
      about: 'About',
      all: 'All Media',
      display: 'Content Filter',
      vertical: 'Vertical',
      horizontal: 'Horizontal',
      both: 'Both',
      account: 'Account',
      logout: 'Logout',
      visibility: 'Library Visibility',
      language: 'Language',
      langName: 'English',
      tvMode: 'Switch to TV Mode',
      tvDesc: 'Layout optimized for remote control',
      version: `V ${version}`,
      sponsor: 'Support Us',
      sponsorPage: 'Sponsorship',
      sponsorText:
        'If you find this project helpful, consider buying the developer a coffee! Your support will help the project continue to improve and maintain, allowing more people to enjoy a better Emby browsing experience.',
      sponsorThanks:
        'Thank you for your support! Every contribution will be used for the development and maintenance of the project.',
      back: 'Back',
      aboutDesc:
        'A vertical video browsing client designed for Emby media server, providing a TikTok-like experience that allows users to browse their personal library in a more modern and convenient way.',
      feature1: 'TikTok-style vertical video browsing experience',
      feature2: 'Multi-view switching (feed view/grid view)',
      feature3: 'Infinite playback + pure mode',
      feature4: 'Smart orientation adaptation (vertical/horizontal)',
      feature5: 'Enhanced gesture control and 2x speed playback',
      feature6: 'TV mode, layout designed for remote control',
      feature7: 'TV APK download (Gitee release)',
      sponsorPoint1: '💰 A cup of coffee = Developer motivation',
      sponsorPoint2: '🚀 Your support = Project future',
      sponsorPoint3: '🎉 Every contribution is appreciated',
      checkUpdates: 'Check for Updates',
      checkingUpdates: 'Checking for updates...',
      updateAvailable: 'Update Available',
      noUpdate: 'You are up to date',
      checkFailed: 'Check failed',
    },
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
              <button
                onClick={() => setMode(mode === 'sponsor' ? 'about' : 'list')}
                className="p-1 -ml-2 text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white font-bold text-xl">
                {mode === 'settings' ? t.settings : mode === 'sponsor' ? t.sponsorPage : t.about}
              </h2>
            </div>
          )}
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700`}>
          {mode === 'list' && (
            <>
              <button
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl mb-2 flex items-center gap-3 transition-colors ${selectedId === null ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
              >
                <Folder className="w-5 h-5 shrink-0" />
                <span>{t.all}</span>
              </button>
              {libraries
                .filter((lib) => !hiddenLibIds.has(lib.Id))
                .map((lib) => (
                  <button
                    key={lib.Id}
                    onClick={() => {
                      onSelect(lib);
                      onClose();
                    }}
                    className={`w-full text-left p-4 rounded-xl mb-2 flex items-center gap-3 transition-colors ${selectedId === lib.Id ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
                  >
                    <Folder className="w-5 h-5 shrink-0" />
                    <span className="truncate">{lib.Name}</span>
                  </button>
                ))}
            </>
          )}

          {mode === 'settings' && (
            <div className="space-y-6 p-2">
              {/* 模式切换 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
                  {t.display}
                </h3>
                <button
                  onClick={onToggleMode}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-white/5"
                >
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
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
                  {t.language}
                </h3>
                <button
                  onClick={onToggleLanguage}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    <div className="text-sm font-bold text-white">{t.langName}</div>
                  </div>
                  <div className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-zinc-400 font-bold uppercase">
                    Toggle
                  </div>
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
                  {t.display}
                </h3>
                <div className="bg-zinc-800 rounded-xl p-1 flex">
                  {['vertical', 'horizontal', 'both'].map((m) => (
                    <button
                      key={m}
                      onClick={() => onOrientationChange(m as OrientationMode)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${orientationMode === m ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
                    >
                      {t[m as keyof typeof t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
                  {t.visibility}
                </h3>
                <div className="space-y-1">
                  {libraries.map((lib) => {
                    const isHidden = hiddenLibIds.has(lib.Id);
                    return (
                      <div
                        key={lib.Id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-3 text-zinc-200 overflow-hidden">
                          <Folder
                            className={`w-4 h-4 shrink-0 ${isHidden ? 'text-zinc-600' : 'text-indigo-400'}`}
                          />
                          <span
                            className={`text-sm truncate ${isHidden ? 'text-zinc-500 line-through opacity-50' : 'font-medium'}`}
                          >
                            {lib.Name}
                          </span>
                        </div>
                        <button
                          onClick={() => onToggleHidden(lib.Id)}
                          className={`p-2 rounded-lg ${isHidden ? 'bg-zinc-800 text-zinc-500' : 'bg-indigo-500/10 text-indigo-400'}`}
                        >
                          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
                  {t.account}
                </h3>
                <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs text-zinc-400 truncate">{serverUrl}</div>
                  <div className="text-sm font-bold text-white truncate">{username}</div>
                  <button
                    onClick={onLogout}
                    className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold"
                  >
                    {t.logout}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'about' && (
            <div className="space-y-5 p-4">
              {/* App Header with Logo */}
              <div className="bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-black text-white tracking-tighter">EmbyTok</div>
                    <div className="text-sm font-bold text-indigo-300 mb-2">{t.version}</div>
                  </div>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-5">{t.aboutDesc}</p>
              </div>

              {/* Tech Stack & Quick Actions */}
              <div className="space-y-4">
                {/* Tech Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className="bg-white/5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/5 uppercase tracking-widest text-white/70 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" /> React 18
                  </div>
                  <div className="bg-white/5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/5 uppercase tracking-widest text-white/70 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" /> TypeScript
                  </div>
                  <div className="bg-white/5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/5 uppercase tracking-widest text-white/70 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Vite
                  </div>
                </div>

                {/* Copy Version & Check Updates */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Extract clean version number
                      const cleanVersion = version.replace(/^V? ?/g, '');
                      navigator.clipboard
                        .writeText(cleanVersion)
                        .then(() => {
                          alert(language === 'zh' ? '已复制！' : 'Copied!');
                        })
                        .catch(() => {
                          // Fallback for browsers that don't support clipboard API
                          console.error('Failed to copy');
                        });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    {language === 'zh' ? '复制版本号' : 'Copy Version'}
                  </button>
                  <button
                    onClick={onCheckUpdates}
                    disabled={isCheckingUpdates}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm transition-all ${
                      isCheckingUpdates
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : updateCheckResult?.hasUpdate
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isCheckingUpdates ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>{t.checkingUpdates}</span>
                      </>
                    ) : updateCheckResult?.hasUpdate ? (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{t.updateAvailable}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.checkUpdates}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Update Status */}
                {updateCheckResult && !isCheckingUpdates && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      updateCheckResult.hasUpdate
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}
                  >
                    {updateCheckResult.hasUpdate ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {language === 'zh' ? '新版本' : 'New Version'}:{' '}
                          {updateCheckResult.latestVersion}
                        </span>
                        <button
                          onClick={onShowUpdateDialog}
                          className="underline hover:text-orange-300"
                        >
                          {language === 'zh' ? '查看' : 'View'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.noUpdate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {language === 'zh' ? '功能特性' : 'Features'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FeatureCard icon={<Smartphone className="w-4 h-4" />} title={t.feature1} />
                  <FeatureCard icon={<Zap className="w-4 h-4" />} title={t.feature2} />
                  <FeatureCard icon={<Infinity className="w-4 h-4" />} title={t.feature3} />
                  <FeatureCard icon={<Smartphone className="w-4 h-4" />} title={t.feature4} />
                  <FeatureCard icon={<Heart className="w-4 h-4" />} title={t.feature5} />
                  <FeatureCard icon={<Tv className="w-4 h-4" />} title={t.feature6} />
                  <FeatureCard icon={<Download className="w-4 h-4" />} title={t.feature7} />
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLinkIcon className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {language === 'zh' ? '相关链接' : 'Links'}
                  </h3>
                </div>
                <div className="space-y-2">
                  <a
                    href="https://github.com/1525745393/embytok"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5 text-white hover:bg-zinc-700/50 transition-all"
                  >
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">GitHub</div>
                      <div className="text-xs text-zinc-400">
                        {language === 'zh' ? '给项目点 Star' : 'Star the project'}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                  </a>
                  <button
                    onClick={() => setMode('sponsor')}
                    className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-white/5 text-white hover:bg-zinc-700/50 transition-all"
                  >
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{t.sponsor}</div>
                      <div className="text-xs text-zinc-400">
                        {language === 'zh' ? '支持项目发展' : 'Support development'}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Footer Info */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {language === 'zh' ? '开源项目 · 享受自由' : 'Open Source · Enjoy Freedom'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-600 text-center">
                  <p>
                    {language === 'zh'
                      ? '特别感谢所有贡献者'
                      : 'Special thanks to all contributors'}
                  </p>
                  <p className="mt-1">EmbyTok © 2024</p>
                </div>
              </div>
            </div>
          )}

          {mode === 'sponsor' && (
            <div className="space-y-6 p-4">
              <div className="bg-gradient-to-br from-indigo-600/10 to-transparent p-6 rounded-2xl border border-white/5">
                <div className="text-xl font-black text-white mb-2 tracking-tighter">
                  {t.sponsorPage}
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-6">{t.sponsorText}</p>
                <div className="text-xs text-white/70 leading-relaxed mb-6">
                  <p>{t.sponsorPoint1}</p>
                  <p>{t.sponsorPoint2}</p>
                  <p>{t.sponsorPoint3}</p>
                </div>
                <p className="text-xs text-indigo-400 leading-relaxed mb-6">{t.sponsorThanks}</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  选择你的赞助方式
                </h3>

                <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                  <h4 className="text-sm font-bold text-white mb-3">支付宝</h4>
                  <div className="flex justify-center mb-3">
                    <img
                      src="tmp/alipay.jpg"
                      alt="支付宝付款码"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-white/70 text-center">扫描二维码进行赞助</p>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                  <h4 className="text-sm font-bold text-white mb-3">微信支付</h4>
                  <div className="flex justify-center mb-3">
                    <img
                      src="tmp/wechat.jpg"
                      alt="微信付款码"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-white/70 text-center">扫描二维码进行赞助</p>
                </div>
              </div>

              <button
                onClick={() => setMode('about')}
                className="w-full py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-bold text-sm transition-colors hover:bg-indigo-600/20"
              >
                {t.back}
              </button>
            </div>
          )}
        </div>

        {mode === 'list' && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex gap-2">
            <button
              onClick={() => setMode('settings')}
              className="flex-1 flex items-center justify-center gap-2 p-3 text-zinc-400 bg-zinc-800/50 rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="font-bold text-sm">{t.settings}</span>
            </button>
            <button
              onClick={() => setMode('about')}
              className="flex items-center justify-center w-14 p-3 text-zinc-400 bg-zinc-800/50 rounded-xl transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex-grow h-full" onClick={onClose}></div>
    </div>
  );
};

export default LibrarySelect;
