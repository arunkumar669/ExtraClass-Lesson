import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// 🔥 GLOBAL API URL (Render backend)
app.config.globalProperties.$api = "https://extra-class-lesson-backend.onrender.com"

app.mount('#app')
