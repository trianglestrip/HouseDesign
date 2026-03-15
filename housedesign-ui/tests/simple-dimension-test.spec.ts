import { test } from '@playwright/test';

test('简单测试数值输入框', async ({ page }) => {
  await page.goto('http://localhost:5181');
  
  // 等待画布加载
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
  
  console.log(`✓ 画布中心: (${x}, ${y})`);
  
  // 点击第一个点
  await page.mouse.click(x, y);
  await page.waitForTimeout(1000);
  
  console.log('✓ 已点击第一个点');
  
  // 截图查看状态
  await page.screenshot({ 
    path: 'tests/screenshots/after-first-click.png',
    fullPage: true 
  });
  
  // 打印页面上所有可见的元素
  const allElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const visible = [];
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      const style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
        visible.push({
          tag: el.tagName,
          class: el.className,
          id: el.id,
          text: el.textContent?.substring(0, 50)
        });
      }
    }
    return visible.slice(0, 50); // 只返回前50个
  });
  
  console.log('可见元素:', JSON.stringify(allElements, null, 2));
  
  // 检查是否有 dimension-input 类
  const hasDimensionInput = await page.locator('.dimension-input').count();
  console.log(`dimension-input 元素数量: ${hasDimensionInput}`);
  
  if (hasDimensionInput > 0) {
    const isVisible = await page.locator('.dimension-input').isVisible();
    console.log(`dimension-input 是否可见: ${isVisible}`);
    
    const styles = await page.locator('.dimension-input').evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        position: style.position,
        left: style.left,
        top: style.top,
      };
    });
    console.log('dimension-input 样式:', JSON.stringify(styles, null, 2));
  }
});
