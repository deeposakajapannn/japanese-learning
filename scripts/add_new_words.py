#!/usr/bin/env python3
"""将 new_words.txt 中的词汇追加到 nouns.json，跳过已存在的词。"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOUNS = ROOT / "public" / "data" / "nouns.json"
WORDS_FILE = ROOT / "scripts" / "new_words.txt"


def main():
    data = json.loads(NOUNS.read_text("utf-8"))
    existing = {item["word"] for item in data}
    max_id = max(item["id"] for item in data)

    added = 0
    skipped = 0

    for line in WORDS_FILE.read_text("utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("|")
        if len(parts) != 5:
            print(f"  跳过格式错误: {line}")
            continue

        word, reading, meaning, meaning_en, topic = parts

        if word in existing:
            skipped += 1
            continue

        max_id += 1
        item = {
            "id": max_id,
            "word": word,
            "reading": reading,
            "meaning": meaning,
            "meaningEn": meaning_en,
            "topic": topic,
        }
        data.append(item)
        existing.add(word)
        added += 1

    NOUNS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Done: +{added} 新词, {skipped} 已存在跳过, 总计 {len(data)} 词")


if __name__ == "__main__":
    main()
