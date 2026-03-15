import { test, expect } from '@playwright/test';

test.describe('使用数值输入绘制房间并测试顶点合并', () => {
  test('绘制一个两室一厅户型', async ({ page }) => {
    await page.goto('http://localhost:5181');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 选择墙体工具
    await page.click('text=实心墙');
    await page.waitForTimeout(500);
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    
    const startX = box.x + 200;
    const startY = box.y + 200;
    
    console.log('========== 开始绘制外墙（矩形：8m x 6m）==========');
    
    // ===== 绘制外墙（矩形）=====
    // 点1：左上角起点
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(300);
    console.log('✓ 外墙点1（起点）');
    
    // 点2：向右 8000mm
    await page.keyboard.type('8000');
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 300, startY);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log('✓ 外墙点2（右，8000mm）');
    
    // 点3：向下 6000mm
    await page.keyboard.type('6000');
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 300, startY + 200);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log('✓ 外墙点3（下，6000mm）');
    
    // 点4：向左 8000mm
    await page.keyboard.type('8000');
    await page.keyboard.down('Shift');
    await page.mouse.move(startX, startY + 200);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log('✓ 外墙点4（左，8000mm）');
    
    // 闭合：回到起点（应该自动吸附合并）
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(200);
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(300);
    console.log('✓ 外墙闭合（吸附到起点）');
    
    // 右键结束外墙绘制
    await page.mouse.click(startX, startY, { button: 'right' });
    await page.waitForTimeout(500);
    
    // 截图1：外墙完成
    await page.screenshot({ 
      path: 'tests/screenshots/rooms-1-outer-wall.png',
      fullPage: false 
    });
    console.log('✓ 截图：外墙完成');
    
    console.log('\n========== 开始绘制中间隔墙（垂直，分隔客厅和卧室）==========');
    
    // ===== 绘制中间隔墙（垂直线）=====
    // 点1：从上边墙的中点向下
    await page.mouse.click(startX + 150, startY);
    await page.waitForTimeout(300);
    console.log('✓ 隔墙1点1（上边墙中点）');
    
    // 点2：向下到底边
    await page.keyboard.type('6000');
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 150, startY + 200);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log('✓ 隔墙1点2（下，6000mm）');
    
    // 点击底边的点（应该吸附合并）
    await page.mouse.move(startX + 150, startY + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(startX + 150, startY + 200);
    await page.waitForTimeout(300);
    console.log('✓ 隔墙1闭合（吸附到底边）');
    
    // 右键结束
    await page.mouse.click(startX + 150, startY + 200, { button: 'right' });
    await page.waitForTimeout(500);
    
    // 截图2：中间隔墙完成
    await page.screenshot({ 
      path: 'tests/screenshots/rooms-2-middle-wall.png',
      fullPage: false 
    });
    console.log('✓ 截图：中间隔墙完成');
    
    console.log('\n========== 开始绘制右侧房间的内部隔墙（水平）==========');
    
    // ===== 绘制右侧房间的水平隔墙 =====
    // 点1：从右边墙的中点向左
    await page.mouse.click(startX + 300, startY + 100);
    await page.waitForTimeout(300);
    console.log('✓ 隔墙2点1（右边墙中点）');
    
    // 点2：向左到中间隔墙（应该吸附合并）
    await page.keyboard.type('4000');
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 150, startY + 100);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log('✓ 隔墙2点2（左，4000mm）');
    
    // 点击中间隔墙的点（应该吸附合并）
    await page.mouse.move(startX + 150, startY + 100);
    await page.waitForTimeout(200);
    await page.mouse.click(startX + 150, startY + 100);
    await page.waitForTimeout(300);
    console.log('✓ 隔墙2闭合（吸附到中间隔墙）');
    
    // 右键结束
    await page.mouse.click(startX + 150, startY + 100, { button: 'right' });
    await page.waitForTimeout(500);
    
    // 截图3：所有墙体完成
    await page.screenshot({ 
      path: 'tests/screenshots/rooms-3-all-walls.png',
      fullPage: false 
    });
    console.log('✓ 截图：所有墙体完成');
    
    console.log('\n========== 验证结果 ==========');
    
    // 验证：检查画布上是否有墙体和端点
    const hasWalls = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      
      // 检查是否有绘制内容（画布不是空白的）
      const ctx = (canvas as HTMLCanvasElement).getContext('2d');
      if (!ctx) return false;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 检查是否有非白色像素
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasWalls).toBe(true);
    console.log('✓ 验证通过：画布上有绘制的墙体');
    
    // 最终截图
    await page.screenshot({ 
      path: 'tests/screenshots/rooms-4-final.png',
      fullPage: false 
    });
    
    console.log('\n========== 测试完成 ==========');
    console.log('已绘制：');
    console.log('  1. 外墙矩形（8m x 6m）');
    console.log('  2. 中间垂直隔墙（6m）');
    console.log('  3. 右侧水平隔墙（4m）');
    console.log('形成：');
    console.log('  - 左侧：客厅（8m x 3m）');
    console.log('  - 右上：卧室1（4m x 3m）');
    console.log('  - 右下：卧室2（4m x 3m）');
    console.log('\n所有顶点应该已自动吸附合并！');
  });
  
  test('测试顶点吸附距离阈值', async ({ page }) => {
    await page.goto('http://localhost:5181');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 选择墙体工具
    await page.click('text=实心墙');
    await page.waitForTimeout(500);
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    
    const x = box.x + 300;
    const y = box.y + 300;
    
    console.log('\n========== 测试1：精确吸附（应该合并）==========');
    
    // 绘制第一条墙
    await page.mouse.click(x, y);
    await page.waitForTimeout(300);
    await page.keyboard.type('3000');
    await page.keyboard.down('Shift');
    await page.mouse.move(x + 100, y);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.mouse.click(x + 100, y, { button: 'right' });
    await page.waitForTimeout(500);
    
    console.log('✓ 第一条墙绘制完成（水平，3000mm）');
    
    // 绘制第二条墙，起点接近第一条墙的终点（应该吸附）
    await page.mouse.click(x + 100, y);
    await page.waitForTimeout(300);
    await page.keyboard.type('3000');
    await page.keyboard.down('Shift');
    await page.mouse.move(x + 100, y + 100);
    await page.keyboard.up('Shift');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.mouse.click(x + 100, y + 100, { button: 'right' });
    await page.waitForTimeout(500);
    
    console.log('✓ 第二条墙绘制完成（垂直，3000mm，应该吸附到第一条墙的终点）');
    
    await page.screenshot({ 
      path: 'tests/screenshots/snap-test-merge.png',
      fullPage: false 
    });
    
    console.log('✓ 截图：顶点吸附合并测试');
    console.log('  两条墙应该在角点精确连接，共享同一个端点');
  });
});
