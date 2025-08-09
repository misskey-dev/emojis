import * as fs from 'node:fs';
import enAnnotationsDerived from 'cldr-annotations-derived-full/annotationsDerived/en/annotations.json' with {
    type: 'json',
};
import enAnnotations from 'cldr-annotations-full/annotations/en/annotations.json' with {
    type: 'json',
};
import jaAnnotationsDerived from 'cldr-annotations-derived-full/annotationsDerived/ja/annotations.json' with {
    type: 'json',
};
import jaAnnotations from 'cldr-annotations-full/annotations/ja/annotations.json' with {
    type: 'json',
};
import { tokenize } from 'kuromojin';
import { isKana, toHiragana } from 'wanakana';
import type { EmojiList } from './update-emojilist.js';
import type { Emoji } from './parse-emoji-test.js';

type EmojiIndex = [string, string[]][];

export const unicodeEmojiIndexLanguages = [
    'en-US',
    'ja-JP',
    'ja-JP_hira',
] as const;

const regionalIndicatorACodePoint = 0x1F1E6;
const aCodePoint = 0x61;

const enAnnotationsMap = new Map(Object.entries(enAnnotations.annotations.annotations));
const enAnnotationsDerivedMap = new Map(Object.entries(enAnnotationsDerived.annotationsDerived.annotations));
const jaAnnotationsMap = new Map(Object.entries(jaAnnotations.annotations.annotations));
const jaAnnotationsDerivedMap = new Map(Object.entries(jaAnnotationsDerived.annotationsDerived.annotations));

/**
 * 以下の形式に整形します
 * 
 * ```json
 * {
	"😀": ["face", "smile", "happy", "joy", ": D", "grin"],
	"😬": ["face", "grimace", "teeth"],
	"😁": ["face", "happy", "smile", "joy", "kawaii"],
	"😂": ["face", "cry", "tears", "weep", "happy", "happytears", "haha"],
}
 * ```
 */
function prettifyEmojiIndexJson(emojiIndex: EmojiIndex): string {
    const json = JSON.stringify(Object.fromEntries(emojiIndex));
    return json
        .replace(/:/g, ': ')
        .replace(/,/g, ', ')
        .replace(/^{/, '{\n\t')
        .replace(/\],\s*/g, '],\n\t')
        .replace(/]}$/, ']\n}') + '\n';
}

async function getAnnotations(
    emoji: Emoji,
    language: typeof unicodeEmojiIndexLanguages[number],
): Promise<string[]> {
    let result: string[] = [];
    const codePoints = Array.from(emoji.emoji).map((c) => c.codePointAt(0));
    const isCountryFlag = codePoints.length === 2 && codePoints.every((codePoint) => (
        codePoint != null &&
        regionalIndicatorACodePoint <= codePoint &&
        codePoint < regionalIndicatorACodePoint + 26
    ));
    const countryCode = isCountryFlag ? String.fromCodePoint(...codePoints.map((codePoint) => codePoint! - regionalIndicatorACodePoint + aCodePoint)) : null;
    const discoloredEmoji = emoji.emoji.replaceAll(vs16, '');

    switch (language) {
        case 'en-US': {
            if (isCountryFlag && countryCode != null) {
                result.push(
                    countryCode,
                    ...emoji.name.split('_'),
                    'flag',
                    'nation',
                    'country',
                    'banner',
                );
            } else {
                if (emoji.subgroup.startsWith('face')) {
                    result.push('face');
                } else if (emoji.subgroup.startsWith('animal')) {
                    result.push('animal', 'nature');
                } else if (emoji.subgroup.startsWith('plant')) {
                    result.push('plant', 'nature');
                } else if (
                    emoji.subgroup === 'person-sport' || emoji.subgroup === 'sport'
                ) {
                    result.push('sport');
                }

                const annotations = enAnnotationsMap.get(emoji.emoji) ??
                    enAnnotationsMap.get(discoloredEmoji) ??
                    enAnnotationsDerivedMap.get(emoji.emoji) ??
                    enAnnotationsDerivedMap.get(discoloredEmoji);

                if (
                    annotations &&
                    'default' in annotations &&
                    Array.isArray(annotations.default)
                ) {
                    result.push(...annotations.default);
                } else {
                    console.warn('Annotations not found: %s', emoji.name);
                }
            }
            result = result.map((word) => word.toLowerCase());
            break;
        }
        case 'ja-JP':
        case 'ja-JP_hira': {
            if (isCountryFlag) {
                const annotations = jaAnnotationsDerivedMap.get(emoji.emoji);
                if (annotations && 'tts' in annotations) {
                    const name = (annotations.tts[0] as string).replace('旗: ', '');
                    result.push(`${name}の旗`, name, '国旗');
                } else {
                    console.warn('Annotations not found: %s', emoji.name);
                    result.push('国旗');
                }
            } else {
                const annotations = jaAnnotationsMap.get(emoji.emoji) ??
                    jaAnnotationsMap.get(discoloredEmoji) ??
                    jaAnnotationsDerivedMap.get(emoji.emoji) ??
                    jaAnnotationsDerivedMap.get(discoloredEmoji);

                if (annotations && 'default' in annotations) {
                    const defaultAnnotations = annotations.default as string[];
                    if (defaultAnnotations.length === 1) {
                        result.push(...defaultAnnotations[0].split('｜'));
                    } else {
                        result.push(...defaultAnnotations);
                    }
                } else {
                    console.warn('Annotations not found: %s', emoji.name);
                }
            }
            if (language === 'ja-JP_hira') {
                result = await Promise.all(
                    result.map((word) => {
                        if (isKana(word)) {
                            return toHiragana(word, { convertLongVowelMark: false });
                        }
                        return tokenize(word).then((tokens) => toHiragana(tokens.map((token) => token.reading ?? token.surface_form).join(''), { convertLongVowelMark: false }));
                    })
                );
            }
        }
    }
    return Array.from(new Set(result));
}

