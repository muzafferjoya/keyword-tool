// lib/suggestions.ts
export type KeywordResult = {
  base: string[]
  questions: string[]
}

const prefixes = ["how", "what", "why", "best", "near me"]

export async function getKeywords(
  query: string,
  country: string
): Promise<KeywordResult> {
  if (!query || query.length < 2) {
    return { base: [], questions: [] }
  }

  const localizedQuery = `${query} in ${country}`
  const cacheKey = `kw_${localizedQuery.toLowerCase().replace(/\s+/g, "_")}`

  // Check cache first
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, expiry } = JSON.parse(cached)
      if (Date.now() < expiry) {
        return data
      }
    }
  } catch (e) {
    console.warn("Cache read failed")
  }

  try {
    // Base suggestions
    const baseUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
      localizedQuery
    )}`
    const baseRes = await fetch(baseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
      },
      mode: "no-cors",
    })

    let base: string[] = []
    try {
      const text = await baseRes.text()
      const json = JSON.parse(text)

      // Google suggest format: [query, [suggestions], [], {meta}]
      if (Array.isArray(json) && json.length >= 2) {
        const suggestions = json[1]
        if (Array.isArray(suggestions)) {
          base = suggestions.map((s: any) => typeof s === 'string' ? s : '')
        }
      }
    } catch (e) {
      console.debug("Base parse failed", e)
    }

    // Question-based keywords
    const questionPromises = prefixes.map(async (p) => {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
        `${p} ${localizedQuery}`
      )}`
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
          },
          mode: "no-cors",
        })
        const text = await res.text()
        const json = JSON.parse(text)

        if (Array.isArray(json) && json.length >= 2) {
          const suggestions = json[1]
          if (Array.isArray(suggestions)) {
            return suggestions.map((s: any) => typeof s === 'string' ? s : '')
          }
        }
        return []
      } catch {
        return []
      }
    })

    const questionResults = await Promise.all(questionPromises)
    const questions = Array.from(new Set(questionResults.flat()))

    const result = {
      base: Array.from(new Set(base)),
      questions,
    }

    // Save to cache (24 hours)
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: result,
          expiry: Date.now() + 1000 * 60 * 60 * 24, // 24 hrs
        })
      )
    } catch (e) {
      console.warn("Cache write failed")
    }

    return result
  } catch (err) {
    console.warn("Failed to fetch keywords", err)
    return { base: [], questions: [] }
  }
}