// utils.js - 通用工具函数
// 职责：提供页面中常用的纯函数

/**
 * 格式化秒数为 "时:分:秒" 或 "分:秒"
 * @param {number} seconds - 总秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
    if (!seconds || seconds < 0) {
        return '00:00';
    }
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return hours + ':' + padZero(minutes) + ':' + padZero(secs);
    }
    return padZero(minutes) + ':' + padZero(secs);
}

/**
 * 数字补零（小于 10 时前面加 0）
 * @param {number} num
 * @returns {string}
 */
function padZero(num) {
    if (num < 10) {
        return '0' + num;
    }
    return '' + num;
}

/**
 * 去掉 HTML 标签，保留纯文本
 * @param {string} html - 含 HTML 标签的文本
 * @returns {string} 纯文本
 */
function stripHtml(html) {
    if (!html) {
        return '';
    }
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * 截断文本，超出长度加省略号
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
function truncateText(text, maxLength) {
    if (!text) {
        return '';
    }
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * 防抖函数：延迟执行，减少频繁调用
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function}
 */
function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}
