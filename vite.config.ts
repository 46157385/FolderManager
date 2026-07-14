import { fileURLToPath, URL } from 'node:url'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

function finderRevealPlugin() {
  return {
    name: 'finder-reveal',
    configureServer(server) {
      server.middlewares.use('/api/reveal-in-finder', (request, response) => {
        const requestUrl = new URL(request.url ?? '', 'http://localhost')
        const materialId = requestUrl.searchParams.get('materialId') ?? ''
        const collection = requestUrl.searchParams.get('collection') ?? 'session5'

        if (!/^[a-z0-9-]+$/.test(materialId) || !/^(session5|thinking)$/.test(collection)) {
          response.statusCode = 400
          response.end('Invalid material id')
          return
        }

        const pdfPath = resolve(process.cwd(), 'public', 'materials', collection, materialId, 'document.pdf')

        if (!existsSync(pdfPath)) {
          response.statusCode = 404
          response.end('File not found')
          return
        }

        execFile('open', ['-R', pdfPath], (error) => {
          if (error) {
            response.statusCode = 500
            response.end('Unable to reveal file')
            return
          }

          response.statusCode = 204
          response.end()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), finderRevealPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
