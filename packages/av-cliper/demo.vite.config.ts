import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        'concat-media': resolve(__dirname, 'demo/concat-media.html')
      }
    },
    outDir: 'demo-dist'
  }
})