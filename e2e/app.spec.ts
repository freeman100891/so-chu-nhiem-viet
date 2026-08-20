import { test, expect } from '@playwright/test';

test.describe('Sổ Chủ Nhiệm Việt Offline - Basic E2E Flow', () => {
  test('should load application title, sidebar and theme switcher', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Sổ Chủ Nhiệm Việt Offline/);

    // Check header/sidebar brand
    await expect(page.getByText('Sổ Chủ Nhiệm')).toBeVisible();

    // Check Theme switcher presence
    const themeBtn = page.getByRole('button', { name: /Chọn chủ đề giao diện|Giao diện/i });
    await expect(themeBtn).toBeVisible();

    // Open theme picker and select Lotus theme
    await themeBtn.click();
    await expect(page.getByText('Hoa Sen Thanh Lịch')).toBeVisible();
    await page.getByText('Hoa Sen Thanh Lịch').click();

    // Verify document data-theme attribute
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'lotus');
  });
});
