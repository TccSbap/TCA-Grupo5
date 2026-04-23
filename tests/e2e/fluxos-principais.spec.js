const { test, expect } = require('@playwright/test');

const resetApplicationState = async (request) => {
  await request.post('/__test/reset-data');
  await request.post('/__test/session/clear');
};

const loginUser = async (page, email = 'joao@email.com', password = '123456') => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
};

const loginAdmin = async (page, email = 'admin@agualimpa.org', password = '123456') => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar como Administrador' }).click();
};

test.beforeEach(async ({ request }) => {
  await resetApplicationState(request);
});

test('a pagina inicial carrega e mostra os atalhos principais', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Consciente para Todos/i })).toBeVisible();
  await expect(page.locator('a[href="/denuncias/nova"]').first()).toBeVisible();
  await expect(page.locator('a[href="/ongs"]').first()).toBeVisible();
  await expect(page.locator('a[href="/planos"]').first()).toBeVisible();
});

test('rota desconhecida exibe a pagina 404', async ({ page }) => {
  const response = await page.goto('/rota-inexistente');

  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /p[aá]gina n[aã]o encontrada/i })).toBeVisible();
});

test('usuario consegue entrar na plataforma e acessar o dashboard', async ({ page }) => {
  await loginUser(page);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Painel de Admin/i })).toBeVisible();
  await expect(page.getByText(/Silva/)).toBeVisible();
});

test('usuario cadastra uma ONG e consegue entrar no painel administrativo', async ({ page }) => {
  await page.goto('/auth/cadastro');
  await page.selectOption('#userType', 'admin');
  await page.locator('#name').fill('Nova ONG Teste');
  await page.locator('#email').fill('nova-ong-teste@exemplo.com');
  await page.locator('#password').fill('SenhaForte123');
  await page.locator('#confirmPassword').fill('SenhaForte123');
  await page.locator('#ongName').fill('ONG Teste E2E');
  await page.locator('#ongDescription').fill('Descricao suficiente para passar na validacao.');
  await page.locator('#ongContact').fill('contato@ongteste.com');
  await page.locator('#ongPhone').fill('(11) 99999-8888');
  await page.locator('#ongAddress').fill('Rua dos Testes, 123');
  await page.getByRole('button', { name: 'Criar Conta' }).click();

  await expect(page).toHaveURL(/\/auth\/login\?success=/);
  await expect(page.getByText(/Cadastro realizado com sucesso/i)).toBeVisible();

  await loginAdmin(page, 'nova-ong-teste@exemplo.com', 'SenhaForte123');
  await expect(page).toHaveURL(/\/admin\/dashboard_admin$/);
  await expect(page.getByRole('heading', { name: /Painel Admin/i })).toBeVisible();

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /Painel Admin/i })).toBeVisible();

  await page.goto('/admin/denuncias');
  await expect(page.getByRole('heading', { name: /Gerenciar Den[úu]ncias/i })).toBeVisible();

  await page.goto('/admin/ongs');
  await expect(page.getByRole('heading', { name: /Gerenciar ONGs/i })).toBeVisible();
});

