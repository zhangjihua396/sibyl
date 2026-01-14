#!/usr/bin/env python3
"""全面扫描 apps/web 目录中的英文文本。"""

import os
import re

def scan_web_directory(path):
    results = {}
    for root, dirs, files in os.walk(path):
        rel_root = os.path.relpath(root, path)
        if any(skip in rel_root.lower() for skip in ['test', 'node_modules', '.git', '.storybook', '.next']):
            continue
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, f)
                rel_path = os.path.relpath(filepath, path)
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        content = file.read()
                        # 查找所有英文文本字符串，不局限于特定属性
                        matches = re.findall(r'"([^"]+)"', content)
                        # 只保留英文文本，不包含中文和模板字符串
                        english_matches = [m for m in matches if m.isascii() and '{' not in m and len(m) > 1]
                        if english_matches:
                            # 去重
                            unique_matches = list(set(english_matches))
                            results[rel_path] = unique_matches
                except Exception as e:
                    print(f"错误读取 {filepath}: {e}")
    return results

if __name__ == '__main__':
    web_results = scan_web_directory('apps/web')
    total = sum(len(v) for v in web_results.values())
    print(f'发现 {total} 条英文文本在 {len(web_results)} 个文件中\n')
    
    # 保存结果到文件
    with open('web_all_english.txt', 'w', encoding='utf-8') as f:
        for fpath, msgs in sorted(web_results.items()):
            f.write(f"=== {fpath} ===\n")
            for msg in sorted(msgs):
                f.write(f"{msg}\n")
            f.write("\n")
    
    # 显示前20个文件的结果
    for fpath, msgs in list(sorted(web_results.items()))[:20]:
        print(f"=== {fpath} ===")
        for msg in sorted(msgs)[:10]:
            print(f"  {msg}")
        if len(msgs) > 10:
            print(f"  ... 还有 {len(msgs)-10} 条")
        print()
    
    print(f'\n总计: {total} 条英文文本')
    print(f'结果已保存到 web_all_english.txt')
