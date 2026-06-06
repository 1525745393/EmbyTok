import { useCallback, useMemo } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import type { UserProfile, MultiUserConfig, ServerConfig, ServerType } from '../../types';

const MULTI_USER_CONFIG_KEY = 'embytok_multi_user_config';

/**
 * 生成用户独立的 localStorage 命名空间
 */
export function getUserStorageKey(userId: string, baseKey: string): string {
  return `embytok_${userId}_${baseKey}`;
}

/**
 * 多用户管理 Hook
 */
export function useMultiUser() {
  const [config, setConfig] = useLocalStorageState<MultiUserConfig>(MULTI_USER_CONFIG_KEY, {
    users: [],
    currentUserId: null
  });

  // 获取当前用户
  const currentUser = useMemo(() => {
    if (!config.currentUserId) return null;
    return config.users.find(u => u.id === config.currentUserId) || null;
  }, [config.users, config.currentUserId]);

  // 添加用户
  const addUser = useCallback((profile: Omit<UserProfile, 'id' | 'lastUsed'>) => {
    const newUser: UserProfile = {
      ...profile,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      lastUsed: Date.now()
    };

    setConfig(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newUser.id
    }));

    return newUser;
  }, [setConfig]);

  // 删除用户
  const removeUser = useCallback((userId: string) => {
    setConfig(prev => {
      const newUsers = prev.users.filter(u => u.id !== userId);
      let newCurrentUserId = prev.currentUserId;

      // 如果删除的是当前用户，切换到另一个用户
      if (prev.currentUserId === userId) {
        newCurrentUserId = newUsers.length > 0 ? newUsers[0].id : null;
      }

      return {
        users: newUsers,
        currentUserId: newCurrentUserId
      };
    });
  }, [setConfig]);

  // 切换用户
  const switchUser = useCallback((userId: string) => {
    setConfig(prev => ({
      ...prev,
      currentUserId: userId
    }));
  }, [setConfig]);

  // 更新用户最后使用时间
  const updateLastUsed = useCallback((userId: string) => {
    setConfig(prev => ({
      ...prev,
      users: prev.users.map(u =>
        u.id === userId ? { ...u, lastUsed: Date.now() } : u
      )
    }));
  }, [setConfig]);

  // 获取用户配置（转换为 ServerConfig 格式）
  const getUserConfig = useCallback((userId: string): ServerConfig | null => {
    const user = config.users.find(u => u.id === userId);
    if (!user) return null;

    return {
      url: user.serverUrl,
      username: user.username,
      token: user.token,
      userId: user.id,
      serverType: user.serverType
    };
  }, [config.users]);

  // 获取当前用户的配置
  const getCurrentUserConfig = useCallback((): ServerConfig | null => {
    if (!currentUser) return null;
    return getUserConfig(currentUser.id);
  }, [currentUser, getUserConfig]);

  // 获取所有用户（按最后使用时间排序）
  const users = useMemo(() => {
    return [...config.users].sort((a, b) => b.lastUsed - a.lastUsed);
  }, [config.users]);

  // 检查是否已登录（有任何用户）
  const isLoggedIn = config.users.length > 0 && config.currentUserId !== null;

  return {
    users,
    currentUser,
    addUser,
    removeUser,
    switchUser,
    updateLastUsed,
    getUserConfig,
    getCurrentUserConfig,
    getUserStorageKey: (userId: string, baseKey: string) => getUserStorageKey(userId, baseKey),
    isLoggedIn
  };
}
