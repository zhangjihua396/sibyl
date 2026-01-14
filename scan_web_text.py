#!/usr/bin/env python3
"""扫描 apps/web 目录中的英文文本。"""

import os
import re

def scan_web_directory(path):
    results = {}
    for root, dirs, files in os.walk(path):
        rel_root = os.path.relpath(root, path)
        if any(skip in rel_root.lower() for skip in ['test', 'node_modules', '.git', '.storybook']):
            continue
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, f)
                rel_path = os.path.relpath(filepath, path)
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        content = file.read()
                        matches = re.findall(r'(detail|message|error|title|placeholder|description|label|alert|success|warning|info)=\"([^\"]+)\"', content)
                        english_matches = [m[1] for m in matches if m[1].isascii() and '{' not in m[1]]
                        if english_matches:
                            results[rel_path] = english_matches
                except:
                    pass
    return results

if __name__ == '__main__':
    web_results = scan_web_directory('apps/web')
    total = sum(len(v) for v in web_results.values())
    print(f'发现 {total} 条消息在 {len(web_results)} 个文件中\n')
    for f, msgs in sorted(web_results.items())[:30]:
        print(f'{f}: {len(msgs)} 条')
        for m in msgs[:5]:
            print(f'  - {m}')
        if len(msgs) > 5:
            print(f'  ... 还有 {len(msgs)-5} 条')
        print()
    print(f'\n总计: {total} 条消息')
