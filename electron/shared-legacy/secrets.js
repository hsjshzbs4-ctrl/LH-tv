// secrets.js - 使用 Electron safeStorage 加密本地敏感数据
// 运行在 Electron 主进程（需 safeStorage API）
// 替代 storage.js 中的 XOR 混淆方案

const { safeStorage } = require('electron');

function isAvailable() {
    return safeStorage && safeStorage.isEncryptionAvailable();
}

/**
 * 加密字符串
 * @param {string} text
 * @returns {string} base64 编码的加密数据
 */
function encrypt(text) {
    if (!isAvailable()) {
        // 降级：使用无硬编码密钥的简单编码（仅保证非明文，不保证安全）
        return fallbackEncode(text);
    }
    var buf = safeStorage.encryptString(text);
    return buf.toString('base64');
}

/**
 * 解密字符串
 * @param {string} encoded - base64 编码的加密数据
 * @returns {string} 解密后的原文，失败返回空字符串
 */
function decrypt(encoded) {
    if (!isAvailable()) {
        return fallbackDecode(encoded);
    }
    try {
        var buf = Buffer.from(encoded, 'base64');
        return safeStorage.decryptString(buf);
    } catch (e) {
        console.error('[Secrets] 解密失败:', e.message);
        return '';
    }
}

// ==================== 降级方案（safeStorage 不可用时） ====================
// 使用进程 PID + 应用路径组合作为动态密钥
// 虽不如 safeStorage 安全，但优于硬编码常量

function getFallbackKey() {
    // 使用机器名+用户目录+固定盐值作为稳定密钥（不依赖 PID，确保重启后可解密）
    var os = require('os');
    var parts = [
        os.hostname() || 'unknown-host',
        (process.env.USERPROFILE || process.env.HOME || __dirname).replace(/\\/g, '/'),
        'tv_app_fallback_salt_v2'
    ];
    return parts.join('_');
}

function fallbackEncode(text) {
    var key = getFallbackKey();
    var result = '';
    for (var i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return 'f1_' + Buffer.from(result, 'binary').toString('base64');
}

function fallbackDecode(encoded) {
    try {
        if (!encoded || encoded.indexOf('f1_') !== 0) return '';
        var raw = encoded.substring(3);
        var text = Buffer.from(raw, 'base64').toString('binary');
        var key = getFallbackKey();
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        return '';
    }
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt,
    isAvailable: isAvailable
};
