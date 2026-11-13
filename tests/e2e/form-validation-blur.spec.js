const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test/reset-data');
  await request.post('/__test/session/clear');
});

test('doacao valida e sinaliza campos obrigatorios ao sair do campo', async ({ page }) => {
  for (const donationPath of ['/doacoes/1/doar', '/doacoes/projeto/doar']) {
    await page.goto(donationPath);

    await page.locator('#nomeCompleto').focus();
    await page.locator('#emailDoador').focus();

    await expect(page.locator('#nomeCompleto')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#nomeCompleto-error')).toContainText(/nome completo/i);

    await page.locator('#valorDoacao').focus();
    await page.locator('#mensagemOpcional').focus();
    await expect(page.locator('#valorDoacao')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#valorDoacao-error')).toContainText(/R\$ 5,00/);
  }
});

test('denuncia valida campos obrigatorios e CEP ao sair do campo', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('joao@email.com');
  await page.locator('#password').fill('123456');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.goto('/denuncias/nova');
  await page.locator('#title').focus();
  await page.locator('#location').focus();

  await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#title-error')).toContainText(/10 e 200 caracteres/i);

  await page.locator('#cep').fill('123');
  await page.locator('#location').focus();
  await expect(page.locator('#cep')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#cep-error')).toContainText(/8 dígitos/i);
});
