import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import http from 'http'
import { URL } from 'url'

// Custom plugin for proxying images to bypass CORS
const imageProxyPlugin = () => ({
    name: 'image-proxy',
    configureServer(server) {
        server.middlewares.use('/proxy-image', (req, res, next) => {
            const queryObject = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const urlParam = queryObject.get('url');

            if (!urlParam) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return;
            }

            try {
                const targetUrl = new URL(urlParam);
                const client = targetUrl.protocol === 'https:' ? https : http;

                client.get(urlParam, (proxyRes) => {
                    res.statusCode = proxyRes.statusCode;

                    // Forward headers
                    Object.keys(proxyRes.headers).forEach(key => {
                        res.setHeader(key, proxyRes.headers[key]);
                    });

                    // Add CORS headers
                    res.setHeader('Access-Control-Allow-Origin', '*');

                    proxyRes.pipe(res);
                }).on('error', (err) => {
                    console.error('Error fetching image:', err);
                    res.statusCode = 500;
                    res.end('Error fetching image');
                });
            } catch (error) {
                console.error('Invalid URL:', error);
                res.statusCode = 400;
                res.end('Invalid URL');
            }
        });
    }
});

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), imageProxyPlugin()],
    server: {
        host: '0.0.0.0', // Ensure it binds correctly if needed
        proxy: {
            '/llm_openai': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                // rewrite: (path) => path.replace(/^\/llm_openai/, ''),
            },
            '/accounts': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
})
