import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// gh-pages SPA fix: copy dist/index.html → dist/404.html so deep links
// (e.g. /issuer/AES) survive a hard refresh on gh-pages, which serves
// 404.html for any non-asset path. Without this, BrowserRouter deep
// links return a 404.
function ghPages404Shim() {
  return {
    name: 'gh-pages-404-shim',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const idx = resolve(dist, 'index.html')
      const fb  = resolve(dist, '404.html')
      if (existsSync(idx)) {
        copyFileSync(idx, fb)
        console.log('[gh-pages-404-shim] dist/404.html written')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ghPages404Shim()],
  base: '/',
})
