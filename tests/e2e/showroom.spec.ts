import { expect, test } from '@playwright/test';

test.describe('showroom view navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function play() {
        queueMicrotask(() => this.dispatchEvent(new Event('ended')));
        return Promise.resolve();
      };
    });
  });

  test('loads front and completes rotation to rear', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Descubre tu próximo terreno' })).toBeVisible();
    await expect(page.getByAltText('Vista frontal del terreno')).toBeVisible();

    await page.getByRole('button', { name: 'Rotar entre vista frontal y posterior' }).click();

    await expect(page.getByAltText('Vista posterior del terreno')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Rotar entre vista frontal y posterior' })
    ).toBeEnabled();
  });
});
