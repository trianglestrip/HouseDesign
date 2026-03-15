import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import App from './App.vue';
import { EditorEngine } from '@housedesign/core';
import { EDITOR_ENGINE_KEY } from '@/constants/injectKeys';
import '@/styles/main.css';

const app = createApp(App);
const editorEngine = new EditorEngine();

app.use(createPinia());
app.use(ElementPlus);
app.provide(EDITOR_ENGINE_KEY, editorEngine);
app.mount('#app');
