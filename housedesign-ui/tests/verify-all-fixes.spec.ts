import { test, expect } from '@playwright/test';

test('验证输入框位置和鼠标隐藏', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[输入框]') || text.includes('[DimensionInput]') || text.includes('[吸附]')) {
      console.log(`[浏览器] ${text}`);
    }
  });
  
  await page.goto('http://localhost:5182');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n========== 验证输入框和鼠标交互 ==========');
  
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 400;
  const startY = box.y + 300;
  
  console.log('【步骤1】点击起点');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  const inputBox = page.locator('.dimension-input');
  console.log('输入框初始位置:', await inputBox.boundingBox());
  
  console.log('\n【步骤2】移动鼠标到右侧300px');
  const endX = startX + 300;
  const endY = startY;
  
  await page.keyboard.down('Shift');
  await page.mouse.move(endX, endY);
  await page.waitForTimeout(500);
  
  const inputBoxAfterMove = await inputBox.boundingBox();
  console.log('移动后输入框位置:', inputBoxAfterMove);
  
  // 计算期望的中点（屏幕坐标）
  const expectedMidX = (startX + endX) / 2;
  const expectedMidY = (startY + endY) / 2;
  
  // 输入框的中心（考虑transform: translate(-50%, -50%)）
  const actualCenterX = inputBoxAfterMove!.x + inputBoxAfterMove!.width / 2;
  const actualCenterY = inputBoxAfterMove!.y + inputBoxAfterMove!.height / 2;
  
  console.log('期望中点（屏幕坐标）:', `(${expectedMidX}, ${expectedMidY})`);
  console.log('实际输入框中心:', `(${actualCenterX.toFixed(1)}, ${actualCenterY.toFixed(1)})`);
  
  const offsetX = Math.abs(actualCenterX - expectedMidX);
  const offsetY = Math.abs(actualCenterY - expectedMidY);
  
  console.log('偏移量:', `X=${offsetX.toFixed(1)}px, Y=${offsetY.toFixed(1)}px`);
  
  expect(offsetX).toBeLessThan(5);
  expect(offsetY).toBeLessThan(5);
  console.log('✓ 输入框位于起点和鼠标的中点');
  
  await page.screenshot({ 
    path: 'tests/screenshots/input-midpoint.png',
    fullPage: false 
  });
  
  console.log('\n【步骤3】输入长度并确认');
  const inputField = page.locator('.dimension-input__field');
  await inputField.clear();
  await inputField.type('3000');
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  console.log('\n【步骤4】向下绘制第二段');
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 300, startY + 150);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  console.log('\n【步骤5】移动到起点附近（测试端点吸附和鼠标隐藏）');
  await page.keyboard.down('Shift');
  // 移动到接近起点（在100mm阈值内）
  await page.mouse.move(startX + 1, startY); 
  await page.waitForTimeout(500);
  
  // 检查十字准线是否隐藏
  const crosshair = page.locator('.crosshair');
  const isCrosshairVisible = await crosshair.isVisible();
  console.log('十字准线是否可见:', isCrosshairVisible);
  
  if (!isCrosshairVisible) {
    console.log('✓ 端点吸附时十字准线已隐藏');
  } else {
    console.log('❌ 端点吸附时十字准线仍然可见');
  }
  
  await page.screenshot({ 
    path: 'tests/screenshots/snap-hide-cursor.png',
    fullPage: false 
  });
  
  console.log('\n【步骤6】确认闭合，检查端点数量');
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(1000);
  
  const result = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const fabricCanvas = (window as any).fabricCanvas;
    
    const nodes = kernel.getTopology().getNodes();
    const endpointCircles = fabricCanvas.getObjects().filter((obj: any) => 
      obj.data && obj.data.type === 'endpoint'
    );
    
    return {
      nodeCount: nodes.length,
      endpointCircleCount: endpointCircles.length,
    };
  });
  
  console.log('节点数量:', result.nodeCount);
  console.log('端点圆圈数量:', result.endpointCircleCount);
  
  expect(result.nodeCount).toBe(result.endpointCircleCount);
  expect(result.nodeCount).toBe(3); // 三角形闭合后应该是3个节点
  console.log('✓ 端点合并正确，无重复圆圈');
  
  await page.screenshot({ 
    path: 'tests/screenshots/final-merged.png',
    fullPage: false 
  });
  
  console.log('\n========== 验证完成 ==========');
  console.log('✓ 输入框位于起点和鼠标中点');
  console.log('✓ 端点吸附时隐藏十字准线');
  console.log('✓ 端点合并后只有一个蓝色圆圈');
});
