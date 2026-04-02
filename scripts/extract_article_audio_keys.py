#!/usr/bin/env python3
"""从 public/data/articles.json 导出日文行，供 Edge TTS 批量录音。

  python scripts/extract_article_audio_keys.py
  python scripts/regenerate_audio_edge_tts.py --keys-file scripts/audio_keys_articles.txt

写入: scripts/audio_keys_articles.txt（每行一条 jp，与 audio_map 键一致）
"""
from __future__ import annotations

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main() -> None:
    path = os.path.join(ROOT, "public", "data", "articles.json")
    out_path = os.path.join(ROOT, "scripts", "audio_keys_articles.txt")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    lines: list[str] = []
    for it in data.get("items", []):
        if it.get("format") == "essay":
            for seg in it.get("segments", []):
                lines.append(seg["jp"])
        elif it.get("format") == "dialogue":
            for sec in it.get("sections", []):
                for line in sec.get("lines", []):
                    lines.append(line["jp"])
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + ("\n" if lines else ""))
    print(f"wrote {len(lines)} lines -> {out_path}")


if __name__ == "__main__":
    main()
