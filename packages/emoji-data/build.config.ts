import { defineBuildConfig } from 'unbuild';
import { resolve, basename } from 'node:path';
import { promises as fsp } from 'node:fs';
import { extractTwemojiRegex } from './scripts/extract-twemoji-regex.js';

export default defineBuildConfig({
    entries: [
        {
            input: './src/index.ts',
            outDir: './built',
        },
        {
            input: './src/regex/index.ts',
            outDir: './built/regex',
        },
        {
            input: './src/indexes/index.ts',
            outDir: './built/indexes',
        },
    ],
    outDir: './built',
    failOnWarn: false,
    declaration: true,
    clean: true,
    rollup: {
        emitCJS: true,
    },
    hooks: {
        'build:before': async () => {
            const licensesToCopy = await Array.fromAsync(fsp.glob('../../LICENSE*', { cwd: import.meta.dirname }));
            const dest = resolve(import.meta.dirname);
            await Promise.all(licensesToCopy.map(async (src) => {
                const filename = basename(src);
                await fsp.copyFile(src, dest + '/' + filename);
            }));
            await extractTwemojiRegex();
        },
        'build:done': async (ctx) => {
            const promises: Promise<void>[] = [];

            const emojilistSrc = resolve(import.meta.dirname, './src/emojilist.json');
            const emojilistDest = resolve(ctx.options.outDir, 'emojilist.json');
            promises.push(fsp.copyFile(emojilistSrc, emojilistDest));
            const emojilistDtsSrc = resolve(import.meta.dirname, './src/emojilist.d.ts');
            const emojilistDtsDest = resolve(ctx.options.outDir, 'emojilist.d.ts');
            promises.push(fsp.copyFile(emojilistDtsSrc, emojilistDtsDest));

            const indexesToCopy = await Array.fromAsync(fsp.glob('./src/indexes/*.json', { cwd: import.meta.dirname }));
            const indexesDest = resolve(ctx.options.outDir, 'indexes');
            promises.push(...indexesToCopy.map(async (src) => {
                const filename = basename(src);
                await fsp.copyFile(src, indexesDest + '/' + filename);
            }));

            await Promise.all(promises);
        },
    }
});