test('usuario autenticado envia uma denuncia e acompanha os detalhes', async ({ page }) => {
  await loginUser(page);

  await page.goto('/denuncias/nova');
  await page.locator('#title').fill('Esgoto a ceu aberto na rua central');
  await page.locator('#location').fill('Rua Central, 123 - Centro - Sao Paulo/SP');
  await page.locator('#description').fill('Existe esgoto a ceu aberto ha varios dias e o mau cheiro atingiu todo o quarteirao.');
  await page.getByRole('button', { name: /Enviar Den[úu]ncia/i }).click();

  await expect(page).toHaveURL(/\/denuncias\/nova\?success=/);
  await expect(page.getByText(/Valida/i)).toBeVisible();

  await page.goto('/denuncias/15');
  await expect(page.getByRole('heading', { name: /Lagoa contaminada por esgoto/i })).toBeVisible();
  await expect(page.getByText(/Ainda não há respostas/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meu Dashboard' })).toBeVisible();
});

test('usuario faz uma doacao completa para uma ONG', async ({ page }) => {
  await page.goto('/doacoes/1/doar');

  await page.locator('#nomeCompleto').fill('Maria da Silva');
  await page.locator('#emailDoador').fill('maria@exemplo.com');
  await page.locator('#telefoneDoador').fill('(11) 98888-7777');
  await page.locator('#documentoDoador').fill('12345678901');
  await page.locator('#cepDoador').fill('01001000');
  await page.locator('#ruaDoador').fill('Rua das Flores');
  await page.locator('#numeroDoador').fill('123');
  await page.locator('#bairroDoador').fill('Centro');
  await page.locator('#cidadeDoador').fill('Sao Paulo');
  await page.locator('#estadoDoador').fill('SP');
  await page.locator('#valorDoacao').fill('50');
  await page.locator('#mensagemOpcional').fill('Obrigado pelo trabalho de voces.');
  await page.locator('input[name="metodoPagamento"][value="pix"]').check();
  await page.locator('#confirmacao').check();
  await page.getByRole('button', { name: 'Finalizar Doação' }).click();

  await expect(page).toHaveURL(/\/doacoes\?success=/);
  await expect(page.getByText(/registrada com sucesso/i)).toBeVisible();
});

test('usuario assina um plano da plataforma', async ({ page }) => {
  await page.goto('/planos/1/assinar');

  await page.locator('#nomeCompleto').fill('Maria da Silva');
  await page.locator('#emailComprador').fill('maria@exemplo.com');
  await page.locator('#telefoneComprador').fill('(11) 98888-7777');
  await page.locator('#documentoComprador').fill('12345678901');
  await page.locator('#cepComprador').fill('01001000');
  await page.locator('#ruaComprador').fill('Rua das Flores');
  await page.locator('#numeroComprador').fill('123');
  await page.locator('#bairroComprador').fill('Bairro Central');
  await page.locator('#cidadeComprador').fill('Sao Paulo');
  await page.locator('#estadoComprador').fill('SP');
  await page.locator('input[name="metodoPagamento"][value="pix"]').check();
  await page.locator('#confirmacao').check();
  await Promise.all([
    page.waitForNavigation(),
    page.locator('#planoForm').evaluate((form) => form.submit())
  ]);

  await expect(page).toHaveURL(/\/planos\?success=/);
  await expect(page.getByText(/registrada com sucesso/i)).toBeVisible();
});

test('usuario envia mensagem pelo formulario de contato', async ({ page }) => {
  await page.goto('/contato');

  await page.getByLabel('Nome Completo *').fill('Maria da Silva');
  await page.getByLabel('Email *').fill('maria@exemplo.com');
  await page.getByLabel('Assunto *').selectOption('duvida');
  await page.getByLabel('Mensagem *').fill('Tenho uma duvida sobre o funcionamento da plataforma.');
  await page.locator('input[name="newsletter"]').check();
  await page.getByRole('button', { name: /Enviar Mensagem/i }).click();

  await expect(page).toHaveURL(/\/contato\?success=/);
  await expect(page.getByText(/Mensagem enviada com sucesso/i)).toBeVisible();
});

test('administrador responde uma denuncia e acompanha os paines da ONG', async ({ page }) => {
  await loginAdmin(page);

  await page.goto('/denuncias/15');
  await expect(page.getByRole('heading', { name: /Lagoa contaminada por esgoto/i })).toBeVisible();
  await page.getByLabel('Sua Resposta').fill('Nossa ONG vai vistoriar o local e acionar a prefeitura hoje.');
  await page.getByLabel('Atualizar Status').selectOption('em_andamento');
  await page.getByRole('button', { name: 'Enviar Resposta' }).click();

  await expect(page).toHaveURL(/\/denuncias\/15\?success=/);
  await expect(page.getByText(/Resposta adicionada com sucesso/i)).toBeVisible();
  await expect(page.getByText(/Nossa ONG vai vistoriar o local/i)).toBeVisible();

  await page.goto('/ongs/admin/dashboard');
  await expect(page.getByRole('heading', { name: /Administra/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Den[úu]ncias Pendentes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Minhas Respostas/i })).toBeVisible();

  await page.goto('/ongs/admin/stats');
  await expect(page.getByRole('heading', { name: /Estat/i })).toBeVisible();
  await expect(page.getByText(/Total de Denúncias/i)).toBeVisible();
});
