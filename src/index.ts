/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url)

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return handleCORS()
      }

      // Handle predict endpoint
      if (url.pathname.startsWith('/predict/')) {
        return handlePredictRequest(request)
      }

      // Default response for other requests
      return new Response('Hello from Cloudflare Worker!', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return new Response(`Error: ${errorMessage}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  },
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

async function handlePredictRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const experimentId = url.pathname.split('/predict/')[1]

    // Forward to prediction API with minimal essential headers
    const apiUrl = `https://prediction.cmab.optimizely.com/predict/${experimentId}`

    // Only include essential headers for API communication
    const headers = new Headers()
    headers.set("content-type", "text/plain;charset=UTF-8")
    headers.set("accept", "*/*")

    // Stream the request body for better performance
    const response = await fetch(apiUrl, {
      method: request.method,
      headers: headers,
      body: request.body, // Stream the body directly instead of reading it first
    })

    // Stream the response back with CORS headers
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Prediction API Error: ${errorMessage}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
