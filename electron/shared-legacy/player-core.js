// player-core.js - 播放器核心模块
// 职责：创建和管理 HTML5 video 播放器、HLS 支持、错误/加载状态

/**
 * 检测是否支持 HLS 播放
 * @returns {boolean}
 */
function isHlsSupported() {
    return typeof Hls !== 'undefined' && Hls.isSupported();
}

/**
 * 创建 HLS 播放器实例
 * @param {HTMLElement} container - 播放器容器元素
 * @param {string} m3u8Url - m3u8 视频地址
 * @param {Object} options - { referer, onError, onReady }
 * @returns {Object} 播放器控制对象
 */
function createHlsPlayer(container, m3u8Url, options) {
    if (!isHlsSupported()) {
        // 降级到原生播放器
        return createPlayer(container, m3u8Url);
    }

    container.innerHTML = '';

    var video = document.createElement('video');
    video.controls = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.setAttribute('playsinline', '');
    container.appendChild(video);

    var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
    });

    if (options && options.referer) {
        hls.config.xhrSetup = function (xhr, url) {
            xhr.setRequestHeader('Referer', options.referer);
        };
    }

    hls.loadSource(m3u8Url);
    hls.attachMedia(video);

    var playerObj = {
        videoElement: video,
        hlsInstance: hls,
        play: function () {
            video.play().catch(function (err) {
                console.log('播放失败:', err.message);
            });
        },
        pause: function () {
            video.pause();
        },
        seek: function (timeInSeconds) {
            video.currentTime = timeInSeconds;
        },
        getCurrentTime: function () {
            return video.currentTime;
        },
        getDuration: function () {
            return video.duration;
        },
        destroy: function () {
            hls.destroy();
            video.pause();
            video.src = '';
            video.remove();
        },
        onError: function (callback) {
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    callback(data.type + ': ' + (data.details || 'unknown'));
                }
            });
            video.addEventListener('error', function () {
                callback('视频加载失败');
            });
        },
        onReady: function (callback) {
            var fired = false;
            function fireOnce() {
                if (!fired) { fired = true; callback(); }
            }
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                fireOnce();
            });
            video.addEventListener('loadedmetadata', function () {
                fireOnce();
            });
        }
    };

    return playerObj;
}

/**
 * 创建播放器实例
 * @param {HTMLElement} container - 播放器容器元素
 * @param {string} videoUrl - 视频文件 URL
 * @returns {Object} 播放器控制对象
 */
function createPlayer(container, videoUrl) {
    // 清空容器
    container.innerHTML = '';

    // 创建 video 元素
    var video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.setAttribute('playsinline', '');
    container.appendChild(video);

    var playerObj = {
        videoElement: video,
        play: function () {
            video.play().catch(function (err) {
                console.log('播放失败:', err.message);
            });
        },
        pause: function () {
            video.pause();
        },
        seek: function (timeInSeconds) {
            video.currentTime = timeInSeconds;
        },
        getCurrentTime: function () {
            return video.currentTime;
        },
        getDuration: function () {
            return video.duration;
        },
        setSource: function (newUrl) {
            video.src = newUrl;
        },
        destroy: function () {
            video.pause();
            video.src = '';
            video.remove();
        },
        onError: function (callback) {
            video.addEventListener('error', function () {
                var errorMessage = '视频加载失败';
                if (video.error) {
                    errorMessage = video.error.message || errorMessage;
                }
                callback(errorMessage);
            });
        },
        onReady: function (callback) {
            video.addEventListener('loadedmetadata', function () {
                callback();
            });
        }
    };

    return playerObj;
}

/**
 * 显示播放器错误界面
 * @param {HTMLElement} container - 播放器容器
 * @param {string} message - 错误信息
 * @param {Function} onRetry - 重试回调
 */
function showPlayerError(container, message, onRetry) {
    container.innerHTML =
        '<div class="player-error">' +
        '<div style="font-size:14px;margin-bottom:12px;">' + message + '</div>' +
        '<button onclick="arguments[0].stopPropagation();" id="retryBtn">切换播放源</button>' +
        '</div>';

    var retryBtn = container.querySelector('#retryBtn');
    if (retryBtn && onRetry) {
        retryBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            onRetry();
        });
    }
}

/**
 * 显示播放器加载状态
 * @param {HTMLElement} container - 播放器容器
 * @param {string} message - 加载提示文字
 */
function showPlayerLoading(container, message) {
    container.innerHTML =
        '<div class="source-loading-overlay">' +
        '<div class="spinner" style="margin-bottom:16px;"></div>' +
        '<div style="font-size:14px;color:#ccc;">' + (message || '加载中...') + '</div>' +
        '</div>';
}
