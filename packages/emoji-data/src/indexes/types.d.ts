import type { EmojiIndex } from './index.js';

declare module '@misskey-dev/emoji-data/indexes/*.json' {
    const value: EmojiIndex;
    export default value;
}
