import { promises as fsp } from 'fs';
import { dirname, resolve } from 'path';
import glob from 'tiny-glob';
import sharp from 'sharp';

const assetsBuiltDir = resolve(import.meta.dirname, './../built');

const UNICODE_SKIN_TONES: Record<string, string> = {
    '1f3ff': 'Dark',
    '1f3fe': 'Medium-Dark',
    '1f3fd': 'Medium',
    '1f3fc': 'Medium-Light',
    '1f3fb': 'Light',
};

const UNICODE_SKIN_TONE_REGEX = /(1f3ff|1f3fe|1f3fd|1f3fc|1f3fb)/;

type FluentEmojiDefinition = {
    cldr: string;
    fromVersion: string;
    gryph: string;
    griphAsUtfInEmoticons: string[];
    group: string;
    keywords: string[];
    mappedToEmoticons: string[];
    tts: string;
    unicode: string;
    unicodeSkintones?: string[];
};

async function processFluentEmojiImage(src: string, dest: string) {
    await sharp(src)
        .resize({ width: 64, height: 64, fit: 'inside' })
        .toFile(dest);
}

async function build() {
    // 1. ライセンスのコピー
    const licensesToCopy = await glob(`${import.meta.dirname}/../../../LICENSE*`);
    const dest = resolve(import.meta.dirname, './../');
    await Promise.all(licensesToCopy.map(async (src) => {
        const filename = src.split(/[\\\/]/).pop()!;
        console.log(`Copying license file: ${filename}`);
        await fsp.copyFile(src, resolve(dest, filename));
    }));

    // 2. Twemojiコピー
    const twemojiSrc = resolve(import.meta.dirname, '../../../twemoji/assets/svg');
    const twemojiDest = resolve(assetsBuiltDir, 'twemoji');
    await fsp.mkdir(twemojiDest, { recursive: true });
    await fsp.cp(twemojiSrc, twemojiDest, { recursive: true });
    console.log(`Copied Twemoji SVGs from ${twemojiSrc} to ${twemojiDest}`);

    // 3. Fluent Emojiのコピー
    const definitions = await glob(`${import.meta.dirname}/../../../fluent-emoji/assets/*/metadata.json`);
    const fluentEmojiDest = resolve(assetsBuiltDir, 'fluent-emoji');
    await fsp.mkdir(fluentEmojiDest, { recursive: true });
    for (const definition of definitions) {
        const defJson = JSON.parse(await fsp.readFile(definition, 'utf-8')) as FluentEmojiDefinition;
        if (defJson.unicodeSkintones != null) {
            const emojiWritePromises = defJson.unicodeSkintones.filter((unicode) => Object.keys(UNICODE_SKIN_TONES).some((tone) => unicode.includes(tone))).map(async (unicode) => {
                const tone = UNICODE_SKIN_TONE_REGEX.exec(unicode);
                if (tone == null || !UNICODE_SKIN_TONES[tone[0]]) {
                    console.error(`No skin tone found in unicode: ${unicode}`);
                    return;
                }

                const dir = resolve(dirname(definition), `${UNICODE_SKIN_TONES[tone[0]]}/3D`);
                const src = await glob(`${dir}/*.png`).catch((error) => {
                    console.error(`Error finding images in ${dir}:`, error)
                    return [];
                });
                if (src.length === 0) {
                    console.error(`No image found for ${unicode} in ${dir}`);
                    return;
                }

                const dest = resolve(fluentEmojiDest, `${unicode.split(' ').join('-').toLowerCase()}.png`);
                await processFluentEmojiImage(src[0], dest);
                console.log(`Processed Fluent Emoji: ${unicode} -> ${dest}`);
            });

            await Promise.all(emojiWritePromises);
        } else {
            const unicode = defJson.unicode.split(' ').join('-').toLowerCase();
            const dir = resolve(dirname(definition), `3D`);
            const src = await glob(`${dir}/*.png`);

            if (src.length === 0) {
                console.error(`No image found for ${unicode} in ${dir}`);
                continue;
            }

            const dest = resolve(fluentEmojiDest, `${unicode}.png`);
            await processFluentEmojiImage(src[0], dest);
            console.log(`Processed Fluent Emoji: ${defJson.unicode} -> ${dest}`);
        }
    }
}

build().catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});
