import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { pinia } from './store';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const app = createApp(App);

// RegisterElement Plus
app.use(ElementPlus, {
  locale: zhCn,
});

// Registerallicon
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// RegisterPinia
app.use(pinia);

app.mount("#app");
