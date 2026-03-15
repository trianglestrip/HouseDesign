import { test, expect } from '@playwright/test';

test('验证端点吸附时隐藏十字准线', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[吸附]')) {
      console.log(`[浏览器] ${text}`);
    }
  });
  
  await page.goto('http://localhost:5182');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n========== 测试端点吸附和十字准线隐藏 ==========');
  
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 400;
  const startY = box.y + 300;
  
  const inputField = page.locator('.dimension-input__field');
  
  // 绘制第一段
  console.log('【步骤1】绘制第一段 3m');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  // 绘制第二段
  console.log('【步骤2】绘制第二段 2m');
  await inputField.clear();
  await inputField.type('2000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY + 150);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  // 移动到起点附近，触发端点吸附
  console.log('【步骤3】移动鼠标到起点附近（触发吸附）');
  await page.keyboard.down('Shift');
  
  // 先移动到远处
  await page.mouse.move(startX - 100, startY);
  await page.waitForTimeout(200);
  
  // 然后慢慢接近起点
  await page.mouse.move(startX - 10, startY);
  await page.waitForTimeout(200);
  
  await page.mouse.move(startX - 2, startY);
  await page.waitForTimeout(500);
  
  // 检查是否有吸附指示器
  const snapIndicatorVisible = await page.evaluate(() => {
    const fabricCanvas = (window as any).fabricCanvas;
    const snapIndicator = fabricCanvas.getObjects().find((obj: any) => 
      obj.radius === 8 && obj.fill === '#409EFF'
    );
    return snapIndicator ? snapIndicator.visible : false;
  });
  
  console.log('吸附指示器是否可见:', snapIndicatorVisible);
  
  // 检查十字准线
  const crosshair = page.locator('.crosshair');
  const isCrosshairVisible = await crosshair.isVisible();
  console.log('十字准线是否可见:', isCrosshairVisible);
  
  await page.screenshot({ 
    path: 'tests/screenshots/snap-crosshair-test.png',
    fullPage: false 
  });
  
  if (snapIndicatorVisible && !isCrosshairVisible) {
    console.log('✓ 端点吸附时，十字准线已隐藏');
  } else if (snapIndicatorVisible && isCrosshairVisible) {
    console.log('❌ 端点吸附时，十字准线仍然可见');
  } else {
    console.log('⚠ 没有触发端点吸附');
  }
  
  await page.keyboard.up('Shift');
});
