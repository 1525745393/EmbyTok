

import React, { useState } from 'react';
import type { UserProfile, ServerType } from '../types';
import { ClientFactory } from '../services/clientFactory';
import { User, Plus, Trash2, Check, X, Loader2, ChevronRight, Server, UserCircle } from 'lucide-react';

interface UserSwitcherProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSwitchUser: (userId: string) => void;
  onAddUser: (profile: Omit<UserProfile, 'id' | 'lastUsed'>) => void;
  onRemoveUser: (userId: string) => void;
  onClose: () => void;
  language?: 'zh' | 'en';
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(timestamp: number, language: 'zh' | 'en'): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return language === 'zh' ? `${days}天前` : `${days}d ago`;
  }
  if (hours > 0) {
    return language === 'zh' ? `${hours}小时前` : `${hours}h ago`;
  }
  if (minutes > 0) {
    return language === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
  }
  return language === 'zh' ? '刚刚' : 'Just now';
}

/**
 * 获取服务器类型颜色
 */
function getServerTypeColors(type: ServerType): { left: string; right: string } {
  return type === 'emby'
    ? { left: '#25F4EE', right: '#6366F1' }
    : { left: '#FF9500', right: '#FE2C55' };
}

/**
 * 用户头像组件
 */
function UserAvatar({ user, size = 48 }: { user: UserProfile; size?: number }) {
  const colors = getServerTypeColors(user.serverType);
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors.left}, ${colors.right})`
      }}
    >
      {user.username[0]?.toUpperCase() || 'U'}
    </div>
  );
}

/**
 * 用户切换组件
 */
const UserSwitcher: React.FC<UserSwitcherProps> = ({
  users,
  currentUser,
  onSwitchUser,
  onAddUser,
  onRemoveUser,
  onClose,
  language = 'zh'
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [serverType, setServerType] = useState<ServerType>('emby');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = {
    zh: {
      title: '切换账户',
      addNew: '添加账户',
      noUsers: '暂无账户',
      lastUsed: '上次使用',
      switch: '切换',
      delete: '删除',
      cancel: '取消',
      confirmDelete: '确定要删除这个账户吗？',
      deleteWarning: '删除后该账户的观看历史和收藏记录也将被删除',
      serverAddress: '服务器地址',
      password: '密码',
      connecting: '正在连接...',
      addSuccess: '添加成功',
      connectFailed: '连接失败，请检查账号密码'
    },
    en: {
      title: 'Switch Account',
      addNew: 'Add Account',
      noUsers: 'No Accounts',
      lastUsed: 'Last used',
      switch: 'Switch',
      delete: 'Delete',
      cancel: 'Cancel',
      confirmDelete: 'Are you sure you want to delete this account?',
      deleteWarning: 'Watch history and favorites will also be deleted',
      serverAddress: 'Server Address',
      password: 'Password',
      connecting: 'Connecting...',
      addSuccess: 'Added successfully',
      connectFailed: 'Connection failed, please check credentials'
    }
  }[language];

  const handleAddUser = async () => {
    if (!serverUrl.trim() || !username.trim()) return;

    setLoading(true);
    setError('');

    let formattedUrl = serverUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `http://${formattedUrl}`;
    }

    try {
      const config = await ClientFactory.authenticate(serverType, formattedUrl, username, password);

      onAddUser({
        name: config.username,
        serverUrl: config.url,
        username: config.username,
        token: config.token,
        serverType: serverType
      });

      setShowAddForm(false);
      setServerUrl('');
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(t.connectFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeletingId(userId);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onRemoveUser(deletingId);
      setDeletingId(null);
    }
  };

  // 添加用户表单
  if (showAddForm) {
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        {/* 头部 */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h2 className="text-white font-bold text-lg">{t.addNew}</h2>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 服务器类型选择 */}
          <div className="flex bg-black/60 rounded-xl p-1 border border-white/10">
            {(['emby', 'plex'] as ServerType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setServerType(type)}
                className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${
                  serverType === type ? 'bg-indigo-600 text-white' : 'text-zinc-500'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* 服务器地址 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t.serverAddress}
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 用户名 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs py-2">{error}</div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-zinc-800 space-y-3">
          <button
            onClick={handleAddUser}
            disabled={loading || !serverUrl.trim() || !username.trim()}
            className="w-full bg-indigo-600 text-white text-sm font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.addNew}
          </button>
        </div>
      </div>
    );
  }

  // 删除确认弹窗
  if (deletingId) {
    const userToDelete = users.find(u => u.id === deletingId);
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">{t.confirmDelete}</h3>
            {userToDelete && (
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <UserAvatar user={userToDelete} size={24} />
                <span>{userToDelete.username}</span>
              </div>
            )}
            <p className="text-xs text-zinc-500">{t.deleteWarning}</p>
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800 flex gap-3">
          <button
            onClick={() => setDeletingId(null)}
            className="flex-1 py-3 bg-zinc-800 text-white text-sm font-bold rounded-xl"
          >
            {t.cancel}
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-xl"
          >
            {t.delete}
          </button>
        </div>
      </div>
    );
  }

  // 用户列表
  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* 头部 */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">{t.title}</h2>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 用户列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <UserCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">{t.noUsers}</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`relative group rounded-xl border transition-all ${
                currentUser?.id === user.id
                  ? 'bg-indigo-600/20 border-indigo-500/50'
                  : 'bg-zinc-800/50 border-white/5 hover:bg-zinc-800'
              }`}
            >
              <div className="p-4 flex items-center gap-3">
                <UserAvatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{user.name}</span>
                    {currentUser?.id === user.id && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 truncate flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    <span>{user.serverUrl}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {t.lastUsed}: {formatRelativeTime(user.lastUsed, language)}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1">
                  {currentUser?.id !== user.id && (
                    <button
                      onClick={() => onSwitchUser(user.id)}
                      className="p-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors"
                    >
                      {t.switch}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加用户按钮 */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.addNew}
        </button>
      </div>
    </div>
  );
};

export default UserSwitcher;
