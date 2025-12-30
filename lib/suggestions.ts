// lib/suggestions.ts
export type KeywordResult = {
  base: string[]
  questions: string[]
}

const prefixes = ["how", "what", "why", "best", "near me"]

async function fetchSuggest(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Origin': 'https://www.google.com'
      },
      mode: 'no-cors' // Bypass CORS
    })
    
    if (!res.ok) {
      console.warn('Request failed:', res.status)
      return []
    }

    // Try to get response as text
    let text = ''
    try {
      text = await res.text()
    } catch (e) {
      console.warn('Failed to read response text:', e)
      return []
    }

    // Log raw response for debugging
    console.log('Raw response:', text.substring(0, 200)) // First 200 chars

    // Parse JSON manually
    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      console.warn('Failed to parse JSON:', e)
      return []
    }

    // Extract suggestions: [query, [suggestions], ...]
    if (Array.isArray(json) && Array.isArray(json[1])) {
      const suggestions = json[1].map(s => String(s).trim()).filter(Boolean)
      console.log('Parsed suggestions:', suggestions.length, suggestions)
      return suggestions
    }
    
    console.warn('Invalid response format:', json)
    return []
  } catch (err) {
    console.warn('Fetch failed:', err)
    return []
  }
}

export async function getKeywords(
  query: string,
  country: string
): Promise<KeywordResult> {
  if (!query || query.length < 2) {
    return { base: [], questions: [] }
  }

  const localizedQuery = `${query} in ${country}`
  const cacheKey = `kw_${localizedQuery.toLowerCase().replace(/\s+/g, '_')}`

  // Check cache
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, expiry } = JSON.parse(cached)
      if (Date.now() < expiry) {
        return data
      }
    }
  } catch (e) {
    console.warn('Cache read failed')
  }

  // Fetch base suggestions
  const base = await fetchSuggest(localizedQuery)

  // Fetch question-based keywords
  const questionPromises = prefixes.map(p => 
    fetchSuggest(`${p} ${localizedQuery}`)
  )
  const questionResults = await Promise.all(questionPromises)
  const questions = Array.from(new Set(questionResults.flat()))

  const result = {
    base: Array.from(new Set(base)),
    questions
  }

  // Save to cache
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
         result,
        expiry: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
      })
    )
  } catch (e) {
    console.warn('Cache write failed')
  }

  return result
}