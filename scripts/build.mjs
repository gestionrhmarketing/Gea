// Generador estático sin dependencias para el sitio de GEA Environment.
// Uso: node scripts/build.mjs   (o `npm run build`)
//
// - Lee site.config.json (datos de contacto, dominio, modo borrador, destino del formulario).
// - Combina src/layout.html + src/partials/*.html + src/pages/*.html.
// - Copia src/assets a dist/assets.
// - Genera sitemap.xml y robots.txt.
// - Verifica enlaces internos y anclas, y reporta los datos pendientes por página.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const read = (p) => fs.readFileSync(p, 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isPending = (v) => !v || String(v).trim().startsWith('[');
const baseUrl = String(config.baseUrl || '').replace(/\/$/, '');

// ---------- Datos de contacto ----------
function pendingSpan(v) {
  return `<span class="pending">${esc(v || '[DATO POR CONFIRMAR]')}</span>`;
}
function contact(key) {
  const v = config.contact?.[key];
  if (isPending(v)) return pendingSpan(v);
  if (key === 'phone') return `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ''))}">${esc(v)}</a>`;
  if (key === 'whatsapp') return `<a href="https://wa.me/${esc(String(v).replace(/\D/g, ''))}" rel="noopener" target="_blank">${esc(v)}<span class="sr-only"> (abre en una pestaña nueva)</span></a>`;
  if (key === 'email') return `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
  return esc(v);
}
function social() {
  const list = Array.isArray(config.social) ? config.social.filter((s) => s && s.url && s.name) : [];
  if (!list.length) return pendingSpan('[REDES SOCIALES POR CONFIRMAR]');
  return `<ul class="social-list">${list
    .map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.name)}<span class="sr-only"> (abre en una pestaña nueva)</span></a></li>`)
    .join('')}</ul>`;
}

