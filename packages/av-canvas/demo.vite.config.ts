import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        'record-avcanvas': resolve(__dirname, 'demo/record-avcanvas.html'),
        'local-recorder': resolve(__dirname, 'demo/local-recorder.html')
      }
    },
    outDir: 'demo-dist'
  }
})
