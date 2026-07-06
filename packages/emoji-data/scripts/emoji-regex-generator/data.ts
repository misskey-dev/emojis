// https://github.com/jdecked/twemoji-parser/blob/86a9fee704df4bd418d60d3ee42288ad1afdaed8/src/scala/config/src/main/resources/config/emoji.yml
// をJSONに変換し、以下を実行
// jq '.[].items[]? | select(.type? // "" | contains("text-default")) | .unicode' emoji.json

export const forceTreatAsTextDefault = [
    '265f',
    'a9',
    'ae',
    '2122',
];

/** 後方互換性のための特別対応用（同一として扱う） */
export const additionalEmojiSequencesByUnicode: Record<string, string[]> = {
    // https://github.com/jdecked/twemoji/issues/151, https://github.com/jdecked/twemoji-parser/pull/10
    '1f441-fe0f-200d-1f5e8-fe0f': [
        '1f441-200d-1f5e8',
    ],
};
