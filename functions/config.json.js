export function onRequestGet({ env }) {
  const apiKey = env.GIPHY_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: 'GIPHY_API_KEY is not configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    { apiKey },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
