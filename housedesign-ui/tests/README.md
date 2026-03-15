# 自动化测试文档

## 概述

本项目使用 Playwright 实现浏览器自动化测试，模拟用户在浏览器中绘制户型的完整流程。

## 测试内容

### 1. 完整户型绘制流程 (`完整户型绘制流程`)
- 选择墙体工具（快捷键 L）
- 绘制外墙矩形（使用 Shift 键角度吸附）
- 绘制内墙分隔
- 测试数值输入功能
- 测试端点拖动
- 测试撤销/重做
- 导出场景到 JSON
- 验证画布内容

### 2. 快捷键功能测试 (`快捷键功能测试`)
- L 键：切换到墙体工具
- Space 键：切换到选择工具
- Escape 键：取消当前操作

### 3. 连续墙体绘制测试 (`连续墙体绘制测试`)
- 绘制5个点的连续折线
- 右键结束绘制
- 验证连续绘制功能

### 4. Shift键角度吸附测试 (`Shift键角度吸附测试`)
- 测试水平吸附（0度）
- 测试垂直吸附（90度）
- 验证角度吸附精度

### 5. 撤销重做功能测试 (`撤销重做功能测试`)
- 绘制多条墙体
- 执行撤销操作（Ctrl+Z）
- 执行重做操作（Ctrl+Y）
- 验证状态恢复

### 6. 复杂户型绘制 (`复杂户型绘制 - 三室一厅`)
- 绘制8000mm x 6000mm外墙
- 绘制3条内墙分隔
- 形成三室一厅户型
- 保存最终截图

## 运行测试

### 前置条件
确保开发服务器正在运行：
```bash
npm run dev
```

### 运行所有测试
```bash
npm run test
```

### 运行测试（显示浏览器窗口）
```bash
npm run test:headed
```

### 运行测试（UI模式）
```bash
npm run test:ui
```

### 查看测试报告
```bash
npm run test:report
```

## 测试结果

测试完成后，会在以下位置生成截图：
- `tests/screenshots/floorplan-result.png` - 完整户型绘制结果
- `tests/screenshots/continuous-walls.png` - 连续墙体绘制
- `tests/screenshots/angle-snap.png` - 角度吸附效果
- `tests/screenshots/before-undo.png` - 撤销前
- `tests/screenshots/after-undo.png` - 撤销后
- `tests/screenshots/after-redo.png` - 重做后
- `tests/screenshots/complex-floorplan.png` - 复杂户型（三室一厅）

## 测试覆盖的功能

✅ 墙体工具选择  
✅ 连续墙体绘制  
✅ 端点吸附  
✅ Shift键角度吸附  
✅ 长度增量吸附  
✅ 端点拖动  
✅ 撤销/重做（Ctrl+Z/Ctrl+Y）  
✅ 快捷键系统  
✅ 场景导出（Ctrl+S）  
✅ 右键结束绘制  

## 技术栈

- **Playwright**: 浏览器自动化框架
- **TypeScript**: 测试脚本语言
- **Chromium**: 测试浏览器

## 注意事项

1. 测试依赖开发服务器运行在 `http://localhost:5180`
2. 如果端口被占用，请修改 `playwright.config.ts` 中的 `baseURL`
3. 首次运行需要安装 Playwright 浏览器：`npx playwright install chromium`
4. 测试使用单个 worker 顺序执行，避免并发冲突
