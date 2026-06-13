// data-paths.js - 可写数据目录解析
// 解决打包后 asar 只读导致无法写入的问题
// 统一使用 Electron userData 目录（开发和生产环境均可写）

var path = require('path');
var fs = require('fs');

var _dataRoot = null;
var _migrated = false;

function getDataRoot() {
    if (_dataRoot) return _dataRoot;

    // 优先使用环境变量指定
    if (process.env.LH_DATA_DIR) {
        _dataRoot = process.env.LH_DATA_DIR;
        ensureDir(_dataRoot);
        return _dataRoot;
    }

    // Electron 环境
    try {
        var electron = require('electron');
        if (electron && electron.app && typeof electron.app.getPath === 'function') {
            var appPath = electron.app.getAppPath();
            // 打包后 asar 只读 → 数据放 EXE 旁边
            if (appPath.indexOf('.asar') !== -1) {
                appPath = require('path').dirname(electron.app.getPath('exe'));
            }
            _dataRoot = path.join(appPath, 'data');
            ensureDir(_dataRoot);
            return _dataRoot;
        }
    } catch (e) { /* 不在 Electron 环境 */ }

    // 回退
    _dataRoot = path.join(__dirname, '..', '..', 'data');
    ensureDir(_dataRoot);
    return _dataRoot;
}

/**
 * 迁移旧数据：从项目 downloads/ 目录 → userData
 * 解决路径变更后旧海报缓存和目录数据丢失的问题
 */
function migrateOldData() {
    var oldDir = path.join(__dirname, '..', 'downloads');
    var newRoot = _dataRoot;

    // 文件和目录映射
    var migrations = [
        { src: '_poster_cache.json', dstDir: '', isDir: false },
        { src: '_catalog.json', dstDir: '', isDir: false },
        { src: 'posters', dstDir: 'posters', isDir: true },
        { src: 'storage', dstDir: 'storage', isDir: true }
    ];

    for (var i = 0; i < migrations.length; i++) {
        var m = migrations[i];
        var oldPath = path.join(oldDir, m.src);

        if (!fs.existsSync(oldPath)) continue;
        // 如果目标已存在，跳过
        var newPath = path.join(newRoot, m.dstDir || m.src);
        if (m.isDir) {
            if (fs.existsSync(newPath)) {
                try {
                    var existingFiles = fs.readdirSync(newPath);
                    if (existingFiles.length > 0) continue; // 已有内容，跳过
                } catch (e) { /* 忽略 */ }
            }
        } else {
            if (fs.existsSync(newPath)) continue; // 目标已存在
        }

        if (m.isDir) {
            // 迁移目录
            try {
                copyDirSync(oldPath, newPath);
                console.log('[数据] 已迁移目录: ' + m.src + ' → userData');
            } catch (e) {
                console.log('[数据] 迁移目录失败: ' + m.src + ' — ' + e.message);
            }
        } else {
            // 迁移文件
            try {
                var dstDir = path.join(newRoot, m.dstDir);
                if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
                fs.copyFileSync(oldPath, newPath);
                console.log('[数据] 已迁移文件: ' + m.src + ' → userData');
            } catch (e) {
                console.log('[数据] 迁移文件失败: ' + m.src + ' — ' + e.message);
            }
        }
    }
}

/**
 * 递归复制目录
 */
function copyDirSync(src, dst) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    var files = fs.readdirSync(src, { withFileTypes: true });
    for (var i = 0; i < files.length; i++) {
        var srcPath = path.join(src, files[i].name);
        var dstPath = path.join(dst, files[i].name);
        if (files[i].isDirectory()) {
            copyDirSync(srcPath, dstPath);
        } else {
            if (!fs.existsSync(dstPath)) {
                fs.copyFileSync(srcPath, dstPath);
            }
        }
    }
}

/**
 * 获取可写文件/目录路径
 * @param {...string} segments - 路径片段
 * @returns {string} 完整可写路径
 */
function getDataPath() {
    var root = getDataRoot();
    var segments = Array.prototype.slice.call(arguments);
    if (segments.length === 0) return root;
    var result = path.join.apply(null, [root].concat(segments));

    // 确保父目录存在
    var dir = path.dirname(result);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return result;
}

/**
 * 确保目录存在
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    } catch (e) {
        // 非致命：目录创建失败不应导致整个 app 崩溃
        // 可能原因：磁盘满、权限不足、路径非法
        console.error('[data-paths] 目录创建失败:', dirPath, e.message);
    }
}

module.exports = { getDataRoot: getDataRoot, getDataPath: getDataPath, ensureDir: ensureDir };
