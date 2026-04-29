#!/usr/bin/env python3
"""Extract unique Chinese strings from source files."""
import os
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / "src"

# Pattern to match Chinese text sequences
CHINESE_RE = re.compile(r'[\u4e00-\u9fff][\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]*[\u4e00-\u9fff]|[\u4e00-\u9fff]')

unique_strings = set()
file_matches = {}

for root, dirs, files in os.walk(SRC_DIR):
    for file in files:
        if not file.endswith(('.vue', '.ts', '.tsx', '.js')):
            continue
        filepath = Path(root) / file
        try:
            content = filepath.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            continue

        matches = CHINESE_RE.findall(content)
        if matches:
            file_matches[str(filepath)] = matches
            for m in matches:
                unique_strings.add(m.strip())

# Sort by length descending so longer phrases come first
sorted_unique = sorted(unique_strings, key=len, reverse=True)

print(f"\n{'='*60}")
print(f"Total files with Chinese: {len(file_matches)}")
print(f"Total unique Chinese strings: {len(sorted_unique)}")
print(f"{'='*60}\n")

print("\n--- UNIQUE STRINGS (sorted by length desc) ---\n")
for s in sorted_unique:
    print(repr(s))
