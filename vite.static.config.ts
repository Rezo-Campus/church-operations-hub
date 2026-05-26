import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

/**
 * Stubs server-only modules so the SPA build never includes
 * Node.js / Cloudflare Worker code in the browser bundle.
 * Admin functions will fail gracefully (fetch 404) on GitHub Pages.
 */
function stubServerOnlyModules(): Plugin {
  return {
    name: 'stub-server-only-modules',
    enforce: 'pre',
    resolveId(id) {
      if (id === '@tanstack/react-start/server') return '\0stub:tanstack-server'
      if (id === '@tanstack/start-storage-context') return '\0stub:storage-context'
      if (id.endsWith('/auth-middleware') || id.endsWith('/auth-middleware.ts'))
        return '\0stub:auth-middleware'
      if (id.endsWith('/client.server') || id.endsWith('/client.server.ts'))
        return '\0stub:client-server'
    },
    load(id) {
      if (id === '\0stub:tanstack-server')
        return 'export const getRequest=()=>null; export const getWebRequest=()=>null; export const getEvent=()=>null; export const setResponseStatus=()=>{}; export default {};'
      if (id === '\0stub:storage-context')
        return 'export const getStartContext=()=>null; export const runWithStartContext=(_ctx,fn)=>fn();'
      if (id === '\0stub:auth-middleware')
        return 'export const requireSupabaseAuth = {};'
      if (id === '\0stub:client-server')
        return 'export const supabaseAdmin = {};'
    },
  }
}

export default defineConfig({
  plugins: [
    stubServerOnlyModules(),
    tanstackRouter({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.SUPABASE_URL': JSON.stringify(''),
    'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(''),
    'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(''),
  },
})
