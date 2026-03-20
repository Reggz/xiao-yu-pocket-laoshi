import { normalizeInput } from "./normalize";

const samples = [
  "ni3hao3",
  "ni3 hao3",
  "ni hao",
  "nihao",
  "Nǐ hǎo",
  "你好",
  "你好 ma",
  "ni hao 吗",
  "你好🙂",
  "wo jiao Sarah"
];

for (const sample of samples) {
  const result = normalizeInput(sample);
  console.log("INPUT:", sample);
  console.log("TOKENS:", result.tokens);
  console.log("PINYIN:", result.canonicalPinyin);
  console.log("HANZI:", result.hanzi);
  console.log("---");
}
