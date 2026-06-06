import { test, expect } from '@playwright/test';

test.describe('应用基础测试', () => {
  test('应该正确加载应用首页', async ({ page }) => {
    // 访问应用首页
    await page.goto('/');

    // 验证页面是否包含 EmbyTok 文本
    await expect(page.locator('body')).toContainText('EmbyTok');

    // 检查页面标题
    await expect(page).toHaveTitle(/EmbyTok/);
  });
});
