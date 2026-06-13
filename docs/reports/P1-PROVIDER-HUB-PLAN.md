# LH-TV P1 Provider Hub — 实施分析报告

> **日期**: 2026-06-12  
> **前置**: P0.1 ✅ P0.2 ✅ P0.3 ✅ P0.4 ✅  

---

## 一、当前 Provider 架构扫描

### 1.1 现有数据源

```
渲染层 (Vue Views)
    │ window.app.getTypeCatalog/searchVideo/getShowDetail ...
    ↓
IPC 层 (preload.ts)
    │ IPCChannel 枚举
    ↓
主进程 Legacy 模块
    ├── video-source.js   → 整合 AppleCMS + B站
    ├── api-client.js     → AppleCMS V10 客户端
    ├── anime-scraper.js  → 樱花动漫爬虫
    ├── tiantian-scraper.js → 天天动漫爬虫
    ├── bilibili-scraper.js → B站搜索
    ├── show-catalog.js   → 首页/分类数据聚合
    └── poster-fetcher.js → 海报抓取
            │
            ↓
    外部 API 站点 (4 个 AppleCMS)
    ├── 光速资源 (priority: 1)
    ├── 360资源  (priority: 1)
    ├── 量子资源  (priority: 2)
    └── 非凡资源  (priority: 9)
```

### 1.2 当前问题

| 问题 | 影响 |
|------|------|
| View 直接调用 `window.app.xxx()` → 绕过抽象层 | 新增 Provider 需要改 IPC + preload + View |
| 每个 legacy 模块返回不同数据结构 | `as Video[]` 断言遍布 7 个 View |
| 搜索结果无聚合排序 | 按 Provider 优先级串行尝试，先到先得 |
| 动漫爬虫 95% 代码重复 | `anime-scraper.js` ≈ `tiantian-scraper.js` |
| 无 Provider 健康检查 | 某站点宕机时静默失败，提示不友好 |
| CacheManager 未在 Provider 层使用 | 仅 catalogStore 和渲染层使用 |

---

## 二、P1 实施范围（精简版）

> 聚焦核心价值，避免过度工程化

### 2.1 必须完成

| 任务 | 说明 |
|------|------|
| **统一 MediaItem 模型** | 消除 name/title/vod_name 差异 |
| **ProviderRegistry** | 注册/查询/排序 |
| **BaseProvider** | 公共逻辑基类 (request/cacheWrap/retry/timeout) |
| **ProviderFacade** | 唯一入口: search/detail/play/catalog |
| **AppleCMS Provider** | 封装现有 4 个 API 站点 |
| **Anime Provider** | 封装樱花/天天动漫爬虫 |
| **CacheManager 集成** | 所有 Provider 调用经 cacheWrap |

### 2.2 延后到 P2/P3

| 任务 | 原因 |
|------|------|
| IPTV Provider | 无现有数据源，新增功能 |
| Manga Provider | 无现有数据源，新增功能 |
| Local Provider 抽象 | 下载模块已是独立系统 |
| Provider 设置 UI 页面 | UI 工作，P2 做 |
| 插件系统 (.zip 加载) | P3 专项 |

---

## 三、P1 目录结构（精简）

```
src/core/providers/
├── ProviderFacade.ts         # 唯一入口，View 只调这个
├── registry/
│   └── ProviderRegistry.ts   # 注册/查询/排序
├── base/
│   └── BaseProvider.ts       # request/cacheWrap/retry/timeout
├── providers/
│   ├── AppleCMSProvider.ts   # 4 站聚合 (guangsu/360/lz/feisu)
│   └── AnimeProvider.ts      # 樱花 + 天天
├── types/
│   ├── media.types.ts        # MediaItem/MediaDetail/PlaySource (统一模型)
│   └── provider.types.ts     # IProvider/IProviderRegistry
└── index.ts
```

---

## 四、统一数据模型

```typescript
// media.types.ts

/** 统一媒体条目（消除 name/title/vod_name 差异） */
export interface MediaItem {
  id: string
  title: string
  cover: string
  description?: string
  type: 'tv' | 'movie' | 'anime'
  provider: string
  score?: number
  year?: number
  genres?: string[]
  remarks?: string
}

/** 统一详情 */
export interface MediaDetail {
  id: string
  title: string
  cover: string
  description: string
  genres: string[]
  score?: number
  year?: number
  episodes: MediaEpisode[]
  provider: string
}

/** 统一剧集 */
export interface MediaEpisode {
  id: string
  title: string
  number: number
  url: string
}

/** 统一播放源 */
export interface MediaPlaySource {
  id: string
  title: string
  url: string
  quality?: string
  headers?: Record<string, string>
}
```

---

## 五、Provider 接口

```typescript
// provider.types.ts

export interface IProvider {
  id: string
  name: string
  enabled: boolean
  priority: number

  search(keyword: string): Promise<MediaItem[]>
  detail(id: string): Promise<MediaDetail | null>
  catalog(type: string, sub: string): Promise<MediaItem[]>
  homepage?(): Promise<HomePageData>

  healthCheck(): Promise<boolean>
}
```

---

## 六、ProviderRegistry

