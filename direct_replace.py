#!/usr/bin/env python3
"""直接替换英文文本为中文，不使用国际化框架。"""

import os
import re

def load_translations():
    """从zh_CN.py加载翻译字典。"""
    translations = {}
    with open('i18n/zh_CN.py', 'r', encoding='utf-8') as f:
        content = f.read()
        # 提取TRANSLATIONS字典内容
        match = re.search(r'TRANSLATIONS:\s*dict\[str,\s*str\]\s*=\s*{([^}]+)}', content, re.DOTALL)
        if match:
            dict_content = match.group(1)
            # 匹配键值对
            pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', dict_content)
            for english, chinese in pairs:
                translations[english] = chinese
    return translations

def fix_syntax_errors(filepath):
    """修复替换导致的语法错误。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复缺少引号的字符串
    content = re.sub(r'(detail|message|error|title)=(\w[\w\s]+)', r'\1="\2"', content)
    
    # 修复t()调用留下的语法错误
    content = re.sub(r't\(([^)]+)\)', r'"\1"', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_in_file(filepath, translations):
    """替换文件中的英文文本为中文。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 移除任何现有的i18n导入
    content = re.sub(r'from sibyl.i18n import t\n', '', content)
    content = re.sub(r'from sibyl import i18n\n', '', content)
    
    # 替换t("text")为直接的中文文本
    def replace_t_call(match):
        english = match.group(1)
        return f'"{translations.get(english, english)}"'
    
    content = re.sub(r't\("([^"]+)"\)', replace_t_call, content)
    
    # 直接替换英文字符串为中文
    for english, chinese in translations.items():
        # 匹配字符串格式："english"
        pattern = f'"{re.escape(english)}"'
        replacement = f'"{chinese}"'
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        # 修复可能的语法错误
        fix_syntax_errors(filepath)

def main():
    """主函数。"""
    translations = load_translations()
    print(f"加载了 {len(translations)} 条翻译")
    
    # 只处理apps目录下的Python文件
    for root, dirs, files in os.walk('apps'):
        # 跳过测试目录和i18n目录
        if 'test' in root.lower() or 'i18n' in root.lower():
            continue
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                filepath = os.path.join(root, file)
                try:
                    print(f"处理文件: {filepath}")
                    replace_in_file(filepath, translations)
                except Exception as e:
                    print(f"错误处理 {filepath}: {e}")
    
    print("替换完成！")

if __name__ == '__main__':
    main()
