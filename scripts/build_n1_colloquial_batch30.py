#!/usr/bin/env python3
"""生成独立 JSON：N1 口语 30 条（不并入 sentences.json）。需项目 .venv（pykakasi）。"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from pykakasi import kakasi

ROOT = Path(__file__).resolve().parents[1]
WORDS_FILE = ROOT / "scripts" / "n1_colloquial_30_words.txt"
OUT_FILE = ROOT / "public" / "data" / "sentences_n1_colloquial_batch30.json"

META: list[tuple[str, str, str]] = [
    ("不是不明白，但没法接受。", "It's not that I don't get it—I just can't agree.", "思考议论"),
    ("虽说只能做，真心话是不想动。", "I know I have to do it, but honestly I don't want to.", "情绪心理"),
    ("本以为不行，结果还挺顺利。", "I thought it was impossible, but it actually went well.", "日常场景"),
    ("不能说完全没问题，但我觉得在可接受范围内。", "I can't say there's zero issue, but I think it's within tolerance.", "思考议论"),
    ("也不是不能去，只是没有非去不可的理由。", "I could go if I had to, but I don't have a strong reason to.", "日常场景"),
    ("虽说没抱期待，也没想到会到这一步。", "I wasn't expecting much, but I didn't think it would go this far.", "情绪心理"),
    ("不是不能理解，但能不能共鸣是另一回事。", "I can understand it, but whether I can sympathize is another matter.", "思考议论"),
    ("话是那么说没错，但光这样解释不够。", "That may be true as far as it goes, but that alone doesn't explain enough.", "思考议论"),
    ("倒也不是绝对不行，只是不现实。", "It's not absolutely impossible, but it's not realistic.", "思考议论"),
    ("结果虽好，过程有问题。", "The outcome was good, but there were problems along the way.", "工作职场"),
    ("明知该做，却迟迟迈不出步。", "I know I should, but I can hardly take the first step.", "情绪心理"),
    ("不想承认，也只能当事实接受。", "I hate to admit it, but I have no choice but to accept the facts.", "情绪心理"),
    ("不能一概否定，但也没法全盘赞成。", "I can't reject it outright, but I can't fully endorse it either.", "思考议论"),
    ("事到如今后悔也改变不了什么。", "Regretting it now won't change anything.", "情绪心理"),
    ("不是毫无可能，但我觉得概率很低。", "It's not impossible, but I think the odds are pretty low.", "思考议论"),
    ("除非给出能让我信服的说法，否则我不会接受。", "Unless there's a convincing explanation, I won't accept it.", "人际关系"),
    ("虽说没有成功的把握，值得一试。", "There's no guarantee it'll work, but it's worth trying.", "思考议论"),
    ("我觉得这不是能轻易一刀切的事。", "I don't think this is something you can neatly settle that easily.", "思考议论"),
    ("表面看起来没问题，实际并非如此。", "It looks fine on the surface, but that's not really the case.", "思考议论"),
    ("我不觉得维持现状就好，但立刻改也很难。", "I don't think staying as we are is fine, but changing right away is hard too.", "工作职场"),
    ("你想说的我懂，是不是有点极端？", "I think I get what you're saying—isn't it a bit extreme?", "人际关系"),
    ("我不强迫你，不过试一次也无妨吧？", "I'm not forcing you, but why not give it a try once?", "人际关系"),
    ("我不认为全错，但有改进空间。", "I don't think everything is wrong, but there's room to improve.", "工作职场"),
    ("花时间也许能解决，但现在没那个余力。", "We might fix it with time, but I don't have the bandwidth now.", "工作职场"),
    ("也觉得该停手，可又没法轻易死心。", "Part of me says I should quit, but I can't let go that easily.", "情绪心理"),
    ("谈不上特别不满，也称不上满意。", "I'm not particularly unhappy, but I'm not satisfied either.", "情绪心理"),
    ("条件齐备的话可行，以现状来说很难。", "It's possible if conditions are met, but it's hard as things stand.", "思考议论"),
    ("不用说也知道，我觉得那是理所当然的结果。", "It goes without saying—I think that outcome was only natural.", "思考议论"),
    ("心情不是不懂，但该现实一点。", "I can see how you feel, but you need to be realistic.", "人际关系"),
    ("理想说起来没完没了，现在只能优先现实。", "We could talk ideals forever—for now reality has to come first.", "思考议论"),
]


def build_converter() -> "kakasi":
    k = kakasi()
    k.setMode("J", "H")
    k.setMode("K", "H")
    k.setMode("H", "H")
    return k.getConverter()


def main() -> None:
    if len(META) != 30:
        print("META length must be 30", file=sys.stderr)
        sys.exit(1)
    text = WORDS_FILE.read_text(encoding="utf-8")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) != 30:
        print(f"words file: expected 30 lines, got {len(lines)}", file=sys.stderr)
        sys.exit(1)
    conv = build_converter()
    out: list[dict] = []
    for i, (word, (m, e, t)) in enumerate(zip(lines, META, strict=True), start=1):
        if word.endswith(("。", "？", "！", "…")):
            w = word
        else:
            w = word + "。"
        reading = conv.do(w)
        out.append(
            {
                "id": i,
                "word": w,
                "reading": reading,
                "meaning": m,
                "level": "N1",
                "meaningEn": e,
                "topic": t,
            }
        )
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} entries to {OUT_FILE}")


if __name__ == "__main__":
    main()
