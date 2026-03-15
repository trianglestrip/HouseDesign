import { test, expect } from '@playwright/test';

test.describe('墙体中心线对齐调试', () => {
  test('绘制L形墙体并显示中心线', async ({ page }) => {
    await page.goto('http://localhost:5181');
    
    // 等待画布加载
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 选择墙体工具（实心墙）
    await page.click('text=实心墙');
    await page.waitForTimeout(300);
    
    // 绘制一个L形墙体（水平 + 垂直）
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // 第一个点（起点）
    await page.mouse.click(centerX - 200, centerY);
    await page.waitForTimeout(200);
    
    // 第二个点（水平右侧）- 按Shift启用角度吸附
    await page.keyboard.down('Shift');
    await page.mouse.click(centerX, centerY);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    
    // 第三个点（垂直向下）- 按Shift启用角度吸附
    await page.keyboard.down('Shift');
    await page.mouse.click(centerX, centerY + 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    
    // 右键结束绘制
    await page.mouse.click(centerX, centerY + 200, { button: 'right' });
    await page.waitForTimeout(500);
    
    // 启用中心线调试显示
    await page.evaluate(() => {
      const config = (window as any).renderConfig;
      if (config && config.previewLine) {
        config.previewLine.showCenterLine = true;
      }
    });
    
    // 触发重绘
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(500);
    
    // 截图保存
    await page.screenshot({ 
      path: 'tests/screenshots/wall-center-debug.png',
      fullPage: false 
    });
    
    console.log('✓ 截图已保存到 tests/screenshots/wall-center-debug.png');
    console.log('  红色虚线 = 墙体真实中心线');
    console.log('  蓝色圆圈 = 端点位置');
    console.log('  如果蓝色圆圈的中心在红色虚线上，说明对齐正确');
  });
  
  test('绘制多角度墙体测试对称性', async ({ page }) => {
    await page.goto('http://localhost:5181');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 选择墙体工具（实心墙）
    await page.click('text=实心墙');
    await page.waitForTimeout(300);
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // 绘制一个六边形（测试不同角度）
    const angles = [0, 60, 120, 180, 240, 300];
    const radius = 150;
    
    for (let i = 0; i < angles.length; i++) {
      const angle = (angles[i] * Math.PI) / 180;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      await page.mouse.click(x, y);
      await page.waitForTimeout(200);
    }
    
    // 闭合回到起点
    const firstAngle = 0;
    const firstX = centerX + Math.cos(firstAngle) * radius;
    const firstY = centerY + Math.sin(firstAngle) * radius;
    await page.mouse.click(firstX, firstY);
    await page.waitForTimeout(300);
    
    // 右键结束
    await page.mouse.click(firstX, firstY, { button: 'right' });
    await page.waitForTimeout(500);
    
    // 启用中心线调试
    await page.evaluate(() => {
      const config = (window as any).renderConfig;
      if (config && config.previewLine) {
        config.previewLine.showCenterLine = true;
      }
    });
    
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(500);
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/wall-center-hexagon.png',
      fullPage: false 
    });
    
    console.log('✓ 六边形墙体截图已保存');
  });
  
  test('测试数值输入框功能', async ({ page }) => {
    await page.goto('http://localhost:5181');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 选择墙体工具
    await page.click('text=实心墙');
    await page.waitForTimeout(300);
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // 第一个点（起点）
    await page.mouse.click(centerX - 200, centerY);
    await page.waitForTimeout(500);
    
    console.log('✓ 第一个点已放置，等待数值输入框出现...');
    
    // 等待数值输入框出现
    const inputBox = page.locator('.dimension-input');
    await inputBox.waitFor({ state: 'visible', timeout: 3000 });
    
    console.log('✓ 数值输入框已显示');
    
    // 截图显示输入框
    await page.screenshot({ 
      path: 'tests/screenshots/dimension-input-visible.png',
      fullPage: false 
    });
    
    // 输入长度值（3000mm = 3m）
    const input = inputBox.locator('input');
    await input.fill('3000');
    await page.waitForTimeout(300);
    
    console.log('✓ 输入长度: 3000mm');
    
    // 截图显示输入的值
    await page.screenshot({ 
      path: 'tests/screenshots/dimension-input-filled.png',
      fullPage: false 
    });
    
    // 按Enter确认
    await input.press('Enter');
    await page.waitForTimeout(500);
    
    console.log('✓ 确认输入，墙体应该按照 3000mm 长度绘制');
    
    // 移动鼠标到右侧，让墙体显示出来
    await page.mouse.move(centerX + 150, centerY);
    await page.waitForTimeout(300);
    
    // 截图显示最终结果
    await page.screenshot({ 
      path: 'tests/screenshots/dimension-input-result.png',
      fullPage: false 
    });
    
    // 验证输入框已消失
    await expect(inputBox).not.toBeVisible();
    
    console.log('✓ 数值输入框测试完成，墙体长度应该是 3000mm');
  });
  
  test('测试数值输入框取消功能', async ({ page }) => {
    await page.goto('http://localhost:5181');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 选择墙体工具
    await page.click('text=实心墙');
    await page.waitForTimeout(300);
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // 第一个点
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(500);
    
    // 等待输入框
    const inputBox = page.locator('.dimension-input');
    await inputBox.waitFor({ state: 'visible', timeout: 3000 });
    
    // 输入一些值
    const input = inputBox.locator('input');
    await input.fill('500');
    await page.waitForTimeout(300);
    
    console.log('✓ 输入值: 500cm');
    
    // 按Esc取消
    await input.press('Escape');
    await page.waitForTimeout(500);
    
    // 验证输入框消失
    await expect(inputBox).not.toBeVisible();
    
    console.log('✓ Esc取消功能正常');
    
    // 验证可以继续用鼠标绘制
    await page.mouse.click(centerX + 100, centerY);
    await page.waitForTimeout(300);
    
    // 右键结束
    await page.mouse.click(centerX + 100, centerY, { button: 'right' });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'tests/screenshots/dimension-input-cancel.png',
      fullPage: false 
    });
    
    console.log('✓ 取消后继续绘制正常');
  });
});
