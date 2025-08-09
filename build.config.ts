import { defineBuildConfig } from 'unbuild';
import glob from 'tiny-glob';
import { resolve, basename } from 'node:path';
import { promises as fsp } from 'node:fs';

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
        inlineDependencies: ['@twemoji/parser'],
    },
    hooks: {
        'build:done': async (ctx) => {
            const promises: Promise<void>[] = [];

            const emojilistSrc = resolve(import.meta.dirname, './src/emojilist.json');
            const emojilistDest = resolve(ctx.options.outDir, 'emojilist.json');
            promises.push(fsp.copyFile(emojilistSrc, emojilistDest));

            const indexesToCopy = await glob('./src/indexes/*.json', { cwd: import.meta.dirname });
            const indexesDest = resolve(ctx.options.outDir, 'indexes');
            promises.push(...indexesToCopy.map(async (src) => {
                const filename = basename(src);
                await fsp.copyFile(src, indexesDest + '/' + filename);
            }));

            await Promise.all(promises);
        },
    }
});
