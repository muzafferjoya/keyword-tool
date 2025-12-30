"use client"

import { useState } from "react"
import { getKeywords, KeywordResult } from "../lib/suggestions"

export default function Home() {
  const [query, setQuery] = useState("")
  const [country, setCountry] = useState("India")
  const [result, setResult] = useState<KeywordResult>({ base: [], questions: [] })
  const [loading, setLoading] = useState(false)

  const popularIdeas = [
    "bakery business",
    "online tuition",
    "digital marketing agency",
    "fitness trainer",
    "graphic designer",
    "photographer",
    "carpenter",
    "plumber",
    "yoga studio",
    "mobile repair shop",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    const keywords = await getKeywords(query, country)
    setResult(keywords)
    setLoading(false)
  }

  const loadPopular = (idea: string) => {
    setQuery(idea)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Free Keyword Research Tool
          </h1>
          <p className="text-gray-600 mt-2">
            Find long-tail, low-competition keyword ideas for your small business
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your business idea..."
              className="flex-1 border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>India</option>
              <option>USA</option>
              <option>UK</option>
              <option>Canada</option>
              <option>Australia</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Finding..." : "Find Keywords"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center my-8">
            <p className="text-gray-600">Searching Google suggestions...</p>
          </div>
        )}

        {!loading && result.base.length === 0 && !query && (
          <div className="text-center text-gray-500">
            <p>Enter a business idea to get started.</p>
          </div>
        )}

        {result.base.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              General Keyword Ideas
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.base.map((kw) => (
                <li key={kw} className="py-1 px-2 bg-blue-50 text-blue-800 rounded text-sm">
                  {kw}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.questions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Customer Questions (SEO Gold!)
            </h2>
            <ul className="space-y-1">
              {result.questions.map((kw) => (
                <li key={kw} className="py-2 px-3 border-b border-gray-100 last:border-0 text-gray-700">
                  <strong>{kw}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Popular Ideas */}
      <div className="max-w-3xl mx-auto mt-12">
        <h2 className="text-xl font-semibold mb-4">Popular Micro Business Ideas (2025)</h2>
        <div className="flex flex-wrap gap-2">
          {popularIdeas.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => loadPopular(idea)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm transition"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto mt-16 text-center text-sm text-gray-500">
        <p>
          Made for small businesses & solopreneurs • Fast, free, no login required
        </p>
      </footer>
    </div>
  )
}