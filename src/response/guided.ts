import { Curriculum } from "../curriculum/types";
import { getUnitsForLevel, getUnitsByTopic } from "../curriculum/helpers";
import { UserSessionState } from "../bot/state";

export type GuidedResult = {
  text: string;
  nextStage: number;
};

const NAME_PATTERNS = [/\bwo\s+jiao\b/i, /\bwo\s+shi\b/i, /my\s+name\s+is/i];
const FEELING_PATTERNS = [/\bwo\s+hen\s+hao\b/i, /i\s*'?m\s*good/i, /fine/i];
const LIKE_PATTERNS = [/\bwo\s+xi\s*huan\b/i, /i\s+like/i];

function buildLine(hanzi: string, pinyin: string, english: string): string {
  return `${hanzi}\n${pinyin}\n${english}`;
}

function detectTopicPreference(input: string, topics: string[]): string | null {
  const lower = input.toLowerCase();
  for (const topic of topics) {
    if (lower.includes(topic.toLowerCase())) return topic;
  }
  return null;
}

function pickSimpleTemplate(curriculum: Curriculum, level: string, topics: string[]): string | null {
  const units = getUnitsForLevel(curriculum, [level]);
  const topicUnits = topics.length ? getUnitsByTopic({ units }, topics) : [];
  const targetUnits = topicUnits.length ? topicUnits : units;
  const template = targetUnits.flatMap((u) => u.templates)[0];
  if (!template) return null;
  return buildLine(template.hanzi, template.pinyin, template.english);
}

export function getGuidedReply(
  input: string,
  session: UserSessionState,
  curriculum: Curriculum
): GuidedResult | null {
  const text = input.trim();
  const lower = text.toLowerCase();
  const stage = session.guidedStage ?? 0;

  if (stage === 0) {
    return {
      text: buildLine("你好！你叫什么名字？", "ni3 hao3! ni3 jiao4 shen2 me ming2 zi?", "Hello! What is your name?"),
      nextStage: 1
    };
  }

  if (stage === 1) {
    if (NAME_PATTERNS.some((p) => p.test(lower))) {
      return {
        text: buildLine(
          "我叫小语，很高兴认识你。你好吗？",
          "wo3 jiao4 xiao3 yu3, hen3 gao1 xing4 ren4 shi ni3. ni3 hao3 ma?",
          "My name is Xiao Yu. Nice to meet you. How are you?"
        ),
        nextStage: 2
      };
    }
    return {
      text: buildLine("你可以说：我叫…", "ni3 ke3 yi3 shuo1: wo3 jiao4…", "You can say: I am called …"),
      nextStage: 1
    };
  }

  if (stage === 2) {
    if (FEELING_PATTERNS.some((p) => p.test(lower))) {
      return {
        text: buildLine(
          "我也很好。你喜欢学中文吗？",
          "wo3 ye3 hen3 hao3. ni3 xi3 huan xue2 zhong1 wen2 ma?",
          "I’m also good. Do you like learning Chinese?"
        ),
        nextStage: 3
      };
    }
    return {
      text: buildLine("你可以说：我很好 / 我还可以", "ni3 ke3 yi3 shuo1: wo3 hen3 hao3 / wo3 hai2 ke3 yi3", "You can say: I’m good / I’m okay"),
      nextStage: 2
    };
  }

  if (stage === 3) {
    if (LIKE_PATTERNS.some((p) => p.test(lower))) {
      return {
        text: buildLine(
          "你最喜欢什么话题？比如：Food, Work。",
          "ni3 zui4 xi3 huan shen2 me hua4 ti2? bi3 ru2: food, work.",
          "What topic do you like most? For example: Food, Work."
        ),
        nextStage: 4
      };
    }
    return {
      text: buildLine("你可以说：我喜欢…", "ni3 ke3 yi3 shuo1: wo3 xi3 huan…", "You can say: I like …"),
      nextStage: 3
    };
  }

  if (stage === 4) {
    const topic = detectTopicPreference(lower, session.settings.topics);
    if (topic || lower.includes("food")) {
      return {
        text: buildLine(
          "你最喜欢吃什么？",
          "ni3 zui4 xi3 huan chi1 shen2 me?",
          "What do you like to eat most?"
        ),
        nextStage: 5
      };
    }
    return {
      text: buildLine("可以说：我喜欢 food / work", "ke3 yi3 shuo1: wo3 xi3 huan food / work", "You can say: I like food / work"),
      nextStage: 4
    };
  }

  if (stage === 5) {
    const template = pickSimpleTemplate(curriculum, session.level, session.settings.topics);
    if (template) {
      return { text: template, nextStage: 5 };
    }
    return {
      text: buildLine("谢谢分享！我们继续练习。", "xie4 xie4 fen1 xiang3! wo3 men2 ji4 xu4 lian4 xi2.", "Thanks for sharing! Let’s keep practicing."),
      nextStage: 5
    };
  }

  return null;
}
