import { test } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../netlify/functions/lookup.mjs'

test('lookup keeps the key server-side and uses the visitor IP', async () => {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.IPIFY_API_KEY
  process.env.IPIFY_API_KEY = 'test-only-key'
  let upstream
  globalThis.fetch = async (url) => {
    upstream = new URL(url)
    return Response.json({ ip: '8.8.8.8', isp: 'Example ISP', location: { lat: 1, lng: 2 }, extra: 'excluded' })
  }
  const request = (query = '') => new Request(`https://example.com/.netlify/functions/lookup${query}`)
  try {
    const response = await handler(request(), { ip: '8.8.8.8' })
    assert.equal(upstream.searchParams.get('ipAddress'), '8.8.8.8')
    assert.equal(upstream.searchParams.get('apiKey'), 'test-only-key')
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    const body = await response.text()
    assert.ok(!body.includes('test-only-key'))
    assert.ok(!body.includes('excluded'))
    await handler(request('?query=example.com'), {})
    assert.equal(upstream.searchParams.get('domain'), 'example.com')
    await handler(request('?query=2001:4860:4860::8888'), {})
    assert.equal(upstream.searchParams.get('ipAddress'), '2001:4860:4860::8888')
    assert.equal((await handler(request('?query=https://example.com'), {})).status, 400)
    assert.equal((await handler(request(), {})).status, 400)
    const calls = []
    globalThis.fetch = async (url) => {
      calls.push(new URL(url))
      return new URL(url).hostname === 'api.ipify.org'
        ? Response.json({ ip: '8.8.4.4' })
        : Response.json({ ip: '8.8.4.4', isp: 'Example ISP', location: { lat: 1, lng: 2 } })
    }
    for (const ip of ['::1', '127.0.0.1', '::ffff:127.0.0.1']) {
      calls.length = 0
      const local = await handler(new Request('http://localhost:8888/.netlify/functions/lookup'), { ip })
      assert.equal(local.status, 200)
      assert.equal(calls.length, 2)
      assert.equal(calls[0].hostname, 'api.ipify.org')
      assert.equal(calls[0].searchParams.has('apiKey'), false)
      assert.equal(calls[1].searchParams.get('ipAddress'), '8.8.4.4')
    }
    calls.length = 0
    await handler(new Request('http://localhost:8888/.netlify/functions/lookup?query=8.8.8.8'), { ip: '::1' })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].searchParams.get('ipAddress'), '8.8.8.8')
    globalThis.fetch = async () => Response.json({ ip: 'invalid' })
    assert.equal((await handler(new Request('http://localhost:8888/.netlify/functions/lookup'), { ip: '::1' })).status, 502)
    globalThis.fetch = async () => new Response('test-only-key', { status: 403 })
    const failed = await handler(request(), { ip: '8.8.8.8' })
    assert.equal(failed.status, 502)
    assert.ok(!(await failed.text()).includes('test-only-key'))
    delete process.env.IPIFY_API_KEY
    assert.equal((await handler(request(), {})).status, 503)
    assert.equal((await handler(new Request('https://example.com', { method: 'POST' }), {})).status, 405)
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.IPIFY_API_KEY
    else process.env.IPIFY_API_KEY = originalKey
  }
})
