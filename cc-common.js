(function () {
    const page = document.documentElement.dataset.page || '';
    const PICSUM_WIDTH = 1920;
    const PICSUM_HEIGHT = 1080;
    const GUIDE_SEEN_KEY = `cc_guide_seen_${page}_v2_1_3`;
    const SCALE_KEY = 'cc_ui_scale';

    // 应用保存的缩放比例
    function applyScale() {
        const saved = localStorage.getItem(SCALE_KEY);
        if (saved) {
            document.body.style.zoom = saved;
        } else {
            document.body.style.zoom = '0.8';
            localStorage.setItem(SCALE_KEY, '0.8');
        }
    }
    applyScale();

    // 添加顶部滑入式控制条
    function createTitlebar() {
        // 只在Tauri环境下显示控制条
        if (!window.__TAURI__) return;
        if (document.querySelector('.cc-titlebar')) return;
        
        // 创建触发感应区
        const trigger = document.createElement('div');
        trigger.className = 'cc-titlebar-trigger';
        document.body.appendChild(trigger);
        
        // 创建控制条
        const titlebar = document.createElement('div');
        titlebar.className = 'cc-titlebar';
        titlebar.innerHTML = `
            <div class="cc-titlebar-drag" data-tauri-drag-region>
                <div class="cc-titlebar-logo">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <div class="cc-titlebar-title">超超工具箱</div>
            </div>
            <div class="cc-titlebar-divider"></div>
            <div class="cc-titlebar-group">
                <div class="cc-titlebar-label">窗口</div>
                <select class="cc-titlebar-scale" id="ccScaleSelect">
                    <option value="0.7">70%</option>
                    <option value="0.8" selected>80%</option>
                    <option value="1">100%</option>
                    <option value="1.2">120%</option>
                </select>
            </div>
            <div class="cc-titlebar-divider"></div>
            <div class="cc-titlebar-btns">
                <button class="cc-titlebar-btn" id="ccMinBtn">
                    <svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="2" rx="1" fill="currentColor"/></svg>
                </button>
                <button class="cc-titlebar-btn" id="ccMaxBtn">
                    <svg viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
                <button class="cc-titlebar-btn cc-titlebar-close" id="ccCloseBtn">
                    <svg viewBox="0 0 16 16"><line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </div>
        `;
        document.body.appendChild(titlebar);

        let hideTimer = null;
        
        // 显示控制条
        const showTitlebar = () => {
            if (hideTimer) clearTimeout(hideTimer);
            titlebar.classList.add('show');
        };
        
        // 隐藏控制条
        const hideTitlebar = () => {
            hideTimer = setTimeout(() => {
                titlebar.classList.remove('show');
            }, 1000);
        };
        
        // 触发区事件
        trigger.addEventListener('mouseenter', showTitlebar);
        
        // 控制条事件
        titlebar.addEventListener('mouseenter', () => {
            if (hideTimer) clearTimeout(hideTimer);
            titlebar.classList.add('show');
        });
        titlebar.addEventListener('mouseleave', hideTitlebar);

        // 绑定缩放选择器
        const scaleSelect = document.getElementById('ccScaleSelect');
        const savedScale = localStorage.getItem(SCALE_KEY) || '0.8';
        scaleSelect.value = savedScale;
        scaleSelect.addEventListener('change', (e) => {
            const newScale = e.target.value;
            document.body.style.zoom = newScale;
            localStorage.setItem(SCALE_KEY, newScale);
        });

        // 绑定窗口控制（如果在Tauri环境）
        if (window.__TAURI__) {
            const { getCurrentWindow } = window.__TAURI__.window;
            const appWindow = getCurrentWindow();
            
            document.getElementById('ccMinBtn').addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await appWindow.minimize();
                } catch (err) {
                    console.error('Minimize error:', err);
                }
            });
            
            document.getElementById('ccMaxBtn').addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    const isMaximized = await appWindow.isMaximized();
                    if (isMaximized) {
                        await appWindow.unmaximize();
                    } else {
                        await appWindow.maximize();
                    }
                } catch (err) {
                    console.error('Maximize error:', err);
                }
            });
            
            document.getElementById('ccCloseBtn').addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await appWindow.close();
                } catch (err) {
                    console.error('Close error:', err);
                }
            });

            // 拖动功能使用 Tauri 内置 data-tauri-drag-region
        }
    }
    createTitlebar();

    // 添加全局快捷键监听（仅 Tauri 环境有效）
    function setupGlobalShortcuts() {
        if (!window.__TAURI__) return;

        document.addEventListener('keydown', (e) => {
            // Ctrl+W 返回主页
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
                e.preventDefault();
                // 检查当前是否已经在首页
                const currentPage = document.documentElement.dataset.page || '';
                if (currentPage !== 'index') {
                    window.location.href = 'index.html';
                }
            }
        });
    }
    setupGlobalShortcuts();

    const GUIDE_MAP = {
        index: {
            title: '首页怎么用',
            body: [
                '点击卡片进入对应工具。',
                '拖动卡片可以调整首页排序，排序会自动保存在本地。',
                '左上角菜单里的“同步”可以把首页排序备份到 GitHub。',
                '菜单里的“背景”可以切换在线随机背景。'
            ]
        },
        'cc-bookmark-manager-v2': {
            title: '书签管理怎么用',
            body: [
                '“新建书签”和“新建文件夹”用于整理常用网址。',
                '导入/导出使用浏览器通用 bookmarks.html 格式。',
                '左上角菜单里的“同步”会同步书签和文件夹数据到 GitHub。'
            ]
        },
        'cc-bookmark-manager': {
            title: '书签管理怎么用',
            body: [
                '可以按文件夹管理书签，也可以用搜索快速过滤。',
                '左上角菜单里的“同步”会同步书签和文件夹数据到 GitHub。'
            ]
        },
        'cc-notes': {
            title: '超超笔记怎么用',
            body: [
                '“笔记”保存长文本，“待办”保存任务列表。',
                '数据默认保存在本机浏览器 localStorage。',
                '左上角菜单里的“同步”会同步笔记和待办到 GitHub。'
            ]
        },
        'cc-txt': {
            title: '超超文本箱怎么用',
            body: [
                '用“新建文本”保存常用文本、草稿和片段。',
                '可以用文件夹、标签、收藏来筛选。',
                '勾选“设为私密”会用文本箱密码保存内容；首次使用会设置密码，之后打开或复制私密文本都要输入同一个密码。',
                '左上角菜单里的“同步”会同步文本箱数据到 GitHub。'
            ]
        },
        'cc-inspiration': {
            title: '灵感记录怎么用',
            body: [
                '在顶部输入标题、内容、类型、状态、1-6 星重要性和标签，按 Ctrl+Enter 可以快速保存。',
                '用灵感记录箱、置顶、归档、搜索和标签筛选来整理灵感。',
                '左上角菜单里的“同步”会同步灵感记录到 GitHub。'
            ]
        },
        'cc-browser': {
            title: '轻量浏览器怎么用',
            body: [
                '顶部地址栏可以输入网址或搜索词。',
                '首页快捷链接可新增、编辑和删除。',
                '左上角菜单里的“同步”会同步快捷链接到 GitHub。'
            ]
        },
        'cc-llm-config-manager': {
            title: '大模型配置怎么用',
            body: [
                '保存 API 地址、Key 和模型名称，方便统一管理。',
                '可以测试连接、复制配置、导出配置。',
                '同步会包含 API Key，请确认 GitHub 仓库权限符合你的预期。'
            ]
        },
        'cc-ocr-translate': {
            title: '截图 OCR 怎么用',
            body: [
                '上传或粘贴截图后识别文字，再按当前设置翻译。',
                '最近记录会保存在本地。',
                '左上角菜单里的“同步”会同步 OCR 历史记录和主题设置。'
            ]
        },
        'cc-trans': {
            title: '截图 OCR 翻译 V2 怎么用',
            body: [
                '点击上传、拖入图片，或直接 Ctrl+V 粘贴截图。',
                '可以选择本地 Tesseract 或 OCR.space 识别，再用 Google 或 MyMemory 翻译。',
                '左上角菜单里的“同步”会同步 V2 历史记录和常用设置。'
            ]
        },
        'cc-pomodoro-timer': {
            title: '番茄钟怎么用',
            body: [
                '设置专注和休息时长后开始计时。',
                '完成次数会保存为本地统计。',
                '左上角菜单里的“同步”会同步番茄钟统计到 GitHub。'
            ]
        },
        'cc-password-manager': {
            title: '密码管理器怎么用',
            body: [
                '可以生成密码，也可以保存条目方便个人使用。',
                '同步会包含保存的密码和历史记录。',
                '即使是私有仓库，也建议谨慎同步密码类数据。'
            ]
        },
        'cc-ai-prompts-viewer': {
            title: 'AI 提示词库怎么用',
            body: [
                '可以切换 CivitAI、Lexica 和精选案例来源。',
                '用分类和搜索快速筛选提示词。',
                '打开卡片后可以复制正向/负向提示词。'
            ]
        },
        'ai-prompts-viewer': {
            title: 'AI 提示词库怎么用',
            body: [
                '用分类和排序筛选本地提示词案例。',
                '打开卡片后可以复制提示词。'
            ]
        },
        'cc-todo': {
            title: '超超Todo 怎么用',
            body: [
                '在顶部输入待办内容，选择类型（一次性/每日/每周/每月）、星级、标签和颜色后添加。',
                '一次性待办完成后保持完成状态，每日/每周/每月待办会在对应时间自动重置为未完成。',
                '待办支持拖拽排序、置顶、编辑、重新评分和删除操作。',
                '每日鸡汤可以保存到个人鸡汤库，最多保存10条。',
                '左上角菜单里的"同步"会同步 Todo 数据和鸡汤记录到 GitHub。'
            ]
        },
        'cc-todo-v2': {
            title: '超超Todo V2 怎么用',
            body: [
                '在左侧输入任务内容，按 Enter 快速添加；点击"更多设置"展开优先级、标签和颜色。',
                '中间任务区支持三种视图：今日视图（按优先级分组）、分类视图（按类型分组）、已完成。',
                '勾选完成任务后有 2 秒撤销机会；悬浮任务行可编辑或删除。',
                '右侧概览面板展示进度圆环、任务分布和标签统计。',
                '左上角菜单里的"同步"会同步 Todo 任务数据到 GitHub。'
            ]
        }
    };

    function ensureBgLayer() {
        let layer = document.getElementById('bg-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'bg-layer';
            document.body.prepend(layer);
        }
        return layer;
    }

    function isPicsumUrl(url) {
        return typeof url === 'string' && url.includes('picsum.photos');
    }

    function makePicsumUrl() {
        const seed = `cc-bg-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${PICSUM_WIDTH}/${PICSUM_HEIGHT}`;
    }

    function setBackground(url) {
        ensureBgLayer().style.backgroundImage = `url("${url}")`;
    }

    const BG_EFFECTS_KEY = 'cc_bg_effects_v1';
    const BG_EFFECT_DEFAULTS = {
        opacity: 100,
        blur: 10,
        brightness: 48
    };

    function clampNumber(value, min, max, fallback) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(max, Math.max(min, number));
    }

    function loadBgEffects() {
        try {
            const saved = JSON.parse(localStorage.getItem(BG_EFFECTS_KEY) || '{}');
            return {
                opacity: clampNumber(saved.opacity, 20, 100, BG_EFFECT_DEFAULTS.opacity),
                blur: clampNumber(saved.blur, 0, 24, BG_EFFECT_DEFAULTS.blur),
                brightness: clampNumber(saved.brightness, 20, 110, BG_EFFECT_DEFAULTS.brightness)
            };
        } catch (_) {
            return { ...BG_EFFECT_DEFAULTS };
        }
    }

    function saveBgEffects(effects) {
        try {
            localStorage.setItem(BG_EFFECTS_KEY, JSON.stringify(effects));
        } catch (_) {}
    }

    function applyBgEffects(effects = loadBgEffects()) {
        const html = document.documentElement;
        html.style.setProperty('--cc-bg-opacity', String(effects.opacity / 100));
        html.style.setProperty('--cc-bg-blur', `${effects.blur}px`);
        html.style.setProperty('--cc-bg-brightness', String(effects.brightness / 100));

        document.querySelectorAll('[data-bg-effect-value]').forEach(value => {
            const key = value.dataset.bgEffectValue;
            const suffix = key === 'blur' ? 'px' : '%';
            value.textContent = `${effects[key]}${suffix}`;
        });

        document.querySelectorAll('[data-bg-effect]').forEach(input => {
            const key = input.dataset.bgEffect;
            input.value = effects[key];
        });
    }

    function setBgEffect(key, value) {
        const effects = loadBgEffects();
        if (key === 'opacity') effects.opacity = clampNumber(value, 20, 100, BG_EFFECT_DEFAULTS.opacity);
        if (key === 'blur') effects.blur = clampNumber(value, 0, 24, BG_EFFECT_DEFAULTS.blur);
        if (key === 'brightness') effects.brightness = clampNumber(value, 20, 110, BG_EFFECT_DEFAULTS.brightness);
        saveBgEffects(effects);
        applyBgEffects(effects);
    }

    function randomBackground() {
        const url = makePicsumUrl();
        setBackground(url);
        try {
            localStorage.setItem('toolBg', url);
            localStorage.setItem('bgImage', url);
            localStorage.setItem('bgProvider', 'picsum.photos');
        } catch (_) {}
    }

    function loadBackground() {
        let saved = '';
        try {
            saved = localStorage.getItem('toolBg') || localStorage.getItem('bgImage') || '';
        } catch (_) {}

        if (isPicsumUrl(saved)) setBackground(saved);
        else randomBackground();
    }

    function createActionButton(title, text, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cc-action-item cc-menu-item';
        button.setAttribute('role', 'menuitem');
        button.title = title;
        button.setAttribute('aria-label', title);
        button.textContent = text;
        button.addEventListener('click', event => {
            event.stopPropagation();
            onClick();
            closeQuickMenu();
        });
        return button;
    }

    function getQuickActions() {
        let wrap = document.querySelector('.cc-quick-actions');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'cc-quick-actions';
            document.body.appendChild(wrap);
        }
        return wrap;
    }

    function getMenuPanel() {
        const wrap = getQuickActions();
        let panel = wrap.querySelector('.cc-menu-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'cc-menu-panel';
            panel.setAttribute('role', 'menu');
            panel.innerHTML = `
                <div class="cc-menu-head">
                    <strong>\u5de5\u5177\u83dc\u5355</strong>
                    <span>\u5feb\u6377\u64cd\u4f5c</span>
                </div>
            `;
            wrap.appendChild(panel);
        }
        return panel;
    }

    function getMenuSection(key, title) {
        const panel = getMenuPanel();
        let section = panel.querySelector(`[data-cc-menu-section="${key}"]`);
        if (!section) {
            section = document.createElement('div');
            section.className = 'cc-menu-section';
            section.setAttribute('data-cc-menu-section', key);
            section.innerHTML = `<div class="cc-menu-section-title">${escapeHtml(title)}</div>`;
            panel.appendChild(section);
        }
        return section;
    }

    function toggleQuickMenu() {
        const wrap = getQuickActions();
        wrap.classList.toggle('expanded');
        wrap.querySelector('.cc-menu-toggle')?.setAttribute('aria-expanded', wrap.classList.contains('expanded') ? 'true' : 'false');
    }

    function closeQuickMenu() {
        const wrap = document.querySelector('.cc-quick-actions');
        wrap?.classList.remove('expanded');
        wrap?.querySelector('.cc-menu-toggle')?.setAttribute('aria-expanded', 'false');
    }

    function addQuickActions() {
        if (document.querySelector('.cc-quick-actions')) return;

        const wrap = getQuickActions();
        if (page !== 'index') {
            const home = document.createElement('button');
            home.type = 'button';
            home.className = 'cc-home-direct';
            home.title = '\u8fd4\u56de\u5de5\u5177\u9996\u9875';
            home.setAttribute('aria-label', '\u8fd4\u56de\u5de5\u5177\u9996\u9875');
            home.textContent = '\u2302';
            home.addEventListener('click', event => {
                event.stopPropagation();
                window.location.href = 'index.html';
            });
            wrap.appendChild(home);
        }

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'cc-menu-toggle';
        toggle.title = '\u6253\u5f00\u5de5\u5177\u83dc\u5355';
        toggle.setAttribute('aria-label', '\u6253\u5f00\u5de5\u5177\u83dc\u5355');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '\u2630';
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            toggleQuickMenu();
        });
        wrap.appendChild(toggle);

        const backgroundText = '\u5207\u6362\u80cc\u666f';
        const guideText = '\u4f7f\u7528\u63d0\u793a';
        const scrollbarText = '\u6eda\u52a8\u6761\u6837\u5f0f';
        const navSection = getMenuSection('navigation', '\u5bfc\u822a');
        const generalSection = getMenuSection('general', '\u901a\u7528');

        if (page !== 'index') {
            navSection.appendChild(createActionButton('\u8fd4\u56de\u9996\u9875', '\u8fd4\u56de\u9996\u9875', () => {
                window.location.href = 'index.html';
            }));
        }

        generalSection.appendChild(createActionButton(guideText, guideText, openGuide));

        // 缩放控制子菜单
        const scaleWrapper = document.createElement('div');
        scaleWrapper.className = 'cc-menu-submenu-wrapper';
        scaleWrapper.innerHTML = `
            <div class="cc-menu-submenu-title">
                <span>缩放比例</span>
                <em class="cc-menu-submenu-arrow">\u25b6</em>
            </div>
            <div class="cc-menu-submenu-panel">
                <button type="button" class="cc-menu-item cc-scale-option" data-scale="0.7">70%</button>
                <button type="button" class="cc-menu-item cc-scale-option" data-scale="0.8">80%</button>
                <button type="button" class="cc-menu-item cc-scale-option" data-scale="1">100%</button>
                <button type="button" class="cc-menu-item cc-scale-option" data-scale="1.2">120%</button>
            </div>
        `;
        generalSection.appendChild(scaleWrapper);
        
        // 初始化缩放菜单状态
        const scaleTitle = scaleWrapper.querySelector('.cc-menu-submenu-title');
        const scalePanel = scaleWrapper.querySelector('.cc-menu-submenu-panel');
        const scaleArrow = scaleTitle.querySelector('.cc-menu-submenu-arrow');
        scaleArrow.style.transform = 'rotate(0deg)';
        
        scaleTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = scalePanel.classList.contains('show');
            scalePanel.classList.toggle('show');
            scaleArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        });
        
        // 缩放按钮事件
        scaleWrapper.querySelectorAll('.cc-scale-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const scale = btn.dataset.scale;
                document.body.style.zoom = scale;
                localStorage.setItem(SCALE_KEY, scale);
                // 更新按钮状态
                scaleWrapper.querySelectorAll('.cc-scale-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // 初始化当前缩放按钮的active状态
        const currentScale = localStorage.getItem(SCALE_KEY) || '0.8';
        scaleWrapper.querySelectorAll('.cc-scale-option').forEach(btn => {
            if (btn.dataset.scale === currentScale) {
                btn.classList.add('active');
            }
        });

        if (page === 'index') {
            const showText = '\u663e\u793a\u6700\u8fd1\u5e38\u7528';
            const hideText = '\u9690\u85cf\u6700\u8fd1\u5e38\u7528';
            const recentToggleBtn = createActionButton(showText, showText, () => {
                const panel = document.getElementById('recentPanel');
                const show = localStorage.getItem('cc_show_recent_panel') === '1';
                const newShow = !show;
                localStorage.setItem('cc_show_recent_panel', newShow ? '1' : '0');

                if (panel) {
                    panel.hidden = !newShow;
                    if (newShow && typeof renderRecentTools === 'function') {
                        renderRecentTools();
                    }
                    if (!newShow) {
                        var listEl = document.getElementById('recentList');
                        if (listEl) listEl.innerHTML = '';
                    }
                }

                updateRecentToggleUI();
            });
            recentToggleBtn.classList.add('cc-recent-toggle');
            generalSection.appendChild(recentToggleBtn);

            function updateRecentToggleUI() {
                const show = localStorage.getItem('cc_show_recent_panel') === '1';
                recentToggleBtn.classList.toggle('active', show);
                recentToggleBtn.textContent = show ? hideText : showText;
            }
            updateRecentToggleUI();
        }

        const scrollbarWrapper = document.createElement('div');
        scrollbarWrapper.className = 'cc-menu-submenu-wrapper';
        scrollbarWrapper.innerHTML = `
            <div class="cc-menu-submenu-title">
                <span>${scrollbarText}</span>
                <em class="cc-menu-submenu-arrow">\u25b6</em>
            </div>
            <div class="cc-menu-submenu-panel">
                <button type="button" class="cc-menu-item cc-scrollbar-option" data-scrollbar="1">\u7b80\u6d01\u78e8\u7802</button>
                <button type="button" class="cc-menu-item cc-scrollbar-option" data-scrollbar="2">\u5149\u6655\u6548\u679c</button>
                <button type="button" class="cc-menu-item cc-scrollbar-option" data-scrollbar="3">\u62df\u6001\u7acb\u4f53</button>
            </div>
        `;
        generalSection.appendChild(scrollbarWrapper);

        const bgEffectsWrapper = document.createElement('div');
        bgEffectsWrapper.className = 'cc-menu-range-group';
        bgEffectsWrapper.innerHTML = `
            <div class="cc-menu-range-title">背景调节</div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button type="button" class="cc-menu-item cc-bg-random-button" data-bg-random style="flex: 1;">${backgroundText}</button>
                <button type="button" class="cc-menu-item cc-bg-random-button" id="cc-bg-manage-button" style="flex: 1;">背景管理</button>
            </div>
            <label class="cc-menu-range-row">
                <span>透明度</span>
                <input type="range" min="20" max="100" step="1" data-bg-effect="opacity">
                <em data-bg-effect-value="opacity"></em>
            </label>
            <label class="cc-menu-range-row">
                <span>模糊度</span>
                <input type="range" min="0" max="24" step="1" data-bg-effect="blur">
                <em data-bg-effect-value="blur"></em>
            </label>
            <label class="cc-menu-range-row">
                <span>亮度</span>
                <input type="range" min="20" max="110" step="1" data-bg-effect="brightness">
                <em data-bg-effect-value="brightness"></em>
            </label>
        `;
        generalSection.appendChild(bgEffectsWrapper);
        bgEffectsWrapper.querySelector('[data-bg-random]').addEventListener('click', event => {
            event.stopPropagation();
            randomBackground();
        });
        const bgManageBtn = bgEffectsWrapper.querySelector('#cc-bg-manage-button');
        if (bgManageBtn) {
            bgManageBtn.addEventListener('click', event => {
                event.stopPropagation();
                if (typeof window.openFavBgModal === 'function') {
                    window.openFavBgModal();
                }
                closeQuickMenu();
            });
        }
        bgEffectsWrapper.querySelectorAll('[data-bg-effect]').forEach(input => {
            input.addEventListener('click', event => event.stopPropagation());
            input.addEventListener('input', event => {
                setBgEffect(event.target.dataset.bgEffect, event.target.value);
            });
        });

        const submenuTitle = scrollbarWrapper.querySelector('.cc-menu-submenu-title');
        const submenuPanel = scrollbarWrapper.querySelector('.cc-menu-submenu-panel');
        const submenuArrow = submenuTitle.querySelector('.cc-menu-submenu-arrow');

        // 初始化箭头样式，确保没有初始旋转
        submenuArrow.style.transform = 'rotate(0deg)';

        submenuTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = submenuPanel.classList.contains('show');
            submenuPanel.classList.toggle('show');
            submenuArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        });

        scrollbarWrapper.querySelectorAll('.cc-scrollbar-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const style = btn.dataset.scrollbar;
                setScrollbarStyle(style);
                submenuPanel.classList.remove('show');
                submenuArrow.style.transform = 'rotate(0deg)';
                closeQuickMenu();
            });
        });

        applyScrollbarStyle();
        applyBgEffects();

        document.addEventListener('click', event => {
            if (!wrap.contains(event.target)) {
                closeQuickMenu();
                submenuPanel.classList.remove('show');
                submenuArrow.style.transform = 'rotate(0deg)';
            }
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeQuickMenu();
                submenuPanel.classList.remove('show');
                submenuArrow.style.transform = 'rotate(0deg)';
            }
        });
    }

    function getGuide() {
        return GUIDE_MAP[page] || {
            title: '使用提示',
            body: [
                '左上角菜单用于返回首页、切换背景、查看提示和 GitHub 同步。',
                '工具数据默认保存在本机浏览器 localStorage。'
            ]
        };
    }

    function ensureGuideModal() {
        if (document.getElementById('ccGuideModal')) return;
        const guide = getGuide();
        const modal = document.createElement('div');
        modal.id = 'ccGuideModal';
        modal.className = 'cc-guide-modal';
        modal.innerHTML = `
            <div class="cc-guide-panel">
                <div class="cc-guide-head">
                    <h2>${escapeHtml(guide.title)}</h2>
                    <button type="button" data-guide-close aria-label="关闭">×</button>
                </div>
                <ul>${guide.body.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </div>
        `;
        modal.addEventListener('click', event => {
            if (event.target.id === 'ccGuideModal' || event.target.hasAttribute('data-guide-close')) {
                closeGuide();
            }
        });
        document.body.appendChild(modal);
    }

    function openGuide() {
        ensureGuideModal();
        document.getElementById('ccGuideModal').classList.add('show');
        try {
            localStorage.setItem(GUIDE_SEEN_KEY, '1');
        } catch (_) {}
    }

    function closeGuide() {
        document.getElementById('ccGuideModal')?.classList.remove('show');
    }

    function showTip(message, type = 'info', duration = 3600) {
        let host = document.getElementById('ccTipHost');
        if (!host) {
            host = document.createElement('div');
            host.id = 'ccTipHost';
            host.className = 'cc-tip-host';
            document.body.appendChild(host);
        }

        const tip = document.createElement('div');
        tip.className = `cc-tip cc-tip-${type}`;
        tip.textContent = message;
        host.appendChild(tip);

        requestAnimationFrame(() => tip.classList.add('show'));
        setTimeout(() => {
            tip.classList.remove('show');
            setTimeout(() => tip.remove(), 260);
        }, duration);
    }

    function showFirstRunTip() {
        try {
            if (localStorage.getItem(GUIDE_SEEN_KEY)) return;
            localStorage.setItem(GUIDE_SEEN_KEY, '1');
        } catch (_) {}

        setTimeout(() => {
            showTip('左上角“⋯”里有背景、提示和同步功能。', 'info', 5200);
        }, 900);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    const SCROLLBAR_KEY = 'cc_scrollbar_style_v1';

    function setScrollbarStyle(style) {
        try {
            localStorage.setItem(SCROLLBAR_KEY, style);
        } catch (_) {}
        applyScrollbarStyle();
    }

    function getScrollbarStyle() {
        try {
            return localStorage.getItem(SCROLLBAR_KEY) || '1';
        } catch (_) {
            return '1';
        }
    }

    function applyScrollbarStyle() {
        const style = getScrollbarStyle();
        const html = document.documentElement;
        html.classList.remove('sc-style-1', 'sc-style-2', 'sc-style-3');
        html.classList.add(`sc-style-${style}`);
        const options = document.querySelectorAll('.cc-scrollbar-option');
        options.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scrollbar === style);
        });
    }

    window.ccChangeBackground = randomBackground;
    window.ccLoadBackground = loadBackground;
    window.randomBg = randomBackground;
    window.changeBackground = randomBackground;
    window.loadBg = loadBackground;
    window.ccShowTip = showTip;
    window.ccOpenGuide = openGuide;
    window.ccCloseQuickMenu = closeQuickMenu;
    window.ccGetQuickMenuSection = getMenuSection;
    window.ccSetScrollbarStyle = setScrollbarStyle;
    window.ccApplyScrollbarStyle = applyScrollbarStyle;
    window.ccApplyBgEffects = applyBgEffects;

    function init() {
        ensureBgLayer();
        loadBackground();
        applyBgEffects();
        addQuickActions();
        showFirstRunTip();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* =========================================================
   公共模块：GitHub 数据同步
   说明：原 cc-sync.js 已合并到这里。脚本会根据 html[data-page] 判断
   当前页面是否支持同步；不支持的页面会直接退出，不影响其它功能。
   ========================================================= */
(function () {
    const DEFAULT_SETTINGS = {
        owner: '',
        repo: '',
        branch: 'main',
        token: ''
    };

    const SETTINGS_KEY = 'opentoolbox_github_sync_settings_v1';
    const API_VERSION = '2022-11-28';

    const TOOL_MAP = {
        index: { id: 'index', name: '首页排序与收藏背景', path: 'data/index.json', keys: ['toolOrder', 'cc_fav_backgrounds'] },
        'cc-bookmark-manager': { id: 'bookmarks', name: '书签管理', path: 'data/bookmarks.json', keys: ['bookmarks', 'bookmarkFolders'] },
        'cc-bookmark-manager-v2': { id: 'bookmarks', name: '书签管理 V2', path: 'data/bookmarks.json', keys: ['bookmarks', 'bookmarkFolders'] },
        'cc-notes': { id: 'notes', name: '超超笔记', path: 'data/notes.json', keys: ['cc_notes', 'cc_todos'] },
        'cc-inspiration': { id: 'inspirations', name: '灵感记录', path: 'data/inspirations.json', keys: ['cc_inspirations'] },
        'cc-txt': { id: 'textbox', name: '超超文本箱', path: 'data/textbox.json', keys: ['chaochaotext_data'] },
        'cc-browser': { id: 'browser-links', name: '轻量浏览器快捷链接', path: 'data/browser-links.json', keys: ['browserQuickLinks'] },
        'cc-llm-config-manager': {
            id: 'llm-configs',
            name: '大模型配置',
            path: 'data/llm-configs.json',
            keys: ['llm_configs'],
            sensitive: '会同步 API Key 等配置内容，请确认仓库权限符合你的预期。'
        },
        'cc-ocr-translate': { id: 'ocr', name: '截图 OCR 记录', path: 'data/ocr.json', keys: ['ocr_history', 'ocr_theme'] },
        'cc-trans': { id: 'ocr-v2', name: '截图 OCR 翻译 V2', path: 'data/ocr-v2.json', keys: ['snip_history_v2', 'snip_settings_v2', 'snip_theme'] },
        'cc-pomodoro-timer': { id: 'pomodoro', name: '番茄钟统计', path: 'data/pomodoro.json', keys: ['pomodoroStats'] },
        'cc-password-manager': {
            id: 'password-manager',
            name: '密码管理器',
            path: 'data/password-manager.json',
            keys: ['savedPasswords', 'passwordHistory'],
            sensitive: '会同步保存的密码和密码历史。即使是私有仓库，也建议只在你完全信任的场景使用。'
        },
        'cc-todo': {
            id: 'todo',
            name: '超超Todo',
            path: 'data/todo.json',
            keys: ['cc_todos', 'cc_todo_quote_date', 'cc_todo_quote_index', 'cc_todo_saved_quotes', 'cc_todo_last_check']
        },
        'cc-todo-v2': {
            id: 'todo-v2',
            name: '超超Todo V2',
            path: 'data/todo-v2.json',
            keys: ['cc_todo_v2_tasks']
        }
    };

    const page = document.documentElement.dataset.page || '';
    const tool = TOOL_MAP[page];
    if (!tool) return;

    function loadSettings() {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
        } catch (_) {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function readEntry(key) {
        const raw = localStorage.getItem(key);
        if (raw === null) return { key, type: 'missing', value: null };

        try {
            return { key, type: 'json', value: JSON.parse(raw) };
        } catch (_) {
            return { key, type: 'string', value: raw };
        }
    }

    function writeEntry(entry) {
        if (!entry || !entry.key) return;
        if (entry.type === 'missing' || entry.value === null || typeof entry.value === 'undefined') {
            localStorage.removeItem(entry.key);
            return;
        }

        if (entry.type === 'string') {
            localStorage.setItem(entry.key, String(entry.value));
        } else {
            localStorage.setItem(entry.key, JSON.stringify(entry.value));
        }
    }

    function buildPayload() {
        return {
            schema: 'cc-tool-sync-v1',
            toolId: tool.id,
            toolName: tool.name,
            page,
            path: tool.path,
            exportedAt: new Date().toISOString(),
            entries: tool.keys.map(readEntry)
        };
    }

    function getApiUrl(settings, path = tool.path) {
        const safePath = path.split('/').map(encodeURIComponent).join('/');
        return `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/contents/${safePath}`;
    }

    function getHeaders(settings) {
        const headers = {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': API_VERSION
        };
        if (settings.token) {
            headers.Authorization = `Bearer ${settings.token}`;
        }
        return headers;
    }

    async function getRemoteFile(settings) {
        const url = `${getApiUrl(settings)}?ref=${encodeURIComponent(settings.branch)}`;
        const response = await fetch(url, { headers: getHeaders(settings) });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(await formatGitHubError(response, '读取 GitHub 文件失败'));
        return response.json();
    }

    async function uploadToGitHub() {
        const settings = collectSettings();
        requireToken(settings);
        saveSettings(settings);

        setBusy(true);
        showSyncStatus('正在上传到 GitHub...');
        try {
            const payload = buildPayload();
            const remote = await getRemoteFile(settings);
            const body = {
                message: `sync: update ${tool.name}`,
                content: encodeBase64(JSON.stringify(payload, null, 2)),
                branch: settings.branch
            };
            if (remote && remote.sha) body.sha = remote.sha;

            const response = await fetch(getApiUrl(settings), {
                method: 'PUT',
                headers: {
                    ...getHeaders(settings),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error(await formatGitHubError(response, '上传到 GitHub 失败'));
            showSyncStatus(`已同步到 ${tool.path}`);
            notify(`已同步 ${tool.name}`, 'success');
        } catch (error) {
            showSyncStatus(error.message, true);
            notify(error.message, 'error', 5200);
        } finally {
            setBusy(false);
        }
    }

    async function downloadFromGitHub() {
        const settings = collectSettings();
        saveSettings(settings);

        if (!confirm(`将用 GitHub 上的 ${tool.name} 数据覆盖当前本地数据，继续吗？`)) {
            notify('已取消拉取，本地数据没有变化。');
            return;
        }

        setBusy(true);
        showSyncStatus('正在从 GitHub 拉取...');
        try {
            const remote = await getRemoteFile(settings);
            if (!remote || !remote.content) throw new Error(`GitHub 上还没有 ${tool.path}，请先在一台设备上上传。`);

            const payload = JSON.parse(decodeBase64(remote.content));
            if (payload.schema !== 'cc-tool-sync-v1' || !Array.isArray(payload.entries)) {
                throw new Error('远程文件格式不符合工具箱同步格式。');
            }

            // 先收集远程有的 key
            const remoteKeys = new Set(payload.entries.map(e => e.key));
            
            // 1. 处理远程有的 key，直接覆盖
            payload.entries
                .filter(entry => tool.keys.includes(entry.key))
                .forEach(writeEntry);
            
            // 2. 对于 tool.keys 里有但远程没有的 key，保留本地数据
            // 不做任何处理，这样本地现有数据不会丢失

            showSyncStatus('已从 GitHub 拉取，本页即将刷新');
            notify('已拉取数据，正在刷新页面。', 'success');
            setTimeout(() => window.location.reload(), 700);
        } catch (error) {
            showSyncStatus(error.message, true);
            notify(error.message, 'error', 5200);
        } finally {
            setBusy(false);
        }
    }

    function collectSettings() {
        return {
            owner: getFieldValue('ccSyncOwner'),
            repo: getFieldValue('ccSyncRepo'),
            branch: getFieldValue('ccSyncBranch') || 'main',
            token: getFieldValue('ccSyncToken')
        };
    }

    function getFieldValue(id) {
        return (document.getElementById(id)?.value || '').trim();
    }

    function requireToken(settings) {
        if (!settings.token) {
            showSyncStatus('请先填写 GitHub Token，然后点“保存设置”。', true);
            notify('同步到 GitHub 需要先填写 Token。点面板里的说明可以按步骤创建。', 'warning', 5200);
            throw new Error('上传需要 GitHub Token。');
        }
    }

    async function formatGitHubError(response, fallback) {
        try {
            const data = await response.json();
            return `${fallback}: ${data.message || response.status}`;
        } catch (_) {
            return `${fallback}: ${response.status}`;
        }
    }

    function encodeBase64(text) {
        const bytes = new TextEncoder().encode(text);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    function decodeBase64(text) {
        const binary = atob(String(text || '').replace(/\s/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }

    function ensureModal() {
        if (document.getElementById('ccSyncModal')) return;
        const settings = loadSettings();
        const modal = document.createElement('div');
        modal.id = 'ccSyncModal';
        modal.className = 'cc-sync-modal';
        modal.innerHTML = `
            <div class="cc-sync-panel">
                <div class="cc-sync-head">
                    <div>
                        <h2>GitHub 同步</h2>
                        <p>${escapeHtml(tool.name)} · <code>${escapeHtml(tool.path)}</code></p>
                    </div>
                    <button type="button" class="cc-sync-close" data-sync-close>×</button>
                </div>
                <div class="cc-sync-steps">
                    <strong>操作顺序</strong>
                    <ol>
                        <li>在 GitHub 创建 fine-grained token，只给本仓库 Contents 读写权限。</li>
                        <li>把 token 粘贴到下面的 Token 输入框，点击“保存设置”。</li>
                        <li>本机数据要备份时点“同步到 GitHub”；新设备要恢复时点“从 GitHub 拉取”。</li>
                    </ol>
                </div>
                ${tool.sensitive ? `<div class="cc-sync-warning">${escapeHtml(tool.sensitive)}</div>` : ''}
                <div class="cc-sync-grid">
                    <label>Owner<input id="ccSyncOwner" value="${escapeAttribute(settings.owner)}" autocomplete="off"></label>
                    <label>Repository<input id="ccSyncRepo" value="${escapeAttribute(settings.repo)}" autocomplete="off"></label>
                    <label>Branch<input id="ccSyncBranch" value="${escapeAttribute(settings.branch)}" autocomplete="off"></label>
                    <label class="cc-sync-token">Token<input id="ccSyncToken" type="password" value="${escapeAttribute(settings.token)}" autocomplete="off" placeholder="github_pat_..."></label>
                </div>
                <div class="cc-sync-hint">
                    Token 保存在本机 localStorage。GitHub 仓库建议保持 Private；含密码或 API Key 的工具同步前请再确认。
                </div>
                <div class="cc-sync-actions">
                    <button type="button" class="cc-sync-secondary" id="ccSyncHelp">怎么创建 Token</button>
                    <button type="button" class="cc-sync-secondary" id="ccSyncToggleToken">显示 Token</button>
                    <button type="button" class="cc-sync-secondary" id="ccSyncCopyToken">复制 Token</button>
                    <button type="button" class="cc-sync-secondary" id="ccSyncSave">保存设置</button>
                    <button type="button" class="cc-sync-secondary" id="ccSyncPull">从 GitHub 拉取</button>
                    <button type="button" class="cc-sync-primary" id="ccSyncPush">同步到 GitHub</button>
                </div>
                <div class="cc-sync-status" id="ccSyncStatus"></div>
            </div>
        `;

        modal.addEventListener('click', event => {
            if (event.target.id === 'ccSyncModal' || event.target.hasAttribute('data-sync-close')) {
                closeSyncModal();
            }
        });
        document.body.appendChild(modal);

        document.getElementById('ccSyncHelp').addEventListener('click', () => {
            notify('GitHub: Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens。权限选 Contents: Read and write。', 'info', 8200);
            showSyncStatus('Token 创建路径：GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens。');
        });
        document.getElementById('ccSyncSave').addEventListener('click', () => {
            const settings = collectSettings();
            saveSettings(settings);
            refreshSyncButtons();
            showSyncStatus(settings.token ? '同步设置已保存，可以上传或拉取。' : '设置已保存，但上传前还需要填写 Token。', !settings.token);
            notify(settings.token ? '同步设置已保存。' : '还没填 Token，上传会失败。', settings.token ? 'success' : 'warning');
        });
        document.getElementById('ccSyncToggleToken').addEventListener('click', toggleTokenVisibility);
        document.getElementById('ccSyncCopyToken').addEventListener('click', copyTokenToClipboard);
        document.getElementById('ccSyncPull').addEventListener('click', downloadFromGitHub);
        document.getElementById('ccSyncPush').addEventListener('click', uploadToGitHub);
    }

    function toggleTokenVisibility() {
        const input = document.getElementById('ccSyncToken');
        const button = document.getElementById('ccSyncToggleToken');
        if (!input || !button) return;
        const shouldShow = input.type === 'password';
        input.type = shouldShow ? 'text' : 'password';
        button.textContent = shouldShow ? '隐藏 Token' : '显示 Token';
        showSyncStatus(shouldShow ? 'Token 已显示，只在当前页面临时可见。' : 'Token 已隐藏。');
    }

    async function copyTokenToClipboard() {
        const token = getFieldValue('ccSyncToken');
        if (!token) {
            showSyncStatus('当前没有可复制的 Token。', true);
            notify('当前没有可复制的 Token。', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(token);
            showSyncStatus('Token 已复制。换电脑时在同步面板粘贴并保存，然后从 GitHub 拉取即可。');
            notify('Token 已复制。', 'success');
        } catch (_) {
            const input = document.getElementById('ccSyncToken');
            input?.select();
            showSyncStatus('浏览器阻止了自动复制；Token 已选中，可以按 Ctrl+C 复制。');
            notify('Token 已选中，可以按 Ctrl+C。', 'warning', 5200);
        }
    }

    function openSyncModal() {
        ensureModal();
        document.getElementById('ccSyncModal').classList.add('show');
        showSyncStatus('先填 Token 并保存；上传会把本页数据写入 GitHub，拉取会覆盖本页本地数据。');
    }

    function closeSyncModal() {
        document.getElementById('ccSyncModal')?.classList.remove('show');
    }

    function showSyncStatus(message, isError = false) {
        const status = document.getElementById('ccSyncStatus');
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function setBusy(isBusy) {
        ['ccSyncHelp', 'ccSyncSave', 'ccSyncPull', 'ccSyncPush', 'ccSyncToggleToken', 'ccSyncCopyToken'].forEach(id => {
            const button = document.getElementById(id);
            if (button) button.disabled = isBusy;
        });
    }

    function notify(message, type = 'info', duration) {
        if (typeof window.ccShowTip === 'function') {
            window.ccShowTip(message, type, duration);
        }
    }

    function addSyncButton() {
        let actions = document.querySelector('.cc-quick-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'cc-quick-actions';
            document.body.appendChild(actions);
        }

        if (actions.querySelector('[data-cc-sync-button]')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cc-action-item';
        button.title = 'GitHub 同步';
        button.setAttribute('aria-label', 'GitHub 同步');
        button.setAttribute('data-cc-sync-button', 'true');
        button.textContent = '同步';
        button.addEventListener('click', event => {
            event.stopPropagation();
            openSyncModal();
            if (typeof window.ccCloseQuickMenu === 'function') window.ccCloseQuickMenu();
        });
        actions.appendChild(button);
    }

    function getHasToken() {
        return Boolean(loadSettings().token);
    }

    function getSyncMenuContainer() {
        if (typeof window.ccGetQuickMenuSection === 'function') {
            return window.ccGetQuickMenuSection('sync', '\u540c\u6b65');
        }

        let actions = document.querySelector('.cc-quick-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'cc-quick-actions';
            document.body.appendChild(actions);
        }
        return actions;
    }

    function refreshSyncButtons() {
        const actions = getSyncMenuContainer();

        actions.querySelectorAll('[data-cc-sync-button]').forEach(button => button.remove());

        const settingsButton = document.createElement('button');
        settingsButton.type = 'button';
        settingsButton.className = 'cc-action-item';
        settingsButton.title = 'GitHub \u540c\u6b65\u8bbe\u7f6e';
        settingsButton.setAttribute('aria-label', 'GitHub \u540c\u6b65\u8bbe\u7f6e');
        settingsButton.setAttribute('data-cc-sync-button', 'settings');
        settingsButton.textContent = '\u540c\u6b65\u8bbe\u7f6e';
        settingsButton.addEventListener('click', event => {
            event.stopPropagation();
            openSyncModal();
            if (typeof window.ccCloseQuickMenu === 'function') window.ccCloseQuickMenu();
        });
        actions.appendChild(settingsButton);

        if (!getHasToken()) return;

        const quickButton = document.createElement('button');
        quickButton.type = 'button';
        quickButton.className = 'cc-action-item cc-action-primary';
        quickButton.title = '\u4e00\u952e\u540c\u6b65\u5230 GitHub';
        quickButton.setAttribute('aria-label', '\u4e00\u952e\u540c\u6b65\u5230 GitHub');
        quickButton.setAttribute('data-cc-sync-button', 'quick');
        quickButton.textContent = '\u4e00\u952e\u540c\u6b65';
        quickButton.addEventListener('click', event => {
            event.stopPropagation();
            uploadToGitHub();
            if (typeof window.ccCloseQuickMenu === 'function') window.ccCloseQuickMenu();
        });
        actions.appendChild(quickButton);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    function init() {
        refreshSyncButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* =========================================================
   页面模块：截图 OCR 翻译 V2
   说明：原 cc-trans.js 已合并到公共脚本中。为了避免污染其它工具页面，
   只有 CC-trans.html（html[data-page="cc-trans"]）才会执行下面的逻辑。
   ========================================================= */
(function () {
  if (document.documentElement.dataset.page !== "cc-trans") return;

const $ = (id) => document.getElementById(id);

const state = {
  imageData: "",
  theme: Number(localStorage.getItem("snip_theme") || 0),
  busy: false,
  worker: null
};

const storage = {
  history: "snip_history_v2",
  settings: "snip_settings_v2"
};

const elements = {
  dropzone: $("dropzone"),
  fileInput: $("fileInput"),
  previewImage: $("previewImage"),
  progressWrap: $("progressWrap"),
  progressLabel: $("progressLabel"),
  progressPercent: $("progressPercent"),
  progressBar: $("progressBar"),
  statusPill: $("statusPill"),
  ocrEngine: $("ocrEngine"),
  translateEngine: $("translateEngine"),
  sourceLang: $("sourceLang"),
  targetLang: $("targetLang"),
  sourceText: $("sourceText"),
  targetText: $("targetText"),
  counterText: $("counterText"),
  historyList: $("historyList"),
  toast: $("toast")
};

const languageLabels = {
  auto: "自动检测",
  "zh-CN": "中文",
  en: "英语",
  ja: "日语",
  ko: "韩语",
  fr: "法语",
  de: "德语",
  es: "西班牙语",
  ru: "俄语"
};

const tesseractLangs = {
  auto: "eng+chi_sim+chi_tra",
  "zh-CN": "chi_sim",
  en: "eng",
  ja: "jpn",
  ko: "kor",
  fr: "fra",
  de: "deu",
  es: "spa",
  ru: "rus"
};

const ocrSpaceLangs = {
  auto: "chs",
  "zh-CN": "chs",
  en: "eng",
  ja: "jpn",
  ko: "kor",
  fr: "fre",
  de: "ger",
  es: "spa",
  ru: "rus"
};

const googleLangs = {
  "zh-CN": "zh-CN",
  en: "en",
  ja: "ja",
  ko: "ko",
  fr: "fr",
  de: "de",
  es: "es",
  ru: "ru"
};

const myMemoryLangs = {
  "zh-CN": "zh-CN",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  ru: "ru-RU"
};

function init() {
  applyTheme();
  loadSettings();
  bindEvents();
  updateCounter();
  renderHistory();
}

function bindEvents() {
  elements.dropzone.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", () => handleFile(elements.fileInput.files[0]));

  elements.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.dropzone.classList.add("dragging");
  });
  elements.dropzone.addEventListener("dragleave", () => elements.dropzone.classList.remove("dragging"));
  elements.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.dropzone.classList.remove("dragging");
    handleFile(event.dataTransfer.files[0]);
  });

  document.addEventListener("paste", (event) => {
    const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    event.preventDefault();
    handleFile(imageItem.getAsFile(), true);
  });

  $("ocrButton").addEventListener("click", runOcr);
  $("translateButton").addEventListener("click", () => translateCurrentText(true));
  $("copySourceButton").addEventListener("click", () => copyText(elements.sourceText.value, "原文已复制"));
  $("copyTargetButton").addEventListener("click", () => copyText(elements.targetText.value, "译文已复制"));
  $("clearAllButton").addEventListener("click", clearCurrent);
  $("clearHistoryButton").addEventListener("click", clearHistory);
  $("themeButton").addEventListener("click", cycleTheme);

  elements.sourceText.addEventListener("input", updateCounter);
  [elements.ocrEngine, elements.translateEngine, elements.sourceLang, elements.targetLang].forEach((el) => {
    el.addEventListener("change", saveSettings);
  });
  elements.targetLang.addEventListener("change", () => {
    if (elements.sourceText.value.trim()) translateCurrentText(false);
  });
}

function handleFile(file, autoRun = false) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("请选择图片文件");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.imageData = reader.result;
    elements.previewImage.src = state.imageData;
    elements.dropzone.classList.add("has-image");
    setStatus(autoRun ? "已粘贴，开始识别" : "图片已载入");
    if (autoRun) runOcr();
  };
  reader.readAsDataURL(file);
}

async function runOcr() {
  if (state.busy) return;
  if (!state.imageData) {
    showToast("请先粘贴或上传截图");
    return;
  }

  setBusy(true);
  setProgress("准备 OCR", 0);
  elements.sourceText.value = "";
  elements.targetText.value = "";
  updateCounter();

  try {
    const text = elements.ocrEngine.value === "ocrspace"
      ? await ocrBySpace(state.imageData)
      : await ocrByTesseract(state.imageData);

    elements.sourceText.value = text.trim();
    updateCounter();

    if (!elements.sourceText.value) {
      setStatus("未识别到文字");
      showToast("未识别到文字，可以换 OCR 引擎再试");
      return;
    }

    setProgress("OCR 完成，准备翻译", 65);
    await translateCurrentText(true);
  } catch (error) {
    setStatus("OCR 失败");
    showToast(error.message || "OCR 失败");
  } finally {
    setBusy(false);
  }
}

async function ocrByTesseract(imageData) {
  if (!window.Tesseract) throw new Error("Tesseract 未加载，请检查网络或改用 OCR.space");
  const lang = tesseractLangs[elements.sourceLang.value] || tesseractLangs.auto;

  if (state.worker) {
    await state.worker.terminate();
    state.worker = null;
  }

  state.worker = await Tesseract.createWorker(lang, 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        const progress = Math.round(message.progress * 60);
        setProgress(`本地 OCR 识别中 ${Math.round(message.progress * 100)}%`, progress);
      }
    }
  });

  const result = await state.worker.recognize(imageData);
  return result.data.text || "";
}

async function ocrBySpace(imageData) {
  setProgress("OCR.space 上传识别中", 20);
  const formData = new FormData();
  formData.append("apikey", "helloworld");
  formData.append("language", ocrSpaceLangs[elements.sourceLang.value] || "chs");
  formData.append("base64Image", imageData);
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");

  const response = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: formData });
  if (!response.ok) throw new Error(`OCR.space 请求失败 ${response.status}`);

  const data = await response.json();
  if (data.IsErroredOnProcessing) throw new Error([].concat(data.ErrorMessage || data.ErrorDetails).filter(Boolean).join("；") || "OCR.space 识别失败");
  return (data.ParsedResults || []).map((item) => item.ParsedText || "").join("\n").trim();
}

async function translateCurrentText(saveToHistory) {
  const text = elements.sourceText.value.trim();
  if (!text) {
    showToast("原文为空");
    return;
  }

  setBusy(true);
  setProgress("正在翻译", 72);

  try {
    const translated = elements.translateEngine.value === "mymemory"
      ? await translateByMyMemory(text)
      : await translateByGoogle(text);

    elements.targetText.value = translated || "翻译结果为空";
    setProgress("完成", 100);
    setStatus("完成");
    showToast("翻译完成");
    if (saveToHistory && translated) addHistory(text, translated);
  } catch (error) {
    setStatus("翻译失败");
    elements.targetText.value = `翻译失败：${error.message || "请检查网络"}`;
    showToast("翻译失败");
  } finally {
    setBusy(false);
  }
}

async function translateByGoogle(text) {
  const target = googleLangs[elements.targetLang.value] || "zh-CN";
  const source = elements.sourceLang.value === "auto" ? "auto" : (googleLangs[elements.sourceLang.value] || "auto");
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google 翻译请求失败 ${response.status}`);
  const data = await response.json();
  return (data[0] || []).map((part) => part[0]).filter(Boolean).join("");
}

async function translateByMyMemory(text) {
  const target = myMemoryLangs[elements.targetLang.value] || "zh-CN";
  const source = elements.sourceLang.value === "auto" ? "auto" : (myMemoryLangs[elements.sourceLang.value] || "auto");
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`MyMemory 请求失败 ${response.status}`);
  const data = await response.json();
  if (data.responseStatus !== 200) throw new Error(data.responseDetails || "MyMemory 翻译失败");
  return data.responseData.translatedText;
}

function updateCounter() {
  const text = elements.sourceText.value;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  elements.counterText.textContent = `${text.length} 字符 · ${lines} 行`;
}

function setProgress(label, percent) {
  elements.progressWrap.hidden = false;
  elements.progressLabel.textContent = label;
  elements.progressPercent.textContent = `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
  elements.progressBar.style.width = elements.progressPercent.textContent;
  setStatus(label);
}

function setStatus(text) {
  elements.statusPill.textContent = text;
}

function setBusy(busy) {
  state.busy = busy;
  ["ocrButton", "translateButton"].forEach((id) => $(id).disabled = busy);
}

function addHistory(source, target) {
  const list = getHistory();
  list.unshift({
    id: Date.now(),
    time: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    source,
    target,
    langs: `${languageLabels[elements.sourceLang.value]} → ${languageLabels[elements.targetLang.value]}`
  });
  localStorage.setItem(storage.history, JSON.stringify(list.slice(0, 20)));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(storage.history) || "[]");
  } catch {
    return [];
  }
}

function renderHistory() {
  const list = getHistory();
  if (!list.length) {
    elements.historyList.innerHTML = '<div class="history-empty">暂无记录。完成一次翻译后会自动保存。</div>';
    return;
  }

  elements.historyList.innerHTML = list.map((item, index) => `
    <article class="history-item" data-index="${index}" title="点击载入">
      <div class="history-meta"><span>${escapeHtml(item.time)}</span><span>${escapeHtml(item.langs)}</span></div>
      <div class="history-text">${escapeHtml(item.source)}</div>
    </article>
  `).join("");

  elements.historyList.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => loadHistoryItem(Number(item.dataset.index)));
  });
}

function loadHistoryItem(index) {
  const item = getHistory()[index];
  if (!item) return;
  elements.sourceText.value = item.source || item.orig || "";
  elements.targetText.value = item.target || item.trans || "";
  updateCounter();
  setStatus("已载入历史");
  showToast("已载入历史记录");
}

function clearHistory() {
  if (!confirm("确定清空历史记录？")) return;
  localStorage.removeItem(storage.history);
  renderHistory();
  showToast("历史已清空");
}

function clearCurrent() {
  state.imageData = "";
  elements.previewImage.removeAttribute("src");
  elements.dropzone.classList.remove("has-image");
  elements.sourceText.value = "";
  elements.targetText.value = "";
  elements.progressWrap.hidden = true;
  updateCounter();
  setStatus("就绪");
}

function saveSettings() {
  const data = {
    ocrEngine: elements.ocrEngine.value,
    translateEngine: elements.translateEngine.value,
    sourceLang: elements.sourceLang.value,
    targetLang: elements.targetLang.value
  };
  localStorage.setItem(storage.settings, JSON.stringify(data));
}

function loadSettings() {
  try {
    const data = JSON.parse(localStorage.getItem(storage.settings) || "{}");
    Object.entries(data).forEach(([key, value]) => {
      if (elements[key] && value) elements[key].value = value;
    });
  } catch {
    localStorage.removeItem(storage.settings);
  }
}

function cycleTheme() {
  state.theme = (state.theme + 1) % 3;
  localStorage.setItem("snip_theme", String(state.theme));
  applyTheme();
}

function applyTheme() {
  document.body.classList.remove("theme-1", "theme-2");
  if (state.theme) document.body.classList.add(`theme-${state.theme}`);
  if (typeof window.ccShowTip === "function") {
    window.ccShowTip("界面强调色已切换", "info", 1600);
  }
}

async function copyText(text, message) {
  if (!text.trim()) {
    showToast("没有可复制的内容");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast(message);
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

window.addEventListener("DOMContentLoaded", init);
})();
