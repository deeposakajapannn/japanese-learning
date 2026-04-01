#!/usr/bin/env python3
"""根据 JLPT 词汇表为 nouns.json 标注级别。

用法：python scripts/label_noun_levels.py
数据源：/tmp/jlpt_n{1-5}.csv（从 open-anki-jlpt-decks 下载）
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOUNS = ROOT / "public" / "data" / "nouns.json"

LEVELS = ["N5", "N4", "N3", "N2", "N1"]


def load_jlpt_dict() -> dict[str, str]:
    """读取 JLPT CSV，构建 word/reading -> level 映射。
    优先低级别（N5 先加载，如果 N3 里也有就不覆盖）。"""
    mapping: dict[str, str] = {}

    for level in LEVELS:
        path = Path(f"/tmp/jlpt_{level.lower()}.csv")
        if not path.exists():
            print(f"  警告: {path} 不存在，跳过")
            continue

        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                expr = row.get("expression", "").strip()
                reading = row.get("reading", "").strip()
                # 用 expression 和 reading 都作为 key
                for key in [expr, reading]:
                    if key and key not in mapping:
                        mapping[key] = level

    return mapping


def main():
    jlpt = load_jlpt_dict()
    print(f"JLPT 词汇表: {len(jlpt)} 条目")

    data = json.loads(NOUNS.read_text("utf-8"))
    labeled = 0
    unlabeled = []

    for item in data:
        word = item["word"]
        reading = item["reading"]

        # 尝试匹配: word -> reading -> 去掉する的动词形式
        level = jlpt.get(word) or jlpt.get(reading)

        # 对于サ变动词，尝试去掉する
        if not level and word.endswith("する"):
            level = jlpt.get(word[:-2]) or jlpt.get(reading[:-2] if reading.endswith("する") else reading)

        if level:
            item["level"] = level
            labeled += 1
        else:
            unlabeled.append(f"{word} ({reading})")

    NOUNS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")

    print(f"标注完成: {labeled}/{len(data)}")
    print(f"未匹配: {len(unlabeled)}")

    # 按级别统计
    levels = {}
    for item in data:
        l = item.get("level", "未标注")
        levels[l] = levels.get(l, 0) + 1
    for l in LEVELS + ["未标注"]:
        if l in levels:
            print(f"  {l}: {levels[l]}")

    if unlabeled:
        print(f"\n未匹配的词（前30个）:")
        for w in unlabeled[:30]:
            print(f"  {w}")


if __name__ == "__main__":
    main()
