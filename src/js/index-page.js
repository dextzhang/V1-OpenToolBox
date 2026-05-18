const ALL_CATEGORY = '全部';
const ORDER_KEY = 'opentoolbox.toolOrder.v1';
const RECENT_KEY = 'opentoolbox.recent.v1';
const RECENT_DAYS = 7;
const tools = window.OpenToolBoxTools || [];
const storage = window.OpenToolBoxStorage;

const state = {
  category: ALL_CATEGORY,
  query: '',
  order: []
};

const els = {
  grid: document.querySelector('#toolGrid'),
  tabs: document.querySelector('#categoryTabs'),
  search: document.querySelector('#toolSearch'),
  count: document.querySelector('#toolCount'),
  empty: document.querySelector('#emptyState'),
  recentPanel: document.querySelector('#recentPanel'),
  recentList: document.querySelector('#recentList'),
  resetOrder: document.querySelector('#resetOrderButton'),
  clearLocalData: document.querySelector('#clearLocalDataButton')
};

try {
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error('工具注册表为空或未加载');
  }

  if (!storage || typeof storage.readJson !== 'function' || typeof storage.writeJson !== 'function') {
    throw new Error('本地存储模块未加载');
  }

  state.order = normalizeOrder(storage.readJson(ORDER_KEY, []));
  init();
} catch (error) {
  renderFatalError(error);
}

function init() {
  renderTabs();
  renderRecent();
  renderTools();
  bindEvents();
}

function bindEvents() {
  els.search.addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    renderTools();
  });

  els.resetOrder.addEventListener('click', () => {
    state.order = tools.map(tool => tool.id);
    storage.writeJson(ORDER_KEY, state.order);
    renderTools();
  });

  els.clearLocalData.addEventListener('click', clearLocalData);
}

