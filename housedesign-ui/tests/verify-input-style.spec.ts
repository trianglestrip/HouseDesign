import { test } from '@playwright/test';

test('验证输入框样式和位置 - 应该小巧且在中点', async ({ page }) => {
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[输入框位置]')) {
      console.log(`[浏览器] ${text}`);
    }
  });
  
  await page.goto('http://localhost:5182');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n========== 测试输入框样式和位置 ==========');
  
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 400;
  const startY = box.y + 300;
  
  console.log('【步骤1】点击起点');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(500);
  
  // 检查输入框是否出现
  const inputBox = page.locator('.dimension-input');
  const isVisible = await inputBox.isVisible();
  console.log('输入框是否可见:', isVisible);
  
  if (isVisible) {
    const inputBoxRect = await inputBox.boundingBox();
    console.log('输入框位置:', inputBoxRect);
    console.log('输入框尺寸:', `${inputBoxRect?.width}px x ${inputBoxRect?.height}px`);
  }
  
  console.log('\n【步骤2】移动鼠标到右侧');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 200, startY);
  await page.waitForTimeout(500);
  
  // 检查输入框是否移动到中点
  if (isVisible) {
    const newInputBoxRect = await inputBox.boundingBox();
    console.log('移动后输入框位置:', newInputBoxRect);
    
    const expectedMidX = (startX + (startX + 200)) / 2;
    const expectedMidY = startY;
    const actualX = newInputBoxRect!.x + newInputBoxRect!.width / 2;
    const actualY = newInputBoxRect!.y + newInputBoxRect!.height / 2;
    
    console.log('期望中点:', `(${expectedMidX}, ${expectedMidY})`);
    console.log('实际中心:', `(${actualX.toFixed(1)}, ${actualY.toFixed(1)})`);
    
    const offsetX = Math.abs(actualX - expectedMidX);
    const offsetY = Math.abs(actualY - expectedMidY);
    
    if (offsetX < 5 && offsetY < 5) {
      console.log('✓ 输入框位置正确（在中点）');
    } else {
      console.log('❌ 输入框位置偏移:', `X偏移${offsetX.toFixed(1)}px, Y偏移${offsetY.toFixed(1)}px`);
    }
  }
  
  await page.keyboard.up('Shift');
  
  // 截图
  await page.screenshot({ 
    path: 'tests/screenshots/input-box-style.png',
    fullPage: false 
  });
  
  console.log('\n【截图】input-box-style.png');
  console.log('【期望】输入框小巧，位于起点和鼠标中点');
});
