// nav.js - 顶部导航（电视剧·电影·动漫·搜索·用户）
var NAV_ITEMS = [
    { page: 'index',   label: '首页', icon: '🏠' },
    { page: 'tv',      label: '电视剧', icon: '📺' },
    { page: 'movies',  label: '电影', icon: '🎬' },
    { page: 'anime',   label: '动漫', icon: '🎌' },
    { page: 'search',  label: '搜索', icon: '🔍' },
    { page: 'settings',label: '设置', icon: '⚙️' },
    { page: 'user',    label: '我的', icon: '👤' }
];

// 导航栏自动补全的全局缓存（跨页面共享）
var _navCatalogCache = null;
var _navSearchTimeout = null;

function initNav() {
    var html = '<div class="top-nav" id="topNav">';
    html += '<span class="nav-logo" data-page="index" style="font-weight:700;letter-spacing:-1px;">LH</span>';
    html += '<div class="nav-links">';

    var current = getCurrentPage();
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        var cls = (item.page === current) ? 'nav-link active' : 'nav-link';
        html += '<button class="' + cls + '" data-page="' + item.page + '">' + item.icon + ' ' + item.label + '</button>';
    }

    html += '</div>';
    html += '<div class="nav-search" id="navSearchBox">' +
        '<input type="text" id="topSearchInput" placeholder="搜索影视，自动补全..." autocomplete="off">' +
        '<div class="nav-ac-dropdown" id="navAcDropdown" style="display:none;"></div>' +
        '</div>';
    html += '<div class="win-controls" style="display:flex;align-items:center;gap:2px;margin-left:12px;-webkit-app-region:no-drag;">' +
        '<button class="win-btn" id="winMin" title="最小化" style="width:32px;height:28px;background:transparent;border:none;color:#aaa;cursor:pointer;font-size:16px;border-radius:4px;">─</button>' +
        '<button class="win-btn" id="winMax" title="最大化" style="width:32px;height:28px;background:transparent;border:none;color:#aaa;cursor:pointer;font-size:14px;border-radius:4px;">□</button>' +
        '<button class="win-btn" id="winClose" title="关闭" style="width:32px;height:28px;background:transparent;border:none;color:#aaa;cursor:pointer;font-size:16px;border-radius:4px;">✕</button>' +
        '</div>';
    html += '</div>';

    var container = document.getElementById('appContainer');
    if (!container) return;
    container.innerHTML = html + '<div class="main-content" id="mainContent"></div>';

    // 导航点击
    var links = document.querySelectorAll('.nav-link, .nav-logo');
    for (var j = 0; j < links.length; j++) {
        links[j].addEventListener('click', function () {
            var page = this.getAttribute('data-page');
            navigateTo(page);
        });
    }

    // 搜索 — 自动补全 + 跳转搜索页
    initNavSearch();

    // 关闭下拉
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#navSearchBox')) {
            var dd = document.getElementById('navAcDropdown');
            if (dd) dd.style.display = 'none';
        }
    });

    // 窗口控制按钮（frame:false 无边框模式）
    var winMin = document.getElementById('winMin');
    var winMax = document.getElementById('winMax');
    var winClose = document.getElementById('winClose');
    if (winMin) winMin.addEventListener('click', function () { window.app.minimizeWindow(); });
    if (winMax) winMax.addEventListener('click', function () {
        window.app.maximizeWindow().then(function (maximized) {
            winMax.textContent = maximized ? '❐' : '□';
        });
    });
    if (winClose) winClose.addEventListener('click', function () { window.app.closeWindow(); });

}

function getCurrentPage() {
    // 优先从 body data-page 属性读取
    if (document.body && document.body.getAttribute('data-page')) {
        return document.body.getAttribute('data-page');
    }
    // Fallback: URL 解析
    var path = window.location.pathname || '';
    var file = path.split('/').pop().replace('.html', '');
    if (!file || file === 'index') return 'index';
    return file;
}

function setActiveNav(pageName) {
    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('active');
        if (links[i].getAttribute('data-page') === pageName) links[i].classList.add('active');
    }
}

function navigateTo(page) {
    var prefix = getPagePrefix();
    var m = {
        'index': prefix + 'index.html',
        'tv': prefix + 'tv.html',
        'movies': prefix + 'movies.html',
        'anime': prefix + 'anime.html',
        'search': prefix + 'search.html',
        'settings': prefix + 'settings.html',
        'user': prefix + 'user.html'
    };
    if (m[page]) window.location.href = m[page];
}

function getPagePrefix() {
    var p = window.location.href;
    var s = p.lastIndexOf('/');
    return s === -1 ? '' : p.substring(0, s + 1);
}

// ==================== 导航栏搜索自动补全 ====================

