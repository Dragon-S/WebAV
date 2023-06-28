import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        'local-record': resolve(__dirname, 'demo/local-record.html')
      }
    },
    outDir: 'demo-dist'
  }
})
