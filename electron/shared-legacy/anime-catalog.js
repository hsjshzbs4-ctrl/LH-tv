// anime-catalog.js - 热门动漫预设目录
// 近五年(2022-2026)热门日漫+国漫+韩漫，作为APP动漫专区的基础数据

var HOT_ANIME = [
    // ====== 2025-2026 热播日漫 ======
    { name: '鬼灭之刃', searchName: '鬼灭之刃', year: '2025', cat: '日漫', tags: ['热血', '战斗'] },
    { name: '咒术回战', searchName: '咒术回战', year: '2025', cat: '日漫', tags: ['热血', '战斗'] },
    { name: '葬送的芙莉莲', searchName: '葬送的芙莉莲', year: '2025', cat: '日漫', tags: ['奇幻', '冒险'] },
    { name: '间谍过家家', searchName: '间谍过家家', year: '2025', cat: '日漫', tags: ['喜剧', '日常'] },
    { name: '我推的孩子', searchName: '我推的孩子', year: '2025', cat: '日漫', tags: ['偶像', '悬疑'] },
    { name: '药屋少女的呢喃', searchName: '药屋少女的呢喃', year: '2025', cat: '日漫', tags: ['宫廷', '推理'] },
    { name: '迷宫饭', searchName: '迷宫饭', year: '2025', cat: '日漫', tags: ['美食', '冒险'] },
    { name: '怪兽8号', searchName: '怪兽8号', year: '2025', cat: '日漫', tags: ['科幻', '战斗'] },
    { name: '坂本日常', searchName: '坂本日常', year: '2025', cat: '日漫', tags: ['搞笑', '战斗'] },
    { name: '胆大党', searchName: '胆大党', year: '2025', cat: '日漫', tags: ['悬疑', '奇幻'] },

    // ====== 2023-2024 热播日漫 ======
    { name: '进击的巨人 最终季', searchName: '进击的巨人', year: '2024', cat: '日漫', tags: ['热血', '战斗'] },
    { name: '电锯人', searchName: '电锯人', year: '2024', cat: '日漫', tags: ['热血', '黑暗'] },
    { name: '死神 千年血战篇', searchName: '死神', year: '2024', cat: '日漫', tags: ['热血', '战斗'] },
    { name: '石纪元 新世界', searchName: '石纪元', year: '2024', cat: '日漫', tags: ['科幻', '冒险'] },
    { name: 'Re:从零开始的异世界生活 第三季', searchName: '从零开始的异世界生活', year: '2024', cat: '日漫', tags: ['奇幻', '异世界'] },
    { name: '无职转生 第二季', searchName: '无职转生', year: '2024', cat: '日漫', tags: ['异世界', '冒险'] },
    { name: '文豪野犬 第五季', searchName: '文豪野犬', year: '2024', cat: '日漫', tags: ['超能力', '战斗'] },
    { name: '关于我转生变成史莱姆这档事 第三季', searchName: '关于我转生变成史莱姆', year: '2024', cat: '日漫', tags: ['异世界', '冒险'] },
    { name: '物理魔法使马修', searchName: '物理魔法使马修', year: '2024', cat: '日漫', tags: ['搞笑', '魔法'] },
    { name: '防风少年', searchName: '防风少年', year: '2024', cat: '日漫', tags: ['校园', '热血'] },

    // ====== 2022热播日漫 ======
    { name: '链锯人', searchName: '链锯人', year: '2022', cat: '日漫', tags: ['热血', '黑暗'] },
    { name: '孤独摇滚', searchName: '孤独摇滚', year: '2022', cat: '日漫', tags: ['音乐', '日常'] },
    { name: '夏日重现', searchName: '夏日重现', year: '2022', cat: '日漫', tags: ['悬疑', '轮回'] },
    { name: '间谍过家家 第一季', searchName: '间谍过家家', year: '2022', cat: '日漫', tags: ['喜剧', '日常'] },
    { name: '派对浪客诸葛孔明', searchName: '派对浪客诸葛孔明', year: '2022', cat: '日漫', tags: ['音乐', '穿越'] },
    { name: '辉夜大小姐想让我告白 第三季', searchName: '辉夜大小姐', year: '2022', cat: '日漫', tags: ['恋爱', '搞笑'] },
    { name: '更衣人偶坠入爱河', searchName: '更衣人偶坠入爱河', year: '2022', cat: '日漫', tags: ['恋爱', 'cosplay'] },
    { name: 'Lycoris Recoil', searchName: '莉可丽丝', year: '2022', cat: '日漫', tags: ['百合', '动作'] },

    // ====== 经典长期热播日漫 ======
    { name: '海贼王', searchName: '海贼王', year: '1999', cat: '日漫', tags: ['热血', '冒险'] },
    { name: '名侦探柯南', searchName: '名侦探柯南', year: '1996', cat: '日漫', tags: ['推理', '悬疑'] },
    { name: '火影忍者', searchName: '火影忍者', year: '2002', cat: '日漫', tags: ['热血', '忍者'] },
    { name: '龙珠超', searchName: '龙珠', year: '2015', cat: '日漫', tags: ['热血', '战斗'] },
    { name: '哆啦A梦', searchName: '哆啦A梦', year: '2005', cat: '日漫', tags: ['子供', '科幻'] },

    // ====== 国漫热播 2022-2026 ======
    { name: '斗罗大陆', searchName: '斗罗大陆', year: '2018', cat: '国漫', tags: ['玄幻', '热血'] },
    { name: '斗破苍穹', searchName: '斗破苍穹', year: '2017', cat: '国漫', tags: ['玄幻', '热血'] },
    { name: '完美世界', searchName: '完美世界', year: '2021', cat: '国漫', tags: ['玄幻', '热血'] },
    { name: '凡人修仙传', searchName: '凡人修仙传', year: '2020', cat: '国漫', tags: ['修仙', '玄幻'] },
    { name: '一念永恒', searchName: '一念永恒', year: '2020', cat: '国漫', tags: ['修仙', '搞笑'] },
    { name: '仙逆', searchName: '仙逆', year: '2025', cat: '国漫', tags: ['修仙', '热血'] },
    { name: '遮天', searchName: '遮天', year: '2024', cat: '国漫', tags: ['玄幻', '热血'] },
    { name: '星辰变', searchName: '星辰变', year: '2018', cat: '国漫', tags: ['修仙', '热血'] },
    { name: '吞噬星空', searchName: '吞噬星空', year: '2020', cat: '国漫', tags: ['科幻', '热血'] },
    { name: '剑来', searchName: '剑来', year: '2025', cat: '国漫', tags: ['武侠', '热血'] },
    { name: '斩神', searchName: '斩神', year: '2025', cat: '国漫', tags: ['热血', '战斗'] },
    { name: '沧元图', searchName: '沧元图', year: '2024', cat: '国漫', tags: ['玄幻', '热血'] },
    { name: '伍六七', searchName: '伍六七', year: '2018', cat: '国漫', tags: ['搞笑', '战斗'] },
    { name: '灵笼', searchName: '灵笼', year: '2023', cat: '国漫', tags: ['科幻', '末日'] },
    { name: '雾山五行', searchName: '雾山五行', year: '2023', cat: '国漫', tags: ['水墨', '战斗'] },
    { name: '时光代理人', searchName: '时光代理人', year: '2024', cat: '国漫', tags: ['悬疑', '穿越'] },
    { name: '一人之下', searchName: '一人之下', year: '2016', cat: '国漫', tags: ['异能', '战斗'] },
    { name: '镇魂街', searchName: '镇魂街', year: '2016', cat: '国漫', tags: ['热血', '战斗'] },
    { name: '全职高手', searchName: '全职高手', year: '2017', cat: '国漫', tags: ['电竞', '热血'] },
    { name: '少年歌行', searchName: '少年歌行', year: '2024', cat: '国漫', tags: ['武侠', '热血'] },
    { name: '三体', searchName: '三体动画', year: '2024', cat: '国漫', tags: ['科幻', '硬核'] },
    { name: '龙族', searchName: '龙族', year: '2024', cat: '国漫', tags: ['奇幻', '热血'] },
    { name: '大王饶命', searchName: '大王饶命', year: '2024', cat: '国漫', tags: ['搞笑', '异能'] },
    { name: '大理寺日志', searchName: '大理寺日志', year: '2023', cat: '国漫', tags: ['古装', '推理'] },

    // ====== 韩漫改编动画 ======
    { name: '我独自升级', searchName: '我独自升级', year: '2025', cat: '韩漫', tags: ['战斗', '奇幻'] },
    { name: '神之塔', searchName: '神之塔', year: '2023', cat: '韩漫', tags: ['冒险', '奇幻'] },
    { name: '高校之神', searchName: '高校之神', year: '2022', cat: '韩漫', tags: ['格斗', '热血'] },
    { name: '大贵族', searchName: '大贵族', year: '2022', cat: '韩漫', tags: ['吸血鬼', '战斗'] },
    { name: '外貌至上主义', searchName: '外貌至上主义', year: '2023', cat: '韩漫', tags: ['校园', '格斗'] },
    { name: '全知读者视角', searchName: '全知读者', year: '2025', cat: '韩漫', tags: ['奇幻', '生存'] }
];

// 按分类索引
function getByCategory(cat) {
    return HOT_ANIME.filter(function (a) { return a.cat === cat; });
}

// 按年份索引
function getByYear(year) {
    return HOT_ANIME.filter(function (a) { return a.year === year; });
}

// 获取全部
function getAll() {
    return HOT_ANIME;
}

// 搜索
function search(keyword) {
    var lower = keyword.toLowerCase();
    return HOT_ANIME.filter(function (a) {
        return a.name.toLowerCase().indexOf(lower) !== -1 ||
            a.searchName.toLowerCase().indexOf(lower) !== -1 ||
            (a.tags || []).some(function (t) { return t.toLowerCase().indexOf(lower) !== -1; });
    });
}

module.exports = {
    HOT_ANIME: HOT_ANIME,
    getByCategory: getByCategory,
    getByYear: getByYear,
    getAll: getAll,
    search: search
};
