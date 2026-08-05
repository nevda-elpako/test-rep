import type { Context } from "@netlify/functions";

// ----------------------------------------------------------------------
// Proxies every /api/* request to the Elpako staging API, so the browser
// never talks to api-staging.elpako.lt directly (avoids CORS entirely —
// same-origin from the page's point of view) and so the fallback demo
// access_token never ships in client-side code.
//
// Each visitor can supply their own assigned access_token as a query
// param (as before); if they don't, we fall back to a shared demo token
// kept only in this function's environment (ELPAKO_STAGING_ACCESS_TOKEN).
// ----------------------------------------------------------------------

const STAGING_BASE_URL = "https://api-staging.elpako.lt";

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  // req.url reflects the original client-facing request path (e.g.
  // /api/v1/mobile/login.json) even though netlify.toml's redirect rule
  // internally dispatches it to this function — and that's exactly the
  // path Elpako's own API expects (its endpoints are themselves rooted
  // at /api/v1/...), so it's forwarded upstream unchanged.
  const subpath = url.pathname;
  const clientToken = url.searchParams.get("access_token");

  const upstream = new URL(STAGING_BASE_URL + subpath);
  url.searchParams.forEach((value, key) => {
    if (key !== "access_token") upstream.searchParams.set(key, value);
  });
  upstream.searchParams.set(
    "access_token",
    clientToken && clientToken.trim() ? clientToken.trim() : process.env.ELPAKO_STAGING_ACCESS_TOKEN ?? ""
  );

  const isBodyless = req.method === "GET" || req.method === "HEAD";
  const upstreamResponse = await fetch(upstream, {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/octet-stream",
    },
    body: isBodyless ? undefined : req.body,
    // @ts-expect-error Node's fetch requires this for streaming request bodies.
    duplex: isBodyless ? undefined : "half",
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      "content-type": upstreamResponse.headers.get("content-type") ?? "application/json",
    },
  });
};
