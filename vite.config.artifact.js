import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build che produce un unico file HTML self-contained (CSS/JS inline),
// per la pubblicazione come Artifact. Nessun service worker, nessun asset
// esterno. Gli import dinamici (xlsx, jszip, fallback storage) vengono
// inglobati nel bundle.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    rollupOptions: {
      input: 'index.artifact.html',
    },
  },
})
