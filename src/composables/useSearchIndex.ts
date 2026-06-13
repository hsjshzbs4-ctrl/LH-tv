// src/composables/useSearchIndex.ts - 搜索前缀索引
// 构建 Trie + 拼音首字母映射，加速本地目录搜索

import type { CatalogItem } from '@/types'

// ======== Trie 节点 ========
interface TrieNode {
  children: Map<string, TrieNode>
  items: CatalogItem[]  // 该节点对应的匹配项（最多存 20 个）
  isEnd: boolean
}

function createTrieNode(): TrieNode {
  return { children: new Map(), items: [], isEnd: false }
}

// ======== 拼音首字母映射（常用字）========
// 仅覆盖影视标题高频字，大幅减少映射体积
const PINYIN_MAP: Record<string, string> = {
  '一': 'y', '二': 'e', '三': 's', '四': 's', '五': 'w',
  '六': 'l', '七': 'q', '八': 'b', '九': 'j', '十': 's',
  '上': 's', '下': 'x', '大': 'd', '小': 'x', '中': 'z',
  '人': 'r', '天': 't', '地': 'd', '山': 's', '水': 's',
  '风': 'f', '火': 'h', '龙': 'l', '凤': 'f', '虎': 'h',
  '金': 'j', '木': 'm', '光': 'g', '暗': 'a', '电': 'd',
  '爱': 'a', '情': 'q', '花': 'h', '月': 'y', '星': 'x',
  '海': 'h', '王': 'w', '神': 's', '魔': 'm', '仙': 'x',
  '战': 'z', '斗': 'd', '武': 'w', '剑': 'j', '刀': 'd',
  '红': 'h', '白': 'b', '黑': 'h', '蓝': 'l', '青': 'q',
  '春': 'c', '夏': 'x', '秋': 'q', '冬': 'd',
  '国': 'g', '家': 'j', '世': 's', '界': 'j', '城': 'c',
  '新': 'x', '旧': 'j', '前': 'q', '后': 'h', '长': 'c',
  '少': 's', '男': 'n', '子': 'z', '儿': 'e',
  '生': 's', '死': 's', '命': 'm', '梦': 'm', '心': 'x',
  '帝': 'd', '皇': 'h', '主': 'z', '角': 'j',
  '快': 'k', '乐': 'l', '美': 'm', '好': 'h', '高': 'g',
  '不': 'b', '之': 'z', '的': 'd', '了': 'l', '是': 's',
  '我': 'w', '你': 'n', '他': 't', '她': 't', '们': 'm',
  '年': 'n', '日': 'r', '时': 's', '代': 'd',
  '记': 'j', '传': 'c', '奇': 'q', '录': 'l', '志': 'z',
  '剧': 'j', '影': 'y', '片': 'p', '集': 'j', '季': 'j',
  '版': 'b'
}

/**
 * 将中文文本转为拼音首字母（仅映射已知字符）
 * 非中文字符原样保留
 */
function toPinyinInitials(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const py = PINYIN_MAP[ch]
    result += py || ch
  }
  return result
}

// ======== 搜索索引 ========
export class SearchIndex {
  private trie: TrieNode = createTrieNode()
  private items: CatalogItem[] = []
  private pinyinMap: Map<string, CatalogItem[]> = new Map()

  /**
   * 从目录项构建索引
   */
  build(items: CatalogItem[]): void {
    this.trie = createTrieNode()
    this.items = items
    this.pinyinMap.clear()

    for (const item of items) {
      if (!item.name) continue
      const name = item.name.toLowerCase()
      const pinyin = toPinyinInitials(name)

      // 插入 Trie（按字符逐个插入）
      this.insertToTrie(name, item)
      this.insertToTrie(pinyin, item)

      // 拼音首字母映射（只保留每个拼音键的前 5 个结果）
      const shortPy = pinyin.replace(/[^a-z]/g, '').substring(0, 4)
      if (shortPy.length >= 2) {
        const existing = this.pinyinMap.get(shortPy)
        if (!existing) {
          this.pinyinMap.set(shortPy, [item])
        } else if (existing.length < 5) {
          existing.push(item)
        }
      }
    }
  }

  private insertToTrie(text: string, item: CatalogItem): void {
    let node = this.trie
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (!node.children.has(ch)) {
        node.children.set(ch, createTrieNode())
      }
      node = node.children.get(ch)!
      // 每个节点缓存少量结果（避免深度遍历）
      if (node.items.length < 20) {
        node.items.push(item)
      }
    }
    node.isEnd = true
  }

  /**
   * 搜索：拼音首字母 > Trie 前缀 > 回退线性搜索
   * @param query 搜索词
   * @param limit 最大结果数
   */
  search(query: string, limit = 10): CatalogItem[] {
    if (!query || query.length < 1) return []

    const q = query.toLowerCase().trim()
    const seen = new Set<string>()
    const results: CatalogItem[] = []

    function add(item: CatalogItem) {
      const key = item.name.replace(/\s+/g, '')
      if (!seen.has(key)) {
        seen.add(key)
        results.push(item)
      }
    }

    // 1. 拼音首字母匹配（2-4字符时优先使用）
    if (/^[a-z]{2,4}$/.test(q)) {
      const pyMatches = this.pinyinMap.get(q)
      if (pyMatches) {
        for (const m of pyMatches) add(m)
      }
    }

    // 2. Trie 前缀搜索
    const trieResults = this.trieSearch(q)
    for (const m of trieResults) add(m)

    // 3. 如果结果不够，回退到线性搜索（包含匹配）
    if (results.length < limit) {
      for (const item of this.items) {
        if (results.length >= limit) break
        if (item.name.toLowerCase().includes(q)) {
          add(item)
        }
      }
    }

    return results.slice(0, limit)
  }

  private trieSearch(text: string): CatalogItem[] {
    let node = this.trie
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (!node.children.has(ch)) {
        return []
      }
      node = node.children.get(ch)!
    }
    // 返回节点缓存的 items，去重并排序
    return node.items
  }

  /**
   * 检查索引是否为空
   */
  get size(): number {
    return this.items.length
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.trie = createTrieNode()
    this.items = []
    this.pinyinMap.clear()
  }
}

// 单例
let _index: SearchIndex | null = null

export function getSearchIndex(): SearchIndex {
  if (!_index) _index = new SearchIndex()
  return _index
}
