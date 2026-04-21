const { test, expect } = require('@playwright/test');

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Água Consciente para Todos/i })).toBeVisible();
});

test('unknown route returns the 404 page', async ({ page }) => {
  const response = await page.goto('/rota-inexistente');

  expect(response.status()).toBe(404);
  await expect(page.getByText(/página não encontrada|pagina nao encontrada/i)).toBeVisible();
});

test('user can navigate from homepage to the denuncias page', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/denuncias/nova"]').first().click();

  await expect(page).toHaveURL(/\/denuncias\/nova$/);
  await expect(page.getByRole('heading', { name: /Nova Denúncia/i })).toBeVisible();
});

test('user can open the login page from the homepage', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/auth/login"]').first().click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('heading', { name: /Entrar na Plataforma/i })).toBeVisible();
});
