// app/api/proxy/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
  
    if (!url) {
      return new Response('URL required', { status: 400 })
    }
  
    try {
      // Add headers to mimic browser request
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.google.com/',
          'Origin': 'https://www.google.com'
        }
      })
  
      const text = await res.text()
      const headers = new Headers()
  
      // Forward original response headers
      res.headers.forEach((value, key) => {
        headers.set(key, value)
      })
  
      // Set CORS headers for client-side access
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      headers.set('Access-Control-Allow-Headers', '*')
  
      return new Response(text, {
        status: res.status,
        headers
      })
    } catch (error) {
      console.error('Proxy error:', error)
      return new Response('Proxy error', { status: 500 })
    }
  }