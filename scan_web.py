#!/usr/bin/env python3
"""扫描 apps/web 目录需要翻译的文件。"""

import os
import re
import json

def scan_directory(path):
    results = {}
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith(('.pyc', '.md', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.txt')):
                continue
            if f.endswith('.py') and f != '__init__.py':
                filepath = os.path.join(root, f)
                rel_path = os.path.relpath(filepath, path)
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        content = file.read()
                        matches = re.findall(r'(detail|message|error|Error|title)="([^"]+)"', content)
                        english_matches = [m[1] for m in matches if m[1].isascii() and '{' not in m[1] and 't(' not in m[1]]
                        if english_matches:
                            results[rel_path] = english_matches
                except:
                    pass
    return results

print("=== 扫描 apps/web 目录 ===")
web_results = scan_directory('apps/web')
print(f"发现 {sum(len(v) for v in web_results.values())} 条消息在 {len(web_results)} 个文件中\n")
for f, msgs in sorted(web_results.items()):
    print(f"{f}: {len(msgs)} 条")
    for m in msgs[:3]:
        print(f"  - {m}")
    if len(msgs) > 3:
        print(f"  ... 还有 {len(msgs)-3} 条")
    print()

# 保存到JSON
with open('web_scan_results.json', 'w', encoding='utf-8') as f:
    json.dump(web_results, f, ensure_ascii=False, indent=2)
print("结果已保存到 web_scan_results.json")
