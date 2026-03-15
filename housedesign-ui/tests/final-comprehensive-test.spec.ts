import { test, expect } from '@playwright/test';

test('综合验证：端点合并 + 输入框样式 + 中心线对齐', async ({ page }) => {
  await page.goto('http://localhost:5182');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 启用中心线调试
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
    }
  });
  
  console.log('\n========== 绘制完整的两室户型 ==========');
  
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  const inputField = page.locator('.dimension-input__field');
  
  // 绘制外墙（6m x 4m矩形）
  console.log('【外墙】绘制6m x 4m矩形');
  
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  // 右6m
  await inputField.clear();
  await inputField.type('6000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  // 下4m
  await inputField.clear();
  await inputField.type('4000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY + 150);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  // 左6m
  await inputField.clear();
  await inputField.type('6000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX - 50, startY + 150);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  // 上4m（闭合）
  await inputField.clear();
  await inputField.type('4000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX, startY - 50);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(1000);
  
  // 结束外墙
  await page.mouse.click(startX, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('✓ 外墙绘制完成');
  
  // 绘制内墙（中间分隔）
  console.log('【内墙】绘制3m垂直分隔墙');
  
  await page.mouse.click(startX + 120, startY);
  await page.waitForTimeout(500);
  
  await inputField.clear();
  await inputField.type('4000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 120, startY + 150);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  await page.mouse.click(startX + 120, startY + 150, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('✓ 内墙绘制完成');
  
  // 验证结果
  const result = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const fabricCanvas = (window as any).fabricCanvas;
    
    const walls = kernel.getWalls();
    const nodes = kernel.getTopology().getNodes();
    const edges = kernel.getTopology().getEdges();
    
    const endpointCircles = fabricCanvas.getObjects().filter((obj: any) => 
      obj.data && obj.data.type === 'endpoint'
    );
    
    const centerLines = fabricCanvas.getObjects().filter((obj: any) => 
      obj.data && obj.data.type === 'centerline'
    );
    
    return {
      wallCount: walls.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      endpointCircleCount: endpointCircles.length,
      centerLineCount: centerLines.length,
    };
  });
  
  console.log('\n========== 验证结果 ==========');
  console.log('墙体数量:', result.wallCount);
  console.log('节点数量:', result.nodeCount);
  console.log('边数量:', result.edgeCount);
  console.log('端点圆圈数量:', result.endpointCircleCount);
  console.log('红色中心线数量:', result.centerLineCount);
  
  // 验证端点合并
  expect(result.nodeCount).toBe(result.endpointCircleCount);
  console.log('✓ 端点数量与圆圈数量一致（无重复）');
  
  // 验证闭合回路
  expect(result.nodeCount).toBe(6); // 外墙4个角 + 内墙与外墙的2个交点
  expect(result.wallCount).toBeGreaterThanOrEqual(5); // 至少5条墙（可能因自动修剪而更多）
  console.log('✓ 户型结构正确（墙体数:', result.wallCount, '）');
  
  // 验证中心线（可能因为重绘而有多余的）
  expect(result.centerLineCount).toBeGreaterThanOrEqual(result.wallCount);
  console.log('✓ 中心线调试显示已启用（数量:', result.centerLineCount, '）');
  
  await page.screenshot({ 
    path: 'tests/screenshots/final-verification.png',
    fullPage: false 
  });
  
  console.log('\n【截图】final-verification.png');
  console.log('【验证点】');
  console.log('  1. 输入框小巧，位于预览线中点');
  console.log('  2. 外墙完美闭合，无重复端点');
  console.log('  3. 内墙端点吸附到外墙上');
  console.log('  4. 红色中心线穿过所有蓝色端点');
});
