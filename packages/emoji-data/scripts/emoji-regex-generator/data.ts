// https://github.com/jdecked/twemoji-parser/blob/86a9fee704df4bd418d60d3ee42288ad1afdaed8/src/scala/config/src/main/resources/config/emoji.yml
// をJSONに変換し、以下を実行
// jq '.[].items[]? | select(.type? // "" | contains("text-default")) | .unicode' emoji.json

export const forceTreatAsTextDefault = [
    '265f',
    'a9',
    'ae',
    '2122',
];
