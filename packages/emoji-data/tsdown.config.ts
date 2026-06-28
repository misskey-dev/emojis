import { defineConfig } from 'tsdown';
import { generateEmojiRegex } from './scripts/emoji-regex-generator/index';

export default defineConfig(() => {
    let isFirstRun = true;

    return {
        entry: {
            index: './src/index.ts',
            regex: './src/regex/index.ts',
            indexes: './src/indexes/index.ts',
        },
        outDir: './built',
        clean: true,
        tsconfig: true,
        format: {
            esm: {
                dts: {
                    tsconfig: true,
                },
            },
            cjs: {
                dts: false,
            },
        },
        outExtensions: (ctx) => ctx.format === 'es' ? { js: '.mjs', dts: '.d.ts' } : { js: '.cjs' },
        copy: [
            { from: '../../LICENSE*', to: '.' },
            { from: './src/emojilist.json', to: 'built' },
            { from: './src/emojilist.d.ts', to: 'built' },
            { from: './src/indexes/*.json', to: 'built/indexes' },
        ],
        hooks: {
            'build:prepare': async () => {
                if (isFirstRun) {
                    isFirstRun = false;
                    await generateEmojiRegex();
                }
            },
        },
    };
});
