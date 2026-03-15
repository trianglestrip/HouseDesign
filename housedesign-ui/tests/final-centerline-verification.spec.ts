import { test } from '@playwright/test';

test('验证墙体中心线对齐 - L形墙体', async ({ page }) => {
  // 监听console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[centerline]') || text.includes('[端点]') || text.includes('[墙体]')) {
      console.log(`[浏览器] ${text}`);
    }
  });
  
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 启用中心线调试显示
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
      console.log('[DEBUG] showCenterLine = true');
    }
  });
  
  console.log('\n========== 绘制L形墙体 ==========');
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  const inputField = page.locator('.dimension-input__field');
  
  // 点1: 起点
  console.log('【步骤1】点击起点');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  // 点2: 向右3m
  console.log('【步骤2】向右3m');
  await page.waitForSelector('.dimension-input__field', { timeout: 2000 });
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(200);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // 点3: 向下3m
  console.log('【步骤3】向下3m');
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY + 200);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(200);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // 结束
  console.log('【步骤4】右键结束');
  await page.mouse.click(startX + 200, startY + 200, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('\n========== 验证结果 ==========');
  
  const result = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const fabricCanvas = (window as any).fabricCanvas;
    
    const walls = kernel.getWalls();
    const nodes = kernel.getTopology().getNodes();
    const fabricObjects = fabricCanvas.getObjects();
    
    const centerLines = fabricObjects.filter((obj: any) => 
      obj.data && obj.data.type === 'centerline'
    );
    
    return {
      wallCount: walls.length,
      nodeCount: nodes.length,
      centerLineCount: centerLines.length,
      nodes: nodes.map((n: any) => ({
        id: n.id,
        x: n.position.x.toFixed(2),
        y: n.position.y.toFixed(2),
      })),
      centerLines: centerLines.map((line: any) => ({
        x1: line.x1?.toFixed(2),
        y1: line.y1?.toFixed(2),
        x2: line.x2?.toFixed(2),
        y2: line.y2?.toFixed(2),
        stroke: line.stroke,
      })),
    };
  });
  
  console.log('墙体数量:', result.wallCount);
  console.log('节点数量:', result.nodeCount);
  console.log('红色中心线数量:', result.centerLineCount);
  
  console.log('\n【节点位置】');
  result.nodes.forEach((n: any) => {
    console.log(`  ${n.id}: (${n.x}, ${n.y}) mm`);
  });
  
  console.log('\n【红色中心线】');
  if (result.centerLineCount > 0) {
    result.centerLines.forEach((line: any, i: number) => {
      console.log(`  中心线${i + 1}: (${line.x1}, ${line.y1}) -> (${line.x2}, ${line.y2}) px`);
      console.log(`  颜色: ${line.stroke}`);
    });
  } else {
    console.log('  ❌ 没有中心线！检查 renderAllWalls() 是否正确渲染');
  }
  
  // 截图
  await page.screenshot({ 
    path: 'tests/screenshots/final-centerline-test.png',
    fullPage: false 
  });
  
  console.log('\n【截图】final-centerline-test.png');
  console.log('【期望】红色虚线应该精确穿过蓝色端点圆圈的中心');
  console.log('【实际】请查看截图验证');
});
