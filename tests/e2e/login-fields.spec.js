const { test, expect } = require('@playwright/test');

[
  { path: '/auth/login', formAction: '/auth/login', title: 'login do usuário' },
  { path: '/admin/login', formAction: '/admin/login', title: 'login administrativo' }
].forEach(({ path, formAction, title }) => {
  test(`${title} exige e-mail válido e senha`, async ({ page }) => {
    await page.goto(path);

    const email = page.getByLabel('Email');
    const password = page.locator('#password');

    await expect(email).toHaveAttribute('type', 'email');
    await expect(email).toHaveAttribute('required', '');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveAttribute('required', '');
    await expect(page.locator('form.auth-form')).toHaveAttribute('action', formAction);

    expect(await email.evaluate((field) => field.checkValidity())).toBe(false);
    expect(await password.evaluate((field) => field.checkValidity())).toBe(false);

    await email.fill('email-invalido');
    await password.fill('senha123');
    expect(await email.evaluate((field) => field.checkValidity())).toBe(false);
    expect(await password.evaluate((field) => field.checkValidity())).toBe(true);

    await email.fill('usuario@exemplo.com');
    expect(await email.evaluate((field) => field.checkValidity())).toBe(true);
  });
});
