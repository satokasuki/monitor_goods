/**
 * Cloudflare Pages Function — GET /api/likes
 *
 * Scrapes the Threads post page for the current like count.
 * Returns JSON: { likes: number, timestamp: string }
 *
 * Target post:
 * https://www.threads.com/@rioleia.cafe_satoka/post/DUrqbHRAbtV
 */

interface Env {}

const THREADS_URL =
  'https://www.threads.net/@rioleia.cafe_satoka/post/DUrqbHRAbtV'

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Try multiple regex patterns to extract the like count from the HTML.
 * Threads embeds JSON data in <script> tags — the field name varies.
 */
function extractLikeCount(html: string): number | null {
  const patterns = [
    // Standard like_count field in embedded JSON
    /"like_count"\s*:\s*(\d+)/,
    // Alternate formats
    /"likeCount"\s*:\s*(\d+)/,
    /"likes"\s*:\s*\{\s*"count"\s*:\s*(\d+)/,
    // Open Graph / meta tag fallback
    /meta\s+(?:property|name)="[^"]*like[^"]*"\s+content="(\d+)"/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const count = parseInt(match[1], 10)
      if (!isNaN(count) && count > 0) {
        return count
      }
    }
  }

  return null
}

/**
 * Extract post text from embedded JSON in the HTML.
 */
function extractPostText(html: string): string | null {
  const patterns = [
    /"text"\s*:\s*\{"text"\s*:\s*"([^"]+)"/,
    /"caption"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      // Unescape basic JSON string escapes
      return match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
  }

  return null
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const response = await fetch(THREADS_URL, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Threads returned HTTP ${response.status}`,
          likes: null,
          postText: null,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      )
    }

    const html = await response.text()
    const likes = extractLikeCount(html)
    const postText = extractPostText(html)

    if (likes !== null) {
      return new Response(
        JSON.stringify({
          likes,
          postText,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=5',
            ...CORS_HEADERS,
          },
        }
      )
    }

    // Could not parse — return the error with a snippet of HTML for debugging
    return new Response(
      JSON.stringify({
        error: 'Could not extract like count from page',
        likes: null,
        postText: null,
        htmlLength: html.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Unknown error',
        likes: null,
        postText: null,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    )
  }
}

/** Handle CORS preflight */
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}
