#!/usr/bin/env python3
import os, re
from pathlib import Path
from collections import Counter

SRC_DIR = Path(__file__).parent.parent / "src"
CHINESE_RE = re.compile(r'[\u4e00-\u9fff][\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]*[\u4e00-\u9fff]|[\u4e00-\u9fff]')

counter = Counter()
for root, dirs, files in os.walk(SRC_DIR):
    for file in files:
        if not file.endswith(('.vue', '.ts', '.tsx', '.js')):
            continue
        filepath = Path(root) / file
        try:
            content = filepath.read_text(encoding='utf-8')
        except:
            continue
        for m in CHINESE_RE.findall(content):
            counter[m.strip()] += 1

for s, c in counter.most_common(300):
    print(f"{c:5d} | {repr(s)}")
print(f"\nTotal unique: {len(counter)}")
