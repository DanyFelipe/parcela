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

  test('keeps the render and its hotspots on a horizontally scrollable stage on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const viewport = page.getByTestId('showroom-render-viewport');
    const stage = page.getByTestId('showroom-render-stage');

    await expect(stage).toHaveCSS('width', '1600px');
    await expect(viewport).toHaveAttribute('tabindex', '0');

    const scrollDimensions = await viewport.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(scrollDimensions.scrollWidth).toBeGreaterThan(scrollDimensions.clientWidth);

    await page.getByRole('button', { name: 'Ver vista aérea' }).click();
    const lotHotspot = page.getByTestId('lot-hotspot').first();
    await expect(lotHotspot).toBeVisible();

    const hotspotLeft = await lotHotspot.evaluate((element) => element.style.left);
    await viewport.evaluate((element) => {
      element.scrollLeft = 320;
    });

    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBe(320);
    await expect(stage).toHaveCSS('width', '1600px');
    await expect.poll(() => lotHotspot.evaluate((element) => element.style.left)).toBe(hotspotLeft);
  });
});
