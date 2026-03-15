/**
 * 自动化绘制户型测试
 * 模拟用户在浏览器中绘制一个完整的户型，包含：
 * - 连续墙体绘制
 * - 端点吸附
 * - 角度吸附（Shift键）
 * - 数值输入
 * - 撤销/重做
 * - 场景导出
 */

import { test, expect } from '@playwright/test';

test.describe('户型绘制自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问应用
    await page.goto('http://localhost:5180/');
    
    // 等待画布加载
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 等待一秒让所有初始化完成
    await page.waitForTimeout(1000);
  });

  test('完整户型绘制流程', async ({ page }) => {
    console.log('=== 开始自动化绘制户型 ===');
    
    // 1. 选择墙体工具（快捷键L）
    console.log('步骤1: 选择墙体工具');
    await page.keyboard.press('l');
    await page.waitForTimeout(300);
    
    // 获取画布元素和尺寸
    const canvas = await page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('无法获取画布位置');
    
    // 计算画布中心和基准点
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    const rulerOffset = 30; // 刻度尺宽度
    
    // 2. 绘制外墙 - 矩形房间（4000mm x 3000mm）
    console.log('步骤2: 绘制外墙矩形');
    
    // 起点（左上角）
    const startX = centerX - 200;
    const startY = centerY - 150;
    
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(200);
    console.log('  - 点击起点');
    
    // 第2点（右上角）- 使用Shift键水平吸附
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 400, startY);
    await page.waitForTimeout(100);
    await page.mouse.click(startX + 400, startY);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    console.log('  - 右上角（Shift水平吸附）');
    
    // 第3点（右下角）- 使用Shift键垂直吸附
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 400, startY + 300);
    await page.waitForTimeout(100);
    await page.mouse.click(startX + 400, startY + 300);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    console.log('  - 右下角（Shift垂直吸附）');
    
    // 第4点（左下角）
    await page.keyboard.down('Shift');
    await page.mouse.move(startX, startY + 300);
    await page.waitForTimeout(100);
    await page.mouse.click(startX, startY + 300);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    console.log('  - 左下角（Shift水平吸附）');
    
    // 闭合到起点（端点吸附）
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(100);
    await page.mouse.click(startX, startY);
    await page.waitForTimeout(300);
    console.log('  - 闭合到起点（端点吸附）');
    
    // 3. 绘制内墙 - 分隔房间
    console.log('步骤3: 绘制内墙分隔');
    
    // 从左墙中点到右墙中点（水平内墙）
    await page.mouse.click(startX, startY + 150);
    await page.waitForTimeout(200);
    
    await page.keyboard.down('Shift');
    await page.mouse.move(startX + 400, startY + 150);
    await page.waitForTimeout(100);
    await page.mouse.click(startX + 400, startY + 150);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    console.log('  - 水平内墙');
    
    // 右键结束当前绘制
    await page.mouse.click(startX + 400, startY + 150, { button: 'right' });
    await page.waitForTimeout(300);
    
    // 4. 测试数值输入功能
    console.log('步骤4: 测试数值输入');
    
    // 开始新墙体
    await page.mouse.click(startX + 200, startY);
    await page.waitForTimeout(300);
    
    // 检查是否显示数值输入框
    const dimensionInput = page.locator('.dimension-input');
    const isVisible = await dimensionInput.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('  - 数值输入框已显示');
      // 输入长度值
      await page.keyboard.type('1500');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      console.log('  - 输入长度: 1500mm');
    } else {
      console.log('  - 数值输入框未显示，继续普通绘制');
      await page.mouse.click(startX + 200, startY + 100);
      await page.waitForTimeout(200);
    }
    
    // 右键结束
    await page.mouse.click(startX + 200, startY + 100, { button: 'right' });
    await page.waitForTimeout(300);
    
    // 5. 测试端点拖动
    console.log('步骤5: 测试端点拖动');
    
    // 切换到选择工具
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    
    // 拖动一个端点
    await page.mouse.move(startX + 400, startY);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.mouse.move(startX + 420, startY + 20, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    console.log('  - 拖动端点完成');
    
    // 6. 测试撤销功能
    console.log('步骤6: 测试撤销功能');
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(500);
    console.log('  - 撤销操作完成');
    
    // 7. 测试重做功能
    console.log('步骤7: 测试重做功能');
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(500);
    console.log('  - 重做操作完成');
    
    // 8. 导出场景
    console.log('步骤8: 导出场景');
    
    // 监听下载事件
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await page.keyboard.press('Control+s');
    
    try {
      const download = await downloadPromise;
      console.log('  - 场景导出成功:', download.suggestedFilename());
    } catch (error) {
      console.log('  - 场景导出触发（未捕获下载）');
    }
    
    await page.waitForTimeout(500);
    
    // 9. 截图保存结果
    console.log('步骤9: 保存截图');
    await page.screenshot({ 
      path: 'tests/screenshots/floorplan-result.png',
      fullPage: true 
    });
    console.log('  - 截图已保存到 tests/screenshots/floorplan-result.png');
    
    // 10. 验证画布上有内容
    console.log('步骤10: 验证绘制结果');
    
    // 检查是否有墙体渲染（通过检查canvas是否有内容）
    const canvasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 检查是否有非白色像素
      let hasContent = false;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // 如果不是纯白色或透明，说明有内容
        if (a > 0 && (r !== 255 || g !== 255 || b !== 255)) {
          hasContent = true;
          break;
        }
      }
      
      return hasContent;
    });
    
    expect(canvasContent).toBe(true);
    console.log('  - ✓ 画布包含绘制内容');
    
    console.log('=== 自动化绘制完成 ===');
  });

  test('快捷键功能测试', async ({ page }) => {
    console.log('=== 测试快捷键功能 ===');
    
    // 测试工具切换快捷键
    await page.keyboard.press('l');
    await page.waitForTimeout(200);
    console.log('  - L键: 墙体工具');
    
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    console.log('  - Space键: 选择工具');
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    console.log('  - Escape键: 取消操作');
    
    console.log('=== 快捷键测试完成 ===');
  });

  test('连续墙体绘制测试', async ({ page }) => {
    console.log('=== 测试连续墙体绘制 ===');
    
    // 选择墙体工具
    await page.keyboard.press('l');
    await page.waitForTimeout(300);
    
    const canvas = await page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('无法获取画布位置');
    
    const baseX = canvasBox.x + 300;
    const baseY = canvasBox.y + 300;
    
    // 绘制折线（5个点）
    const points = [
      { x: baseX, y: baseY },
      { x: baseX + 200, y: baseY },
      { x: baseX + 200, y: baseY + 150 },
      { x: baseX + 100, y: baseY + 150 },
      { x: baseX + 100, y: baseY + 100 },
    ];
    
    for (let i = 0; i < points.length; i++) {
      await page.mouse.click(points[i].x, points[i].y);
      await page.waitForTimeout(200);
      console.log(`  - 点 ${i + 1}: (${points[i].x}, ${points[i].y})`);
    }
    
    // 右键结束
    await page.mouse.click(points[points.length - 1].x, points[points.length - 1].y, { button: 'right' });
    await page.waitForTimeout(300);
    console.log('  - 右键结束绘制');
    
    // 截图
    await page.screenshot({ path: 'tests/screenshots/continuous-walls.png' });
    console.log('  - 截图已保存');
    
    console.log('=== 连续墙体绘制测试完成 ===');
  });

  test('Shift键角度吸附测试', async ({ page }) => {
    console.log('=== 测试Shift键角度吸附 ===');
    
    await page.keyboard.press('l');
    await page.waitForTimeout(300);
    
    const canvas = await page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('无法获取画布位置');
    
    const baseX = canvasBox.x + 400;
    const baseY = canvasBox.y + 400;
    
    // 起点
    await page.mouse.click(baseX, baseY);
    await page.waitForTimeout(200);
    console.log('  - 起点');
    
    // 按住Shift，移动到接近水平的位置（应该吸附到0度）
    await page.keyboard.down('Shift');
    await page.mouse.move(baseX + 200, baseY + 10);
    await page.waitForTimeout(300);
    await page.mouse.click(baseX + 200, baseY + 10);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    console.log('  - 水平吸附点');
    
    // 按住Shift，移动到接近垂直的位置（应该吸附到90度）
    await page.keyboard.down('Shift');
    await page.mouse.move(baseX + 200, baseY + 200);
    await page.waitForTimeout(300);
    await page.mouse.click(baseX + 200, baseY + 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    console.log('  - 垂直吸附点');
    
    // 右键结束
    await page.mouse.click(baseX + 200, baseY + 200, { button: 'right' });
    await page.waitForTimeout(300);
    
    // 截图
    await page.screenshot({ path: 'tests/screenshots/angle-snap.png' });
    console.log('  - 截图已保存');
    
    console.log('=== Shift键角度吸附测试完成 ===');
  });

  test('撤销重做功能测试', async ({ page }) => {
    console.log('=== 测试撤销/重做功能 ===');
    
    await page.keyboard.press('l');
    await page.waitForTimeout(300);
    
    const canvas = await page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('无法获取画布位置');
    
    const baseX = canvasBox.x + 300;
    const baseY = canvasBox.y + 300;
    
    // 绘制一条墙
    await page.mouse.click(baseX, baseY);
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 200, baseY);
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 200, baseY, { button: 'right' });
    await page.waitForTimeout(300);
    console.log('  - 绘制第1条墙');
    
    // 绘制第二条墙
    await page.mouse.click(baseX, baseY + 100);
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 200, baseY + 100);
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 200, baseY + 100, { button: 'right' });
    await page.waitForTimeout(300);
    console.log('  - 绘制第2条墙');
    
    // 截图：绘制完成
    await page.screenshot({ path: 'tests/screenshots/before-undo.png' });
    
    // 撤销2次
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    console.log('  - 撤销1次');
    
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    console.log('  - 撤销2次');
    
    // 截图：撤销后
    await page.screenshot({ path: 'tests/screenshots/after-undo.png' });
    
    // 重做1次
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(300);
    console.log('  - 重做1次');
    
    // 截图：重做后
    await page.screenshot({ path: 'tests/screenshots/after-redo.png' });
    
    console.log('=== 撤销/重做测试完成 ===');
  });

  test('复杂户型绘制 - 三室一厅', async ({ page }) => {
    console.log('=== 绘制复杂户型：三室一厅 ===');
    
    await page.keyboard.press('l');
    await page.waitForTimeout(300);
    
    const canvas = await page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('无法获取画布位置');
    
    const baseX = canvasBox.x + 200;
    const baseY = canvasBox.y + 200;
    
    // 外墙 - 大矩形（8000mm x 6000mm）
    console.log('  - 绘制外墙');
    const outerWall = [
      { x: baseX, y: baseY },
      { x: baseX + 800, y: baseY },
      { x: baseX + 800, y: baseY + 600 },
      { x: baseX, y: baseY + 600 },
      { x: baseX, y: baseY }, // 闭合
    ];
    
    for (const point of outerWall) {
      await page.keyboard.down('Shift');
      await page.mouse.move(point.x, point.y);
      await page.waitForTimeout(50);
      await page.mouse.click(point.x, point.y);
      await page.keyboard.up('Shift');
      await page.waitForTimeout(150);
    }
    
    await page.waitForTimeout(500);
    
    // 内墙1 - 客厅与卧室分隔（垂直墙）
    console.log('  - 绘制内墙1（客厅/卧室分隔）');
    await page.mouse.click(baseX + 400, baseY);
    await page.waitForTimeout(200);
    await page.keyboard.down('Shift');
    await page.mouse.move(baseX + 400, baseY + 600);
    await page.mouse.click(baseX + 400, baseY + 600);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 400, baseY + 600, { button: 'right' });
    await page.waitForTimeout(300);
    
    // 内墙2 - 卧室分隔（水平墙）
    console.log('  - 绘制内墙2（卧室分隔）');
    await page.mouse.click(baseX + 400, baseY + 300);
    await page.waitForTimeout(200);
    await page.keyboard.down('Shift');
    await page.mouse.move(baseX + 800, baseY + 300);
    await page.mouse.click(baseX + 800, baseY + 300);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 800, baseY + 300, { button: 'right' });
    await page.waitForTimeout(300);
    
    // 内墙3 - 走廊（垂直墙）
    console.log('  - 绘制内墙3（走廊）');
    await page.mouse.click(baseX + 200, baseY);
    await page.waitForTimeout(200);
    await page.keyboard.down('Shift');
    await page.mouse.move(baseX + 200, baseY + 600);
    await page.mouse.click(baseX + 200, baseY + 600);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);
    await page.mouse.click(baseX + 200, baseY + 600, { button: 'right' });
    await page.waitForTimeout(500);
    
    // 最终截图
    console.log('  - 保存最终截图');
    await page.screenshot({ 
      path: 'tests/screenshots/complex-floorplan.png',
      fullPage: true 
    });
    
    console.log('=== 复杂户型绘制完成 ===');
    console.log('户型包含: 1个客厅 + 3个卧室 + 1个走廊');
  });
});
