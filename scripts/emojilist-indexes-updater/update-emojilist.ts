import * as fs from 'node:fs';
import type { Emoji } from './parse-emoji-test.js';

const fitzpatrick = [0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF]
    .map((codePoint) => String.fromCodePoint(codePoint));

const zwj = '\u200D';
const femaleSign = '\u2640';
const maleSign = '\u2642';
const rightSign = '\u27A1';
const vs16 = '\uFE0F';

export function updateEmojilist(
    emojiTestEmojis: Emoji[],
    emojilistPath: string,
): [string, string, number][] {
    const emojilist = JSON.parse(fs.readFileSync(emojilistPath, { encoding: 'utf-8' })) as [string, string, number][];
    const emojilistEmojis = new Set(emojilist.map((e) => e[0] as string));
    for (let i = 0; i < emojiTestEmojis.length; i++) {
        const emoji = emojiTestEmojis[i];
        const discoloredEmoji = emoji.emoji.replaceAll(vs16, '');
        if (
            emoji.status === 'fully-qualified' &&
            !fitzpatrick.some((c) => emoji.emoji.includes(c)) &&
            !(emojilistEmojis.has(emoji.emoji) || emojilistEmojis.has(discoloredEmoji))
        ) {
            if (emoji.emoji.includes(`${zwj}${rightSign}`)) {
                const leftEmoji = emoji
                    .emoji
                    .replace(`${zwj}${rightSign}`, '')
                    .replaceAll(vs16, '');
                const leftIndex = emojilist.findIndex(
                    (e) => e[0].replace(vs16, '') === leftEmoji,
                );
                if (leftIndex >= 0) {
                    const leftEmoji = emojilist[leftIndex];
                    let name = emoji.name;
                    if (emoji.name.endsWith('_facing_right')) {
                        if (leftEmoji[1].endsWith('_woman')) {
                            if (leftEmoji[0].includes(`${zwj}${femaleSign}`)) {
                                name = `${leftEmoji[1]}_facing_right`;
                            }
                        } else if (leftEmoji[1].endsWith('_man')) {
                            if (leftEmoji[0].includes(`${zwj}${maleSign}`)) {
                                name = `${leftEmoji[1]}_facing_right`;
                            }
                        } else {
                            name = `${leftEmoji[1]}_facing_right`;
                        }
                    }
                    emojilist.splice(
                        leftIndex + 1,
                        0,
                        [emoji.emoji, name, leftEmoji[2]],
                    );
                    continue;
                }
            }
            if (emoji.emoji.includes(`${zwj}${femaleSign}`)) {
                const maleEmoji = emoji.emoji.replaceAll(femaleSign, maleSign);
                const maleIndex = emojilist.findIndex((e) => e[0] === maleEmoji);
                if (maleIndex >= 0) {
                    emojilist.splice(
                        maleIndex,
                        0,
                        [emoji.emoji, emoji.name, emojilist[maleIndex][2]],
                    );
                    continue;
                }
                const genderlessEmoji = emoji
                    .emoji
                    .replaceAll(`${zwj}${femaleSign}`, '')
                    .replaceAll(vs16, '');
                const genderlessIndex = emojilist.findIndex(
                    (e) => e[0].replaceAll(vs16, '') === genderlessEmoji,
                );
                if (genderlessIndex >= 0) {
                    emojilist.splice(
                        genderlessIndex + 1,
                        0,
                        [emoji.emoji, emoji.name, emojilist[genderlessIndex][2]],
                    );
                    continue;
                }
            } else if (emoji.emoji.includes(`${zwj}${maleSign}`)) {
                const femaleEmoji = emoji.emoji.replaceAll(maleSign, femaleSign);
                const femaleIndex = emojilist.findIndex((e) => e[0] === femaleEmoji);
                if (femaleIndex >= 0) {
                    emojilist.splice(femaleIndex + 1, 0, [
                        emoji.emoji,
                        emoji.name,
                        emojilist[femaleIndex][2],
                    ]);
                    continue;
                }
                const genderlessEmoji = emoji
                    .emoji
                    .replaceAll(`${zwj}${maleSign}`, '')
                    .replaceAll(vs16, '');
                const genderlessIndex = emojilist.findIndex(
                    (e) => e[0].replaceAll(vs16, '') === genderlessEmoji,
                );
                if (genderlessIndex >= 0) {
                    emojilist.splice(
                        genderlessIndex + 1,
                        0,
                        [emoji.emoji, emoji.name, emojilist[genderlessIndex][2]],
                    );
                    continue;
                }
            } else {
                const genderIndex = emojilist.findIndex(
                    (e) =>
                        e[0]
                            .replaceAll(vs16, '')
                            .replaceAll(zwj, '')
                            .replaceAll(maleSign, '')
                            .replaceAll(femaleSign, '') === discoloredEmoji,
                );
                if (genderIndex >= 0) {
                    emojilist.splice(
                        genderIndex,
                        0,
                        [emoji.emoji, emoji.name, emojilist[genderIndex][2]],
                    );
                    continue;
                }
            }

            let emojilistIndex = 0;
            if (emoji.group === 8) {
                while (emojilistIndex < emojilist.length) {
                    const emojilistEmoji = emojilist[emojilistIndex];
                    const emojiTestEmoji = emojiTestEmojis.find(
                        (e) => e.emoji === emojilistEmoji[0],
                    );
                    if (
                        emojiTestEmoji?.group === emoji.group &&
                        emojiTestEmoji.subgroup === emoji.subgroup &&
                        emojiTestEmoji.name > emoji.name
                    ) {
                        break;
                    }
                    emojilistIndex += 1;
                }
            } else {
                let sameSubgroupCount = 0;
                while (emojilistIndex < emojilist.length) {
                    const emojilistEmoji = emojilist[emojilistIndex];
                    const emojiTestIndex = emojiTestEmojis.findIndex(
                        (e) => e.emoji === emojilistEmoji[0],
                    );
                    const emojiTestEmoji = emojiTestEmojis[emojiTestIndex];
                    const group = emojilistEmoji[2] as number;
                    if (group > emoji.group) {
                        break;
                    } else if (group === emoji.group) {
                        if (emojiTestEmoji.subgroup === emoji.subgroup) {
                            if (emojiTestIndex > i) {
                                break;
                            }
                            sameSubgroupCount += 1;
                        } else if (sameSubgroupCount > 1) {
                            break;
                        } else {
                            sameSubgroupCount = 0;
                        }
                    }
                    emojilistIndex += 1;
                }
            }

            emojilist.splice(emojilistIndex, 0, [
                emoji.emoji,
                emoji.name,
                emoji.group,
            ]);
            emojilistEmojis.add(emoji.emoji);
        }
    }
    fs.writeFileSync(emojilistPath, JSON.stringify(emojilist), 'utf-8');
    return emojilist;
}

export function checkDuplicateEmojis(
    emojilist: [string, string, number][],
): void {
    const emojis = new Map();
    const names = new Map();
    for (const [emoji, name] of emojilist) {
        if (emojis.has(emoji)) {
            console.warn(
                `Duplicate emoji found: ${emoji} (${emojis.get(emoji)}, ${name})`,
            );
        }
        if (names.has(name)) {
            console.warn(
                `Duplicate name found: ${name} (${names.get(name)}, ${emoji})`,
            );
        }
        emojis.set(emoji, name);
        names.set(name, emoji);
    }
}
