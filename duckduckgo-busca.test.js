const { chromium } = require('playwright');

(async () => {
  console.log('Iniciando o script...');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  console.log('Navegador aberto.');

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/116.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  console.log('Abrindo a página inicial do DuckDuckGo...');
  await page.goto('https://duckduckgo.com');
  console.log('Página inicial carregada.');

  console.log('Preenchendo o campo de busca com "brasil"...');
  await page.fill('input[name="q"]', 'brasil');
  console.log('Campo de busca preenchido.');

  console.log('Pressionando Enter e aguardando os resultados carregarem...');
  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForLoadState('networkidle')
  ]);
  console.log('Resultados carregados.');

  // Fechar o modal "Add DuckDuckGo to Chrome"
  try {
    console.log('Aguardando e tentando fechar o modal principal...');
    await page.waitForSelector('.js-badge-link-dismiss', { timeout: 10000 });
    await page.click('.js-badge-link-dismiss');
    console.log('Modal principal fechado.');
  } catch {
    console.log('Modal principal não apareceu.');
  }

  // Fechar o modal de cookies
  try {
    console.log('Aguardando e tentando fechar o modal de cookies...');
    await page.waitForSelector('.js-badge-link-close', { timeout: 5000 });
    await page.click('.js-badge-link-close');
    console.log('Modal de cookies fechado.');
  } catch {
    console.log('Modal de cookies não apareceu.');
  }

  console.log('Aguardando os resultados...');
  await page.waitForSelector('a.result__a');
  console.log('Resultados visíveis.');

  console.log('Tirando screenshot...');
  await page.screenshot({ path: 'resultado-duckduckgo.png' });
  console.log('Screenshot salva: resultado-duckduckgo.png');

  await browser.close();
  console.log('Navegador fechado. Script finalizado com sucesso!');
})();
