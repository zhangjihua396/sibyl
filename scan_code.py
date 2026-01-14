#!/usr/bin/env python3
"""扫描需要翻译的文件，排除测试、文档、配置文件。"""

import os
import re
import json

def scan_directory(path):
    results = {}
    for root, dirs, files in os.walk(path):
        rel_root = os.path.relpath(root, path)
        if any(skip in rel_root.lower() for skip in ['test', 'doc', 'i18n', '.git', 'node_modules']):
            continue
        for f in files:
            if f.endswith(('.pyc', '.md', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.txt', '.html', '.css', '.js', '.jsx', '.ts', '.tsx')):
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

apps_results = scan_directory('apps')
packages_results = scan_directory('packages')

print("=== 扫描结果 ===")
print(f"\napps 目录: {sum(len(v) for v in apps_results.values())} 条消息在 {len(apps_results)} 个文件中")
for f, msgs in sorted(apps_results.items()):
    print(f"  {f}: {len(msgs)} 条")

print(f"\npackages 目录: {sum(len(v) for v in packages_results.values())} 条消息在 {len(packages_results)} 个文件中")
for f, msgs in sorted(packages_results.items()):
    print(f"  {f}: {len(msgs)} 条")

# 保存到JSON文件
output = {"apps": apps_results, "packages": packages_results}
with open('scan_results.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f"\n结果已保存到 scan_results.json")
