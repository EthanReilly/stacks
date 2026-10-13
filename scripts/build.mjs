/* Builds www/ for the Android app from src/app-body.html (the same page that runs on claude.ai):
   adds a proper <head>, swaps Google Fonts for bundled font files, and bundles the native bridge. */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

const VERSION = process.env.APP_VERSION || '1.0.0';
const out = 'www';
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/fonts`, { recursive: true });

const fonts = [
  ['@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2', 'bricolage.woff2'],
  ['@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2', 'figtree.woff2'],
  ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 'plex-mono-500.woff2']
];
for (const [from, to] of fonts) copyFileSync(`node_modules/${from}`, `${out}/fonts/${to}`);
writeFileSync(`${out}/fonts.css`, `
@font-face { font-family: "Bricolage Grotesque"; font-style: normal; font-display: swap; font-weight: 200 800; src: url(fonts/bricolage.woff2) format("woff2"); }
@font-face { font-family: "Figtree"; font-style: normal; font-display: swap; font-weight: 300 900; src: url(fonts/figtree.woff2) format("woff2"); }
@font-face { font-family: "IBM Plex Mono"; font-style: normal; font-display: swap; font-weight: 500; src: url(fonts/plex-mono-500.woff2) format("woff2"); }
`.trim() + '\n');

await build({
  entryPoints: ['src/native.js'], bundle: true, minify: true, format: 'iife', target: 'chrome100',
  define: { __APP_VERSION__: JSON.stringify(VERSION) }, outfile: `${out}/native.js`, logLevel: 'warning'
});

let body = readFileSync('src/app-body.html', 'utf8');
/* drop the Google Fonts links (the app ships its own fonts and must work offline) */
body = body.replace(/<link rel="preconnect"[^>]*>\s*/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '');
const head = `<!doctype html>
<html lang="en-IE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#F3F5F4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101413" media="(prefers-color-scheme: dark)">
<link rel="stylesheet" href="fonts.css">
<style>
  /* base reset (claude.ai adds the same around artifacts) */
  [hidden] { display: none !important; }
  html, body { margin: 0; }
  img { max-width: 100%; }
  :root { padding-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px)); padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)); }
  /* keep scrolled content from showing through the status bar */
  body::after { content: ""; position: fixed; left: 0; right: 0; top: 0; height: var(--safe-area-inset-top, env(safe-area-inset-top, 0px)); background: var(--bg); z-index: 15; pointer-events: none; }
  * { -webkit-tap-highlight-color: transparent; }
</style>
<script src="native.js"></script>
</head>
<body>
`;
writeFileSync(`${out}/index.html`, head + body + '\n</body>\n</html>\n');
console.log(`built www/ (version ${VERSION})`);
