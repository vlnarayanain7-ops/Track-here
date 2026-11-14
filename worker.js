/**
 * Cloudflare Worker: Edge Reverse Proxy for Track Here
 * 1. Proxies /api/* and /socket.io/* to the Render backend (preserves cookies, eliminates CORS issues)
 * 2. Serves static React files from dist/ with SPA routing fallback
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Forward API and WebSocket upgrade / polling requests to Render
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
      const backendUrl = new URL(request.url);
      backendUrl.hostname = 'trackhere-api.onrender.com';
      backendUrl.protocol = 'https:';
      backendUrl.port = '';

      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const backendRequest = new Request(backendUrl.toString(), {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',
      });

      return fetch(backendRequest);
    }

    // Serve static frontend assets from dist/
    let response = await env.ASSETS.fetch(request);

    // If static asset not found, serve index.html for Single Page Application client routing
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexRequest = new Request(new URL('/', request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  },
};
