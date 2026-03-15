import { test } from '@playwright/test';

test('调试数值输入框显示', async ({ page }) => {
  // 监听控制台日志
  page.on('console', msg => {
    console.log(`[浏览器控制台] ${msg.type()}: ${msg.text()}`);
  });
  
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  console.log('✓ 已选择实心墙工具');
  
  // 获取画布位置
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  console.log(`准备点击位置: (${x}, ${y})`);
  
  // 在点击前检查状态
  const beforeClick = await page.evaluate(() => {
    return {
      dimensionInputVisible: (window as any).dimensionInputVisible,
      hasDimensionInput: document.querySelectorAll('.dimension-input').length,
    };
  });
  console.log('点击前状态:', beforeClick);
  
  // 点击第一个点
  await page.mouse.click(x, y);
  await page.waitForTimeout(1000);
  
  console.log('✓ 已点击第一个点');
  
  // 点击后检查状态
  const afterClick = await page.evaluate(() => {
    return {
      dimensionInputVisible: (window as any).dimensionInputVisible,
      hasDimensionInput: document.querySelectorAll('.dimension-input').length,
      allDivs: Array.from(document.querySelectorAll('div')).map(d => ({
        class: d.className,
        visible: d.offsetParent !== null,
        text: d.textContent?.substring(0, 30)
      })).filter(d => d.class.includes('dimension') || d.class.includes('input'))
    };
  });
  console.log('点击后状态:', JSON.stringify(afterClick, null, 2));
  
  // 截图
  await page.screenshot({ 
    path: 'tests/screenshots/debug-dimension-input.png',
    fullPage: true 
  });
  
  console.log('✓ 截图已保存');
});
