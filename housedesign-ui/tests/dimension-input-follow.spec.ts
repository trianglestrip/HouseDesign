import { test } from '@playwright/test';

test('测试数值输入框跟随鼠标移动', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  // 点击第一个点
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  console.log('✓ 第一个点已放置');
  
  // 等待输入框出现
  const inputBox = page.locator('.dimension-input');
  await inputBox.waitFor({ state: 'visible', timeout: 3000 });
  
  console.log('✓ 数值输入框已显示');
  
  // 截图1：初始位置
  await page.screenshot({ 
    path: 'tests/screenshots/input-follow-1.png',
    fullPage: false 
  });
  
  // 移动鼠标到右侧
  await page.mouse.move(startX + 150, startY);
  await page.waitForTimeout(300);
  
  console.log('✓ 鼠标移动到右侧');
  
  // 截图2：输入框应该跟随到右侧
  await page.screenshot({ 
    path: 'tests/screenshots/input-follow-2.png',
    fullPage: false 
  });
  
  // 移动鼠标到下方
  await page.mouse.move(startX + 150, startY + 150);
  await page.waitForTimeout(300);
  
  console.log('✓ 鼠标移动到下方');
  
  // 截图3：输入框应该跟随到下方
  await page.screenshot({ 
    path: 'tests/screenshots/input-follow-3.png',
    fullPage: false 
  });
  
  // 在输入框中输入数字（焦点应该一直在输入框中）
  await page.keyboard.type('2500');
  await page.waitForTimeout(300);
  
  console.log('✓ 输入长度: 2500mm');
  
  // 截图4：显示输入的值
  await page.screenshot({ 
    path: 'tests/screenshots/input-follow-4.png',
    fullPage: false 
  });
  
  // 按Enter确认
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  console.log('✓ 确认输入');
  
  // 移动鼠标显示最终墙体
  await page.mouse.move(startX + 150, startY + 150);
  await page.waitForTimeout(300);
  
  // 截图5：最终结果，墙体长度应该是 2500mm
  await page.screenshot({ 
    path: 'tests/screenshots/input-follow-5-result.png',
    fullPage: false 
  });
  
  console.log('✓ 测试完成，墙体长度应该是 2500mm');
});
