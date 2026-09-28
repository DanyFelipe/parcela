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

  test('navigates from front to top via view control and clicks a lot hotspot', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByAltText('Vista frontal del terreno')).toBeVisible();

    await page.getByRole('button', { name: 'Ver vista aérea' }).click();

    await expect(page.getByTestId('showroom-base-image')).toBeVisible();

    const lotHotspot = page.getByTestId('lot-hotspot').first();
    await expect(lotHotspot).toBeVisible();
    await lotHotspot.click();
  });

  test('navigates from front to top via lots_overview feature hotspot and clicks a lot hotspot', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByAltText('Vista frontal del terreno')).toBeVisible();

    await page.getByRole('button', { name: 'Ver lotes' }).click();

    await expect(page.getByTestId('showroom-base-image')).toBeVisible();

    const lotHotspot = page.getByTestId('lot-hotspot').first();
    await expect(lotHotspot).toBeVisible();
    await lotHotspot.click();
  });
});
