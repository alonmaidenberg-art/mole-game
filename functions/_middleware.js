// Cloudflare Pages: block known AI fetchers and scripted clients (humans and Googlebot are unaffected).
const BAD=/claudebot|claude-user|claude-searchbot|anthropic|gptbot|chatgpt|oai-searchbot|openai|perplexity|ccbot|bytespider|applebot-extended|google-extended|cohere|meta-externalagent|facebookbot|amazonbot|diffbot|python-requests|python-urllib|aiohttp|httpx|curl\/|wget|go-http-client|node-fetch|axios|undici|scrapy|headless/i;
export async function onRequest(context){
  const ua=context.request.headers.get('user-agent')||'';
  const p=new URL(context.request.url).pathname;
  if(p==='/robots.txt'||p==='/sitemap.xml'||p.startsWith('/google'))return context.next();
  if(!ua||BAD.test(ua))return new Response('Forbidden',{status:403});
  return context.next();
}
