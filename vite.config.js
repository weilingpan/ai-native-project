import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Ensure it binds correctly if needed
        proxy: {
            '/llm_openai': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                // rewrite: (path) => path.replace(/^\/llm_openai/, ''),
            },
        },
    },
})
