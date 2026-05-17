import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const toolsSource = await readFile(new URL('../src/data/tools.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(toolsSource, sandbox);
const tools = sandbox.window.OpenToolBoxTools;
const ids = new Set();
const errors = [];

if (!index.includes('src/js/index-page.js') || !index.includes('src/data/tools.js')) {
  errors.push('index.html 必须加载 src/data/tools.js 和 src/js/index-page.js');
}

for (const tool of tools) {
  if (!tool.id || !tool.title || !tool.page || !tool.category) {
    errors.push(`工具注册项不完整: ${JSON.stringify(tool)}`);
  }
  if (ids.has(tool.id)) {
    errors.push(`工具 id 重复: ${tool.id}`);
  }
  ids.add(tool.id);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`检查通过：已注册 ${tools.length} 个工具。`);
