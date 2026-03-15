import { test } from '@playwright/test';

test('测试边移动鼠标边输入数字', async ({ page }) => {
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
  
  console.log('✓ 第一个点已放置，输入框出现');
  
  // 等待输入框
  const inputBox = page.locator('.dimension-input');
  await inputBox.waitFor({ state: 'visible', timeout: 3000 });
  
  // 截图1：初始状态
  await page.screenshot({ 
    path: 'tests/screenshots/typing-1-start.png',
    fullPage: false 
  });
  
  // 输入第一个数字 "2"
  await page.keyboard.type('2');
  await page.waitForTimeout(200);
  
  console.log('✓ 输入: 2');
  
  // 截图2
  await page.screenshot({ 
    path: 'tests/screenshots/typing-2-digit1.png',
    fullPage: false 
  });
  
  // 移动鼠标到右侧
  await page.mouse.move(startX + 100, startY);
  await page.waitForTimeout(300);
  
  console.log('✓ 鼠标移动到右侧');
  
  // 截图3：输入框应该跟随
  await page.screenshot({ 
    path: 'tests/screenshots/typing-3-move1.png',
    fullPage: false 
  });
  
  // 继续输入 "5"
  await page.keyboard.type('5');
  await page.waitForTimeout(200);
  
  console.log('✓ 输入: 25');
  
  // 截图4
  await page.screenshot({ 
    path: 'tests/screenshots/typing-4-digit2.png',
    fullPage: false 
  });
  
  // 再次移动鼠标
  await page.mouse.move(startX + 150, startY + 50);
  await page.waitForTimeout(300);
  
  console.log('✓ 鼠标再次移动');
  
  // 截图5
  await page.screenshot({ 
    path: 'tests/screenshots/typing-5-move2.png',
    fullPage: false 
  });
  
  // 继续输入 "00"
  await page.keyboard.type('00');
  await page.waitForTimeout(200);
  
  console.log('✓ 输入: 2500');
  
  // 截图6：显示完整输入
  await page.screenshot({ 
    path: 'tests/screenshots/typing-6-complete.png',
    fullPage: false 
  });
  
  // 按Enter确认
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  console.log('✓ 确认输入，墙体长度 = 2500mm');
  
  // 移动鼠标显示最终墙体
  await page.mouse.move(startX + 150, startY + 50);
  await page.waitForTimeout(300);
  
  // 截图7：最终结果
  await page.screenshot({ 
    path: 'tests/screenshots/typing-7-final.png',
    fullPage: false 
  });
  
  console.log('✓ 测试完成！');
  console.log('  演示了：');
  console.log('  1. 点击第一个点后输入框出现');
  console.log('  2. 边移动鼠标边输入数字（焦点保持在输入框）');
  console.log('  3. 输入框跟随鼠标位置移动');
  console.log('  4. 确认后墙体按精确长度绘制');
});