function initNavSearch() {
    var si = document.getElementById('topSearchInput');
    if (!si) return;

    // 输入防抖
    si.addEventListener('input', function () {
        if (_navSearchTimeout) clearTimeout(_navSearchTimeout);
        var val = this.value.trim();
        if (!val) {
            document.getElementById('navAcDropdown').style.display = 'none';
            return;
        }
        _navSearchTimeout = setTimeout(function () { navShowSuggestions(val); }, 150);
    });

    // 键盘导航
    si.addEventListener('keydown', function (e) {
        var dd = document.getElementById('navAcDropdown');
        var items = dd ? dd.querySelectorAll('.autocomplete-item') : [];
        var activeIdx = -1;
        for (var i = 0; i < items.length; i++) {
            if (items[i].classList.contains('active')) { activeIdx = i; break; }
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIdx < items.length - 1) {
                if (activeIdx >= 0) items[activeIdx].classList.remove('active');
                items[activeIdx + 1].classList.add('active');
                items[activeIdx + 1].scrollIntoView({ block: 'nearest' });
            } else if (activeIdx === -1 && items.length > 0) {
                items[0].classList.add('active');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIdx > 0) {
                items[activeIdx].classList.remove('active');
                items[activeIdx - 1].classList.add('active');
            } else if (activeIdx === 0) {
                items[0].classList.remove('active');
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            var q = this.value.trim();
            if (!q) return;
            dd.style.display = 'none';
            // 如果有选中项，用选中项的名字
            if (activeIdx >= 0) {
                q = items[activeIdx].getAttribute('data-name') || q;
            }
            window.location.href = getPagePrefix() + 'search.html?q=' + encodeURIComponent(q);
        } else if (e.key === 'Escape') {
            dd.style.display = 'none';
        }
    });

    // 聚焦时显示建议
    si.addEventListener('focus', function () {
        if (this.value.trim() && _navCatalogCache) {
            navShowSuggestions(this.value.trim());
        }
    });
}

function loadNavCatalog() {
    if (_navCatalogCache) return Promise.resolve(_navCatalogCache);

    var types = [
        { type: 'tv', sub: 'cn' }, { type: 'tv', sub: 'kr' }, { type: 'tv', sub: 'us' },
        { type: 'movie', sub: 'cn' }, { type: 'movie', sub: 'kr' }, { type: 'movie', sub: 'us' },
        { type: 'anime', sub: 'cn' }, { type: 'anime', sub: 'jp' }, { type: 'anime', sub: 'movie' }
    ];

    var promises = types.map(function (t) {
        return window.app.getTypeCatalog(t.type, t.sub).catch(function () { return []; });
    });

    return Promise.all(promises).then(function (results) {
        var seen = {};
        var merged = [];
        results.forEach(function (items, idx) {
            (items || []).forEach(function (item) {
                var key = (item.name || '').replace(/\s+/g, '');
                if (!seen[key]) {
                    seen[key] = true;
                    item._type = types[idx].type;
                    item._sub = types[idx].sub;
                    merged.push(item);
                }
            });
        });

        // 补充 anime-catalog
        return window.app.getAnimeCatalog('all').then(function (animeItems) {
            (animeItems || []).forEach(function (item) {
                var key = (item.name || '').replace(/\s+/g, '');
                if (!seen[key]) {
                    seen[key] = true;
                    item._type = 'anime';
                    item._sub = (item.cat === '国漫' ? 'cn' : (item.cat === '韩漫' ? 'kr' : 'jp'));
                    merged.push(item);
                }
            });
            _navCatalogCache = merged;
            return merged;
        }).catch(function () {
            _navCatalogCache = merged;
            return merged;
        });
    });
}

function navShowSuggestions(keyword) {
    var dd = document.getElementById('navAcDropdown');
    if (!dd) return;

    var lower = keyword.toLowerCase();
    var matches = (_navCatalogCache || []).filter(function (s) {
        return (s.name || '').toLowerCase().indexOf(lower) !== -1;
    });
    matches.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
    matches = matches.slice(0, 10);

    if (matches.length === 0) {
        dd.style.display = 'none';
        return;
    }

    var typeLabels = { tv: '📺', movie: '🎬', anime: '🎌' };
    var subLabels = { cn: '国产', kr: '韩国', jp: '日本', us: '欧美', movie: '剧场' };

    var html = '';
    for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        var icon = typeLabels[m._type] || '🎬';
        var sub = subLabels[m._sub] || '';
        var rating = m.rating ? ' ⭐' + (typeof m.rating === 'number' ? m.rating.toFixed(1) : m.rating) : '';
        var year = m.year ? ' · ' + m.year : '';
        var name = escHtml(m.name);
        var idx = name.toLowerCase().indexOf(lower);
        var highlighted = idx >= 0
            ? name.substring(0, idx) + '<mark>' + name.substring(idx, idx + keyword.length) + '</mark>' + name.substring(idx + keyword.length)
            : name;
        html += '<div class="autocomplete-item" data-name="' + escAttr(m.name) + '">' +
            '<span class="ac-icon">' + icon + '</span>' +
            '<span class="ac-name">' + highlighted + '</span>' +
            '<span class="ac-meta">' + sub + year + rating + '</span>' +
            '</div>';
    }

    dd.innerHTML = html;
    dd.style.display = 'block';

    // 点击建议 → 跳搜索页
    dd.querySelectorAll('.autocomplete-item').forEach(function (item) {
        item.addEventListener('click', function () {
            var name = this.getAttribute('data-name');
            dd.style.display = 'none';
            window.location.href = getPagePrefix() + 'search.html?q=' + encodeURIComponent(name);
        });
    });

    // 首次输入时加载目录
    if (!_navCatalogCache) {
        loadNavCatalog().then(function () { navShowSuggestions(keyword); });
        dd.style.display = 'none';
    }
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
