import { promises as fsp, existsSync } from 'fs';
import { dirname, resolve } from 'path';
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
const VS16 = 'fe0f';
const ZERO_WIDTH_JOINER = '200d';

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

// taken from @twemoji/parser to normalize fluent-emoji filenames
function removeVS16s(unicodes: string[]) {
    if (unicodes.includes(ZERO_WIDTH_JOINER)) {
        return unicodes;
    } else {
        return unicodes.filter((u) => u !== VS16);
    }
}

function normalizeFluentEmojiFilename(unicode: string) {
    return removeVS16s(unicode.toLowerCase().split(' ')).map((c) => c.replace(/^0+/, '')).join('-');
}

async function build() {
    // 1. 出力ディレクトリのクリア
    if (existsSync(assetsBuiltDir)) {
        console.log(`Removing existing assets build directory at ${assetsBuiltDir}`);
        await fsp.rm(assetsBuiltDir, { recursive: true, force: true });
    }
    await fsp.mkdir(assetsBuiltDir, { recursive: true });
    console.log(`Created assets build directory at ${assetsBuiltDir}`);

    // 2. ライセンスのコピー
    const licensesToCopy = await Array.fromAsync(fsp.glob(`${import.meta.dirname}/../../../LICENSE*`));
    const dest = resolve(import.meta.dirname, './../');
    await Promise.all(licensesToCopy.map(async (src) => {
        const filename = src.split(/[\\\/]/).pop()!;
        await fsp.copyFile(src, resolve(dest, filename));
    }));
    console.log(`Copied licenses to ${dest}`);

    // 3. Twemojiコピー
    const twemojiSrc = resolve(import.meta.dirname, '../../../twemoji/assets/svg');
    const twemojiDest = resolve(assetsBuiltDir, 'twemoji');
    await fsp.mkdir(twemojiDest, { recursive: true });
    await fsp.cp(twemojiSrc, twemojiDest, { recursive: true });
    console.log(`Copied Twemoji SVGs from ${twemojiSrc} to ${twemojiDest}`);

    // 4. Fluent Emojiのコピー
    const definitions = fsp.glob(`${import.meta.dirname}/../../../fluent-emoji/assets/*/metadata.json`);
    const fluentEmojiDest = resolve(assetsBuiltDir, 'fluent-emoji');
    await fsp.mkdir(fluentEmojiDest, { recursive: true });
    for await (const definition of definitions) {
        const defJson = JSON.parse(await fsp.readFile(definition, 'utf-8')) as FluentEmojiDefinition;
        if (defJson.unicodeSkintones != null) {
            const emojiWritePromises = defJson.unicodeSkintones.filter((unicode) => Object.keys(UNICODE_SKIN_TONES).some((tone) => unicode.includes(tone))).map(async (unicode) => {
                const tone = UNICODE_SKIN_TONE_REGEX.exec(unicode);
                if (tone == null || !UNICODE_SKIN_TONES[tone[0]]) {
                    console.error(`No skin tone found in unicode: ${unicode}`);
                    return;
                }

                const dir = resolve(dirname(definition), `${UNICODE_SKIN_TONES[tone[0]]}/3D`);
                const src = await Array.fromAsync(fsp.glob(`${dir}/*.png`));
                if (src.length === 0) {
                    console.error(`No image found for ${unicode} in ${dir}`);
                    return;
                }

                const dest = resolve(fluentEmojiDest, `${normalizeFluentEmojiFilename(unicode)}.png`);
                await processFluentEmojiImage(src[0], dest);
            });

            // デフォルト
            emojiWritePromises.push((async () => {
                const unicode = normalizeFluentEmojiFilename(defJson.unicode);
                const dir = resolve(dirname(definition), `Default/3D`);
                const src = await Array.fromAsync(fsp.glob(`${dir}/*.png`));
                if (src.length === 0) {
                    console.error(`No image found for ${unicode} in ${dir}`);
                    return;
                }
                const dest = resolve(fluentEmojiDest, `${unicode}.png`);
                await processFluentEmojiImage(src[0], dest);
            })());

            await Promise.all(emojiWritePromises);
        } else {
            const unicode = normalizeFluentEmojiFilename(defJson.unicode);
            const dir = resolve(dirname(definition), `3D`);
            const src = await Array.fromAsync(fsp.glob(`${dir}/*.png`));

            if (src.length === 0) {
                console.error(`No image found for ${unicode} in ${dir}`);
                continue;
            }

            const dest = resolve(fluentEmojiDest, `${unicode}.png`);
            await processFluentEmojiImage(src[0], dest);
        }
    }
    console.log(`Copied Fluent Emoji images to ${fluentEmojiDest}`);
}

build().catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});
