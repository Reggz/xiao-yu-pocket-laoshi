export type Hint = {
  message: string;
};

export function buildAutoHint(english: string, hanzi: string, pinyin: string): Hint {
  return {
    message: `\`${english}\` 可以说 \`${hanzi}\` (${pinyin}).`
  };
}

export function buildCorrectionHint(original: string, corrected: string, explanation: string): Hint {
  return {
    message: `你写的是 \`${original}\`。更好的说法是 \`${corrected}\`。${explanation}`
  };
}
