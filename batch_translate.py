#!/usr/bin/env python3
"""批量翻译 Python 文件中的英文消息。"""

import os
import re

def translate_file(filepath: str) -> int:
    """翻译文件中的英文消息。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    # 检查是否已导入 t()
    if 'from sibyl.i18n import t' not in content:
        # 在最后一个导入后添加导入语句
        import_pattern = r'(^from .+ import .+\n)+'
        match = re.search(import_pattern, content, re.MULTILINE)
        if match:
            content = content[:match.end()] + 'from sibyl.i18n import t\n' + content[match.end():]
    
    # 只翻译纯英文消息，不包含变量
    def translate_match(m):
        msg = m.group(2)
        # 跳过包含变量的消息
        if '{' in msg or 't(' in msg or not msg.isascii():
            return m.group(0)
        # 跳过包含变量的模式
        attr = m.group(1)
        if f'{attr}="f"' in m.group(0):
            return m.group(0)
        changes += 1
        return f'{attr}=t("{msg}")'
    
    # 使用更精确的正则表达式
    pattern = r'(detail|message|error|title)="([^"]+)"'
    
    def safe_translate(match):
        nonlocal changes
        attr = match.group(1)
        msg = match.group(2)
        # 跳过包含 { 的消息 (有变量替换)
        if '{' in msg or not msg.isascii():
            return match.group(0)
        # 跳过 f-string
        if match.group(0).startswith(attr + '="f"'):
            return match.group(0)
        changes += 1
        return f'{attr}=t("{msg}")'
    
    content = re.sub(pattern, safe_translate, content)
    
    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return changes

def main():
    base_path = 'apps/api/src/sibyl'
    total_files = 0
    total_messages = 0
    
    for root, dirs, files in os.walk(base_path):
        for f in files:
            if f.endswith('.py') and f != '__init__.py':
                filepath = os.path.join(root, f)
                rel_path = os.path.relpath(filepath, base_path)
                
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # 检查是否有需要翻译的消息
                matches = re.findall(r'(detail|message|error|title)="([^"]+)"', content)
                english_matches = [m for m in matches if m[1].isascii() and '{' not in m[1]]
                
                if english_matches:
                    count = translate_file(filepath)
                    if count > 0:
                        print(f"翻译: {rel_path} ({count} 条)")
                        total_files += 1
                        total_messages += count
    
    print(f"\n共翻译 {total_messages} 条消息到 {total_files} 个文件")

if __name__ == '__main__':
    main()
