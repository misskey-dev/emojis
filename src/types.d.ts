declare module '@twemoji/parser/dist/lib/regex.js' {
    const emojiRegex: RegExp;
    export default emojiRegex;
}

declare module '@misskey-dev/emojis/emojilist.json' {
    const emojiList: [string, string, number][];
    export default emojiList;
}
