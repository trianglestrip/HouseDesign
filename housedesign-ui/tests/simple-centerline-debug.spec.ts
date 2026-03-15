import { test } from '@playwright/test';

test('简化调试：直接观察端点和中心线', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 启用红色中心线调试显示
  await page.evaluate(() => {
    const config = (window as any).renderConfig;
    if (config && config.previewLine) {
      config.previewLine.showCenterLine = true;
    }
  });
  
  console.log('✓ 已启用红色中心线调试显示');
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 300;
  const startY = box.y + 300;
  
  console.log('\n========== 绘制简单L形墙体 ==========');
  
  // 点1（起点）
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(300);
  
  // 点2（向右3m）
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 点3（向下3m）
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY + 200);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // 结束绘制
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 200, startY + 200, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('✓ L形墙体绘制完成');
  
  // 移动鼠标触发重绘
  await page.mouse.move(startX + 100, startY + 100);
  await page.waitForTimeout(500);
  
  // 放大拐点区域截图
  console.log('\n========== 放大拐点区域截图 ==========');
  await page.screenshot({ 
    path: 'tests/screenshots/centerline-debug-full.png',
    fullPage: false 
  });
  
  console.log('\n查看截图：centerline-debug-full.png');
  console.log('【期望】红色虚线应该穿过蓝色端点圆圈的正中心');
  console.log('【实际】如果红色线不在蓝色圆圈中心，说明问题存在');
  console.log('\n可能的原因：');
  console.log('  1. 端点渲染使用了错误的坐标');
  console.log('  2. 墙体多边形的角平分线计算有误');
  console.log('  3. 坐标转换（mm -> px）有问题');
});
