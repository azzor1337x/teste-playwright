const { chromium } = require('playwright');
const { faker } = require('@faker-js/faker');
const fs = require('fs'); // Para salvar no CSV

// Função para salvar email, senha e ID no CSV
const salvarRegistroCSV = (email, senha, idNumero) => {
  const arquivo = 'registros.csv';
  const linha = `${email},${senha},${idNumero}\n`;
  fs.appendFileSync(arquivo, linha, 'utf8');
  console.log(`Registro salvo no CSV: ${email}, ID: ${idNumero}`);
};

(async () => {
  console.log('Iniciando o script de cadastro...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,
  });

  const page = await context.newPage();

  // ===== Etapa 1 =====
  console.log('Abrindo página de registro...');
  await page.goto('https://app2.artia.com/users/registration');

  // Gerando dados aleatórios
  let nome = faker.person.fullName();
  nome = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos

  const ddd = faker.number.int({ min: 11, max: 99 });
  const telefone = faker.phone.number(`${ddd}########`);

  const email = faker.internet.email({ firstName: nome.split(' ')[0], lastName: nome.split(' ')[1] });
  const senha = faker.internet.password({ length: 12, memorable: false, symbols: true });

  console.log('Preenchendo formulário da primeira etapa...');
  await page.fill('input[name="userName"]', nome);
  await page.fill('input[name="userPhone"]', telefone);
  await page.fill('input[name="userEmail"]', email);
  await page.fill('input[name="userPassword"]', senha);

  console.log('Clicando no botão "Criar conta"...');
  await Promise.all([
    page.click('button[data-test-id="create-account"]'),
    page.waitForLoadState('networkidle'),
  ]);

  // ===== Etapa 2 =====
  console.log('Preenchendo formulário da segunda etapa...');
  const empresa = faker.company.name();
  await page.fill('input[name="companyName"]', empresa);

  // Função para preencher campos de autocomplete / dropdown customizado
  const preencherSearchInput = async (containerDataTestId, texto, opcaoExata) => {
    console.log(`Selecionando ${opcaoExata} em ${containerDataTestId}...`);
    const toggle = page.locator(
      `[data-test-id="${containerDataTestId}"] svg[data-test-id="toggle-select-open-status"]`
    );
    await toggle.click();

    const inputPesquisa = page.locator('input[data-test-id="search-input"]:visible');
    if (await inputPesquisa.count() > 0) {
      await inputPesquisa.fill('');
      await inputPesquisa.type(texto, { delay: 150 });
    }

    await page.waitForTimeout(1000);

    const opcao = page.locator(`p.chakra-text:has-text("${opcaoExata}"):visible`);
    const count = await opcao.count();
    console.log(`Foram encontradas ${count} opções visíveis para "${opcaoExata}"`);
    if (count > 0) {
      await opcao.first().click();
    } else {
      throw new Error(`Não foi possível encontrar a opção "${opcaoExata}" em ${containerDataTestId}`);
    }
  };

  // ===== Preenchendo campos =====
  await preencherSearchInput('businessLine', 'Education', 'Education and Teaching');
  await preencherSearchInput('employeesNumber', '0', '0 - 1');
  await preencherSearchInput('department', 'Others', 'Others');
  await preencherSearchInput('userJobTitle', 'Student', 'Student');
  await preencherSearchInput('mainGoal', 'Client', 'Client Projects');

  // ===== Finalizar cadastro =====
  console.log('Clicando no botão "Finalize"...');
  await Promise.all([
    page.getByRole('button', { name: 'Finalize' }).click(),
    page.waitForLoadState('networkidle'),
  ]);

  console.log('Cadastro finalizado com sucesso!');

  // ===== Extrair ID do botão =====
  await page.waitForTimeout(2000); // espera carregamento
  const botao = await page.locator('button[role="group"][title^="ID:"]');
  const titulo = await botao.getAttribute('title');
  const match = titulo.match(/ID:(\d+)/);
  const idNumero = match ? match[1] : null;

  if (!idNumero) throw new Error('Não foi possível extrair o ID do botão');

  console.log(`ID extraído: ${idNumero}`);

  // ===== Salvar no CSV =====
  salvarRegistroCSV(email, senha, idNumero);

  await browser.close();
})();
