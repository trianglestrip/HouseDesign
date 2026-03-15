import { test } from '@playwright/test';

test('放大查看拐点 - 验证端点是否在中心', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 启用中心线调试
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
    }
  });
  
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  const inputField = page.locator('.dimension-input__field');
  
  // 绘制简单的L形（向右2m，向下2m）
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  await inputField.clear();
  await inputField.type('2000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 150, startY);
  await page.keyboard.up('Shift');
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  await inputField.clear();
  await inputField.type('2000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 150, startY + 150);
  await page.keyboard.up('Shift');
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  await page.mouse.click(startX + 150, startY + 150, { button: 'right' });
  await page.waitForTimeout(500);
  
  // 获取节点位置
  const nodePositions = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const config = (window as any).renderConfig;
    if (!config || !config.scale) {
      console.error('[ERROR] renderConfig not found');
      return [];
    }
    
    const scale = config.scale.pixelsPerMeter / 1000;
    
    return kernel.getTopology().getNodes().map((n: any) => ({
      id: n.id,
      mmX: n.position.x.toFixed(2),
      mmY: n.position.y.toFixed(2),
      pxX: (n.position.x * scale).toFixed(2),
      pxY: (n.position.y * scale).toFixed(2),
    }));
  });
  
  console.log('\n【节点位置】');
  nodePositions.forEach((n: any) => {
    console.log(`  ${n.id}:`);
    console.log(`    mm: (${n.mmX}, ${n.mmY})`);
    console.log(`    px: (${n.pxX}, ${n.pxY})`);
  });
  
  // 缩放到拐点区域
  await page.evaluate(() => {
    const fabricCanvas = (window as any).fabricCanvas;
    fabricCanvas.zoomToPoint({ x: 420, y: 300 }, 3); // 放大3倍
  });
  await page.waitForTimeout(500);
  
  await page.screenshot({ 
    path: 'tests/screenshots/corner-closeup.png',
    fullPage: false 
  });
  
  console.log('\n【放大截图】corner-closeup.png');
  console.log('【重点观察】拐点处的蓝色端点圆圈是否精确位于红色中心线的交点');
});
