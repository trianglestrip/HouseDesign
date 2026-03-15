import { test } from '@playwright/test';

test('模拟真实用户绘制三室一厅 - 发现交互问题', async ({ page }) => {
  await page.goto('http://localhost:5181');
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('\n==========================================');
  console.log('  模拟真实用户绘制三室一厅户型');
  console.log('  户型：约 100㎡，三室一厅一厨一卫');
  console.log('==========================================\n');
  
  // 选择墙体工具
  await page.click('text=实心墙');
  await page.waitForTimeout(500);
  
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const startX = box.x + 150;
  const startY = box.y + 150;
  
  console.log('========== 阶段1: 绘制外墙（12m × 8m）==========');
  console.log('【用户操作】点击画布左上角作为起点');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(300);
  
  console.log('【问题1】输入框出现了，但我还没想好尺寸，想先看看方向');
  console.log('【期望】能否延迟显示输入框？或者让我先移动鼠标确定方向？');
  await page.screenshot({ path: 'tests/screenshots/ux-issue-1-input-too-early.png' });
  
  console.log('\n【用户操作】输入第一段墙长度：12000mm（向右）');
  await page.keyboard.type('12000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 400, startY);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  console.log('【问题2】输入框又立即出现了，但我想连续快速绘制');
  console.log('【期望】能否按住某个键（如Shift）临时禁用输入框？');
  await page.screenshot({ path: 'tests/screenshots/ux-issue-2-input-interrupts-flow.png' });
  
  console.log('\n【用户操作】继续输入第二段：8000mm（向下）');
  await page.keyboard.type('8000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 400, startY + 300);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  console.log('【用户操作】第三段：12000mm（向左）');
  await page.keyboard.type('12000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX, startY + 300);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  console.log('【用户操作】闭合到起点');
  await page.mouse.move(startX, startY);
  await page.waitForTimeout(200);
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(300);
  
  console.log('【问题3】闭合后输入框又出现了，但我只是想闭合，不需要输入');
  console.log('【期望】检测到吸附到起点时，自动闭合不显示输入框');
  await page.screenshot({ path: 'tests/screenshots/ux-issue-3-input-on-close.png' });
  
  await page.keyboard.press('Escape');
  await page.mouse.click(startX, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('\n========== 阶段2: 绘制主卧（右上，4m × 3.5m）==========');
  console.log('【用户思考】主卧在右上角，我需要从外墙的某个点开始往里绘制隔墙');
  console.log('【问题4】我怎么知道从哪里开始？需要精确定位外墙上的点');
  console.log('【期望】能否在墙体上显示中点/等分点？或者输入距离来定位？');
  
  console.log('\n【用户操作】估算一个位置，从上边墙向下');
  await page.mouse.click(startX + 300, startY);
  await page.waitForTimeout(300);
  await page.keyboard.type('3500');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 300, startY + 150);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  
  console.log('【问题5】绘制完垂直墙后，想立即绘制水平墙，但需要重新点击起点');
  console.log('【期望】能否自动继续从当前端点开始？类似CAD的连续绘制？');
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 300, startY, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('\n【用户操作】绘制水平隔墙');
  await page.mouse.click(startX + 300, startY + 150);
  await page.waitForTimeout(300);
  await page.keyboard.type('4000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 400, startY + 150);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 400, startY + 150, { button: 'right' });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'tests/screenshots/ux-progress-1-master-bedroom.png' });
  
  console.log('\n========== 阶段3: 绘制次卧（右中，4m × 3m）==========');
  await page.mouse.click(startX + 300, startY + 150);
  await page.waitForTimeout(300);
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 300, startY + 250);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 300, startY + 250, { button: 'right' });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'tests/screenshots/ux-progress-2-second-bedroom.png' });
  
  console.log('\n========== 阶段4: 绘制书房（右下，4m × 1.5m）==========');
  console.log('【用户操作】从次卧下方继续绘制');
  await page.mouse.click(startX + 300, startY + 250);
  await page.waitForTimeout(300);
  
  console.log('【问题6】画到这里发现布局不对，想撤销重来');
  console.log('【期望】此时按Ctrl+Z应该撤销整条墙？还是撤销单个点？');
  console.log('【当前】不确定撤销粒度，可能需要多次尝试');
  
  await page.keyboard.type('1500');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 300, startY + 300);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 300, startY + 300, { button: 'right' });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'tests/screenshots/ux-progress-3-study-room.png' });
  
  console.log('\n========== 阶段5: 绘制厨房和卫生间（左侧）==========');
  console.log('【用户思考】左侧要放厨房（上）和卫生间（下）');
  console.log('【问题7】需要在左侧竖直分割，但不确定从哪个高度开始');
  console.log('【期望】能否有辅助线？或者显示已有墙体的尺寸？');
  
  await page.mouse.click(startX, startY + 150);
  await page.waitForTimeout(300);
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 100, startY + 150);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 100, startY + 150, { button: 'right' });
  await page.waitForTimeout(500);
  
  console.log('\n【用户操作】绘制厨房和卫生间之间的水平墙');
  await page.mouse.click(startX + 100, startY + 150);
  await page.waitForTimeout(300);
  await page.keyboard.type('3000');
  await page.keyboard.down('Shift');
  await page.mouse.move(startX + 100, startY + 250);
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.mouse.click(startX + 100, startY + 250, { button: 'right' });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'tests/screenshots/ux-final-3br-apartment.png' });
  
  console.log('\n==========================================');
  console.log('  绘制完成！发现的交互问题汇总：');
  console.log('==========================================\n');
  
  console.log('【问题1】输入框出现时机');
  console.log('  - 现状：点击第一个点立即显示');
  console.log('  - 问题：用户可能还在思考尺寸或方向');
  console.log('  - 建议：等鼠标移动一小段距离后再显示，或按空格键主动呼出\n');
  
  console.log('【问题2】输入框打断连续绘制');
  console.log('  - 现状：每次确认后立即显示新输入框');
  console.log('  - 问题：快速连续绘制时频繁打断');
  console.log('  - 建议：按住Shift键时禁用输入框，直接鼠标绘制\n');
  
  console.log('【问题3】闭合时不必要的输入框');
  console.log('  - 现状：吸附到起点时仍显示输入框');
  console.log('  - 问题：用户只想闭合，不需要输入');
  console.log('  - 建议：检测到闭合操作时，自动完成不显示输入框\n');
  
  console.log('【问题4】墙体上定位困难');
  console.log('  - 现状：只能估算位置');
  console.log('  - 问题：无法精确定位墙体上的点');
  console.log('  - 建议：显示墙体中点，或允许输入距离来定位\n');
  
  console.log('【问题5】不支持连续绘制');
  console.log('  - 现状：每条墙结束后需重新选择起点');
  console.log('  - 问题：效率低，操作繁琐');
  console.log('  - 建议：自动从上一个端点继续，或按空格键继续\n');
  
  console.log('【问题6】撤销粒度不清晰');
  console.log('  - 现状：不确定撤销是撤销整条墙还是单个点');
  console.log('  - 问题：可能撤销过多或过少');
  console.log('  - 建议：明确撤销粒度，或提供两种撤销（Backspace撤销点，Ctrl+Z撤销墙）\n');
  
  console.log('【问题7】缺少辅助线和尺寸标注');
  console.log('  - 现状：看不到已绘制墙体的尺寸');
  console.log('  - 问题：难以规划布局');
  console.log('  - 建议：显示已有墙体的尺寸标注，或提供辅助线对齐\n');
  
  console.log('【额外发现的优化点】');
  console.log('  8. 缺少墙体中点吸附：连接到墙体中点很常见');
  console.log('  9. 缺少距离复制：想画相同长度的墙时需要重新输入');
  console.log('  10. 缺少正交锁定：画正交墙时每次都要按Shift');
  console.log('  11. 输入框位置：跟随鼠标有时会遮挡视线');
  console.log('  12. 单位切换：只支持mm，输入大数字麻烦（如12000）\n');
});