// ---------- Plantillas ----------
const layout = read(path.join(SRC, 'layout.html'));
const partials = Object.fromEntries(
  fs.readdirSync(path.join(SRC, 'partials'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [path.basename(f, '.html'), read(path.join(SRC, 'partials', f))])
);

function parsePage(file) {
  const raw = read(file);
  const m = raw.match(/^\s*<!--meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`Falta el bloque <!--meta {...} --> en ${file}`);
  const meta = JSON.parse(m[1]);
  return { meta, body: raw.slice(m[0].length) };
}

function breadcrumbs(meta) {
  if (!meta.breadcrumbs) return '';
  const items = [{ label: 'Inicio', href: 'index.html' }, ...meta.breadcrumbs];
  const html = items
    .map((b, i) =>
      i === items.length - 1
        ? `<li><span aria-current="page">${esc(b.label)}</span></li>`
        : `<li><a href="${esc(b.href)}">${esc(b.label)}</a></li>`
    )
    .join('');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.label,
      item: `${baseUrl}/${b.href || meta.file}`,
    })),
  };
  return `<nav class="breadcrumbs container" aria-label="Ruta de navegación"><ol>${html}</ol></nav>
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function jsonLd(meta) {
  if (!meta.organizationLd) return '';
  // Solo se incluyen datos confirmados en el documento base; los de contacto se agregan cuando existan.
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: `${baseUrl}/`,
    logo: `${baseUrl}/assets/img/logo-gea-provisional-520.png`,
    description:
      'Servicios especializados en gestión ambiental para empresas e industrias: manejo de residuos peligrosos, RPBI, residuos de manejo especial, capacitación, asesoría y trámites ambientales.',
  };
  if (!isPending(config.contact?.email)) org.email = config.contact.email;
  if (!isPending(config.contact?.phone)) org.telephone = config.contact.phone;
  if (!isPending(config.legalName)) org.legalName = config.legalName;
  return `<script type="application/ld+json">${JSON.stringify(org)}</script>`;
}

function render(tpl, ctx, depth = 0) {
  if (depth > 5) throw new Error('Inclusión de parciales demasiado profunda');
  return tpl
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
      if (!(name in partials)) throw new Error(`Parcial no encontrado: ${name}`);
      return render(partials[name], ctx, depth + 1);
    })
    .replace(/\{\{nav:([\w-]+)\}\}/g, (_, key) => (ctx.meta.nav === key ? 'aria-current="page"' : ''))
    .replace(/\{\{contact:([\w-]+)\}\}/g, (_, key) => contact(key))
    .replace(/\{\{social\}\}/g, () => social())
    .replace(/\{\{([\w.]+)\}\}/g, (all, key) => (key in ctx.vars ? ctx.vars[key] : all));
}

// ---------- Construcción ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(SRC, 'assets'), path.join(DIST, 'assets'), { recursive: true });

const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html')).sort();
const sitemapEntries = [];
const pendingReport = [];

for (const f of pages) {
  const { meta, body } = parsePage(path.join(SRC, 'pages', f));
  meta.file = f;
  const pagePath = f === 'index.html' ? '' : f;
  const canonical = `${baseUrl}/${pagePath}`;
  const draftBanner = config.draft ? render(partials['draft-banner'] || '', { meta, vars: {} }) : '';

  const vars = {
    title: esc(meta.title),
    description: esc(meta.description),
    canonical: esc(canonical),
    siteName: esc(config.siteName),
    locale: esc(config.locale || 'es_MX'),
    robots: meta.noindex || config.draft ? 'noindex, nofollow' : 'index, follow',
    htmlClass: config.draft ? 'is-draft' : '',
    draftBanner,
    breadcrumbs: breadcrumbs(meta),
    jsonld: jsonLd(meta),
    bodyClass: esc(meta.bodyClass || ''),
    formEndpoint: esc(config.formEndpoint || ''),
    formNotice: '',
    year: String(new Date().getFullYear()),
  };

  const ctx = { meta, vars };
  vars.content = render(body, ctx);
  const html = render(layout, ctx);
  fs.writeFileSync(path.join(DIST, f), html);

  if (!meta.noindex) sitemapEntries.push({ loc: canonical, priority: f === 'index.html' ? '1.0' : meta.priority || '0.7' });

  const text = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const found = [...text.matchAll(/\[[A-ZÁÉÍÓÚÑ0-9 ,.:/()\-]*POR (?:CONFIRMAR|VALIDAR)[^\]]*\]/g)].map((m) => m[0]);
  const verify = (text.match(/class="verify"/g) || []).length;
  pendingReport.push({ page: f, placeholders: [...new Set(found)], verify });
}

// sitemap.xml y robots.txt
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries
    .map((e) => `  <url><loc>${esc(e.loc)}</loc><lastmod>${today}</lastmod><priority>${e.priority}</priority></url>`)
    .join('\n')}\n</urlset>\n`
);
fs.writeFileSync(
  path.join(DIST, 'robots.txt'),
  config.draft
    ? `# Modo borrador: se bloquea la indexación hasta publicar (draft=false en site.config.json)\nUser-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`
);

// ---------- Verificación de enlaces internos ----------
const errors = [];
const htmlFiles = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
const idsByFile = Object.fromEntries(
  htmlFiles.map((f) => [f, new Set([...read(path.join(DIST, f)).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))])
);
for (const f of htmlFiles) {
  const html = read(path.join(DIST, f));
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|#$)/.test(url)) continue;
    const [pathPart, hash] = url.split('#');
    const clean = pathPart.split('?')[0];
    const target = clean ? clean : f;
    if (clean && !fs.existsSync(path.join(DIST, clean))) errors.push(`${f}: enlace roto → ${url}`);
    else if (hash && target.endsWith('.html') && !idsByFile[target]?.has(hash)) errors.push(`${f}: ancla inexistente → ${url}`);
  }
}

// ---------- Reporte ----------
console.log(`\n✔ ${pages.length} páginas generadas en dist/  (modo borrador: ${config.draft ? 'sí' : 'no'})`);
console.log(`✔ Formulario: ${config.formEndpoint ? 'conectado a ' + config.formEndpoint : 'SIN DESTINO CONFIGURADO (no envía mensajes)'}`);
console.log('\nDatos pendientes visibles por página:');
for (const r of pendingReport) {
  console.log(`  ${r.page.padEnd(42)} marcadores: ${String(r.placeholders.length).padStart(2)}   afirmaciones por validar: ${r.verify}`);
}
if (errors.length) {
  console.error(`\n✖ ${errors.length} problema(s) de enlaces:\n  ` + errors.join('\n  '));
  process.exit(1);
} else {
  console.log('\n✔ Todos los enlaces internos y anclas son válidos.\n');
}
