import { test, expect } from '@playwright/test';

test.describe('移动端界面测试', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE 尺寸

  test('应该在移动设备上正确显示界面', async ({ page }) => {
    await page.goto('/');

    // 验证在移动端也能看到 EmbyTok
    await expect(page.getByText('EmbyTok')).toBeVisible();

    // 验证界面元素在小屏幕上也可访问
    const inputs = page.locator('input');
    await expect(inputs).not.toHaveCount(0);
  });
});
