import { parseEmojiTest } from './parse-emoji-test.js';
import { checkDuplicateEmojis, updateEmojilist } from './update-emojilist.js';
import {
	unicodeEmojiIndexLanguages,
	updateUnicodeEmojiIndex,
} from './update-indexes.js';
import { resolve } from 'node:path';

async function main(): Promise<void> {
    const emojilistPath = resolve(import.meta.dirname, '../../src/emojilist.json');
    const unicodeEmojiIndexesPath = resolve(import.meta.dirname, '../../src/indexes');

    console.log('Fetching emoji test data...');
    const emojiTestEmojis = await parseEmojiTest();

    console.log('Updating emojilist...');
	const emojilist = updateEmojilist(emojiTestEmojis, emojilistPath);

	checkDuplicateEmojis(emojilist);

	for (const language of unicodeEmojiIndexLanguages) {
        console.log(`Updating Unicode emoji index for ${language}...`);
		await updateUnicodeEmojiIndex(
			language,
			emojiTestEmojis,
			emojilistPath,
			unicodeEmojiIndexesPath,
		);
	}

	console.log('Emojilist and indexes updated successfully. Please check manually if the changes are correct.');
}

await main();
