/**
 * Vue inject/provide ??- ??????EditorEngine ??
 */
import type { InjectionKey } from 'vue';
import type { EditorEngine } from '@housedesign/core';

export const EDITOR_ENGINE_KEY: InjectionKey<EditorEngine> = Symbol(
  'editorEngine'
);
