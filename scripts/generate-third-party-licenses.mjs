// Genera public/third-party-licenses.txt con los avisos de licencia de las dependencias de producción.
// Solo lee archivos que ya están en node_modules; no descarga ni ejecuta código de terceros.
// Uso: npm run licenses   (después de npm install)
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'third-party-licenses.txt');

const paths = execSync('npm ls --omit=dev --all --parseable', { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 })
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean)
  .slice(1); // la primera línea es el propio proyecto

const LICENSE_FILE = /^(licen[sc]e|copying|unlicense|feel-free)(\.(md|txt|markdown))?$/i;

const entries = new Map();
for (const dir of paths) {
  const pkgFile = join(dir, 'package.json');
  if (!existsSync(pkgFile)) continue;
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const key = `${pkg.name}@${pkg.version}`;
  if (entries.has(key)) continue;

  let declared = pkg.license ?? pkg.licenses ?? 'No declarada';
  if (typeof declared === 'object' && !Array.isArray(declared)) declared = declared.type ?? 'No declarada';
  if (Array.isArray(declared)) declared = declared.map(x => (typeof x === 'object' ? x.type : x)).join(' OR ');

  const file = readdirSync(dir).find(f => LICENSE_FILE.test(f));
  const text = file ? readFileSync(join(dir, file), 'utf8').trim() : null;
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? pkg.homepage ?? '';
  const author = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name ?? '';
  entries.set(key, { key, declared: String(declared), repo, author, text });
}

const sorted = [...entries.values()].sort((a, b) => a.key.localeCompare(b.key));
const bar = '='.repeat(72);
const parts = [
  'Nappy - Licencias de terceros / Third-party licenses',
  '',
  'Nappy incluye las siguientes librerías de código abierto, cada una bajo su propia licencia.',
  'Nappy includes the following open source libraries, each under its own license.',
  '',
  `Paquetes / Packages: ${sorted.length}`,
  '',
];
for (const e of sorted) {
  parts.push(bar, `${e.key}`, `Licencia / License: ${e.declared}`);
  if (e.author) parts.push(`Autor / Author: ${e.author}`);
  if (e.repo) parts.push(`Origen / Source: ${e.repo}`);
  parts.push('', e.text ?? '(El paquete no incluye un archivo de licencia; la licencia declarada es la indicada arriba.)', '');
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, parts.join('\n'), 'utf8');
console.log(`Escrito ${out} (${sorted.length} paquetes)`);
