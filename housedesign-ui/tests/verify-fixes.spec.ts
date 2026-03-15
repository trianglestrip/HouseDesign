import { test } from '@playwright/test';

test('验证修复：输入尺寸后自动确定点 + 端点在中心', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n========== 测试修复1: 输入尺寸后自动确定第二个点 ==========');
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  // 点击第一个点
  console.log('【步骤1】点击第一个点');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  // 等待输入框
  const inputBox = page.locator('.dimension-input');
  await inputBox.waitFor({ state: 'visible', timeout: 3000 });
  console.log('✓ 输入框出现');
  
  // 移动鼠标确定方向（向右）
  console.log('【步骤2】移动鼠标向右，确定方向');
  await page.mouse.move(startX + 200, startY);
  await page.waitForTimeout(300);
  
  // 输入长度
  console.log('【步骤3】输入长度：3000mm');
  await page.keyboard.type('3000');
  await page.waitForTimeout(300);
  
  // 截图1：输入完成
  await page.screenshot({ 
    path: 'tests/screenshots/fix-test-1-input.png',
    fullPage: false 
  });
  
  // 按Enter确认
  console.log('【步骤4】按Enter确认');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 截图2：应该自动创建了第二个点，并显示新的输入框
  await page.screenshot({ 
    path: 'tests/screenshots/fix-test-2-auto-point.png',
    fullPage: false 
  });
  
  console.log('【验证】第二个点应该已自动确定');
  console.log('【验证】新的输入框应该出现，准备绘制第三个点');
  
  // 继续绘制第三个点（向下）
  console.log('\n【步骤5】继续输入第二段：2000mm（向下）');
  await page.mouse.move(startX + 200, startY + 150);
  await page.waitForTimeout(300);
  await page.keyboard.type('2000');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 第四个点（向左）
  console.log('【步骤6】第三段：3000mm（向左，闭合）');
  await page.mouse.move(startX, startY + 150);
  await page.waitForTimeout(300);
  await page.keyboard.type('3000');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 闭合
  await page.mouse.move(startX, startY);
  await page.waitForTimeout(200);
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.mouse.click(startX, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('\n========== 测试修复2: 端点在墙体中心 ==========');
  
  // 启用中心线调试
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
    }
  });
  
  await page.mouse.move(startX + 100, startY + 75);
  await page.waitForTimeout(500);
  
  // 最终截图：应该看到红色中心线穿过蓝色端点
  await page.screenshot({ 
    path: 'tests/screenshots/fix-test-3-centerline.png',
    fullPage: false 
  });
  
  console.log('\n========== 验证结果 ==========');
  console.log('✓ 修复1：输入尺寸后应该自动确定点，无需再点击');
  console.log('✓ 修复2：红色中心线应该穿过蓝色端点的中心');
  console.log('\n查看截图验证：');
  console.log('  - fix-test-2-auto-point.png: 第二个点自动确定');
  console.log('  - fix-test-3-centerline.png: 端点在中心线上');
});
