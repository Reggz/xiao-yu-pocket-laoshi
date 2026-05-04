import fs from "fs";
import path from "path";
import { Curriculum, CurriculumUnit, GrammarItem, GrammarTier, ReplyPair } from "./types";

const UNIT_TITLE = /^(?:##\s+)?Unit\s+\d+:\s+(.+)\s+\(Topic:\s+(.+)\)$/;
const LEVEL_LINE = /^Level:\s+(.+?)(?:\s+Vocab:)?$/;
const ITEM_LINE = /^-?\s*(.+)\s+\|\s+(.+)\s+\|\s+(.+)$/;
const GRAMMAR_LINE = /^-?\s*(.+)\s+\|\s+(.+)\s+\|\s+(.+)\s+\|\s+(critical|core|advanced)$/;
const REPLY_PAIR_LINE = /^-?\s*(.+?)\s*=>\s*(.+?)(?:\s*\|\s*(.+))?$/;

function parseItems(lines: string[]): { items: CurriculumUnit["vocab"]; restIndex: number } {
  const items: CurriculumUnit["vocab"] = [];
  let i = 0;
  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "" || line.endsWith(":") || line.startsWith("##") || line.startsWith("Unit ")) {
      break;
    }
    const match = ITEM_LINE.exec(line);
    if (match) {
      items.push({ hanzi: match[1].trim(), pinyin: match[2].trim(), english: match[3].trim() });
    }
  }
  return { items, restIndex: i };
}

function parseGrammar(lines: string[]): { items: GrammarItem[]; restIndex: number } {
  const items: GrammarItem[] = [];
  let i = 0;
  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "" || line.endsWith(":") || line.startsWith("##") || line.startsWith("Unit ")) {
      break;
    }
    const match = GRAMMAR_LINE.exec(line);
    if (match) {
      items.push({
        hanzi: match[1].trim(),
        pinyin: match[2].trim(),
        english: match[3].trim(),
        tier: match[4].trim() as GrammarTier
      });
    }
  }
  return { items, restIndex: i };
}

function parseReplyPairs(lines: string[]): { items: ReplyPair[]; restIndex: number } {
  const items: ReplyPair[] = [];
  let i = 0;
  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "" || line.endsWith(":") || line.startsWith("##") || line.startsWith("Unit ")) {
      break;
    }
    const match = REPLY_PAIR_LINE.exec(line);
    if (match) {
      const promptHanzi = match[1].trim();
      const replyHanzi = match[2].trim();
      const rationale = match[3]?.trim();
      if (promptHanzi && replyHanzi) {
        items.push({ promptHanzi, replyHanzi, rationale });
      }
    }
  }
  return { items, restIndex: i };
}

export function loadCurriculumFromFile(filePath: string): Curriculum {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, "utf8");
  const lines = raw.split(/\r?\n/);

  const units: CurriculumUnit[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const unitMatch = UNIT_TITLE.exec(line);
    if (unitMatch) {
      const title = unitMatch[1].trim();
      const topic = unitMatch[2].trim();
      i += 1;

      let level = "";
      const nextLine = lines[i]?.trim();
      const levelMatch = nextLine ? LEVEL_LINE.exec(nextLine) : null;
      if (levelMatch) {
        level = levelMatch[1].trim();
        i += 1;
      }

      const unit: CurriculumUnit = {
        title,
        topic,
        level,
        vocab: [],
        phrases: [],
        templates: [],
        grammar: [],
        replyPairs: []
      };

      while (i < lines.length && !lines[i].trim().startsWith("## Unit") && !lines[i].trim().startsWith("Unit ")) {
        const section = lines[i].trim();
        if (section === "Vocab:") {
          const parsed = parseItems(lines.slice(i + 1));
          unit.vocab = parsed.items;
          i += parsed.restIndex + 1;
          continue;
        }
        if (section === "Phrases:") {
          const parsed = parseItems(lines.slice(i + 1));
          unit.phrases = parsed.items;
          i += parsed.restIndex + 1;
          continue;
        }
        if (section === "Templates:") {
          const parsed = parseItems(lines.slice(i + 1));
          unit.templates = parsed.items;
          i += parsed.restIndex + 1;
          continue;
        }
        if (section === "Grammar:") {
          const parsed = parseGrammar(lines.slice(i + 1));
          unit.grammar = parsed.items;
          i += parsed.restIndex + 1;
          continue;
        }
        if (section === "ReplyPairs:") {
          const parsed = parseReplyPairs(lines.slice(i + 1));
          unit.replyPairs = parsed.items;
          i += parsed.restIndex + 1;
          continue;
        }
        i += 1;
      }

      units.push(unit);
      continue;
    }
    i += 1;
  }

  return { units };
}
