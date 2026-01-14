#!/usr/bin/env python3
"""精确替换引号内的英文文本为中文。"""

import os
import re

def load_translations():
    """从zh_CN.py加载翻译字典。"""
    translations = {}
    with open('i18n/zh_CN.py', 'r', encoding='utf-8') as f:
        content = f.read()
        match = re.search(r'TRANSLATIONS:\s*dict\[str,\s*str\]\s*=\s*{([^}]+)}', content, re.DOTALL)
        if match:
            dict_content = match.group(1)
            pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', dict_content)
            for english, chinese in pairs:
                translations[english] = chinese
    return translations

def replace_in_file(filepath, translations):
    """只替换引号内的英文字符串为中文。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 移除i18n导入
    content = re.sub(r'from sibyl.i18n import t\n', '', content)
    content = re.sub(r'from sibyl import i18n\n', '', content)
    
    # 替换t("text")为直接中文
    def replace_t_call(match):
        english = match.group(1)
        return f'"{translations.get(english, english)}"'
    
    content = re.sub(r't\("([^"]+)"\)', replace_t_call, content)
    
    # 替换引号内的英文字符串
    def replace_english_string(match):
        full_str = match.group(0)
        english = match.group(1)
        if english.isascii() and english in translations:
            return f'"{translations[english]}"'
        return full_str
    
    # 只匹配完整的字符串，不破坏语法结构
    content = re.sub(r'"([^"]+)"', replace_english_string, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    """主函数。"""
    translations = load_translations()
    print(f"加载了 {len(translations)} 条翻译")
    
    # 恢复文件到原始状态
    os.system('git checkout apps/')
    
    # 只处理Python文件
    for root, dirs, files in os.walk('apps'):
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
