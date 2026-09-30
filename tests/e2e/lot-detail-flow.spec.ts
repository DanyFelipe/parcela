import { expect, test } from '@playwright/test';

test.describe('lot detail flow', () => {
  test.beforeEach(async ({ page }) => {
    // Las transiciones de video deben completarse instantáneamente en los tests
    // para no depender de la duración real de los clips.
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function play() {
        queueMicrotask(() => this.dispatchEvent(new Event('ended')));
        return Promise.resolve();
      };
    });
  });

  test('navigates from top view hotspot to the indexable lot page with correct metadata', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByAltText('Vista frontal del terreno')).toBeVisible();

    // 1. Entrar a la vista aérea (top) desde el control dedicado.
    await page.getByRole('button', { name: 'Ver vista aérea' }).click();
    await expect(page.getByTestId('showroom-base-image')).toBeVisible();

    // 2. Clickear el primer hotspot de lote disponible.
    const lotHotspot = page.getByTestId('lot-hotspot').first();
    await expect(lotHotspot).toBeVisible();

    const lotId = await lotHotspot.getAttribute('data-lot-id');
    expect(lotId).toBeTruthy();

    await lotHotspot.click();

    // 3. Verificar que se abre el preview card con datos del lote.
    const previewCard = page.getByTestId('hotspot-preview-card');
    await expect(previewCard).toBeVisible();

    const lotName = await previewCard.locator('h2').textContent();
    expect(lotName).toBeTruthy();

    await expect(previewCard.getByRole('link', { name: 'Ver ficha completa' })).toBeVisible();

    // 4. Navegar a la página completa del lote.
    await previewCard.getByRole('link', { name: 'Ver ficha completa' }).click();

    // 5. Verificar URL, contenido y metadata.
    await expect(page).toHaveURL(new RegExp(`/lot/${lotId}$`));
    await expect(page.getByRole('heading', { name: lotName! })).toBeVisible();

    const title = await page.title();
    expect(title).toContain(lotName);
    expect(title).toMatch(/\u00b7/); // separador "·" entre nombre, superficie y estado

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain(lotName);
    expect(description).toContain('Ficha técnica de');

    await expect(page.getByRole('link', { name: 'Volver al showroom' })).toBeVisible();
  });
});
