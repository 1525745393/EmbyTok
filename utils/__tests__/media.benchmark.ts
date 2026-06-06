import { describe, bench } from 'vitest';
import { isFolderType, calculatePlaybackProgress } from '../media';
import type { EmbyItem } from '../../types';

// 创建模拟数据
const createMockEmbyItems = (count: number): EmbyItem[] => {
  const types = ['Movie', 'Episode', 'Series', 'Season', 'Folder', 'MusicAlbum'];
  return Array.from(
    { length: count },
    (_, i) =>
      ({
        Id: `item-${i}`,
        Name: `Item ${i}`,
        Type: types[i % types.length],
      }) as EmbyItem
  );
};

describe('media utils 性能测试', () => {
  bench('isFolderType - 大量数据测试', () => {
    const testItems = createMockEmbyItems(1000);
    testItems.forEach((item) => isFolderType(item));
  });

  bench('calculatePlaybackProgress - 性能测试', () => {
    for (let i = 0; i < 10000; i++) {
      calculatePlaybackProgress(i * 100, 3600000);
    }
  });
});
