/**
 * 快捷键管理 Composable
 */

import { onMounted, onUnmounted, type Ref } from 'vue';
import type { GeometryKernel } from '@housedesign/core';
import type { Canvas } from 'fabric';

export interface ShortcutHandler {
  (event: KeyboardEvent): void | boolean; // 返回false可以阻止默认行为
}

export interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
}

interface ShortcutConfig {
  key: string;
  handler: ShortcutHandler;
  options: ShortcutOptions;
}

/**
 * 快捷键管理器
 */
export function useShortcuts(
  canvas: Ref<Canvas | null>,
  geometryKernel?: GeometryKernel
) {
  const shortcuts = new Map<string, ShortcutConfig>();
  let isEnabled = true;

  /**
   * 生成快捷键ID
   */
  function generateShortcutId(key: string, options: ShortcutOptions): string {
    const parts: string[] = [];
    if (options.ctrl) parts.push('Ctrl');
    if (options.shift) parts.push('Shift');
    if (options.alt) parts.push('Alt');
    if (options.meta) parts.push('Meta');
    parts.push(key.toUpperCase());
    return parts.join('+');
  }

  /**
   * 检查是否在输入框中
   */
  function isInputFocused(): boolean {
    const target = document.activeElement as HTMLElement;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }

  /**
   * 检查快捷键是否匹配
   */
  function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
    const { key, options } = config;
    
    // 检查修饰键
    if (options.ctrl && !event.ctrlKey) return false;
    if (options.shift && !event.shiftKey) return false;
    if (options.alt && !event.altKey) return false;
    if (options.meta && !event.metaKey) return false;
    
    // 检查按键（不区分大小写）
    return event.key.toUpperCase() === key.toUpperCase();
  }

  /**
   * 键盘事件处理
   */
  function handleKeyDown(event: KeyboardEvent): void {
    // 如果快捷键被禁用，直接返回
    if (!isEnabled) return;
    
    // 如果在输入框中，跳过大部分快捷键（除了Esc）
    if (isInputFocused() && event.key !== 'Escape') {
      return;
    }

    // 遍历所有快捷键，找到匹配的
    for (const config of shortcuts.values()) {
      if (matchesShortcut(event, config)) {
        const result = config.handler(event);
        
        // 如果handler返回false或配置了preventDefault，阻止默认行为
        if (result === false || config.options.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        break; // 只执行第一个匹配的快捷键
      }
    }
  }

  /**
   * 注册快捷键
   */
  function registerShortcut(
    key: string,
    handler: ShortcutHandler,
    options: ShortcutOptions = {}
  ): string {
    const id = generateShortcutId(key, options);
    shortcuts.set(id, { key, handler, options });
    console.log(`[快捷键] 注册: ${id}`);
    return id;
  }

  /**
   * 注销快捷键
   */
  function unregisterShortcut(id: string): void {
    shortcuts.delete(id);
    console.log(`[快捷键] 注销: ${id}`);
  }

  /**
   * 清空所有快捷键
   */
  function unregisterAll(): void {
    shortcuts.clear();
    console.log('[快捷键] 清空所有快捷键');
  }

  /**
   * 启用/禁用快捷键
   */
  function setEnabled(enabled: boolean): void {
    isEnabled = enabled;
  }

  /**
   * 获取所有已注册的快捷键
   */
  function getRegisteredShortcuts(): string[] {
    return Array.from(shortcuts.keys());
  }

  // 挂载时添加事件监听
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    console.log('[快捷键] 系统已启动');
  });

  // 卸载时移除事件监听
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    unregisterAll();
    console.log('[快捷键] 系统已关闭');
  });

  return {
    registerShortcut,
    unregisterShortcut,
    unregisterAll,
    setEnabled,
    getRegisteredShortcuts,
  };
}
