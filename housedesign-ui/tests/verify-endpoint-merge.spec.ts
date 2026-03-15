import { test, expect } from '@playwright/test';

test('验证闭合回路端点合并 - 不应出现重复端点', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[addWallPoint]') || text.includes('已存在边') || 
        text.includes('自环') || text.includes('[数值输入]')) {
      console.log(`[浏览器] ${text}`);
    }
  });
  
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
  
  console.log('\n========== 绘制闭合矩形 ==========');
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 400;
  const startY = box.y + 300;
  
  const inputField = page.locator('.dimension-input__field');
  
  // 绘制矩形：3m x 3m
  console.log('【步骤1】点1 - 起点');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  console.log('【步骤2】点2 - 向右3m');
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.waitForTimeout(200);
  // 保持Shift按住，直到Enter确认
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  console.log('【步骤3】点3 - 向下3m');
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  // 精确向下移动（X不变）
  await page.mouse.move(startX + 120, startY + 150);
  await page.waitForTimeout(200);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  console.log('【步骤4】点4 - 向左3m');
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  // 精确向左移动（Y不变）
  await page.mouse.move(startX - 50, startY + 120);
  await page.waitForTimeout(200);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(800);
  
  console.log('【步骤5】点5 - 闭合回到起点（向上3m）');
  await inputField.clear();
  await inputField.type('3000');
  await page.keyboard.down('Shift');
  // 精确向上移动（X坐标与node_3相同，Y向上）
  await page.mouse.move(startX, startY - 50);
  await page.waitForTimeout(200);
  await inputField.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(1000);
  
  // 结束
  await page.mouse.click(startX, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('\n========== 验证结果 ==========');
  
  const result = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const fabricCanvas = (window as any).fabricCanvas;
    
    const walls = kernel.getWalls();
    const nodes = kernel.getTopology().getNodes();
    const edges = kernel.getTopology().getEdges();
    
    // 统计每个节点的端点圆圈数量
    const endpointCircles = fabricCanvas.getObjects().filter((obj: any) => 
      obj.data && obj.data.type === 'endpoint'
    );
    
    const circleCountByNode = new Map();
    endpointCircles.forEach((circle: any) => {
      const nodeId = circle.data.nodeId;
      circleCountByNode.set(nodeId, (circleCountByNode.get(nodeId) || 0) + 1);
    });
    
    return {
      wallCount: walls.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      endpointCircleCount: endpointCircles.length,
      nodes: nodes.map((n: any) => ({
        id: n.id,
        edgeCount: n.edgeIds?.length || 0,
        circleCount: circleCountByNode.get(n.id) || 0,
      })),
      edges: edges.map((e: any) => ({
        id: e.id,
        from: e.nodeA,
        to: e.nodeB,
      })),
    };
  });
  
  console.log('墙体数量:', result.wallCount);
  console.log('节点数量:', result.nodeCount);
  console.log('边数量:', result.edgeCount);
  console.log('端点圆圈数量:', result.endpointCircleCount);
  
  console.log('\n【节点详情】');
  result.nodes.forEach((n: any) => {
    console.log(`  ${n.id}: ${n.edgeCount}条边, ${n.circleCount}个圆圈`);
    if (n.circleCount > 1) {
      console.log(`    ❌ 问题：出现了${n.circleCount}个重复圆圈！`);
    }
  });
  
  console.log('\n【边详情】');
  result.edges.forEach((e: any) => {
    console.log(`  ${e.id}: ${e.from} -> ${e.to}`);
  });
  
  // 检查是否有重复圆圈
  const hasDuplicates = result.nodes.some((n: any) => n.circleCount > 1);
  
  if (hasDuplicates) {
    console.log('\n❌ 测试失败：存在重复的端点圆圈');
  } else {
    console.log('\n✓ 测试通过：所有节点只有一个端点圆圈');
  }
  
  await page.screenshot({ 
    path: 'tests/screenshots/closed-loop-merge.png',
    fullPage: false 
  });
  
  console.log('\n【截图】closed-loop-merge.png');
  
  // 断言
  expect(hasDuplicates).toBe(false);
  expect(result.nodeCount).toBe(4); // 矩形应该只有4个节点
  expect(result.edgeCount).toBe(4); // 矩形应该只有4条边
});
