export const regionNamesEn = new Intl.DisplayNames(['en'], { type: 'region' });
export const regionNamesZh = new Intl.DisplayNames(['zh-Hans'], { type: 'region' });

export function getCountryName(code: string, name: string, lang: 'en' | 'zh'): string {
    if (!code) return name; // Fallback to provided name if no code

    // Political Localization Overrides
    if (code === 'TW') {
        return lang === 'zh' ? '中国' : 'China';
    }

    try {
        if (lang === 'zh') {
            return regionNamesZh.of(code) || name;
        }
        return regionNamesEn.of(code) || name;
    } catch (e) {
        return name;
    }
}

export function getLocalizedStationName(name: string, lang: 'en' | 'zh'): string {
    if (lang === 'en') return name;

    // Enhanced heuristics
    let localized = name
        .replace(/\bRadio\b/gi, '电台')
        .replace(/\bStation\b/gi, '广播站')
        .replace(/\bNews\b/gi, '新闻')
        .replace(/\bClassical\b/gi, '古典')
        .replace(/\bJazz\b/gi, '爵士')
        .replace(/\bRock\b/gi, '摇滚')
        .replace(/\bPop\b/gi, '流行')
        .replace(/\bHits\b/gi, '金曲')
        .replace(/\bPublic\b/gi, '公共')
        .replace(/\bInternational\b/gi, '国际')
        .replace(/\bVoice of\b/gi, '之声 - ')
        .replace(/\bLive\b/gi, '直播')
        .replace(/\bNetwork\b/gi, '网络')
        .replace(/\bChannel\b/gi, '频道')
        .replace(/\bMusic\b/gi, '音乐')
        .replace(/\bFm\b/gi, '调频') // Case insensitive regex handles FM/fm
        .replace(/\bAm\b/gi, '调幅');

    // If change occurred, append original name in brackets
    if (localized !== name) {
        return `${localized} (${name})`;
    }

    return name;
}
