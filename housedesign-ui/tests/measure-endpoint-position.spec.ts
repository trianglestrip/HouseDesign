import { test } from '@playwright/test';

test('精确测量端点位置 - 验证是否在中心线上', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n========== 精确测量端点位置 ==========');
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  // 绘制一个L形墙体（90度角）
  console.log('【步骤1】绘制直角L形墙体');
  
  // 点1
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(300);
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 点2（向下）
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY + 200);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 结束
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 200, startY + 200, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('【步骤2】获取几何数据');
  
  // 获取节点和墙体数据
  const geometryData = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    if (!kernel) return null;
    
    const topology = kernel.getTopology();
    const nodes = topology.getNodes();
    const walls = kernel.getWalls();
    
    return {
      nodes: nodes.map((n: any) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
      })),
      walls: walls.map((w: any) => ({
        id: w.id,
        nodeA: w.nodeA,
        nodeB: w.nodeB,
        thickness: w.thickness,
      })),
      scale: (window as any).renderConfig?.scale?.pixelsPerMeter || 40,
    };
  });
  
  console.log('\n【几何数据】');
  console.log('节点数量:', geometryData.nodes.length);
  console.log('墙体数量:', geometryData.walls.length);
  console.log('缩放比例:', geometryData.scale, 'px/m');
  
  // 找到中间的拐点（应该是node_1）
  const cornerNode = geometryData.nodes[1];
  console.log('\n【拐点节点】', cornerNode);
  console.log('  位置(mm):', cornerNode.x, cornerNode.y);
  
  const scale = geometryData.scale / 1000; // mm -> px
  const cornerPx = {
    x: cornerNode.x * scale,
    y: cornerNode.y * scale,
  };
  console.log('  位置(px):', cornerPx.x, cornerPx.y);
  
  // 获取端点圆圈的实际渲染位置
  const endpointData = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    
    // 查找所有 fabric 圆形对象
    const fabricCanvas = (canvas as any).__canvas;
    if (!fabricCanvas) return null;
    
    const circles = fabricCanvas.getObjects().filter((obj: any) => 
      obj.data && obj.data.type === 'endpoint'
    );
    
    return circles.map((circle: any) => ({
      nodeId: circle.data.nodeId,
      left: circle.left,
      top: circle.top,
      radius: circle.radius,
      centerX: circle.left + circle.radius,
      centerY: circle.top + circle.radius,
    }));
  });
  
  console.log('\n【端点圆圈渲染位置】');
  const cornerCircle = endpointData.find((c: any) => c.nodeId === cornerNode.id);
  if (cornerCircle) {
    console.log('  圆圈中心(px):', cornerCircle.centerX, cornerCircle.centerY);
    console.log('  节点位置(px):', cornerPx.x, cornerPx.y);
    
    const offsetX = cornerCircle.centerX - cornerPx.x;
    const offsetY = cornerCircle.centerY - cornerPx.y;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    
    console.log('\n【偏移量】');
    console.log('  X偏移:', offsetX.toFixed(2), 'px');
    console.log('  Y偏移:', offsetY.toFixed(2), 'px');
    console.log('  总距离:', distance.toFixed(2), 'px');
    
    if (distance > 1) {
      console.log('\n❌ 问题确认：端点圆圈偏离节点位置 ' + distance.toFixed(2) + ' 像素');
      console.log('  期望：偏移应该接近0');
      console.log('  实际：偏移超过1像素，说明渲染位置不正确');
    } else {
      console.log('\n✓ 端点位置正确：偏移在可接受范围内');
    }
  }
  
  // 启用红色中心线调试
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
    }
  });
  await page.mouse.move(startX + 100, startY + 100);
  await page.waitForTimeout(500);
  
  // 放大截图
  await page.screenshot({ 
    path: 'tests/screenshots/endpoint-alignment-debug.png',
    fullPage: false 
  });
  
  console.log('\n【截图】endpoint-alignment-debug.png');
  console.log('  红色虚线 = 墙体真实中心线（节点连线）');
  console.log('  蓝色圆圈 = 端点渲染位置');
  console.log('  如果不重合，说明端点渲染逻辑有问题');
});
