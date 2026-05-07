import { resolve } from 'node:path';
import { promises as fsp, existsSync } from 'node:fs';
import twemojiRegex from '@twemoji/parser/dist/lib/regex.js';

function reconstructRegexString(regex: RegExp): string {
    return `/${regex.source}/${regex.flags}`;
}

export async function extractTwemojiRegex(): Promise<void> {
    const outFileDir = resolve(import.meta.dirname, '../src/regex');
    const outFilePath = resolve(outFileDir, 'index.ts');
    
    if (existsSync(outFilePath)) {
        await fsp.rm(outFilePath);
    }

    if (!existsSync(outFileDir)) {
        await fsp.mkdir(outFileDir, { recursive: true });
    }

    const content = `export const emojiRegex = ${reconstructRegexString('default' in twemojiRegex ? twemojiRegex.default : twemojiRegex)};\n`;

    await fsp.writeFile(outFilePath, content, 'utf-8');
    console.log(`Twemoji regex has been extracted and written to ${outFilePath}`);
}
