import { resolve } from 'node:path';
import { promises as fsp } from 'node:fs';
import Mustache from 'mustache';
import { generateRegexView } from './generator.js';

export async function generateEmojiRegex(): Promise<void> {
    const __dirname = import.meta.dirname;
    const configPath = resolve(__dirname, '../../../../twemoji-parser/src/scala/config/src/main/resources/config/emoji.yml');
    const templatePath = resolve(__dirname, './regex.js.mustache');
    const outputPath = resolve(__dirname, '../../src/regex/index.ts');

    console.log(`Loading config from ${configPath}...`);
    const yamlContent = await fsp.readFile(configPath, 'utf8');

    console.log('Generating view...');
    const view = generateRegexView(yamlContent);

    console.log(`Loading template from ${templatePath}...`);
    const templateContent = await fsp.readFile(templatePath, 'utf8');

    console.log('Rendering template...');
    const renderedContent = Mustache.render(templateContent, view);

    console.log(`Writing output to ${outputPath}...`);
    const parentDir = resolve(outputPath, '..');
    await fsp.mkdir(parentDir, { recursive: true });
    await fsp.writeFile(outputPath, renderedContent, 'utf8');

    console.log('Done!');
}
