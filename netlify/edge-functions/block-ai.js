// Blocks known AI fetchers/scrapers from reading the games (humans and Googlebot are unaffected).
const BAD=/claudebot|claude-user|claude-searchbot|anthropic|gptbot|chatgpt|oai-searchbot|openai|perplexity|ccbot|bytespider|applebot-extended|google-extended|cohere|meta-externalagent|facebookbot|amazonbot|diffbot|python-requests|python-urllib|aiohttp|httpx|curl\/|wget|go-http-client|node-fetch|axios|undici|scrapy|headless/i;
export default async (request, context) => {
  const ua = request.headers.get('user-agent') || '';
  const path = new URL(request.url).pathname;
  if (path === '/robots.txt' || path === '/sitemap.xml' || path.startsWith('/google')) return;
  if (!ua || BAD.test(ua)) return new Response('Forbidden', { status: 403 });
};
export const config = { path: '/*' };
