
// Common Radio Languages
export const LANGUAGE_MAP: Record<string, string> = {
    'english': '英语',
    'spanish': '西班牙语',
    'french': '法语',
    'german': '德语',
    'italian': '意大利语',
    'chinese': '中文',
    'mandarin': '普通话',
    'cantonese': '粤语',
    'russian': '俄语',
    'japanese': '日语',
    'korean': '韩语',
    'portuguese': '葡萄牙语',
    'dutch': '荷兰语',
    'polish': '波兰语',
    'turkish': '土耳其语',
    'arabic': '阿拉伯语',
    'hindi': '印地语',
    'greek': '希腊语',
    'swedish': '瑞典语',
    'norwegian': '挪威语',
    'danish': '丹麦语',
    'finnish': '芬兰语',
    'ukrainian': '乌克兰语',
    'thai': '泰语',
    'vietnamese': '越南语',
    'indonesian': '印尼语',
    'hungarian': '匈牙利语',
    'czech': '捷克语',
    'romanian': '罗马尼亚语',
    'persian': '波斯语',
    'farsi': '波斯语',
    'serbian': '塞尔维亚语',
    'croatian': '克罗地亚语'
};

// Common Radio Tags / Genres
export const GENRE_MAP: Record<string, string> = {
    'pop': '流行',
    'rock': '摇滚',
    'jazz': '爵士',
    'classical': '古典',
    'news': '新闻',
    'talk': '谈话',
    'electronic': '电子',
    'dance': '舞曲',
    'house': '浩室',
    'techno': '特克诺',
    'trance': '出神',
    'ambient': '氛围',
    'chillout': '放松',
    'lounge': '休闲',
    'hip hop': '嘻哈',
    'rap': '说唱',
    'rnb': 'R&B',
    'soul': '灵魂乐',
    'funk': '放克',
    'disco': '迪斯科',
    'blues': '蓝调',
    'country': '乡村',
    'folk': '民谣',
    'latin': '拉丁',
    'reggae': '雷鬼',
    'metal': '金属',
    'punk': '朋克',
    'indie': '独立音乐',
    'alternative': '另类',
    'oldies': '怀旧',
    '80s': '80年代',
    '90s': '90年代',
    '00s': '00年代',
    '70s': '70年代',
    'top 40': '榜单金曲',
    'hits': '热歌',
    'adult contemporary': '成人当代',
    'christian': '基督教',
    'gospel': '福音',
    'islamic': '伊斯兰',
    'culture': '文化',
    'sport': '体育',
    'education': '教育',
    'kids': '儿童',
    'student': '校园',
    'variety': '综艺',
    'world': '世界音乐',
    'soundtrack': '原声',
    'instrumental': '纯音乐',
    'easy listening': '轻音乐',
    'community': '社区',
    'public radio': '公共广播',
    'college': '高校',
    'weather': '天气',
    'traffic': '交通',
    'politics': '政治',
    'comedy': '喜剧',
    'drama': '戏剧',
    'business': '商业',
    'finance': '金融',
    'technology': '科技',
    'science': '科学'
};

export function getLocalizedTag(tag: string, lang: 'zh' | 'en'): string {
    if (lang === 'en') return tag;
    const lower = tag.toLowerCase().trim();
    return GENRE_MAP[lower] || tag;
}

export function getLocalizedLanguage(languageStr: string, lang: 'zh' | 'en'): string {
    if (!languageStr) return '';
    if (lang === 'en') return languageStr;

    // language can be comma separated "custom" string sometimes? 
    // Usually it is a single word in our stations.json but can be "english,spanish"
    const langs = languageStr.split(',').map(l => l.trim().toLowerCase());
    const translated = langs.map(l => LANGUAGE_MAP[l] || l);
    return translated.join(' / ');
}
