const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context, request }, testInfo) => {
    await request.post('/__test/reset-data');
    await context.addCookies([{ name: 'ods6_cookie_consent', value: 'accepted', url: testInfo.project.use.baseURL, sameSite: 'Lax' }]);
});

for (const viewport of [{ width: 360, height: 780 }, { width: 769, height: 487 }, { width: 1280, height: 800 }]) {
    test(`noticias: fontes, busca e layout em ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const response = await page.goto('/noticias');
        expect(response.status()).toBe(200);
        await expect(page.locator('.noticia-card')).toHaveCount(6);
        await expect(page.locator('.noticia-source').first()).toContainText('ANA');
        await expect(page.locator('.noticia-header time').first()).toHaveAttribute('datetime', '2026-10-22');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        await page.screenshot({ path: testInfo.outputPath('noticias.png'), fullPage: true });
        await page.getByLabel('Buscar notícia', { exact: true }).fill('tarifa social');
        await page.getByLabel('Tema', { exact: true }).selectOption('saneamento');
        await page.getByRole('button', { name: 'Filtrar notícias' }).press('Enter');
        await expect(page.locator('.noticia-card')).toHaveCount(1);
        await expect(page.locator('.noticia-card h2')).toContainText('Tarifa Social');
        await expect(page.locator('.noticia-footer a')).toHaveAttribute('href', /^https:\/\/www.gov.br\/ana\//);
        await page.getByLabel('Buscar notícia', { exact: true }).fill('assunto sem resultados xyz');
        await page.getByRole('button', { name: 'Filtrar notícias' }).click();
        await expect(page.getByRole('heading', { name: 'Nenhuma notícia encontrada' })).toBeVisible();
        await page.getByRole('link', { name: 'Ver todas as notícias' }).click();
        await expect(page.locator('.noticia-card')).toHaveCount(6);
        expect(errors).toEqual([]);
    });
}

test('publicacoes abrem a fonte original em uma nova aba', async ({ page, context }) => {
    await context.route('https://www.gov.br/**', (route) => route.fulfill({ status: 200, body: '<h1>Fonte externa</h1>', contentType: 'text/html' }));
    await page.goto('/noticias');
    const popupReady = page.waitForEvent('popup');
    await page.locator('.noticia-footer a').first().click();
    const popup = await popupReady;
    await expect(popup).toHaveURL(/^https:\/\/www.gov.br\/ana\/.*eficiencia/);
    await popup.close();
});

test('paginas publicas renderizam sem erros JavaScript no tablet', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 769, height: 487 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of ['/', '/ongs', '/sobre', '/contato', '/impacto', '/doacoes', '/doacoes/1/doar', '/denuncias', '/denuncias/1', '/auth/login', '/auth/cadastro', '/privacidade']) {
        const response = await page.goto(route);
        expect(response.status(), route).toBe(200);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), route).toBeLessThanOrEqual(769);
    }
    expect(errors).toEqual([]);
});

test('modo offline nao reapresenta o dashboard privado do usuario', async ({ page, context }) => {
    await page.goto('/auth/login');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.getByLabel('Email').fill('joao@email.com');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Meu Dashboard' })).toBeVisible();
    await context.setOffline(true);
    try {
        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { name: 'Você está offline' })).toBeVisible();
        await expect(page.getByText('João Silva', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Meu Dashboard' })).toHaveCount(0);
    } finally { await context.setOffline(false); }
});
