import { defineConfig } from 'vite';
// import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        // lib: {
        //   entry: 'src/app-demo.ts',
        //   formats: ['es']
        // },
        // Increase the allowed chunk size to prevent a warning, as we exceed 500K
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
        }
    },
    base: './',
    define: {
        '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    }
})
