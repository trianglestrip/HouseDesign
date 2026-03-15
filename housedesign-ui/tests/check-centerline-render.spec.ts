import { test } from '@playwright/test';

test('验证中心线数据是否正确', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 启用中心线显示
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
      console.log('[DEBUG] 已启用 showCenterLine');
    }
  });
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 400;
  const startY = box.y + 300;
  
  console.log('\n========== 绘制一条简单直线墙体 ==========');
  
  // 点1
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(300);
  
  // 点2（向右3m）
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // 右键结束绘制
  await page.mouse.click(startX + 200, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('✓ 直线墙体绘制完成');
  
  // 检查生成的数据
  const debugData = await page.evaluate(() => {
    const kernel = (window as any).geometryKernel;
    const fabricCanvas = (window as any).fabricCanvas;
    
    if (!kernel || !fabricCanvas) return { error: 'kernel或fabricCanvas未找到' };
    
    const walls = kernel.getWalls();
    const topology = kernel.getTopology();
    
    // 找到fabric画布上的对象
    const fabricObjects = fabricCanvas.getObjects();
    const centerLines = fabricObjects.filter((obj: any) => 
      obj.data && obj.data.type === 'centerline'
    );
    
    return {
      wallCount: walls.length,
      nodeCount: topology.getNodes().length,
      fabricObjectCount: fabricObjects.length,
      centerLineCount: centerLines.length,
      centerLineData: centerLines.map((line: any) => ({
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        stroke: line.stroke,
      })),
      firstWall: walls[0] ? {
        id: walls[0].id,
        nodeA: walls[0].nodeA,
        nodeB: walls[0].nodeB,
        thickness: walls[0].thickness,
      } : null,
    };
  });
  
  console.log('\n【调试数据】');
  
  if (debugData.error) {
    console.log('❌ 错误:', debugData.error);
    return;
  }
  
  console.log('墙体数量:', debugData.wallCount);
  console.log('节点数量:', debugData.nodeCount);
  console.log('Fabric对象数量:', debugData.fabricObjectCount);
  console.log('中心线数量:', debugData.centerLineCount);
  
  if (debugData.centerLineCount > 0) {
    console.log('\n【中心线详情】');
    debugData.centerLineData.forEach((line: any, i: number) => {
      console.log(`  中心线${i + 1}: (${line.x1}, ${line.y1}) -> (${line.x2}, ${line.y2})`);
      console.log(`  颜色: ${line.stroke}`);
    });
  } else {
    console.log('\n❌ 问题：没有渲染中心线！');
    console.log('  检查 CanvasView.vue 的 renderAllWalls() 函数');
    console.log('  确认 previewConfig.showCenterLine 是否为 true');
  }
  
  await page.screenshot({ 
    path: 'tests/screenshots/centerline-check.png',
    fullPage: false 
  });
  
  console.log('\n【截图】centerline-check.png');
});