const fitzpatrick = [0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF]
    .map((codePoint) => String.fromCodePoint(codePoint));

const vs16 = '\uFE0F';

export async function updateUnicodeEmojiIndex(
    language: typeof unicodeEmojiIndexLanguages[number],
    emojiTestEmojis: Emoji[],
    emojilistPath: string,
    unicodeEmojiIndexesPath: string,
): Promise<void> {
    const emojilist = JSON.parse(
        fs.readFileSync(emojilistPath, { encoding: 'utf-8' })
    ) as EmojiList;

    const emojiIndex = Object.entries(
        JSON.parse(fs.readFileSync(`${unicodeEmojiIndexesPath}/${language}.json`, { encoding: 'utf-8' }))
    ) as EmojiIndex;

    const emojiIndexEmojis = new Set(emojiIndex.map(([key]) => key));

    for (let i = 0; i < emojiTestEmojis.length; i++) {
        const emoji = emojiTestEmojis[i];
        const discoloredEmoji = emoji.emoji.replaceAll(vs16, '');
        if (
            emoji.status === 'fully-qualified' &&
            !fitzpatrick.some((c) => emoji.emoji.includes(c))
        ) {
            if (
                !emojiIndexEmojis.has(emoji.emoji) &&
                !emojiIndexEmojis.has(discoloredEmoji)
            ) {
                let emojiIndexIndex = 0;
                const codePoints = Array.from(emoji.emoji).map((c) => c.codePointAt(0));
                const isCountryFlag = codePoints.length === 2 &&
                    codePoints.every((codePoint) =>
                        codePoint && regionalIndicatorACodePoint <= codePoint &&
                        codePoint < regionalIndicatorACodePoint + 26,
                    );
                const countryCode = isCountryFlag
                    ? String.fromCodePoint(
                        ...codePoints.map((codePoint) => codePoint! - regionalIndicatorACodePoint + aCodePoint)
                    )
                    : null;

                if (language !== 'en-US' && isCountryFlag && countryCode != null) {
                    while (emojiIndexIndex < emojiIndex.length) {
                        const emojiIndexEmoji = emojiIndex[emojiIndexIndex][0];
                        const codePoints = Array.from(emojiIndexEmoji).map(
                            (c) => c.codePointAt(0),
                        );
                        if (
                            codePoints.length === 2 &&
                            codePoints.every((codePoint) => (
                                codePoint && regionalIndicatorACodePoint <= codePoint &&
                                codePoint < regionalIndicatorACodePoint + 26
                            )) &&
                            String.fromCodePoint(
                                ...Array.from(emojiIndexEmoji).map((c) => c.codePointAt(0)! - regionalIndicatorACodePoint + aCodePoint)
                            ) > countryCode
                        ) {
                            break;
                        }
                        emojiIndexIndex += 1;
                    }
                } else {
                    let emojilistIndex = emojilist.findIndex((e) => e[0] === emoji.emoji);
                    if (emojilistIndex < 0) {
                        emojilistIndex = emojilist.findIndex((e) => e[0].replaceAll(vs16, '') === discoloredEmoji);
                    }

                    while (emojiIndexIndex < emojiIndex.length) {
                        const emojiIndexEmoji = emojiIndex[emojiIndexIndex][0];
                        if (emojilist.findIndex((e) => e[0] === emojiIndexEmoji) > emojilistIndex) {
                            break;
                        }
                        emojiIndexIndex += 1;
                    }
                }
                emojiIndex.splice(emojiIndexIndex, 0, [emoji.emoji, await getAnnotations(emoji, language)]);
            } else {
                let emojiIndexIndex = emojiIndex.findIndex((e) => e[0] === emoji.emoji);
                if (emojiIndexIndex < 0) {
                    emojiIndexIndex = emojiIndex.findIndex((e) => e[0].replaceAll(vs16, '') === discoloredEmoji);
                }
                if (emojiIndexIndex < 0) {
                    console.error(`Emoji index not found: ${emoji.name}`);
                    continue;
                }
                if (emojiIndex[emojiIndexIndex][1].length === 0) {
                    emojiIndex.splice(emojiIndexIndex, 1, [emojiIndex[emojiIndexIndex][0], await getAnnotations(emoji, language)]);
                }
            }
        }
    }

    fs.writeFileSync(`${unicodeEmojiIndexesPath}/${language}.json`, prettifyEmojiIndexJson(emojiIndex), 'utf-8');
}
