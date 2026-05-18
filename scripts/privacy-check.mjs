import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url);
const errors = [];
const textExtensions = new Set([
  '.bat',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.txt',
  '.yml'
]);

const forbiddenLiterals = [
  'owner: \'dextzhang\'',
  'owner: "dextzhang"',
  'local-soft-tool-v3',
  'cc_github_sync_settings'
];

const secretPatterns = [
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /ghp_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /AIza[0-9A-Za-z_-]{35}/g
];

await verifyNoDataDirectory();
await scanDirectory(new URL('.', root));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('隐私检查通过：未发现 data/、旧同步默认值或常见密钥格式。');

async function verifyNoDataDirectory() {
  try {
    const info = await stat(new URL('data', root));
    if (info.isDirectory()) {
      errors.push('禁止提交或保留 data/ 目录：该目录用于本地个人导出数据。');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function scanDirectory(directoryUrl) {
  for (const entry of await readdir(directoryUrl, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;

    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
    if (entry.isDirectory()) {
      await scanDirectory(entryUrl);
      continue;
    }

    const filePath = relative(root.pathname, entryUrl.pathname).replaceAll('\\', '/');
    if (filePath === 'scripts/privacy-check.mjs') continue;
    if (!textExtensions.has(getExtension(entry.name))) continue;
    const text = await readFile(entryUrl, 'utf8');
    scanText(filePath, text);
  }
}

function scanText(filePath, text) {
  for (const literal of forbiddenLiterals) {
    if (text.includes(literal)) {
      errors.push(`${filePath}: 包含禁止公开的旧同步默认值：${literal}`);
    }
  }

  for (const pattern of secretPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      errors.push(`${filePath}: 疑似真实密钥或 Token：${match[0].slice(0, 12)}...`);
    }
  }
}

function getExtension(fileName) {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index).toLowerCase() : '';
}
