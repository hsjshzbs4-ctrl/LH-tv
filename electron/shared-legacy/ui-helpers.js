// ui-helpers.js — 通用 UI 状态函数
// 职责：loading/error/empty/skeleton 统一组件，避免各页面重复代码

/**
 * 显示骨架屏卡片
 * @param {HTMLElement} container
 * @param {number} count
 */
function showSkeletonCards(container, count) {
    var html = '<div class="skeleton-grid">';
    for (var i = 0; i < (count || 10); i++) {
        html += '<div class="skeleton-card skeleton"></div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 显示骨架屏列表
 * @param {HTMLElement} container
 * @param {number} count
 */
function showSkeletonList(container, count) {
    var html = '';
    for (var i = 0; i < (count || 5); i++) {
        html +=
            '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;">' +
            '<div class="skeleton" style="width:120px;height:72px;border-radius:4px;flex-shrink:0;"></div>' +
            '<div style="flex:1;"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>' +
            '</div>';
    }
    container.innerHTML = html;
}

/**
 * 显示加载状态
 * @param {HTMLElement} container
 * @param {string} message
 */
function showLoading(container, message) {
    container.innerHTML =
        '<div class="player-loading">' +
        '<div class="spinner"></div>' +
        '<div class="msg">' + (message || '加载中...') + '</div>' +
        '</div>';
}

/**
 * 显示错误状态（带重试+反馈按钮）
 * @param {HTMLElement} container
 * @param {string} message
 * @param {Function} onRetry
 */
function showError(container, message, onRetry) {
    container.innerHTML =
        '<div class="player-error">' +
        '<div>' + (message || '加载失败') + '</div>' +
        '<div style="font-size:12px;color:#888;">可能是网络问题或资源已下架</div>' +
        '<div>' +
        (onRetry ? '<button class="retry-btn" id="retryBtn">🔄 重试</button>' : '') +
        '<button class="feedback-btn" id="feedbackBtn" style="margin-left:8px;">📩 反馈</button>' +
        '</div></div>';
    var retryBtn = container.querySelector('#retryBtn');
    if (retryBtn && onRetry) retryBtn.addEventListener('click', onRetry);
    var fbBtn = container.querySelector('#feedbackBtn');
    if (fbBtn) {
        fbBtn.addEventListener('click', function () {
            alert('已记录反馈：' + (message || '') + '\n作者会尽快处理！');
        });
    }
}

/**
 * 显示空状态
 * @param {HTMLElement} container
 * @param {string} message
 */
function showEmpty(container, message) {
    container.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📭</div>' +
        '<div class="empty-text">' + (message || '暂无内容') + '</div>' +
        '</div>';
}

/**
 * 显示 Toast 通知
 * @param {string} message
 * @param {number} durationMs
 */
function showToast(message, durationMs) {
    var existing = document.getElementById('dlToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'dlToast';
    toast.className = 'dl-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, durationMs || 3000);
}

// ==================== 通用影视卡片构建（首页/电视剧/电影/动漫共享） ====================

var CARD_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#e91e63'];

/**
 * 构建单个影视卡片 HTML
 * @param {Object} v - { name, image, rating, remarks }
 * @returns {string} HTML 字符串
 */
function buildCard(v) {
    var initial = (v.name || '影').charAt(0);
    var colorIdx = 0;
    for (var ci = 0; ci < (v.name || '').length; ci++) { colorIdx += (v.name || '').charCodeAt(ci); }
    var bgColor = CARD_COLORS[colorIdx % CARD_COLORS.length];
    var imageHtml = v.image
        ? '<img class="poster-img" src="' + escAttr(v.image) + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
          '<div class="poster-placeholder" style="display:none;background:' + bgColor + ';font-size:40px;font-weight:700;color:#fff;">' + initial + '</div>'
        : '<div class="poster-placeholder" style="background:' + bgColor + ';font-size:40px;font-weight:700;color:#fff;">' + initial + '</div>';
    return '<div class="poster-card" data-name="' + escAttr(v.name || '') + '">' +
        imageHtml +
        '<div class="poster-title">' + escHtml(v.name || '') + '</div>' +
        '<div class="poster-meta">' + (v.rating ? '⭐' + (typeof v.rating === 'number' ? v.rating.toFixed(1) : v.rating) : '') +
        (v.remarks ? ' · ' + escHtml(v.remarks) : '') + '</div></div>';
}

/**
 * 增量补充海报（不替换 DOM，避免闪烁）
 * @param {HTMLElement} row - 卡片行元素，需挂载 _localItems
 * @param {Array} onlineVideos - 在线视频列表
 */
function mergeLocalAndOnline(row, onlineVideos) {
    if (!row || !row._localItems) return;

    var localItems = row._localItems;
    onlineVideos = onlineVideos || [];

    var posterMap = {};
    for (var li = 0; li < localItems.length; li++) {
        var ln = (localItems[li].name || '').replace(/\s+/g, '');
        if (localItems[li].image && !posterMap[ln]) posterMap[ln] = localItems[li].image;
    }
    for (var oi = 0; oi < onlineVideos.length; oi++) {
        var on = (onlineVideos[oi].name || '').replace(/\s+/g, '');
        if (onlineVideos[oi].image && !posterMap[on]) posterMap[on] = onlineVideos[oi].image;
    }

    var cards = row.querySelectorAll('.poster-card');
    for (var c = 0; c < cards.length; c++) {
        var card = cards[c];
        var cardName = (card.getAttribute('data-name') || '').replace(/\s+/g, '');
        var img = card.querySelector('img.poster-img');
        var placeholder = card.querySelector('.poster-placeholder');

        if (img && img.style.display !== 'none' && img.src && img.src.length > 5) continue;

        var posterUrl = posterMap[cardName];
        if (posterUrl && posterUrl.indexOf('http') === 0) {
            if (img) {
                img.src = posterUrl;
                img.style.display = '';
                if (placeholder) placeholder.style.display = 'none';
            } else if (placeholder) {
                var newImg = document.createElement('img');
                newImg.className = 'poster-img';
                newImg.src = posterUrl;
                newImg.loading = 'lazy';
                newImg.onerror = function () { this.style.display = 'none'; if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex'; };
                card.insertBefore(newImg, card.firstChild);
            }
        }
    }
}

/**
 * 绑定卡片点击 → 跳转播放页
 * @param {HTMLElement} el - 包含 .poster-card 的容器
 */
function bindCardClicks(el) {
    el.querySelectorAll('.poster-card').forEach(function (c) {
        c.addEventListener('click', function () {
            window.location.href = getPagePrefix() + 'play.html?name=' + encodeURIComponent(this.getAttribute('data-name'));
        });
    });
}

// HTML/属性转义
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
