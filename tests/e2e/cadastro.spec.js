const { test, expect } = require('@playwright/test');

const resetApplicationState = async (request) => {
  await request.post('/__test/reset-data');
  await request.post('/__test/session/clear');
};

test.beforeEach(async ({ request }) => {
  await resetApplicationState(request);
});

test('usuario normal cadastra sem preencher campos da ONG', async ({ page }) => {
  await page.goto('/auth/cadastro');
  await page.selectOption('#userType', 'user');

  await expect(page.locator('#ongFields')).toBeHidden();

  await page.locator('#name').fill('Maria da Silva');
  await page.locator('#email').fill('maria1@exemplo.com');
  await page.locator('#password').fill('SenhaForte123');
  await page.locator('#confirmPassword').fill('SenhaForte123');
  await page.getByRole('button', { name: 'Criar Conta' }).click();

  await expect(page).toHaveURL(/\/auth\/login\?success=/);
  await expect(page.getByText(/Cadastro realizado com sucesso/i)).toBeVisible();
});

test('usuario ONG precisa preencher os campos da ONG', async ({ page }) => {
  await page.goto('/auth/cadastro');
  await page.selectOption('#userType', 'admin');

  await expect(page.locator('#ongFields')).toBeVisible();

  await page.locator('#name').fill('Admin ONG Teste');
  await page.locator('#email').fill('admin1@teste.com');
  await page.locator('#password').fill('SenhaForte123');
  await page.locator('#confirmPassword').fill('SenhaForte123');
  await page.getByRole('button', { name: 'Criar Conta' }).click();

  await expect(page.locator('#ongName-error')).toContainText('O nome da ONG é obrigatório.');
  await expect(page.locator('#ongDescription-error')).toContainText('A descrição da ONG é obrigatória.');
  await expect(page.locator('#ongContact-error')).toContainText('O e-mail da ONG deve conter @ e .com.');
  await expect(page.locator('#ongCnpj-error')).toContainText('O CNPJ da ONG é inválido.');
  await expect(page.locator('#ongRg-error')).toContainText('O RG do responsável é inválido.');
  await expect(page).toHaveURL(/\/auth\/cadastro$/);
});
