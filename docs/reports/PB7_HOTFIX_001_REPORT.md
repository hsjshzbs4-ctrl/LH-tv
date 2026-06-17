# PB7-HOTFIX-001 — 分类页与海报系统修复报告

> Date: 2026-06-17 | Branch: develop/v2.0 | Tag: v3.0.1 (pending)
> Priority: P0 Critical | Status: COMPLETE

---

## Root Cause Analysis

### ISSUE-1: 分类页内容混杂
**Root Cause**: `categoryService.getCategory()` 调用 `providerFacade.catalog()` 后未做客户端二次过滤。Provider 返回的 `item.type` 可能与请求的 `category` 参数不一致。
**Fix**: `src/content/categoryService.ts` — 添加 `items.filter()` 进行 `item.type` 与 `category` 的规范化比对。

### ISSUE-2: 海报显示首字母占位符
**Root Cause**: `PosterCard.vue` 未校验 `props.image` 有效性。当 Provider 返回空字符串或 `file://` 坏链时，图片加载失败触发 `@error`，显示首字母占位符。
**Fix**: `src/components/cards/PosterCard.vue` — 新增 `isValidImageUrl()` 前置校验，过滤无效 URL。新增 `safeImage` 计算属性。

### ISSUE-3: Web 端无影视资源
**Root Cause**: `AppleCMSProvider` 通过 `window.app.*` IPC 调用，仅在 Electron 环境可用。Web 浏览器无 `window.app` API。
**Fix**: `src/core/providers/providers/WebAppleCMSProvider.ts` — 新建 Web 兼容 Provider。Electron 环境自动回退 IPC，Web 环境使用 HTTP fetch 直连 AppleCMS API。

---

## Modified Files

| File | Change | Lines |
|------|--------|-------|
| `src/content/categoryService.ts` | 客户端分类过滤 | +8 |
| `src/components/cards/PosterCard.vue` | 封面 URL 校验 | +12 |
| `src/core/providers/providers/WebAppleCMSProvider.ts` | 新增 Web Provider | +150 |

## Test Results

```
TypeScript: 0 errors
Build: PASS
Tests: 242 files / 2134 ALL PASSED
```

## Remaining Risks

1. WebAppleCMSProvider 需要 CORS 代理或 AppleCMS API 支持跨域访问
2. 封面校验仅过滤无效 URL，不解决源数据缺失问题
3. 分类过滤基于 `item.type` 字段，若 Provider 未返回 type 则不过滤
