import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const API_PATH_PREFIX = '/api/v1'
const PROXY_PATH_PARAM = '__proxyPath'
const REQUEST_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'if-modified-since',
  'if-none-match',
  'range',
]
const RESPONSE_HEADERS_TO_SKIP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

export default async function handler(request, response) {
  let upstreamUrl

  try {
    upstreamUrl = resolveUpstreamUrl(request)
  }
  catch (error) {
    sendProblem(response, 503, 'backend_not_configured', error.message)
    return
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, createUpstreamRequest(request))

    response.status(upstreamResponse.status)
    copyResponseHeaders(upstreamResponse.headers, response)

    if (!upstreamResponse.body || request.method === 'HEAD') {
      response.end()
      return
    }

    await pipeline(Readable.fromWeb(upstreamResponse.body), response)
  }
  catch (error) {
    if (response.headersSent) {
      response.destroy(error)
      return
    }

    sendProblem(
      response,
      502,
      'backend_unavailable',
      '无法连接 FolderManager 后端服务',
    )
  }
}

function resolveUpstreamUrl(request) {
  const configuredBaseUrl = process.env.BACKEND_API_BASE_URL?.trim()
  if (!configuredBaseUrl) {
    throw new Error('正式环境未配置 BACKEND_API_BASE_URL')
  }

  const baseUrl = new URL(configuredBaseUrl)
  if (!/^https?:$/.test(baseUrl.protocol)) {
    throw new Error('BACKEND_API_BASE_URL 必须是 HTTP(S) 地址')
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host}`)
  const configuredPath = baseUrl.pathname.replace(/\/+$/, '')
  const requestPath = resolveRequestPath(request)

  baseUrl.pathname = configuredPath.endsWith(API_PATH_PREFIX)
    ? `${configuredPath}${requestPath}`
    : `${configuredPath}${API_PATH_PREFIX}${requestPath}`
  requestUrl.searchParams.delete(PROXY_PATH_PARAM)
  baseUrl.search = requestUrl.search

  if (baseUrl.host === request.headers.host) {
    throw new Error('BACKEND_API_BASE_URL 不能指向当前 Vercel 前端域名')
  }

  return baseUrl
}

function resolveRequestPath(request) {
  const configuredPath = request.query?.[PROXY_PATH_PARAM]
  const path = Array.isArray(configuredPath) ? configuredPath[0] : configuredPath

  if (path === undefined) {
    return ''
  }
  if (typeof path !== 'string') {
    throw new Error('API 代理路径无效')
  }

  return `/${path.replace(/^\/+/, '')}`
}

function createUpstreamRequest(request) {
  const headers = new Headers()
  for (const name of REQUEST_HEADERS) {
    const value = request.headers[name]
    if (typeof value === 'string') {
      headers.set(name, value)
    }
  }

  const method = request.method || 'GET'
  if (method === 'GET' || method === 'HEAD') {
    return { method, headers, redirect: 'manual' }
  }

  const body = serializeRequestBody(request.body, headers)
  return { method, headers, body, redirect: 'manual' }
}

function serializeRequestBody(body, headers) {
  if (body === undefined || body === null) {
    return undefined
  }
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    return body
  }

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return JSON.stringify(body)
}

function copyResponseHeaders(upstreamHeaders, response) {
  for (const [name, value] of upstreamHeaders) {
    if (!RESPONSE_HEADERS_TO_SKIP.has(name.toLowerCase())) {
      response.setHeader(name, value)
    }
  }
}

function sendProblem(response, status, errorCode, detail) {
  response.status(status).json({
    status,
    errorCode,
    title: '后端服务不可用',
    detail,
  })
}
