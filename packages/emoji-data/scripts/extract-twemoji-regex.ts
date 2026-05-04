import { resolve } from 'node:path';
import { promises as fsp, existsSync } from 'node:fs';
import twemojiRegex from '@twemoji/parser/dist/lib/regex.js';

function reconstructRegexString(regex: RegExp): string {
    return `/${regex.source}/${regex.flags}`;
}

export async function extractTwemojiRegex(): Promise<void> {
    const outFilePath = resolve(import.meta.dirname, '../src/regex/index.ts');
    
    if (existsSync(outFilePath)) {
        await fsp.rm(outFilePath);
    }

    const content = `export const emojiRegex = ${reconstructRegexString(twemojiRegex.default)};\n`;

    await fsp.writeFile(outFilePath, content, 'utf-8');
    console.log(`Twemoji regex has been extracted and written to ${outFilePath}`);
}
