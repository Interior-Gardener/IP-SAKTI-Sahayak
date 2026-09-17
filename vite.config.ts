import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages serves static files and nothing else: there is no rewrite
 * rule to send /plant/tulsi back to index.html, so a deep link or a reload
 * anywhere but the root would 404. Pages does serve 404.html for a miss,
 * though, so shipping a copy of index.html under that name hands the URL to
 * the router exactly as a rewrite would.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
    },
  }
}

export default defineConfig({
  /* Root on a domain of its own (Vercel, `vite preview`); /<repo>/ on
   * GitHub Pages, where the deploy workflow sets VITE_BASE. */
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), spaFallback()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three'
            if (id.includes('@react-three')) return 'r3f'
            if (id.includes('react-router') || id.includes('motion')) return 'ui-vendor'
            return 'vendor'
          }
        },
      },
    },
  },
})
