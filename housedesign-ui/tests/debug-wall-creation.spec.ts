import { test } from '@playwright/test';

test('详细调试墙体创建流程', async ({ page }) => {
  // 监听所有console消息
  page.on('console', msg => console.log(`[浏览器] ${msg.text()}`));
  
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n========== 步骤1：选择墙体工具 ==========');
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 400;
  const startY = box.y + 300;
  
  console.log('\n========== 步骤2：点击起点 ==========');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  const afterFirstClick = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    return {
      nodeCount: kernel.getTopology().getNodes().length,
      wallCount: kernel.getWalls().length,
    };
  });
  console.log('第一次点击后 - 节点数:', afterFirstClick.nodeCount, '墙体数:', afterFirstClick.wallCount);
  
  console.log('\n========== 步骤3：输入长度3000mm ==========');
  
  // 等待输入框出现
  await page.waitForSelector('.dimension-input__field', { timeout: 2000 });
  const inputField = page.locator('.dimension-input__field');
  
  //清空并输入
  await inputField.clear();
  await inputField.type('3000');
  await page.waitForTimeout(200);
  
  const inputValue = await inputField.inputValue();
  console.log('输入框当前值:', inputValue);
  
  console.log('\n========== 步骤4：移动鼠标（水平方向）==========');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(200);
  
  console.log('\n========== 步骤5：按Enter确认 ==========');
  
  // 确保焦点在输入框上
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  const afterEnter = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    return {
      nodeCount: kernel.getTopology().getNodes().length,
      wallCount: kernel.getWalls().length,
      nodes: kernel.getTopology().getNodes().map((n: any) => ({
        id: n.id,
        x: n.position.x.toFixed(2),
        y: n.position.y.toFixed(2),
      })),
    };
  });
  
  console.log('按Enter后 - 节点数:', afterEnter.nodeCount, '墙体数:', afterEnter.wallCount);
  console.log('节点列表:');
  afterEnter.nodes.forEach((n: any) => {
    console.log(`  ${n.id}: (${n.x}, ${n.y}) mm`);
  });
  
  console.log('\n========== 步骤6：右键结束 ==========');
  await page.mouse.click(startX + 200, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  const afterRightClick = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const walls = kernel.getWalls();
    return {
      nodeCount: kernel.getTopology().getNodes().length,
      wallCount: walls.length,
      walls: walls.map((w: any) => ({
        id: w.id,
        nodeA: w.nodeA,
        nodeB: w.nodeB,
        thickness: w.thickness,
      })),
    };
  });
  
  console.log('右键后 - 节点数:', afterRightClick.nodeCount, '墙体数:', afterRightClick.wallCount);
  
  if (afterRightClick.wallCount === 0) {
    console.log('\n❌ 墙体未创建！可能的原因：');
    console.log('  1. handleDimensionConfirm 中的 addWallPoint 失败');
    console.log('  2. 右键事件触发了删除或清除操作');
    console.log('  3. 数值输入框的confirm事件没有正确触发');
  } else {
    console.log('\n✓ 墙体创建成功！');
    afterRightClick.walls.forEach((w: any) => {
      console.log(`  ${w.id}: ${w.nodeA} -> ${w.nodeB}, 厚度${w.thickness}mm`);
    });
  }
  
  await page.screenshot({ 
    path: 'tests/screenshots/debug-wall-creation.png',
    fullPage: false 
  });
});
