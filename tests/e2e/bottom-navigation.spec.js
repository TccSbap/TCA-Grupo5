const { test, expect } = require('@playwright/test');

const acceptCookies = async (context) => {
  await context.addCookies([
    {
      name: 'ods6_cookie_consent',
      value: 'accepted',
      url: 'http://127.0.0.1:3000',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);
};

const login = async (page, email, password, buttonName = 'Entrar') => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: buttonName }).click();
};

test.beforeEach(async ({ request, context }) => {
  await request.post('/__test/reset-data');
  await request.post('/__test/session/clear');
  await acceptCookies(context);
});

test('navegacao inferior aparece em celular, marca a rota atual e deixa o fim da pagina acessivel', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/doacoes');

  const navigation = page.getByRole('navigation', { name: 'Navegação móvel' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  await expect(navigation.getByRole('link', { name: 'Doação' })).toHaveAttribute('aria-current', 'page');
  await expect(navigation.getByRole('link', { name: 'Denúncias' })).toHaveAttribute('href', '/denuncias');
  await expect(navigation.getByRole('button', { name: 'Outros' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/auth/login');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const bottomNavigationTop = await navigation.evaluate((element) => element.getBoundingClientRect().top);
  const footerBottom = await page.locator('.footer-bottom').evaluate((element) => element.getBoundingClientRect().bottom);
  expect(footerBottom).toBeLessThanOrEqual(bottomNavigationTop + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  await page.goto('/doacoes/1/doar');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const formButton = page.getByRole('button', { name: 'Finalizar Doação' });
  const formButtonBottom = await formButton.evaluate((element) => element.getBoundingClientRect().bottom);
  const formNavigationTop = await navigation.evaluate((element) => element.getBoundingClientRect().top);
  expect(formButtonBottom).toBeLessThanOrEqual(formNavigationTop + 1);
});

test('menu Outros abre por teclado, permite acessar os links e fecha com Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/impacto');

  const toggle = page.getByRole('button', { name: 'Outros' });
  const menu = page.getByRole('navigation', { name: 'Outras páginas' });
  await expect(toggle).toHaveAttribute('aria-current', 'page');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('link', { name: 'Impacto' })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', { name: 'Notícias' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();

  await toggle.click();
  await expect(menu.getByRole('link', { name: 'ONGs' })).toBeVisible();
  await menu.getByRole('link', { name: 'ONGs' }).click();
  await expect(page).toHaveURL(/\/ongs$/);
});

test('link Perfil aponta ao dashboard de usuário autenticado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'joao@email.com', '123456');
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('link', { name: 'Perfil' }))
    .toHaveAttribute('href', '/dashboard');
});

test('link Perfil aponta ao perfil da ONG autenticada', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await login(page, 'admin@agualimpa.org', '123456');
  const navigation = page.getByRole('navigation', { name: 'Navegação móvel' });
  await expect(navigation.getByRole('link', { name: 'Perfil' }))
    .toHaveAttribute('href', '/ongs/admin/dashboard');
  await expect(navigation.getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page');
  await expect(navigation.getByRole('button', { name: 'Outros' })).not.toHaveAttribute('aria-current', 'page');
});

test('link Perfil aponta ao dashboard do administrador', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@ods6.org');
  await page.locator('#password').fill('123456');
  await page.getByRole('button', { name: 'Entrar no Painel Administrativo' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('link', { name: 'Perfil' }))
    .toHaveAttribute('href', '/admin');
});

test('celular e tablet em orientacao paisagem nao criam rolagem horizontal', async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 }
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ['/', '/doacoes', '/denuncias', '/ongs', '/impacto']) {
      await page.goto(route);
      const overflowElements = await page.evaluate(() => Array.from(document.body.querySelectorAll('*'))
        .map((element) => ({
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className && typeof element.className === 'string' ? `.${element.className.trim().replace(/\s+/g, '.')}` : ''}`,
          right: Math.round(element.getBoundingClientRect().right),
          width: element.scrollWidth,
          clientWidth: element.clientWidth
        }))
        .filter((element) => element.right > window.innerWidth + 1 || element.width > element.clientWidth + 1)
        .slice(0, 10));
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `horizontal overflow at ${viewport.width}x${viewport.height} on ${route}: ${JSON.stringify(overflowElements)}`
      ).toBeLessThanOrEqual(viewport.width);
      await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
      await expect(page.locator('#primary-navigation')).toBeHidden();
      await expect(page.locator('.mobile-menu-toggle')).toBeHidden();
    }
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeHidden();
  await expect(page.locator('#primary-navigation')).toBeVisible();
});
