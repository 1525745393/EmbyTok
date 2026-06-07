/**
 * 设备检测工具
 */

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
};

export const isLandscape = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * 设备 ID 管理工具
 * 用于在 localStorage 中保存设备 ID，防止每次页面刷新生成新设备
 */

const STORAGE_KEY = 'embytok_device_id';

export const getDeviceId = (): string => {
  // 尝试从 localStorage 获取已保存的设备 ID
  let deviceId = null;
  try {
    deviceId = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage 不可用时继续
  }

  // 如果没有保存的设备 ID，生成一个新的并保存
  if (!deviceId) {
    deviceId = 'embytok-web-' + Math.random().toString(36).substring(7);
    try {
      localStorage.setItem(STORAGE_KEY, deviceId);
    } catch (e) {
      // localStorage 不可用时继续
    }
  }

  return deviceId;
};

export default {
  isMobile,
  isLandscape,
  getDeviceId,
};
