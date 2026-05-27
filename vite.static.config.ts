import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

/**
 * Replaces all TanStack Start / server-only modules with no-op stubs.
 * GitHub Pages is static — server functions will never work here;
 * removing the runtime cuts ~300 KB from the bundle and prevents any
 * server-side initialisation code from running in the browser.
 */
function stubServerOnlyModules(): Plugin {
  const REACT_START_STUB = `
export function createServerFn() {
  const b = { middleware:()=>b, inputValidator:()=>b, handler:()=>async()=>{ throw new Error("Server functions unavailable"); } };
  return b;
}
export const useServerFn = (fn) => fn;
export const createMiddleware = () => ({ server: () => ({}) });
export const createStart = () => ({});
export const createIsomorphicFn = () => { const fn=()=>undefined; return Object.assign(fn,{ client:()=>({server:()=>()=>undefined}), server:()=>({client:()=>()=>undefined}) }); };
export const createClientOnlyFn = (fn) => fn;
export const createServerOnlyFn = (fn) => fn;
export const hydrate = async () => {};
export const json = (d) => d;
export const mergeHeaders = () => new Headers();
export const trackPostProcessPromise = () => {};
export const getRouterInstance = () => null;
export const getGlobalStartContext = () => null;
export const getDefaultSerovalPlugins = () => [];
export const RawStream = null;
export const FRAME_HEADER_SIZE = 0;
export const TSS_CONTENT_TYPE_FRAMED = '';
export const TSS_CONTENT_TYPE_FRAMED_VERSIONED = '';
export const TSS_FORMDATA_CONTEXT = '';
export const TSS_FRAMED_PROTOCOL_VERSION = 1;
export const TSS_SERVER_FUNCTION = '';
export const X_TSS_CONTEXT = '';
export const X_TSS_RAW_RESPONSE = '';
export const X_TSS_SERIALIZED = '';
export const validateFramedProtocolVersion = () => {};
export const createNullProtoObject = () => Object.create(null);
export const safeObjectMerge = (...a) => Object.assign({}, ...a);
export const execValidator = (_v, d) => d;
export const executeMiddleware = async () => ({ result: undefined, error: undefined });
export const flattenMiddlewares = (m) => m;
export const FrameType = {};
`

  const rootStaticPath = path.resolve(__dirname, './src/__root.static.tsx')

  return {
    name: 'stub-server-only-modules',
    enforce: 'pre',
    resolveId(id) {
      // Stub the entire TanStack Start runtime (includes start-client-core)
      if (id === '@tanstack/react-start' || id === '@tanstack/start-client-core')
        return '\0stub:react-start'
      if (id === '@tanstack/react-start/server' || id === '@tanstack/react-start/client')
        return '\0stub:react-start'
      if (id === '@tanstack/start-storage-context') return '\0stub:storage-context'
      if (id.endsWith('/auth-middleware') || id.endsWith('/auth-middleware.ts'))
        return '\0stub:auth-middleware'
      if (id.endsWith('/client.server') || id.endsWith('/client.server.ts'))
        return '\0stub:client-server'
      // Replace the SSR root (has shellComponent) with the plain SPA root
      if (id.endsWith('/routes/__root') || id.endsWith('/routes/__root.tsx'))
        return rootStaticPath
    },
    load(id) {
      if (id === '\0stub:react-start') return REACT_START_STUB
      if (id === '\0stub:storage-context')
        return 'export const getStartContext=()=>null; export const runWithStartContext=(_c,fn)=>fn();'
      if (id === '\0stub:auth-middleware')
        return 'export const requireSupabaseAuth = {};'
      if (id === '\0stub:client-server')
        return 'export const supabaseAdmin = {};'
    },
  }
}

export default defineConfig({
  // Use spa/ as Vite root so the dev server (port 8080) is not affected
  root: path.resolve(__dirname, 'spa'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [
    stubServerOnlyModules(),
    tanstackRouter({
      routesDirectory: path.resolve(__dirname, './src/routes'),
      generatedRouteTree: path.resolve(__dirname, './src/routeTree.gen.ts'),
    }),
    react(),
    tailwindcss(),
    tsconfigPaths({ root: __dirname }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Keep React + its runtime deps (scheduler, jsx-runtime, etc.) in ONE chunk.
          // Splitting scheduler into "vendor" breaks React 19 ("Cannot set properties of undefined (setting 'Activity')").
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/use-sync-external-store/')
          ) return 'react'
          if (id.includes('@tanstack/react-router') || id.includes('@tanstack/router-core')) return 'router'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@radix-ui')) return 'ui'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'charts'
          return 'vendor'
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.SUPABASE_URL': JSON.stringify(''),
    'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(''),
    'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(''),
  },
})
