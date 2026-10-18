import { isIP } from 'node:net'

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
})

export default async function handler(request, context) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const key = process.env.IPIFY_API_KEY
  if (!key) return json({ error: 'Lookup service is not configured' }, 503)

  const url = new URL(request.url)
  const query = (url.searchParams.get('query') || '').trim()
  const params = new URLSearchParams({ apiKey: key })
  if (query) {
    if (isIP(query)) params.set('ipAddress', query)
    else if (query.length <= 253 && /^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(query)) {
      params.set('domain', query)
    } else return json({ error: 'Enter a valid IP address or domain' }, 400)
  } else {
    // Use Netlify's visitor IP, rather than the function server's IP.
    if (!context.ip || !isIP(context.ip)) return json({ error: 'Could not determine visitor IP' }, 400)
    params.set('ipAddress', context.ip)
  }

  try {
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    const loopback = context.ip === '::1' || context.ip === '::ffff:127.0.0.1' || context.ip?.startsWith('127.')
    if (!query && localHost && loopback) {
      // Netlify Dev sees loopback. Discover this computer's public IP instead.
      const publicIpResponse = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(10000),
      })
      if (!publicIpResponse.ok) return json({ error: 'Could not determine public IP' }, 502)
      const { ip } = await publicIpResponse.json()
      if (!isIP(ip || '')) return json({ error: 'Could not determine public IP' }, 502)
      params.set('ipAddress', ip)
    }
    const response = await fetch(`https://geo.ipify.org/api/v2/country,city?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      // Do not forward upstream errors that might contain credentials.
      return json({ error: 'Lookup failed' }, [400, 422].includes(response.status) ? 400 : 502)
    }
    const { ip, isp, location } = await response.json()
    return json({ ip, isp, location })
  } catch {
    return json({ error: 'Lookup service is unavailable' }, 502)
  }
}
