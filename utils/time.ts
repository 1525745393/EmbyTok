/**
 * 格式化时间为中文分钟格式（如 "120 分钟"）
 * @param ticks - Emby 格式的时间刻度（100纳秒为单位）
 * @returns 格式化后的时间字符串
 */
export function formatTimeText(ticks?: number): string {
  if (!ticks) return '';
  const minutes = Math.round(ticks / 10000000 / 60);
  return `${minutes} 分钟`;
}

/**
 * 格式化时间为简短格式（如 "120m"）
 * @param ticks - Emby 格式的时间刻度（100纳秒为单位）
 * @returns 格式化后的时间字符串
 */
export function formatTime(ticks?: number): string {
  if (!ticks) return '';
  const minutes = Math.round(ticks / 10000000 / 60);
  return `${minutes}m`;
}