function renderTabs() {
  const categories = [ALL_CATEGORY, ...new Set(tools.map(tool => tool.category))];
  els.tabs.innerHTML = categories.map(category => `
    <button class="tab ${category === state.category ? 'is-active' : ''}" type="button" data-category="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join('');

  els.tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderTabs();
    renderTools();
  }, { once: true });
}

function renderTools() {
  const orderedTools = state.order
    .map(id => tools.find(tool => tool.id === id))
    .filter(Boolean);

  const filtered = orderedTools.filter(tool => {
    const inCategory = state.category === ALL_CATEGORY || tool.category === state.category;
    const haystack = `${tool.title} ${tool.description} ${tool.category}`.toLowerCase();
    return inCategory && (!state.query || haystack.includes(state.query));
  });

  const canReorder = state.category === ALL_CATEGORY && !state.query;
  els.grid.dataset.reorder = canReorder ? 'enabled' : 'disabled';
  els.count.textContent = `${filtered.length} / ${tools.length}`;
  els.empty.hidden = filtered.length > 0;
  els.grid.innerHTML = filtered.map(tool => renderToolCard(tool, canReorder)).join('');
  bindCardEvents(canReorder);
}

function renderToolCard(tool, canReorder) {
  return `
    <article class="card" draggable="${canReorder ? 'true' : 'false'}" data-id="${escapeHtml(tool.id)}">
      <a class="card-link" href="${escapeHtml(tool.page)}" data-open-tool="${escapeHtml(tool.id)}" draggable="false">
        <span class="card-icon">${escapeHtml(tool.icon)}</span>
        <span class="card-title">${escapeHtml(tool.title)}</span>
        <span class="card-desc">${escapeHtml(tool.description)}</span>
        <span class="card-category">${escapeHtml(tool.category)}</span>
      </a>
      <button class="drag-handle" type="button" aria-label="拖动排序" ${canReorder ? '' : 'disabled'}>⋮⋮ 拖动</button>
    </article>
  `;
}

function bindCardEvents(canReorder) {
  let draggedId = null;
  let didDrag = false;
  let suppressClickUntil = 0;

  els.grid.querySelectorAll('[data-open-tool]').forEach(link => {
    link.addEventListener('click', event => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      recordUsage(link.dataset.openTool);
    });
  });

  if (!canReorder) return;

  els.grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('dragstart', event => {
      draggedId = card.dataset.id;
      didDrag = false;
      card.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedId = null;
      if (didDrag) {
        persistOrderFromDom(false);
        suppressClickUntil = Date.now() + 450;
      }
    });

    card.addEventListener('dragover', event => {
      event.preventDefault();
      const target = event.currentTarget;
      if (!draggedId || target.dataset.id === draggedId) return;
      const dragged = els.grid.querySelector(`[data-id="${cssEscape(draggedId)}"]`);
      if (!dragged) return;
      const afterTarget = event.offsetY > target.offsetHeight / 2;
      els.grid.insertBefore(dragged, afterTarget ? target.nextSibling : target);
      didDrag = true;
    });

    card.addEventListener('drop', event => {
      event.preventDefault();
      if (didDrag) {
        persistOrderFromDom(false);
        suppressClickUntil = Date.now() + 450;
      }
    });
  });
}

function persistOrderFromDom(shouldRender = true) {
  state.order = normalizeOrder(Array.from(els.grid.querySelectorAll('.card')).map(item => item.dataset.id));
  storage.writeJson(ORDER_KEY, state.order);
  if (shouldRender) renderTools();
}

function renderRecent() {
  const recent = pruneRecent(storage.readJson(RECENT_KEY, {}));
  storage.writeJson(RECENT_KEY, recent);

  const ranked = Object.entries(recent)
    .map(([id, days]) => ({
      tool: tools.find(tool => tool.id === id),
      count: Object.values(days).reduce((sum, value) => sum + value, 0)
    }))
    .filter(item => item.tool && item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  els.recentPanel.hidden = ranked.length === 0;
  els.recentList.innerHTML = ranked.map(item => `
    <a class="recent-chip" href="${escapeHtml(item.tool.page)}" data-open-tool="${escapeHtml(item.tool.id)}">
      <span>${escapeHtml(item.tool.icon)}</span>
      <strong>${escapeHtml(item.tool.title)}</strong>
      <em>${item.count} 次</em>
    </a>
  `).join('');
}

function recordUsage(id) {
  const recent = pruneRecent(storage.readJson(RECENT_KEY, {}));
  const day = dateKey(new Date());
  recent[id] = recent[id] || {};
  recent[id][day] = (recent[id][day] || 0) + 1;
  storage.writeJson(RECENT_KEY, recent);
}

function clearLocalData() {
  const ok = confirm('将清理当前地址下的 localStorage，包括排序、最近使用、同步设置和本地工具数据。不会影响 GitHub 仓库。继续？');
  if (!ok) return;
  localStorage.clear();
  if (typeof window.ccShowTip === 'function') {
    window.ccShowTip('本地数据已清理，页面即将刷新。', 'success');
  }
  setTimeout(() => window.location.reload(), 250);
}

function pruneRecent(recent) {
  const validDays = new Set(Array.from({ length: RECENT_DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return dateKey(date);
  }));

  Object.keys(recent).forEach(id => {
    Object.keys(recent[id] || {}).forEach(day => {
      if (!validDays.has(day)) delete recent[id][day];
    });
    if (!Object.keys(recent[id] || {}).length) delete recent[id];
  });

  return recent;
}

function normalizeOrder(order) {
  const ids = new Set(tools.map(tool => tool.id));
  const clean = order.filter((id, index) => ids.has(id) && order.indexOf(id) === index);
  return [...clean, ...tools.map(tool => tool.id).filter(id => !clean.includes(id))];
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function cssEscape(value) {
  return String(value).replace(/"/g, '\\"');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function renderFatalError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (els.count) els.count.textContent = '加载失败';
  if (els.tabs) els.tabs.innerHTML = '';
  if (els.empty) els.empty.hidden = true;
  if (els.grid) {
    els.grid.innerHTML = `
      <div class="load-error">
        <strong>工具列表加载失败</strong>
        <span>${escapeHtml(message)}</span>
        <small>请按 Ctrl + F5 强制刷新，或重启 npm.cmd run start。</small>
      </div>
    `;
  }
  console.error('[OpenToolBox] 首页初始化失败:', error);
}
