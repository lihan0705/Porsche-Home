/**
 * 抽卡彩蛋页的干净 URL：/engine-brokendown（不带 index.html）。
 *
 * public/engine-brokendown/index.html 是零构建单文件页（可双击直接打开），
 * 它的 three.js 走 importmap + ./vendor/...，这些都是相对「文档目录」解析的。
 * 目录 URL 在 basePath 下会被路由规范化掉尾斜杠：
 *   /porsche-home/engine-brokendown/ → 308 → /porsche-home/engine-brokendown
 * 于是页面内的 ./vendor/... 会解析到 /porsche-home/vendor/...（404），
 * 而静态目录索引在 dev 下也不会把 /engine-brokendown 映射到 index.html。
 *
 * 这里用同一个文件（单一事实源，不改 HTML）直接应答该路径，
 * 并注入 <base> 把相对基准钉回本页目录，让 importmap 与 ./vendor 正常解析。
 * dev 与线上 Worker 跑的是同一条路由，不依赖静态目录索引的具体行为。
 * 单一事实源仍是 public/engine-brokendown/index.html（可双击打开的那份），此处不复制副本。
 */
import html from '@/public/engine-brokendown/index.html?raw';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const body = html.replace('<head>', `<head>\n<base href="${pathname}/">`);
  return new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
