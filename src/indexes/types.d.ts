import type { EmojiIndex } from './index.js';

declare module '@misskey-dev/emojis/indexes/*.json' {
    const value: EmojiIndex;
    export default value;
}
