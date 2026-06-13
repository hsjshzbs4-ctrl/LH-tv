// validate.js - 轻量 IPC 参数校验
// 职责：在主进程 IPC handler 入口处校验渲染进程传入的参数
// 不引入第三方依赖，纯函数实现

/**
 * 校验规则：
 *   { name: 'showName', required: true, type: 'string' }
 *   { name: 'page', required: false, type: 'number', default: 1 }
 */

/**
 * 校验参数并返回 { valid, error, values }
 * @param {Array} rules - 校验规则数组
 * @param {...any} args - IPC handler 收到的参数
 * @returns {{ valid: boolean, error?: string, values: Array }}
 */
function check(rules, args) {
    var values = [];
    // 将 arguments 转为真正的数组（args 可能是类数组）
    var params = [];
    for (var i = 0; i < args.length; i++) {
        params.push(args[i]);
    }

    for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        var val = params[j];

        // 必填检查
        if (rule.required && (val === undefined || val === null)) {
            return { valid: false, error: '缺少必填参数: ' + rule.name, values: [] };
        }

        // 默认值
        if ((val === undefined || val === null) && rule.default !== undefined) {
            val = rule.default;
        }

        // 类型检查
        if (val !== undefined && val !== null && rule.type) {
            var actualType = typeof val;
            if (rule.type === 'array') {
                if (!Array.isArray(val)) {
                    return { valid: false, error: '参数 ' + rule.name + ' 应为数组，实际为 ' + actualType, values: [] };
                }
            } else if (actualType !== rule.type) {
                return { valid: false, error: '参数 ' + rule.name + ' 应为 ' + rule.type + '，实际为 ' + actualType, values: [] };
            }
        }

        // 范围检查（仅数字）
        if (rule.type === 'number' && val !== undefined) {
            if (rule.min !== undefined && val < rule.min) {
                return { valid: false, error: '参数 ' + rule.name + ' 最小值为 ' + rule.min, values: [] };
            }
            if (rule.max !== undefined && val > rule.max) {
                return { valid: false, error: '参数 ' + rule.name + ' 最大值为 ' + rule.max, values: [] };
            }
        }

        // 字符串长度检查
        if (rule.type === 'string' && rule.maxLength && val && val.length > rule.maxLength) {
            return { valid: false, error: '参数 ' + rule.name + ' 超过最大长度 ' + rule.maxLength, values: [] };
        }

        values.push(val);
    }

    return { valid: true, values: values };
}

/**
 * 带校验的 IPC handler 包装器
 * 用法：
 *   ipcMain.handle('search', withValidation([
 *     { name: 'keyword', required: true, type: 'string', maxLength: 100 },
 *     { name: 'page', required: false, type: 'number', default: 1, min: 1 }
 *   ], function(event, keyword, page) { ... }))
 */
function withValidation(rules, handler) {
    return function (event) {
        // 收集可变参数（跳过 event）
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        var result = check(rules, args);
        if (!result.valid) {
            console.warn('[Validate] IPC 参数校验失败:', result.error);
            return Promise.resolve({ error: result.error, _invalid: true });
        }

        // 用校验后的值调用 handler
        var handlerArgs = [event].concat(result.values);
        return handler.apply(null, handlerArgs);
    };
}

module.exports = {
    check: check,
    withValidation: withValidation
};
