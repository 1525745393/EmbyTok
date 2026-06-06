import { EmbyItem } from '../types';

/**
 * 文件夹类型列表
 */
const FOLDER_TYPES = ['Series', 'Season', 'Folder', 'CollectionFolder', 'BoxSet', 'show', 'season'];

/**
 * 判断项目是否为文件夹类型
 * @param item - EmbyItem 对象
 * @returns 是否为文件夹类型
 */
export function isFolderType(item: EmbyItem): boolean {
  const type = (item.Type || '').toLowerCase();
  return FOLDER_TYPES.some((t) => t.toLowerCase() === type);
}

/**
 * 计算视频播放进度百分比
 * @param playbackPositionTicks - 当前播放位置的时间刻度
 * @param runTimeTicks - 总时长的时间刻度
 * @returns 进度百分比（0-100）
 */
export function calculatePlaybackProgress(
  playbackPositionTicks?: number,
  runTimeTicks?: number
): number {
  if (!playbackPositionTicks || !runTimeTicks || runTimeTicks === 0) {
    return 0;
  }
  return Math.min(Math.round((playbackPositionTicks / runTimeTicks) * 100), 100);
}

/**
 * 判断设备是否为电视
 * @returns 是否为电视设备
 */
export function isTVDevice(): boolean {
  return window.navigator.userAgent.toLowerCase().includes('tv');
}

/**
 * 判断是否为 iOS Safari 浏览器
 * @returns 是否为 iOS Safari
 */
export function isIOSSafari(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream &&
    /Safari/.test(navigator.userAgent) &&
    !/CriOS/.test(navigator.userAgent) &&
    !/FxiOS/.test(navigator.userAgent) &&
    !/OPiOS/.test(navigator.userAgent)
  );
}