```typescript
class ProviderRegistry {
  private providers = new Map<string, IProvider>()

  register(provider: IProvider): void
  unregister(id: string): void
  getEnabled(): IProvider[]     // 按 priority 排序
  getAll(): IProvider[]
  get(id: string): IProvider | undefined
}
```

---

## 七、ProviderFacade (聚合搜索核心)

```typescript
class ProviderFacade {
  constructor(
    private registry: ProviderRegistry,
    private cache: CacheManager
  ) {}

  // 聚合搜索：并发所有 Provider，合并 + 按 priority/score 排序
  async search(keyword: string): Promise<MediaItem[]>

  // 单 Provider 详情
  async detail(providerId: string, mediaId: string): Promise<MediaDetail | null>

  // 分类目录（单 Provider）
  async catalog(providerId: string, type: string, sub: string): Promise<MediaItem[]>
}
```

### 聚合搜索流程

```
User: "火影忍者"
    │
ProviderFacade.search("火影忍者")
    │
    ├── AppleCMSProvider.search()  ─┐
    ├── AnimeProvider.search()     ─┤ Promise.all()
    │                               ─┘
    ├── cacheWrap for each
    │
    ├── 合并结果 (flat)
    ├── 按 priority + score 排序
    ├── 去重 (title 相似度)
    └── 返回统一 MediaItem[]
```

---

## 八、AppleCMSProvider 设计

封装现有 `api-client.js` 的功能：

```typescript
class AppleCMSProvider extends BaseProvider {
  id = 'applecms'
  name = 'AppleCMS 聚合'
  priority = 1

  private sites = [
    { key: 'guangsu', name: '光速资源', url: '...', priority: 1 },
    { key: '360zy',   name: '360资源',  url: '...', priority: 1 },
    { key: 'lz',      name: '量子资源',  url: '...', priority: 2 },
    { key: 'feisu',   name: '非凡资源',  url: '...', priority: 9 },
  ]

  // 内部对 4 个站点并发请求，按 priority 合并
  async search(keyword: string): Promise<MediaItem[]>
  async detail(id: string): Promise<MediaDetail | null>
  async catalog(type: string, sub: string): Promise<MediaItem[]>

  // 适配器：AppleCMS 响应 → MediaItem
  private mapToMediaItem(raw: AppleCMSVideo): MediaItem
}
```

---

## 九、AnimeProvider 设计

封装 `anime-scraper.js` + `tiantian-scraper.js`：

```typescript
class AnimeProvider extends BaseProvider {
  id = 'anime'
  name = '动漫聚合'
  priority = 2

  async search(keyword: string): Promise<MediaItem[]>
  async detail(id: string): Promise<MediaDetail | null>
  async catalog(type: string, sub: string): Promise<MediaItem[]>

  private mapToMediaItem(raw: AnimeItem): MediaItem
}
```

---

## 十、实施步骤（6 步）

```
Step 1  创建 media.types.ts + provider.types.ts     (~100 行)
Step 2  创建 BaseProvider.ts                         (~80 行)
Step 3  创建 ProviderRegistry.ts                     (~50 行)
Step 4  创建 AppleCMSProvider.ts                     (~200 行, 含4站适配)
Step 5  创建 AnimeProvider.ts                        (~150 行)
Step 6  创建 ProviderFacade.ts                       (~120 行)
         + 更新 HomeView/SearchView/PlayView 接入

合计: ~700 行新代码，7 个新文件，~5 个 View 修改
```

---

## 十一、受影响 View 修改

| View | 变更 |
|------|------|
| `HomeView.vue` | `window.app.getTypeCatalog` → `providerFacade.catalog()` |
| `TVView.vue` | `window.app.getTypeCatalog` → `providerFacade.catalog()` |
| `MoviesView.vue` | `window.app.getTypeCatalog` → `providerFacade.catalog()` |
| `AnimeView.vue` | `window.app.getAnimeCatalog` → `providerFacade.catalog()` |
| `PlayView.vue` | `window.app.getShowDetail` → `providerFacade.detail()` |
| `SearchView.vue` | `catalogStore.searchLocal` → `providerFacade.search()` (可选) |

---

## 十二、向后兼容

- IPC 层 (preload + main) **不变**
- 旧 legacy 模块 **不删除**（Provider 内部调用 legacy 函数或重构为直接 HTTP 调用）
- StorageService **不变**
- PlayerEngine **不变**
- CacheManager **已集成**（Provider 自动使用 cacheWrap）

---

## 十三、风险分析

| 风险 | 等级 | 缓解 |
|------|:---:|------|
| AppleCMS 4 站并发可能超时 | 🟡 | 保持现有优先级策略，先高优后低优 |
| 统一模型丢失旧字段 | 🟡 | MediaItem 保留 `remarks`/`genres` 等可选字段 |
| Anime 爬虫迁移复杂度 | 🟡 | 先封装 facade 调用现有 legacy 函数，不重写爬虫 |
| TypeScript 编译 | 🟢 | 每步 typecheck |

---

## 十四、预期收益

```
新增 Provider (如新资源站):  50 行 → 只需写 Provider 子类
View 代码行数:              5 个 View 各减 5~10 行
缓存命中率:                 现有 0% → >80%（Provider 层自动缓存）
代码耦合:                   降低 ~60%
类型安全:                   消除 View 中的 as Video[] / as unknown
```
