import { fileURLToPath, URL } from 'node:url'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const defaultMaterialsBaseUrl = 'https://wwg-5.oss-cn-qingdao.aliyuncs.com/materials'

function finderRevealPlugin() {
  return {
    name: 'finder-reveal',
    configureServer(server) {
      server.middlewares.use('/api/reveal-in-finder', (request, response) => {
        const requestUrl = new URL(request.url ?? '', 'http://localhost')
        const materialId = requestUrl.searchParams.get('materialId') ?? ''

        if (!/^[a-z0-9-]+$/.test(materialId)) {
          response.statusCode = 400
          response.end('Invalid material id')
          return
        }

        const pdfPath = resolve(process.cwd(), 'public', 'materials', materialId, 'document.pdf')

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

function materialPdfPreviewPlugin() {
  return {
    name: 'material-pdf-preview',
    configureServer(server) {
      server.middlewares.use('/api/material-pdf', async (request, response) => {
        const requestUrl = new URL(request.url ?? '', 'http://localhost')
        const materialId = requestUrl.pathname.replace(/^\/+/, '')

        if (!/^[a-z0-9-]+$/.test(materialId)) {
          response.statusCode = 400
          response.end('Invalid material id')
          return
        }

        const baseUrl = process.env.VITE_MATERIALS_BASE_URL?.trim() || defaultMaterialsBaseUrl
        const pdfUrl = `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(materialId)}/document.pdf`
        const upstreamResponse = await fetch(pdfUrl)

        if (!upstreamResponse.ok || !upstreamResponse.body) {
          response.statusCode = upstreamResponse.status || 502
          response.end('Unable to load PDF')
          return
        }

        response.statusCode = upstreamResponse.status
        response.setHeader('Content-Type', upstreamResponse.headers.get('content-type') || 'application/pdf')
        response.setHeader('Content-Disposition', `inline; filename="${materialId}.pdf"`)
        response.setHeader('Cache-Control', 'public, max-age=3600')

        const contentLength = upstreamResponse.headers.get('content-length')
        if (contentLength) {
          response.setHeader('Content-Length', contentLength)
        }

        Readable.fromWeb(upstreamResponse.body).pipe(response)
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), finderRevealPlugin(), materialPdfPreviewPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
