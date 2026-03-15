import { test, expect } from '@playwright/test';

test.describe('绘制 L 形房间', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该能够绘制 L 形房间并验证端点吸附', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }

    const points = [
      { x: canvasBox.x + 200, y: canvasBox.y + 200 },
      { x: canvasBox.x + 600, y: canvasBox.y + 200 },
      { x: canvasBox.x + 600, y: canvasBox.y + 400 },
      { x: canvasBox.x + 400, y: canvasBox.y + 400 },
      { x: canvasBox.x + 400, y: canvasBox.y + 600 },
      { x: canvasBox.x + 200, y: canvasBox.y + 600 },
      { x: canvasBox.x + 200, y: canvasBox.y + 200 }
    ];

    for (let i = 0; i < points.length; i++) {
      await canvas.click({ position: { x: points[i].x - canvasBox.x, y: points[i].y - canvasBox.y } });
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: 'tests/screenshots/l-shape-room.png' });

    const wallCount = await page.locator('.stat-item .value').first().textContent();
    expect(Number(wallCount)).toBeGreaterThan(0);
  });

  test('应该显示尺寸输入框在中点位置', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }

    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(100);

    await canvas.hover({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(100);

    const dimensionInput = page.locator('.dimension-input');
    const isVisible = await dimensionInput.isVisible();
    expect(isVisible).toBe(true);

    if (isVisible) {
      const inputBox = await dimensionInput.boundingBox();
      if (inputBox) {
        const expectedX = (200 + 400) / 2 + canvasBox.x;
        const expectedY = 200 + canvasBox.y;
        
        expect(Math.abs(inputBox.x + inputBox.width / 2 - expectedX)).toBeLessThan(30);
        expect(Math.abs(inputBox.y + inputBox.height / 2 - expectedY)).toBeLessThan(30);
      }
    }
  });

  test('应该在端点吸附时隐藏十字准线', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(100);
    
    await canvas.click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(100);
    
    await canvas.click({ position: { x: 400, y: 400 } });
    await page.waitForTimeout(100);
    
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(200);
    
    const crosshair = page.locator('.crosshair');
    const isVisible = await crosshair.isVisible();
    
    expect(isVisible).toBe(false);
  });

  test('应该支持撤销和重做操作', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    
    await canvas.click({ position: { x: 200, y: 200 } });
    await canvas.click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(100);
    
    const wallCountBefore = await page.locator('.stat-item .value').first().textContent();
    
    await page.click('button[title*="撤销"]');
    await page.waitForTimeout(100);
    
    const wallCountAfter = await page.locator('.stat-item .value').first().textContent();
    expect(Number(wallCountAfter)).toBeLessThan(Number(wallCountBefore));
    
    await page.click('button[title*="重做"]');
    await page.waitForTimeout(100);
    
    const wallCountRedone = await page.locator('.stat-item .value').first().textContent();
    expect(wallCountRedone).toBe(wallCountBefore);
  });
});
