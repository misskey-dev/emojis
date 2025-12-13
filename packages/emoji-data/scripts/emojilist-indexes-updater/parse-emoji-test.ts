export type Emoji = {
	emoji: string;
	status: string;
	version: string;
	name: string;
	group: number;
	subgroup: string;
};

const emojiTestUrl = 'https://www.unicode.org/Public/emoji/latest/emoji-test.txt';

export async function parseEmojiTest(): Promise<Emoji[]> {
	const emojiTestRes = await fetch(emojiTestUrl);
    const emojiTest = await emojiTestRes.text();
	const emojiTestEmojis: Emoji[] = [];
	let group = -1;
	let subgroup = '';
	for (const line of emojiTest.split('\n')) {
		if (line.startsWith('# group:')) {
			if (!line.startsWith('# group: Component')) {
				group += 1;
			}
		} else if (line.startsWith('# subgroup:')) {
			subgroup = line.replace('# subgroup: ', '');
		} else if (!line.startsWith('#') && line.length > 0) {
			const [status, rest] = line.split('; ')[1].split('# ');
			const [emoji, version, ...name] = rest.split(' ');
			emojiTestEmojis.push({
				emoji,
				status: status.trim(),
				version,
				name: (name[0] === 'flag:' ? name.slice(1) : name)
					.join('_')
					.toLowerCase()
					.normalize('NFKD')
					.replaceAll(/\W/g, '')
					.replaceAll(/_{2,}/g, '_'),
				group,
				subgroup,
			});
		}
	}
	return emojiTestEmojis;
}
