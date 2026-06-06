import { test, expect } from '@playwright/test';

test.describe('应用性能测试', () => {
  test('首页加载性能应该在合理范围内', async ({ page }) => {
    // 开始性能测量
    const startTime = Date.now();

    // 访问页面
    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // 验证页面加载时间（可根据实际需求调整阈值）
    expect(loadTime).toBeLessThan(5000); // 应该在5秒内加载完成

    console.log(`页面加载时间: ${loadTime}ms`);

    // 获取性能指标
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0] as any;

      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        ttfb: timing.responseStart - timing.navigationStart,
        firstPaint: navigation?.firstPaint || 0,
        firstContentfulPaint: navigation?.firstContentfulPaint || 0,
      };
    });

    console.log('性能指标:', performanceTiming);

    // 验证关键性能指标
    expect(performanceTiming.ttfb).toBeLessThan(2000); // TTFB 应该在 2 秒内
    expect(performanceTiming.domContentLoaded).toBeLessThan(3000); // DOM 加载应该在 3 秒内
  });

  test('检查资源加载情况', async ({ page }) => {
    // 监听网络请求
    const resources: string[] = [];

    page.on('request', (request) => {
      resources.push(request.url());
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    console.log(`加载的资源数量: ${resources.length}`);

    // 验证资源加载数量（根据实际情况调整）
    expect(resources.length).toBeGreaterThan(0);

    // 检查是否有过大的资源
    const resourceSizes = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry) => ({
        name: entry.name,
        size: entry.transferSize,
        duration: entry.duration,
      }));
    });

    console.log('资源详情:', resourceSizes);

    // 验证没有超大资源（例如，单个资源不超过 500KB）
    const maxResourceSize = 500 * 1024; // 500KB
    const largeResources = resourceSizes.filter((r) => r.size > maxResourceSize);

    expect(largeResources.length).toBe(0);
  });

  test('模拟用户操作的响应性能', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 测试按钮点击响应
    const buttons = await page.getByRole('button').all();

    if (buttons.length > 0) {
      const clickStartTime = Date.now();
      await buttons[0].click();
      const clickResponseTime = Date.now() - clickStartTime;

      console.log(`按钮点击响应时间: ${clickResponseTime}ms`);
      expect(clickResponseTime).toBeLessThan(500); // 响应应该在 500ms 内
    }
  });
});
