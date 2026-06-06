import { test, expect } from '@playwright/test';

test.describe('登录流程测试', () => {
  test.beforeEach(async ({ page, context }) => {
    // 清除本地存储
    await context.clearCookies();
    await context.clearPermissions();

    // 访问首页
    await page.goto('/');
  });

  test('应该显示登录表单', async ({ page }) => {
    // 验证登录表单元素
    await expect(page.getByText('EmbyTok')).toBeVisible();

    // 检查 URL 参数选择器
    await expect(page.locator('select[name="serverType"]')).toBeVisible();

    // 检查输入框
    await expect(page.locator('input[name="serverUrl"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // 检查登录按钮
    await expect(page.getByText('立即连接')).toBeVisible();
  });

  test('应该在未填写完整信息时阻止登录', async ({ page }) => {
    // 点击登录按钮
    await page.getByText('立即连接').click();

    // 验证仍然在登录页面
    await expect(page.getByText('EmbyTok')).toBeVisible();
  });

  test('应该支持切换服务器类型', async ({ page }) => {
    const serverTypeSelect = page.locator('select[name="serverType"]');

    // 检查默认值
    await expect(serverTypeSelect).toHaveValue('emby');

    // 切换到 Plex
    await serverTypeSelect.selectOption('plex');
    await expect(serverTypeSelect).toHaveValue('plex');

    // 切换回 Emby
    await serverTypeSelect.selectOption('emby');
    await expect(serverTypeSelect).toHaveValue('emby');
  });
});
