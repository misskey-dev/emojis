import { resolve } from 'node:path';
import { promises as fsp } from 'node:fs';
import { generateRegexView } from './generator.js';

export function renderTemplate(template: string, view: Record<string, any>): string {
  return template.replace(/\{\{(?:![\s\S]*?|([\s\S]*?))\}\}/g, (match, key) => {
    if (key === undefined) {
      return '';
    }
    const trimmedKey = key.trim();
    if (trimmedKey in view) {
      return String(view[trimmedKey]);
    }
    return '';
  });
}

async function main() {
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
  const renderedContent = renderTemplate(templateContent, view);

  console.log(`Writing output to ${outputPath}...`);
  const parentDir = resolve(outputPath, '..');
  await fsp.mkdir(parentDir, { recursive: true });
  await fsp.writeFile(outputPath, renderedContent, 'utf8');

  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
