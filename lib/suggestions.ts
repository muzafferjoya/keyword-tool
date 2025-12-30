// lib/suggestions.ts
export type KeywordResult = {
  base: string[]
  questions: string[]
}

const prefixes = ["how", "what", "why", "best", "near me"]

// Free CORS proxy (AllOrigins)
const corsProxy = 'https://api.allorigins.win/get?url='

async function fetchSuggest(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
    const proxiedUrl = corsProxy + encodeURIComponent(url)

    const res = await fetch(proxiedUrl)
    
    if (!res.ok) return []

    const data = await res.json()
    const rawBody = data.contents // AllOrigins returns { contents: "..." }

    // Parse JSON from string
    let json
    try {
      json = JSON.parse(rawBody)
    } catch (e) {
      console.warn('Failed to parse JSON:', e)
      return []
    }

    // Extract suggestions: [query, [suggestions], ...]
    if (Array.isArray(json) && Array.isArray(json[1])) {
      return json[1].map(s => String(s).trim()).filter(Boolean)
    }
    
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