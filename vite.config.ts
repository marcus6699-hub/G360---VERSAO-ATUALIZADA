import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function safeViteClientHmrPlugin() {
  return {
    name: 'safe-vite-client-hmr',
    transform(code: string, id: string) {
      if (id.includes('vite/dist/client/client.mjs')) {
        return code
          .replace(
            /createConnection:\s*\(\)\s*=>\s*new WebSocket\([^)]+\)/g,
            'createConnection: () => ({ readyState: 1, OPEN: 1, addEventListener() {}, removeEventListener() {}, send() {}, close() {} })'
          )
          .replace(
            'reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));',
            'resolve();'
          );
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [safeViteClientHmrPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

