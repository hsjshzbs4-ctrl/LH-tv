// year-catalog.js — 2015-2026 影视年表
// 按年份、类型组织的影视目录，用于 APP 内各板块快速浏览和离线搜索
// 数据来源：公开评分聚合（豆瓣/IMDb/MyAnimeList）

var CATALOG = {

    // ==================== 动漫 ====================
    anime: {
        // ===== 国产动漫 (国漫) =====
        cn: [
            // 2025-2026
            { name: '斗罗大陆2：绝世唐门', year: '2025', rating: 7.2, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '斗破苍穹 年番', year: '2025', rating: 7.5, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '完美世界', year: '2025', rating: 7.8, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '凡人修仙传', year: '2025', rating: 8.5, genres: ['修仙', '玄幻', '3D'], tags: ['B站'] },
            { name: '仙逆', year: '2025', rating: 8.3, genres: ['修仙', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '剑来', year: '2025', rating: 8.0, genres: ['武侠', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '遮天', year: '2025', rating: 7.0, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '斩神', year: '2025', rating: 8.2, genres: ['热血', '战斗', '2D'], tags: ['腾讯视频'] },
            { name: '沧元图', year: '2025', rating: 7.8, genres: ['玄幻', '热血', '3D'], tags: ['优酷'] },
            { name: '一念永恒', year: '2025', rating: 7.5, genres: ['修仙', '搞笑', '2D'], tags: ['腾讯视频'] },
            { name: '深空彼岸', year: '2025', rating: 6.8, genres: ['科幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '大主宰 年番', year: '2025', rating: 7.3, genres: ['玄幻', '热血', '3D'], tags: ['爱奇艺'] },
            { name: '逆天至尊', year: '2025', rating: 6.5, genres: ['玄幻', '热血', '3D'], tags: ['优酷'] },
            { name: '星辰变', year: '2025', rating: 7.8, genres: ['修仙', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '吞噬星空', year: '2025', rating: 8.0, genres: ['科幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '灵武大陆', year: '2025', rating: 6.8, genres: ['玄幻', '热血', '3D'], tags: ['优酷'] },
            { name: '武动乾坤', year: '2025', rating: 7.2, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '牧神记', year: '2025', rating: 7.5, genres: ['玄幻', '热血', '3D'], tags: ['B站'] },
            { name: '一人之下 第六季', year: '2025', rating: 8.5, genres: ['异能', '战斗', '2D'], tags: ['腾讯视频'] },
            // 2023-2024
            { name: '伍六七', year: '2024', rating: 8.8, genres: ['搞笑', '战斗', '2D'], tags: ['B站'] },
            { name: '三体', year: '2024', rating: 8.3, genres: ['科幻', '硬核', '3D'], tags: ['B站'] },
            { name: '时光代理人', year: '2024', rating: 8.6, genres: ['悬疑', '穿越', '2D'], tags: ['B站'] },
            { name: '雾山五行', year: '2023', rating: 8.8, genres: ['水墨', '战斗', '2D'], tags: ['B站'] },
            { name: '少年歌行', year: '2024', rating: 7.8, genres: ['武侠', '热血', '3D'], tags: ['优酷'] },
            { name: '龙族', year: '2024', rating: 7.0, genres: ['奇幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '中国奇谭', year: '2023', rating: 8.8, genres: ['奇幻', '短片', '2D'], tags: ['B站'] },
            { name: '罗小黑战记', year: '2024', rating: 9.0, genres: ['治愈', '奇幻', '2D'], tags: ['B站'] },
            { name: '镇魂街', year: '2024', rating: 7.5, genres: ['热血', '战斗', '2D'], tags: ['B站'] },
            { name: '刺客伍六七', year: '2018', rating: 8.8, genres: ['搞笑','战斗','2D'], tags: ['B站'] },
            { name: '全职高手', year: '2024', rating: 7.8, genres: ['电竞', '热血', '2D'], tags: ['腾讯视频'] },
            { name: '大理寺日志', year: '2023', rating: 8.2, genres: ['古装', '推理', '2D'], tags: ['B站'] },
            // 2020-2022
            { name: '灵笼', year: '2022', rating: 8.3, genres: ['科幻', '末日', '3D'], tags: ['B站'] },
            { name: '元龙', year: '2020', rating: 7.2, genres: ['穿越', '玄幻', '3D'], tags: ['B站'] },
            { name: '天官赐福', year: '2020', rating: 8.0, genres: ['古风', '奇幻', '2D'], tags: ['B站'] },
            { name: '魔道祖师', year: '2018', rating: 8.9, genres: ['古风', '奇幻', '2D'], tags: ['腾讯视频'] },
            // 2015-2019
            { name: '狐妖小红娘', year: '2015', rating: 8.8, genres: ['恋爱', '奇幻', '2D'], tags: ['腾讯视频'] },
            { name: '秦时明月', year: '2015', rating: 8.5, genres: ['武侠', '历史', '3D'], tags: ['优酷'] },
            { name: '画江湖之不良人', year: '2015', rating: 8.3, genres: ['武侠', '热血', '3D'], tags: ['全平台'] },
            { name: '全职高手 第一季', year: '2017', rating: 8.3, genres: ['电竞', '热血', '2D'], tags: ['腾讯视频'] },
            { name: '斗破苍穹 第一季', year: '2017', rating: 7.0, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '斗罗大陆', year: '2018', rating: 7.5, genres: ['玄幻', '热血', '3D'], tags: ['腾讯视频'] },
            { name: '刺客伍六七', year: '2018', rating: 8.8, genres: ['搞笑', '战斗', '2D'], tags: ['B站'] },
            { name: '少年锦衣卫', year: '2017', rating: 8.0, genres: ['武侠', '热血', '3D'], tags: ['优酷'] },
        ],

        // ===== 日本动漫 (日漫) =====
        jp: [
            // 2025-2026
            { name: '鬼灭之刃', year: '2025', rating: 8.8, genres: ['热血', '战斗'], tags: ['剧场版'] },
            { name: '咒术回战', year: '2025', rating: 8.5, genres: ['热血', '战斗'], tags: ['MAPPA'] },
            { name: '葬送的芙莉莲', year: '2025', rating: 9.2, genres: ['奇幻', '冒险', '治愈'], tags: ['MADHOUSE'] },
            { name: '关于我转生变成史莱姆这档事 第四季', year: '2025', rating: 7.8, genres: ['异世界', '冒险'], tags: [] },
            { name: '怪兽8号', year: '2025', rating: 8.0, genres: ['科幻', '战斗'], tags: ['Production I.G'] },
            { name: '胆大党', year: '2025', rating: 8.2, genres: ['悬疑', '奇幻'], tags: [] },
            { name: '坂本日常', year: '2025', rating: 7.5, genres: ['搞笑', '战斗'], tags: [] },
            { name: '我推的孩子', year: '2025', rating: 8.3, genres: ['偶像', '悬疑'], tags: [] },
            { name: '药屋少女的呢喃', year: '2025', rating: 8.5, genres: ['宫廷', '推理'], tags: [] },
            { name: '迷宫饭', year: '2025', rating: 8.4, genres: ['美食', '冒险'], tags: ['Trigger'] },
            { name: 'Re:从零开始的异世界生活 第三季', year: '2025', rating: 8.5, genres: ['奇幻', '异世界'], tags: [] },
            { name: '无职转生 第二季', year: '2025', rating: 8.0, genres: ['异世界', '冒险'], tags: [] },
            { name: '冰之城墙', year: '2025', rating: 7.0, genres: ['青春', '恋爱'], tags: [] },
            { name: '冻结地球', year: '2025', rating: 7.2, genres: ['科幻', '悬疑'], tags: [] },
            // 2023-2024
            { name: '进击的巨人 最终季', year: '2024', rating: 9.0, genres: ['热血', '战斗', '黑暗'], tags: ['MAPPA'] },
            { name: '电锯人', year: '2023', rating: 8.3, genres: ['热血', '黑暗'], tags: ['MAPPA'] },
            { name: '间谍过家家', year: '2024', rating: 8.5, genres: ['喜剧', '日常'], tags: ['WIT/CloverWorks'] },
            { name: '死神 千年血战篇', year: '2024', rating: 8.7, genres: ['热血', '战斗'], tags: [] },
            { name: '石纪元 新世界', year: '2024', rating: 8.0, genres: ['科幻', '冒险'], tags: [] },
            { name: '物理魔法使马修', year: '2024', rating: 7.3, genres: ['搞笑', '魔法'], tags: [] },
            { name: '防风少年', year: '2024', rating: 7.5, genres: ['校园', '热血'], tags: [] },
            { name: '文豪野犬 第五季', year: '2024', rating: 7.8, genres: ['超能力', '战斗'], tags: [] },
            // 2020-2022
            { name: '孤独摇滚', year: '2022', rating: 9.0, genres: ['音乐', '日常'], tags: ['CloverWorks'] },
            { name: '夏日重现', year: '2022', rating: 8.5, genres: ['悬疑', '轮回'], tags: [] },
            { name: '链锯人 第一季', year: '2022', rating: 8.3, genres: ['热血', '黑暗'], tags: [] },
            { name: '辉夜大小姐想让我告白 第三季', year: '2022', rating: 8.8, genres: ['恋爱', '搞笑'], tags: [] },
            { name: '更衣人偶坠入爱河', year: '2022', rating: 7.8, genres: ['恋爱', 'Cosplay'], tags: [] },
                        { name: '命运石之门', year: '2011', rating: 9.3, genres: ['科幻','悬疑'], tags: ['神作'] },
            { name: '钢之炼金术师 FA', year: '2009', rating: 9.6, genres: ['热血','冒险'], tags: ['神作'] },
            { name: '星际牛仔', year: '1998', rating: 9.6, genres: ['科幻','太空'], tags: ['经典'] },
            { name: '新世纪福音战士', year: '1995', rating: 9.4, genres: ['科幻','机甲'], tags: ['经典'] },
            { name: '虫师', year: '2005', rating: 9.4, genres: ['治愈','奇幻'], tags: ['经典'] },
            { name: '银魂', year: '2006', rating: 9.6, genres: ['搞笑','热血'], tags: ['经典'] },
            { name: '排球少年 第二季', year: '2015', rating: 9.7, genres: ['体育','热血'], tags: ['Production I.G'] },
            { name: '宝石之国', year: '2017', rating: 8.6, genres: ['奇幻','战斗'], tags: ['Orange'] },
            { name: '擅长捉弄的高木同学', year: '2018', rating: 8.7, genres: ['恋爱','日常'], tags: [] },
            { name: '混沌武士', year: '2004', rating: 9.4, genres: ['冒险','动作'], tags: ['经典'] },
            { name: 'Clannad After Story', year: '2008', rating: 9.3, genres: ['恋爱','治愈'], tags: ['催泪'] },
            { name: '轻音少女', year: '2009', rating: 8.9, genres: ['音乐','日常'], tags: ['京都动画'] },
            { name: '魔法少女小圆', year: '2011', rating: 8.8, genres: ['魔法','黑暗'], tags: ['SHAFT'] },
            { name: '冰菓', year: '2012', rating: 8.9, genres: ['校园','推理'], tags: ['京都动画'] },
            { name: '日常', year: '2011', rating: 9.1, genres: ['搞笑','日常'], tags: ['京都动画'] },
            { name: '派对浪客诸葛孔明', year: '2022', rating: 8.0, genres: ['音乐', '穿越'], tags: [] },
            { name: 'Lycoris Recoil', year: '2022', rating: 8.0, genres: ['百合', '动作'], tags: [] },
            { name: '赛博朋克边缘行者', year: '2022', rating: 9.0, genres: ['科幻', '赛博朋克'], tags: ['Trigger/Netflix'] },
            // 2015-2019
            { name: '鬼灭之刃 第一季', year: '2019', rating: 8.8, genres: ['热血', '战斗'], tags: ['ufotable'] },
            { name: '进击的巨人', year: '2013', rating: 9.1, genres: ['热血', '战斗', '黑暗'], tags: ['WIT'] },
            { name: '一拳超人', year: '2015', rating: 8.8, genres: ['热血', '搞笑'], tags: ['MADHOUSE'] },
            { name: '我的英雄学院', year: '2016', rating: 7.8, genres: ['热血', '校园'], tags: ['Bones'] },
            { name: 'Re:从零开始的异世界生活', year: '2016', rating: 8.3, genres: ['奇幻', '异世界'], tags: ['White Fox'] },
            { name: '命运石之门0', year: '2018', rating: 8.7, genres: ['科幻', '悬疑'], tags: [] },
            { name: '紫罗兰永恒花园', year: '2018', rating: 8.7, genres: ['治愈', '文艺'], tags: ['京都动画'] },
            { name: '约定的梦幻岛', year: '2019', rating: 8.3, genres: ['悬疑', '黑暗'], tags: ['CloverWorks'] },
            { name: '辉夜大小姐想让我告白', year: '2019', rating: 8.7, genres: ['恋爱', '搞笑'], tags: ['A-1 Pictures'] },
            { name: 'Dr.STONE 石纪元', year: '2019', rating: 8.1, genres: ['科幻', '冒险'], tags: [] },
            { name: '关于我转生变成史莱姆这档事', year: '2018', rating: 7.9, genres: ['异世界', '冒险'], tags: [] },
            { name: '盾之勇者成名录', year: '2019', rating: 7.2, genres: ['异世界', '冒险'], tags: [] },
            { name: '多罗罗', year: '2019', rating: 8.3, genres: ['历史', '黑暗'], tags: ['MAPPA'] },
            { name: '动物狂想曲', year: '2019', rating: 8.3, genres: ['校园', '悬疑'], tags: ['Orange'] },
            { name: '无职转生', year: '2021', rating: 8.0, genres: ['异世界', '冒险'], tags: [] },
            { name: '咒术回战 第一季', year: '2020', rating: 8.4, genres: ['热血', '战斗'], tags: ['MAPPA'] },
        ],

        // ===== 动漫剧场版 =====
        movie: [
            { name: '鬼灭之刃 无限列车篇', year: '2020', rating: 8.5, genres: ['热血', '战斗'] },
            { name: '鬼灭之刃 绊之奇迹', year: '2024', rating: 7.8, genres: ['热血', '战斗'] },
            { name: '铃芽之旅', year: '2023', rating: 7.8, genres: ['奇幻', '冒险'] },
            { name: '灌篮高手 THE FIRST', year: '2023', rating: 8.9, genres: ['体育', '热血'] },
            { name: '你想活出怎样的人生', year: '2024', rating: 7.8, genres: ['奇幻', '文艺'] },
            { name: '天气之子', year: '2019', rating: 7.5, genres: ['奇幻', '恋爱'] },
            { name: '你的名字', year: '2016', rating: 8.5, genres: ['恋爱', '奇幻'] },
            { name: '声之形', year: '2016', rating: 8.2, genres: ['校园', '治愈'] },
            { name: '哆啦A梦 新大雄的海底鬼岩城', year: '2026', rating: 6.5, genres: ['子供', '冒险'] },
            { name: '光之美少女 奇迹宇宙', year: '2025', rating: 7.0, genres: ['魔法少女', '子供'] },
            { name: '伤物语 历与吸血鬼', year: '2025', rating: 8.0, genres: ['奇幻', '战斗'] },
            { name: '龙猫', year: '1988', rating: 9.2, genres: ['治愈', '奇幻'] },
            { name: '千与千寻', year: '2001', rating: 9.4, genres: ['奇幻', '冒险'] },
            { name: '哈尔的移动城堡', year: '2004', rating: 9.1, genres: ['奇幻', '恋爱'] },
            { name: '天空之城', year: '1986', rating: 9.1, genres: ['冒险', '奇幻'] },
            { name: '风之谷', year: '1984', rating: 8.9, genres: ['科幻', '冒险'] },
            { name: '幽灵公主', year: '1997', rating: 8.9, genres: ['奇幻', '冒险'] },
            { name: '借东西的小人阿莉埃蒂', year: '2010', rating: 8.8, genres: ['奇幻', '治愈'] },
            { name: '起风了', year: '2013', rating: 7.8, genres: ['历史', '文艺'] },
                        { name: '言叶之庭', year: '2013', rating: 8.4, genres: ['恋爱','文艺'], tags: ['新海诚'] },
            { name: '秒速5厘米', year: '2007', rating: 8.3, genres: ['恋爱','文艺'], tags: ['新海诚'] },
            { name: '声之形', year: '2016', rating: 8.3, genres: ['校园','治愈'], tags: ['京都动画'] },
            { name: '崖上的波妞', year: '2008', rating: 8.5, genres: ['子供', '奇幻'] },
        ],
    },

    // ==================== 电视剧 ====================
    tv: {
        // ===== 国产剧 =====
        cn: [
            // 2025-2026
            { name: '繁花', year: '2024', rating: 8.6, genres: ['都市', '年代'], tags: ['王家卫', '胡歌'] },
            { name: '三体', year: '2024', rating: 8.3, genres: ['科幻', '悬疑'], tags: ['刘慈欣', '张鲁一'] },
            { name: '庆余年 第二季', year: '2024', rating: 7.8, genres: ['古装', '权谋'], tags: ['张若昀'] },
            { name: '长相思', year: '2023', rating: 7.8, genres: ['古装', '奇幻'], tags: ['杨紫'] },
            { name: '长相思 第二季', year: '2024', rating: 7.2, genres: ['古装', '奇幻'], tags: ['杨紫'] },
            { name: '莲花楼', year: '2023', rating: 8.5, genres: ['古装', '武侠'], tags: ['成毅'] },
            { name: '狂飙', year: '2023', rating: 8.5, genres: ['犯罪', '剧情'], tags: ['张译', '张颂文'] },
            { name: '漫长的季节', year: '2023', rating: 9.4, genres: ['悬疑', '剧情'], tags: ['范伟', '秦昊'] },
            { name: '去有风的地方', year: '2023', rating: 8.3, genres: ['爱情', '治愈'], tags: ['刘亦菲'] },
            { name: '大江大河之岁月如歌', year: '2024', rating: 8.3, genres: ['年代', '剧情'], tags: ['王凯'] },
            { name: '大唐狄公案', year: '2024', rating: 7.0, genres: ['古装', '悬疑'], tags: [] },
            { name: '墨雨云间', year: '2024', rating: 7.5, genres: ['古装', '爱情'], tags: [] },
            { name: '玫瑰的故事', year: '2024', rating: 8.0, genres: ['都市', '爱情'], tags: ['刘亦菲'] },
            { name: '我的阿勒泰', year: '2024', rating: 8.7, genres: ['治愈', '文艺'], tags: ['马伊琍'] },
            { name: '小巷人家', year: '2024', rating: 8.2, genres: ['年代', '家庭'], tags: [] },
            // 2020-2022
            { name: '人世间', year: '2022', rating: 8.4, genres: ['年代', '家庭'], tags: ['雷佳音'] },
            { name: '开端', year: '2022', rating: 7.9, genres: ['悬疑', '循环'], tags: ['白敬亭', '赵今麦'] },
            { name: '苍兰诀', year: '2022', rating: 7.7, genres: ['古装', '奇幻'], tags: ['虞书欣'] },
            { name: '梦华录', year: '2022', rating: 8.0, genres: ['古装', '爱情'], tags: ['刘亦菲'] },
            { name: '警察荣誉', year: '2022', rating: 8.3, genres: ['职场', '剧情'], tags: ['张若昀'] },
            { name: '县委大院', year: '2022', rating: 7.8, genres: ['政治', '剧情'], tags: ['胡歌'] },
            { name: '隐秘的角落', year: '2020', rating: 8.8, genres: ['悬疑', '犯罪'], tags: ['秦昊'] },
            { name: '沉默的真相', year: '2020', rating: 9.0, genres: ['悬疑', '犯罪'], tags: ['廖凡', '白宇'] },
            { name: '山海情', year: '2021', rating: 9.2, genres: ['扶贫', '剧情'], tags: ['黄轩'] },
            { name: '觉醒年代', year: '2021', rating: 9.3, genres: ['历史', '剧情'], tags: ['于和伟'] },
            { name: '功勋', year: '2021', rating: 9.0, genres: ['传记', '剧情'], tags: [] },
            { name: '你是我的荣耀', year: '2021', rating: 7.2, genres: ['爱情', '都市'], tags: ['杨洋', '迪丽热巴'] },
            { name: '扫黑风暴', year: '2021', rating: 7.1, genres: ['犯罪', '剧情'], tags: ['孙红雷'] },
            { name: '赘婿', year: '2021', rating: 7.3, genres: ['古装', '喜剧'], tags: ['郭麒麟'] },
            // 2015-2019
            { name: '庆余年 第一季', year: '2019', rating: 8.0, genres: ['古装', '权谋'], tags: ['张若昀'] },
            { name: '爱情公寓5', year: '2020', rating: 6.9, genres: ['都市', '喜剧'], tags: ['娄艺潇', '陈赫'] },
            { name: '爱情公寓 第四季', year: '2014', rating: 7.5, genres: ['都市', '喜剧'], tags: ['娄艺潇', '陈赫'] },
            { name: '爱情公寓 第三季', year: '2012', rating: 7.7, genres: ['都市', '喜剧'], tags: ['娄艺潇', '陈赫'] },
            { name: '爱情公寓 第二季', year: '2011', rating: 7.9, genres: ['都市', '喜剧'], tags: ['娄艺潇', '陈赫'] },
            { name: '爱情公寓 第一季', year: '2009', rating: 8.2, genres: ['都市', '喜剧'], tags: ['娄艺潇', '陈赫'] },
            { name: '陈情令', year: '2019', rating: 7.7, genres: ['古装', '奇幻'], tags: ['肖战', '王一博'] },
            { name: '长安十二时辰', year: '2019', rating: 8.2, genres: ['古装', '悬疑'], tags: ['雷佳音'] },
            { name: '都挺好', year: '2019', rating: 7.8, genres: ['家庭', '都市'], tags: ['姚晨'] },
            { name: '知否知否应是绿肥红瘦', year: '2018', rating: 7.9, genres: ['古装', '家庭'], tags: ['赵丽颖'] },
            { name: '延禧攻略', year: '2018', rating: 7.2, genres: ['古装', '宫斗'], tags: ['吴谨言'] },
            { name: '大江大河', year: '2018', rating: 8.8, genres: ['年代', '剧情'], tags: ['王凯'] },
            { name: '如懿传', year: '2018', rating: 7.5, genres: ['古装', '宫斗'], tags: ['周迅'] },
            { name: '白夜追凶', year: '2017', rating: 9.0, genres: ['悬疑', '犯罪'], tags: ['潘粤明'] },
            { name: '人民的名义', year: '2017', rating: 8.3, genres: ['政治', '反腐'], tags: ['陆毅'] },
            { name: '琅琊榜', year: '2015', rating: 9.4, genres: ['古装', '权谋'], tags: ['胡歌'] },
            { name: '伪装者', year: '2015', rating: 8.5, genres: ['谍战', '剧情'], tags: ['胡歌'] },
            { name: '欢乐颂', year: '2016', rating: 7.3, genres: ['都市', '女性'], tags: ['刘涛'] },
            { name: '鬼吹灯之精绝古城', year: '2016', rating: 8.0, genres: ['冒险', '悬疑'], tags: ['靳东'] },
            { name: '无心法师', year: '2015', rating: 8.1, genres: ['奇幻', '爱情'], tags: ['韩东君'] },
            { name: '花千骨', year: '2015', rating: 7.2, genres: ['古装', '仙侠'], tags: ['赵丽颖'] },
            { name: '三生三世十里桃花', year: '2017', rating: 6.5, genres: ['古装', '仙侠'], tags: ['杨幂'] },
                        // 豆瓣高分经典（补录）
            { name: '甄嬛传', year: '2011', rating: 9.4, genres: ['宫斗','古装'], tags: ['孙俪'] },
            { name: '武林外传', year: '2006', rating: 9.6, genres: ['古装','喜剧'], tags: ['闫妮','沙溢'] },
            { name: '父母爱情', year: '2014', rating: 9.5, genres: ['年代','爱情'], tags: ['郭涛','梅婷'] },
            { name: '大明王朝1566', year: '2007', rating: 9.8, genres: ['历史','权谋'], tags: ['陈宝国'] },
            { name: '亮剑', year: '2005', rating: 9.5, genres: ['战争','历史'], tags: ['李幼斌'] },
            { name: '士兵突击', year: '2006', rating: 9.5, genres: ['军旅','剧情'], tags: ['王宝强'] },
            { name: '潜伏', year: '2008', rating: 9.4, genres: ['谍战','剧情'], tags: ['孙红雷'] },
            { name: '战长沙', year: '2014', rating: 9.2, genres: ['战争','家庭'], tags: ['杨紫','霍建华'] },
            { name: '仙剑奇侠传', year: '2005', rating: 9.1, genres: ['仙侠','古装'], tags: ['胡歌','刘亦菲'] },
            { name: '仙剑奇侠传三', year: '2009', rating: 8.9, genres: ['仙侠','古装'], tags: ['胡歌','杨幂'] },
            { name: '想见你', year: '2019', rating: 9.2, genres: ['爱情','悬疑','穿越'], tags: ['许光汉'] },
            { name: '步步惊心', year: '2011', rating: 8.7, genres: ['古装','穿越'], tags: ['刘诗诗'] },
            { name: '最好的我们', year: '2016', rating: 8.9, genres: ['校园','青春'], tags: ['刘昊然','谭松韵'] },
            { name: '大宅门', year: '2001', rating: 9.4, genres: ['家族','历史'], tags: ['陈宝国'] },
            { name: '神探狄仁杰', year: '2004', rating: 9.1, genres: ['古装','悬疑'], tags: ['梁冠华'] },
            { name: '红楼梦', year: '1987', rating: 9.7, genres: ['古装','名著'], tags: ['欧阳奋强','陈晓旭'] },
            { name: '西游记', year: '1986', rating: 9.7, genres: ['神话','名著'], tags: ['六小龄童'] },
            { name: '三国演义', year: '1994', rating: 9.6, genres: ['历史','名著'], tags: ['唐国强'] },
            { name: '水浒传', year: '1998', rating: 9.0, genres: ['历史','名著'], tags: ['李雪健'] },
            { name: '我的团长我的团', year: '2009', rating: 9.6, genres: ['战争','剧情'], tags: ['段奕宏'] },
            { name: '康熙王朝', year: '2001', rating: 9.2, genres: ['历史','剧情'], tags: ['陈道明'] },
            { name: '闯关东', year: '2008', rating: 9.3, genres: ['年代','剧情'], tags: ['李幼斌'] },
            { name: '汉武大帝', year: '2005', rating: 9.2, genres: ['历史','剧情'], tags: ['陈宝国'] },
            { name: '香蜜沉沉烬如霜', year: '2018', rating: 7.8, genres: ['古装', '仙侠'], tags: ['杨紫'] },
        ],

        // ===== 韩剧 =====
        kr: [
            { name: '黑暗荣耀', year: '2023', rating: 8.9, genres: ['复仇', '剧情'], tags: ['宋慧乔', 'Netflix'] },
            { name: 'Moving 异能', year: '2023', rating: 8.5, genres: ['超能力', '动作'], tags: ['Disney+'] },
            { name: '财阀家的小儿子', year: '2022', rating: 7.5, genres: ['重生', '商战'], tags: ['宋仲基'] },
            { name: '非常律师禹英禑', year: '2022', rating: 8.8, genres: ['法律', '治愈'], tags: ['朴恩斌'] },
            { name: '我的解放日志', year: '2022', rating: 9.1, genres: ['治愈', '剧情'], tags: [] },
            { name: '鱿鱼游戏', year: '2021', rating: 7.7, genres: ['悬疑', '生存'], tags: ['李政宰', 'Netflix'] },
            { name: 'D.P逃兵追缉令', year: '2021', rating: 9.1, genres: ['军事', '剧情'], tags: ['丁海寅', 'Netflix'] },
            { name: '那年我们', year: '2021', rating: 8.7, genres: ['爱情', '校园'], tags: [] },
            { name: '海岸村恰恰恰', year: '2021', rating: 8.5, genres: ['爱情', '喜剧'], tags: ['申敏儿'] },
            { name: '机智的医生生活', year: '2020', rating: 9.5, genres: ['医疗', '友情'], tags: ['曹政奭'] },
            { name: '虽然是精神病但没关系', year: '2020', rating: 8.4, genres: ['治愈', '爱情'], tags: ['金秀贤'] },
            { name: '爱的迫降', year: '2020', rating: 7.9, genres: ['爱情', '喜剧'], tags: ['玄彬', '孙艺珍'] },
            { name: '梨泰院Class', year: '2020', rating: 7.2, genres: ['创业', '复仇'], tags: ['朴叙俊'] },
            { name: '王国', year: '2019', rating: 8.5, genres: ['古装', '丧尸'], tags: ['朱智勋', 'Netflix'] },
            { name: '德鲁纳酒店', year: '2019', rating: 7.8, genres: ['奇幻', '爱情'], tags: ['IU'] },
            { name: '天空之城', year: '2018', rating: 8.8, genres: ['教育', '黑色幽默'], tags: [] },
                        { name: '机智的牢房生活', year: '2017', rating: 9.4, genres: ['监狱','喜剧'], tags: ['Netflix'] },
            { name: '秘密森林', year: '2017', rating: 9.3, genres: ['犯罪','悬疑'], tags: ['Netflix'] },
            { name: '棒球大联盟', year: '2019', rating: 9.3, genres: ['职场','体育'], tags: ['南宫珉'] },
            { name: '至上之法', year: '2021', rating: 8.8, genres: ['法律','校园'], tags: ['Netflix'] },
            { name: '猪猡之王', year: '2022', rating: 8.7, genres: ['犯罪','惊悚'], tags: [] },
            { name: '解读恶之心的人们', year: '2022', rating: 8.5, genres: ['犯罪','心理'], tags: ['金南佶'] },
            { name: '机智的医生生活 第二季', year: '2021', rating: 9.5, genres: ['医疗','友情'], tags: ['Netflix'] },
            { name: '我的大叔', year: '2018', rating: 9.4, genres: ['治愈', '剧情'], tags: ['IU', '李善均'] },
            { name: 'Live', year: '2018', rating: 9.1, genres: ['警察', '职场'], tags: [] },
            { name: '信号', year: '2016', rating: 9.2, genres: ['悬疑', '穿越'], tags: ['李帝勋'] },
            { name: '孤单又灿烂的神-鬼怪', year: '2016', rating: 8.7, genres: ['奇幻', '爱情'], tags: ['孔刘'] },
            { name: '请回答1988', year: '2015', rating: 9.7, genres: ['家庭', '青春'], tags: ['朴宝剑'] },
            { name: '太阳的后裔', year: '2016', rating: 7.8, genres: ['爱情', '军事'], tags: ['宋仲基', '宋慧乔'] },
            { name: 'W-两个世界', year: '2016', rating: 7.9, genres: ['奇幻', '爱情'], tags: ['李钟硕'] },
            { name: '未生', year: '2014', rating: 9.3, genres: ['职场', '剧情'], tags: ['任时完'] },
        ],

        // ===== 美剧/英剧 =====
        us: [
            { name: '最后生还者', year: '2023', rating: 8.8, genres: ['末日', '剧情'], tags: ['HBO'] },
                        { name: '老友记', year: '1994', rating: 9.7, genres: ['喜剧','友情'], tags: ['经典'] },
            { name: '生活大爆炸', year: '2007', rating: 9.5, genres: ['喜剧','科学'], tags: ['经典'] },
            { name: '真探 第一季', year: '2014', rating: 9.3, genres: ['悬疑','犯罪'], tags: ['HBO'] },
            { name: '无耻之徒', year: '2011', rating: 9.4, genres: ['剧情','喜剧'], tags: ['Showtime'] },
            { name: '我们这一天', year: '2016', rating: 9.5, genres: ['家庭','剧情'], tags: ['NBC'] },
            { name: '疑犯追踪', year: '2011', rating: 9.3, genres: ['犯罪','科幻'], tags: ['CBS'] },
            { name: '纸牌屋 第一季', year: '2013', rating: 9.3, genres: ['政治','剧情'], tags: ['Netflix'] },
            { name: '心灵猎人', year: '2017', rating: 9.0, genres: ['犯罪','心理'], tags: ['Netflix'] },
            { name: '白莲花度假村', year: '2021', rating: 8.8, genres: ['悬疑','剧情'], tags: ['HBO'] },
            { name: '人生切割术', year: '2022', rating: 9.1, genres: ['科幻', '悬疑'], tags: ['Apple TV+'] },
            { name: '龙之家族', year: '2022', rating: 8.2, genres: ['奇幻', '权谋'], tags: ['HBO'] },
            { name: '怪奇物语', year: '2016', rating: 9.1, genres: ['科幻', '恐怖', '悬疑'], tags: ['Netflix', 'S1-S4'] },
            { name: '怪奇物语 第一季', year: '2016', rating: 9.1, genres: ['科幻', '恐怖'], tags: ['Netflix'] },
            { name: '怪奇物语 第二季', year: '2017', rating: 8.9, genres: ['科幻', '恐怖'], tags: ['Netflix'] },
            { name: '怪奇物语 第三季', year: '2019', rating: 8.8, genres: ['科幻', '恐怖'], tags: ['Netflix'] },
            { name: '怪奇物语 第四季', year: '2022', rating: 8.8, genres: ['科幻', '恐怖'], tags: ['Netflix'] },
            { name: '怪奇物语 最终季', year: '2025', rating: 0, genres: ['科幻', '恐怖'], tags: ['Netflix', '待播'] },
            { name: '星期三', year: '2022', rating: 7.8, genres: ['奇幻', '青春'], tags: ['Netflix'] },
            { name: '和平使者', year: '2022', rating: 8.4, genres: ['超级英雄', '喜剧'], tags: ['DC'] },
            { name: '洛基', year: '2021', rating: 8.3, genres: ['超级英雄', '科幻'], tags: ['Marvel/Disney+'] },
            { name: '旺达幻视', year: '2021', rating: 8.4, genres: ['超级英雄', '悬疑'], tags: ['Marvel/Disney+'] },
            { name: '后翼弃兵', year: '2020', rating: 9.0, genres: ['剧情', '国际象棋'], tags: ['Netflix'] },
            { name: '曼达洛人', year: '2019', rating: 9.0, genres: ['科幻', '西部'], tags: ['Star Wars/Disney+'] },
            { name: '切尔诺贝利', year: '2019', rating: 9.6, genres: ['历史', '灾难'], tags: ['HBO'] },
            { name: '黑袍纠察队', year: '2019', rating: 8.5, genres: ['超级英雄', '黑色幽默'], tags: ['Amazon'] },
            { name: '权力的游戏', year: '2011', rating: 9.3, genres: ['奇幻', '权谋'], tags: ['HBO'] },
            { name: '绝命毒师', year: '2008', rating: 9.6, genres: ['犯罪', '剧情'], tags: ['AMC'] },
            { name: '风骚律师', year: '2015', rating: 9.5, genres: ['犯罪', '剧情'], tags: ['AMC'] },
            { name: '西部世界', year: '2016', rating: 8.6, genres: ['科幻', '西部'], tags: ['HBO'] },
            { name: '黑镜', year: '2011', rating: 9.0, genres: ['科幻', '黑色幽默'], tags: ['Netflix'] },
            { name: '王冠', year: '2016', rating: 9.0, genres: ['历史', '传记'], tags: ['Netflix'] },
            { name: '毒枭', year: '2015', rating: 9.3, genres: ['犯罪', '传记'], tags: ['Netflix'] },
            { name: '行尸走肉', year: '2010', rating: 8.5, genres: ['丧尸', '末日'], tags: ['AMC'] },
            { name: '神探夏洛克', year: '2010', rating: 9.4, genres: ['悬疑', '推理'], tags: ['BBC'] },
            { name: '浴血黑帮', year: '2013', rating: 9.1, genres: ['犯罪', '黑帮'], tags: ['BBC'] },
            { name: '杀死伊芙', year: '2018', rating: 8.3, genres: ['谍战', '犯罪'], tags: ['BBC America'] },
            { name: '亢奋', year: '2019', rating: 8.0, genres: ['青春', '剧情'], tags: ['HBO'] },
        ],
    },

    // ==================== 电影 ====================
    movie: {
        // ===== 国产电影 =====
        cn: [
            { name: '哪吒之魔童闹海', year: '2025', rating: 8.8, genres: ['动画', '奇幻'] },
            { name: '封神 第二部', year: '2025', rating: 7.5, genres: ['奇幻', '动作'] },
            { name: '热辣滚烫', year: '2024', rating: 7.5, genres: ['喜剧', '励志'], tags: ['贾玲'] },
            { name: '飞驰人生2', year: '2024', rating: 7.7, genres: ['喜剧', '赛车'], tags: ['沈腾'] },
            { name: '第二十条', year: '2024', rating: 7.5, genres: ['剧情', '法律'], tags: ['张艺谋'] },
            { name: '抓娃娃', year: '2024', rating: 7.8, genres: ['喜剧', '家庭'], tags: ['沈腾', '马丽'] },
            { name: '满江红', year: '2023', rating: 7.4, genres: ['悬疑', '古装'], tags: ['张艺谋'] },
            { name: '流浪地球2', year: '2023', rating: 8.3, genres: ['科幻', '灾难'], tags: ['吴京', '刘德华'] },
            { name: '孤注一掷', year: '2023', rating: 7.2, genres: ['犯罪', '剧情'], tags: ['张艺兴'] },
            { name: '消失的她', year: '2023', rating: 7.2, genres: ['悬疑', '犯罪'], tags: ['朱一龙'] },
                        { name: '让子弹飞', year: '2010', rating: 9.0, genres: ['剧情','动作'], tags: ['姜文'] },
            { name: '霸王别姬', year: '1993', rating: 9.6, genres: ['剧情','历史'], tags: ['张国荣','陈凯歌'] },
            { name: '活着', year: '1994', rating: 9.4, genres: ['剧情','历史'], tags: ['葛优','张艺谋'] },
            { name: '大话西游之大圣娶亲', year: '1995', rating: 9.2, genres: ['喜剧','奇幻'], tags: ['周星驰'] },
            { name: '大话西游之月光宝盒', year: '1995', rating: 9.1, genres: ['喜剧','奇幻'], tags: ['周星驰'] },
            { name: '功夫', year: '2004', rating: 8.8, genres: ['动作','喜剧'], tags: ['周星驰'] },
            { name: '无间道', year: '2002', rating: 9.3, genres: ['犯罪','悬疑'], tags: ['刘德华','梁朝伟'] },
            { name: '鬼子来了', year: '2000', rating: 9.3, genres: ['战争','喜剧'], tags: ['姜文'] },
            { name: '年会不能停', year: '2023', rating: 8.2, genres: ['喜剧','职场'], tags: ['大鹏'] },
            { name: '封神 第一部', year: '2023', rating: 7.8, genres: ['奇幻', '动作'], tags: ['乌尔善'] },
            { name: '长安三万里', year: '2023', rating: 8.3, genres: ['动画', '历史'], tags: ['追光动画'] },
            { name: '八角笼中', year: '2023', rating: 7.4, genres: ['剧情', '体育'], tags: ['王宝强'] },
            { name: '长津湖', year: '2021', rating: 7.4, genres: ['战争', '历史'], tags: ['吴京'] },
            { name: '你好李焕英', year: '2021', rating: 7.8, genres: ['喜剧', '家庭'], tags: ['贾玲'] },
            { name: '悬崖之上', year: '2021', rating: 7.6, genres: ['谍战', '悬疑'], tags: ['张艺谋'] },
            { name: '刺杀小说家', year: '2021', rating: 6.7, genres: ['奇幻', '动作'], tags: ['雷佳音'] },
            { name: '流浪地球', year: '2019', rating: 7.9, genres: ['科幻', '灾难'], tags: ['吴京'] },
            { name: '哪吒之魔童降世', year: '2019', rating: 8.4, genres: ['动画', '奇幻'], tags: ['饺子'] },
            { name: '我和我的祖国', year: '2019', rating: 7.6, genres: ['剧情', '主旋律'] },
            { name: '我不是药神', year: '2018', rating: 9.0, genres: ['剧情', '社会'], tags: ['徐峥'] },
            { name: '红海行动', year: '2018', rating: 8.2, genres: ['战争', '动作'], tags: ['林超贤'] },
            { name: '唐人街探案2', year: '2018', rating: 6.9, genres: ['喜剧', '悬疑'], tags: ['王宝强'] },
            { name: '西虹市首富', year: '2018', rating: 6.6, genres: ['喜剧'], tags: ['沈腾'] },
            { name: '战狼2', year: '2017', rating: 7.1, genres: ['动作', '战争'], tags: ['吴京'] },
            { name: '芳华', year: '2017', rating: 7.6, genres: ['剧情', '历史'], tags: ['冯小刚'] },
            { name: '羞羞的铁拳', year: '2017', rating: 6.8, genres: ['喜剧', '体育'], tags: ['开心麻花'] },
            { name: '湄公河行动', year: '2016', rating: 8.0, genres: ['动作', '犯罪'], tags: ['林超贤'] },
            { name: '美人鱼', year: '2016', rating: 6.7, genres: ['喜剧', '奇幻'], tags: ['周星驰'] },
            { name: '夏洛特烦恼', year: '2015', rating: 7.7, genres: ['喜剧', '穿越'], tags: ['沈腾'] },
            { name: '大圣归来', year: '2015', rating: 8.3, genres: ['动画', '奇幻'], tags: [] },
            { name: '捉妖记', year: '2015', rating: 6.7, genres: ['奇幻', '喜剧'], tags: ['白百何'] },
            { name: '寻龙诀', year: '2015', rating: 7.4, genres: ['冒险', '奇幻'], tags: ['陈坤'] },
            { name: '老炮儿', year: '2015', rating: 7.5, genres: ['剧情', '犯罪'], tags: ['冯小刚'] },
        ],

        // ===== 好莱坞/国际电影 =====
        us: [
            { name: '奥本海默', year: '2023', rating: 8.8, genres: ['传记', '历史'], tags: ['诺兰'] },
            { name: '芭比', year: '2023', rating: 7.2, genres: ['喜剧', '奇幻'], tags: [] },
            { name: '阿凡达：水之道', year: '2022', rating: 7.9, genres: ['科幻', '冒险'], tags: ['卡梅隆'] },
            { name: '壮志凌云2：独行侠', year: '2022', rating: 8.2, genres: ['动作', '剧情'], tags: ['汤姆·克鲁斯'] },
            { name: '瞬息全宇宙', year: '2022', rating: 7.9, genres: ['科幻', '喜剧'], tags: ['杨紫琼'] },
            { name: '新蝙蝠侠', year: '2022', rating: 7.5, genres: ['超级英雄', '犯罪'], tags: ['DC'] },
            { name: '沙丘', year: '2021', rating: 7.8, genres: ['科幻', '冒险'], tags: ['维伦纽瓦'] },
            { name: '蜘蛛侠：英雄无归', year: '2021', rating: 7.3, genres: ['超级英雄', '动作'], tags: ['Marvel'] },
            { name: '007：无暇赴死', year: '2021', rating: 7.0, genres: ['动作', '谍战'], tags: [] },
            { name: '信条', year: '2020', rating: 7.7, genres: ['科幻', '动作'], tags: ['诺兰'] },
            { name: '小丑', year: '2019', rating: 8.7, genres: ['犯罪', '剧情'], tags: ['DC', '华金·菲尼克斯'] },
            { name: '复仇者联盟4：终局之战', year: '2019', rating: 8.3, genres: ['超级英雄', '动作'], tags: ['Marvel'] },
            { name: '寄生虫', year: '2019', rating: 8.8, genres: ['剧情', '黑色幽默'], tags: ['奉俊昊', '奥斯卡'] },
            { name: '绿皮书', year: '2018', rating: 8.9, genres: ['剧情', '喜剧'], tags: ['奥斯卡'] },
            { name: '海王', year: '2018', rating: 7.6, genres: ['超级英雄', '冒险'], tags: ['DC'] },
            { name: '头号玩家', year: '2018', rating: 8.6, genres: ['科幻', '冒险'], tags: ['斯皮尔伯格'] },
            { name: '寻梦环游记', year: '2017', rating: 9.1, genres: ['动画', '音乐'], tags: ['皮克斯'] },
            { name: '敦刻尔克', year: '2017', rating: 8.4, genres: ['战争', '历史'], tags: ['诺兰'] },
            { name: '银翼杀手2049', year: '2017', rating: 8.3, genres: ['科幻', '悬疑'], tags: ['维伦纽瓦'] },
            { name: '神奇女侠', year: '2017', rating: 7.1, genres: ['超级英雄', '动作'], tags: ['DC'] },
            { name: '爱乐之城', year: '2016', rating: 8.4, genres: ['音乐', '爱情'], tags: ['奥斯卡'] },
            { name: '疯狂动物城', year: '2016', rating: 9.2, genres: ['动画', '喜剧'], tags: ['迪士尼'] },
            { name: '死侍', year: '2016', rating: 7.8, genres: ['超级英雄', '喜剧'], tags: ['Marvel'] },
            { name: '火星救援', year: '2015', rating: 8.4, genres: ['科幻', '冒险'], tags: ['雷德利·斯科特'] },
            { name: '疯狂的麦克斯：狂暴之路', year: '2015', rating: 8.6, genres: ['动作', '科幻'], tags: [] },
            { name: '头脑特工队', year: '2015', rating: 8.7, genres: ['动画', '喜剧'], tags: ['皮克斯'] },
            { name: '星际穿越', year: '2014', rating: 9.4, genres: ['科幻', '冒险'], tags: ['诺兰'] },
            { name: '盗梦空间', year: '2010', rating: 9.3, genres: ['科幻', '悬疑'], tags: ['诺兰'] },
            { name: '肖申克的救赎', year: '1994', rating: 9.7, genres: ['剧情', '犯罪'] },
            { name: '阿甘正传', year: '1994', rating: 9.5, genres: ['剧情', '励志'] },
            { name: '泰坦尼克号', year: '1997', rating: 9.4, genres: ['爱情', '灾难'], tags: ['卡梅隆'] },
            { name: '教父', year: '1972', rating: 9.3, genres: ['犯罪', '剧情'] },
            { name: '黑暗骑士', year: '2008', rating: 9.2, genres: ['超级英雄', '犯罪'], tags: ['诺兰'] },
            { name: '辛德勒的名单', year: '1993', rating: 9.6, genres: ['历史','战争'], tags: ['斯皮尔伯格'] },
            { name: '搏击俱乐部', year: '1999', rating: 9.0, genres: ['剧情','悬疑'], tags: ['大卫芬奇'] },
            { name: '楚门的世界', year: '1998', rating: 9.4, genres: ['剧情','喜剧'], tags: ['金凯瑞'] },
            { name: '海上钢琴师', year: '1998', rating: 9.3, genres: ['剧情','音乐'], tags: ['托纳多雷'] },
            { name: '美丽人生', year: '1997', rating: 9.6, genres: ['剧情','喜剧'], tags: ['意大利'] },
            { name: '教父2', year: '1974', rating: 9.2, genres: ['犯罪','剧情'], tags: ['科波拉'] },
            { name: '黑客帝国', year: '1999', rating: 9.1, genres: ['科幻','动作'], tags: ['经典'] },
            { name: '这个杀手不太冷', year: '1994', rating: 9.4, genres: ['剧情','犯罪'], tags: ['吕克贝松'] },
            { name: '拯救大兵瑞恩', year: '1998', rating: 9.1, genres: ['战争','剧情'], tags: ['斯皮尔伯格'] },
            { name: '放牛班的春天', year: '2004', rating: 9.3, genres: ['音乐','剧情'], tags: ['法国'] },
            { name: '当幸福来敲门', year: '2006', rating: 9.2, genres: ['剧情','励志'], tags: ['威尔史密斯'] },
            { name: '触不可及', year: '2011', rating: 9.3, genres: ['剧情','喜剧'], tags: ['法国'] },
            { name: '飞屋环游记', year: '2009', rating: 9.1, genres: ['动画','冒险'], tags: ['皮克斯'] },
            { name: '机器人总动员', year: '2008', rating: 9.3, genres: ['动画','科幻'], tags: ['皮克斯'] },
            { name: '指环王', year: '2001', rating: 9.1, genres: ['奇幻', '冒险'], tags: ['彼得·杰克逊'] },
        ],

        // ===== 韩国电影 =====
        kr: [
            { name: '破墓', year: '2024', rating: 7.5, genres: ['恐怖', '悬疑'] },
            { name: '首尔之春', year: '2023', rating: 8.5, genres: ['历史', '政治'], tags: ['黄政民'] },
            { name: '混凝土乌托邦', year: '2023', rating: 7.0, genres: ['灾难', '剧情'], tags: ['李秉宪'] },
            { name: '犯罪都市4', year: '2024', rating: 7.3, genres: ['犯罪', '动作'], tags: ['马东锡'] },
            { name: '犯罪都市2', year: '2022', rating: 7.4, genres: ['犯罪', '动作'], tags: ['马东锡'] },
            { name: '寄生虫', year: '2019', rating: 8.8, genres: ['剧情', '黑色幽默'], tags: ['奉俊昊'] },
            { name: '釜山行', year: '2016', rating: 8.5, genres: ['丧尸', '灾难'], tags: ['孔刘'] },
            { name: '与神同行', year: '2017', rating: 7.8, genres: ['奇幻', '剧情'], tags: ['河正宇'] },
            { name: '极限职业', year: '2019', rating: 7.7, genres: ['喜剧', '犯罪'], tags: [] },
            { name: '老手', year: '2015', rating: 7.6, genres: ['犯罪', '动作'], tags: ['黄政民'] },
            { name: '暗杀', year: '2015', rating: 8.0, genres: ['谍战', '历史'], tags: ['全智贤'] },
            { name: '辩护人', year: '2013', rating: 9.2, genres: ['剧情', '法律'], tags: ['宋康昊'] },
            { name: '新世界', year: '2013', rating: 8.8, genres: ['犯罪', '黑帮'], tags: ['李政宰'] },
            { name: '黄海', year: '2010', rating: 8.4, genres: ['犯罪', '动作'], tags: ['河正宇'] },
            { name: '杀人回忆', year: '2003', rating: 8.9, genres: ['犯罪','悬疑'], tags: ['奉俊昊','宋康昊'] },
            { name: '恐怖直播', year: '2013', rating: 8.8, genres: ['犯罪','惊悚'], tags: ['河正宇'] },
            { name: '母亲', year: '2009', rating: 8.5, genres: ['剧情','悬疑'], tags: ['奉俊昊'] },
            { name: '共同警备区', year: '2000', rating: 8.8, genres: ['剧情','战争'], tags: ['朴赞郁'] },
            { name: '我要复仇', year: '2002', rating: 8.1, genres: ['犯罪', '剧情'], tags: ['朴赞郁'] },
        ],

        // ===== 日本电影 =====
        jp: [
            { name: '铃芽之旅', year: '2023', rating: 7.8, genres: ['动画', '奇幻'], tags: ['新海诚'] },
            { name: '灌篮高手', year: '2023', rating: 8.9, genres: ['动画', '体育'] },
            { name: '你想活出怎样的人生', year: '2024', rating: 7.8, genres: ['动画', '文艺'], tags: ['宫崎骏'] },
            // 吉卜力经典动画电影
            { name: '千与千寻', year: '2001', rating: 9.4, genres: ['动画', '奇幻', '冒险'], tags: ['宫崎骏', '吉卜力'] },
            { name: '龙猫', year: '1988', rating: 9.2, genres: ['动画', '治愈', '奇幻'], tags: ['宫崎骏', '吉卜力'] },
            { name: '哈尔的移动城堡', year: '2004', rating: 9.1, genres: ['动画', '奇幻', '恋爱'], tags: ['宫崎骏', '吉卜力'] },
            { name: '天空之城', year: '1986', rating: 9.1, genres: ['动画', '冒险', '奇幻'], tags: ['宫崎骏', '吉卜力'] },
            { name: '风之谷', year: '1984', rating: 8.9, genres: ['动画', '科幻', '冒险'], tags: ['宫崎骏', '吉卜力'] },
            { name: '幽灵公主', year: '1997', rating: 8.9, genres: ['动画', '奇幻', '冒险'], tags: ['宫崎骏', '吉卜力'] },
            { name: '崖上的波妞', year: '2008', rating: 8.5, genres: ['动画', '奇幻', '子供'], tags: ['宫崎骏', '吉卜力'] },
            { name: '借东西的小人阿莉埃蒂', year: '2010', rating: 8.8, genres: ['动画', '奇幻', '治愈'], tags: ['吉卜力'] },
            { name: '起风了', year: '2013', rating: 7.8, genres: ['动画', '历史', '文艺'], tags: ['宫崎骏', '吉卜力'] },
            // 其他经典动画电影
            { name: '鬼灭之刃 无限列车篇', year: '2020', rating: 8.5, genres: ['动画', '热血', '战斗'], tags: ['ufotable'] },
            { name: '声之形', year: '2016', rating: 8.2, genres: ['动画', '校园', '治愈'], tags: ['京都动画'] },
            { name: '言叶之庭', year: '2013', rating: 8.4, genres: ['动画', '恋爱', '文艺'], tags: ['新海诚'] },
            { name: '秒速5厘米', year: '2007', rating: 8.3, genres: ['动画', '恋爱', '文艺'], tags: ['新海诚'] },
            { name: '驾驶我的车', year: '2021', rating: 7.9, genres: ['剧情'], tags: ['滨口龙介'] },
            { name: '小偷家族', year: '2018', rating: 8.7, genres: ['剧情', '家庭'], tags: ['是枝裕和'] },
            { name: '你的名字', year: '2016', rating: 8.5, genres: ['动画', '恋爱'], tags: ['新海诚'] },
            { name: '天气之子', year: '2019', rating: 7.5, genres: ['动画', '奇幻'], tags: ['新海诚'] },
            { name: '海街日记', year: '2015', rating: 8.7, genres: ['家庭', '治愈'], tags: ['是枝裕和'] },
                        { name: '情书', year: '1995', rating: 8.9, genres: ['爱情','剧情'], tags: ['岩井俊二'] },
            { name: '告白', year: '2010', rating: 8.8, genres: ['悬疑','剧情'], tags: ['中岛哲也'] },
            { name: '花束般的恋爱', year: '2021', rating: 8.2, genres: ['爱情','剧情'], tags: ['有村架纯','菅田将晖'] },
            { name: '浪客剑心', year: '2012', rating: 8.0, genres: ['动作', '历史'], tags: ['佐藤健'] },
            { name: '入殓师', year: '2008', rating: 8.8, genres: ['剧情', '治愈'], tags: ['奥斯卡'] },
        ],
    }
};

// ==================== 查询接口 ====================

/**
 * 按类型获取全部
 */
function getByType(type, sub) {
    if (!CATALOG[type]) return [];
    var items;
    if (sub && CATALOG[type][sub]) {
        items = CATALOG[type][sub];
    } else if (!sub) {
        items = [];
        var keys = Object.keys(CATALOG[type]);
        for (var i = 0; i < keys.length; i++) {
            items = items.concat(CATALOG[type][keys[i]]);
        }
    } else {
        return [];
    }
    // 过滤屏蔽标题
    var blocked = [];
    try {
        var cfg = require('./config.js');
        blocked = (cfg.CONTENT_FILTER && cfg.CONTENT_FILTER.blockedTitles) || [];
    } catch (e) {}
    return items.filter(function (item) {
        for (var i = 0; i < blocked.length; i++) {
            if ((item.name || '').indexOf(blocked[i]) !== -1) return false;
        }
        return true;
    });
}

/**
 * 按年份获取
 * @param {string} year
 * @param {string} type - 'anime'|'tv'|'movie'
 */
function getByYear(year, type) {
    var results = [];
    var categories = type ? [type] : Object.keys(CATALOG);
    for (var t = 0; t < categories.length; t++) {
        var cat = CATALOG[categories[t]];
        if (!cat) continue;
        var subKeys = Object.keys(cat);
        for (var s = 0; s < subKeys.length; s++) {
            var items = cat[subKeys[s]];
            for (var i = 0; i < items.length; i++) {
                if (String(items[i].year) === String(year)) {
                    items[i]._sub = subKeys[s];
                    items[i]._type = categories[t];
                    results.push(items[i]);
                }
            }
        }
    }
    return results;
}

/**
 * 按类型+子类型获取
 */
function getByCategory(type, subType) {
    if (CATALOG[type] && CATALOG[type][subType]) {
        return CATALOG[type][subType];
    }
    return [];
}

/**
 * 搜索
 */
function searchCatalog(keyword) {
    var results = [];
    var lower = keyword.toLowerCase();
    var types = Object.keys(CATALOG);
    for (var t = 0; t < types.length; t++) {
        var cat = CATALOG[types[t]];
        var subKeys = Object.keys(cat);
        for (var s = 0; s < subKeys.length; s++) {
            var items = cat[subKeys[s]];
            for (var i = 0; i < items.length; i++) {
                if (items[i].name.toLowerCase().indexOf(lower) !== -1) {
                    items[i]._sub = subKeys[s];
                    items[i]._type = types[t];
                    results.push(items[i]);
                }
            }
        }
    }
    return results;
}

/**
 * 获取所有年份列表
 */
function getYearRange() {
    var years = {};
    var types = Object.keys(CATALOG);
    for (var t = 0; t < types.length; t++) {
        var cat = CATALOG[types[t]];
        var subKeys = Object.keys(cat);
        for (var s = 0; s < subKeys.length; s++) {
            var items = cat[subKeys[s]];
            for (var i = 0; i < items.length; i++) {
                years[items[i].year] = true;
            }
        }
    }
    return Object.keys(years).sort(function (a, b) { return b.localeCompare(a); });
}

module.exports = {
    CATALOG: CATALOG,
    getByType: getByType,
    getByYear: getByYear,
    getByCategory: getByCategory,
    searchCatalog: searchCatalog,
    getYearRange: getYearRange
};
