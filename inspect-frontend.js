const { chromium } = require('playwright');

async function inspectFrontend() {
  console.log('🔍 Iniciando inspección del frontend...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`🌐 FRONTEND LOG [${msg.type()}]:`, msg.text());
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log(`❌ FRONTEND ERROR:`, error.message);
  });
  
  // Enable network request logging
  page.on('request', request => {
    if (request.url().includes('api')) {
      console.log(`📡 API REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('api')) {
      console.log(`📡 API RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Go to admin login
    console.log('📱 Navegando a admin login...');
    await page.goto('http://localhost:3003/admin/login');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('🔐 Haciendo login...');
    await page.fill('input[type="email"]', 'admin@alicante.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Go to import page by clicking menu
    console.log('📊 Navegando a página de importación...');
    const importMenuButton = page.getByRole('link', { name: 'Importar', exact: true });
    if (await importMenuButton.count() > 0) {
      await importMenuButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ Menu Importar no encontrado, navegando directamente...');
      await page.goto('http://localhost:3003/admin/import');
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot
    await page.screenshot({ path: '/Users/danielrodriguez/cobranza-portal/frontend-import-page.png' });
    console.log('📸 Screenshot guardado: frontend-import-page.png');
    
    // Try to upload file
    console.log('📁 Probando subir archivo...');
    const fileInput = await page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles('/Users/danielrodriguez/Downloads/INFORME_MARBELLA_editado.xlsx');
      console.log('✅ Archivo seleccionado');
      
      await page.waitForTimeout(2000);
      
      // Try to click import button
      const importButton = page.locator('text=Iniciar Importación');
      if (await importButton.count() > 0) {
        console.log('🚀 Haciendo clic en importar...');
        await importButton.click();
        
        // Wait for result
        await page.waitForTimeout(10000);
        
        // Take screenshot of result
        await page.screenshot({ path: '/Users/danielrodriguez/cobranza-portal/frontend-import-result.png' });
        console.log('📸 Screenshot resultado guardado: frontend-import-result.png');
      } else {
        console.log('❌ No se encontró el botón de importación');
      }
    } else {
      console.log('❌ No se encontró el input de archivo');
    }
    
    console.log('✅ Inspección completada');
    
  } catch (error) {
    console.log('❌ Error durante inspección:', error.message);
  } finally {
    await browser.close();
  }
}

inspectFrontend().catch(console.error);