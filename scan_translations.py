#!/usr/bin/env python3
"""扫描项目中的所有需要翻译的英文文本。"""

import os
import re

def scan_file(filepath, patterns):
    """扫描文件中的英文文本。"""
    results = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pattern_name, regex in patterns.items():
        matches = re.findall(regex, content)
        english_matches = [m for m in matches if m.isascii() and '{' not in m and 't(' not in m]
        if english_matches:
            results[pattern_name] = english_matches
    return results

def main():
    all_results = {}
    
    # 扫描 apps/api 目录
    api_path = 'apps/api/src/sibyl'
    patterns = {
        'detail': r'detail="([^"]+)"',
        'message': r'message="([^"]+)"',
        'error': r'error="([^"]+)"',
        'Error': r'Error="([^"]+)"',
        'title': r'title="([^"]+)"',
    }
    
    for root, dirs, files in os.walk(api_path):
        for f in files:
            if f.endswith('.py') and f != '__init__.py':
                filepath = os.path.join(root, f)
                rel_path = os.path.relpath(filepath, api_path)
                file_results = scan_file(filepath, patterns)
                if file_results:
                    all_results[f'api/{rel_path}'] = file_results
    
    print('=' * 60)
    print('Sibyl 项目翻译扫描结果')
    print('=' * 60)
    
    total_messages = 0
    for category, files in sorted(all_results.items()):
        file_total = sum(len(matches) for matches in files.values())
        total_messages += file_total
    
    print(f'\n总计发现: {total_messages} 条需要翻译的英文消息')
    
    # 写入详细计划
    with open('TRANSLATION_PLAN.md', 'w', encoding='utf-8') as f:
        f.write('# Sibyl 项目翻译计划\n\n')
        f.write('> 最后更新: 2026-01-14\n\n')
        f.write('## 目录\n\n')
        f.write('1. [概览](#概览)\n')
        f.write('2. [翻译流程](#翻译流程)\n')
        f.write('3. [文件清单](#文件清单)\n')
        f.write('4. [翻译条目](#翻译条目)\n\n')
        
        f.write('## 概览\n\n')
        f.write(f'- **总消息数**: {total_messages} 条\n')
        f.write('- **翻译文件位置**: `apps/api/src/sibyl/i18n/zh_CN.py`\n')
        f.write('- **翻译函数**: `t(text)` - 需要创建\n\n')
        
        f.write('## 翻译流程\n\n')
        f.write('### 步骤 1: 创建 i18n 基础设施\n\n')
        f.write('1. 创建 `apps/api/src/sibyl/i18n/__init__.py`\n')
        f.write('2. 创建 `apps/api/src/sibyl/i18n/zh_CN.py`\n')
        f.write('3. 在 `apps/api/src/sibyl/api/app.py` 添加全局异常处理器\n\n')
        
        f.write('### 步骤 2: 添加翻译函数调用\n\n')
        f.write('在每个需要翻译的位置，将:\n')
        f.write('```python\ndetail="Error message"\n```\n')
        f.write('改为:\n')
        f.write('```python\nfrom sibyl.i18n import t\ndetail=t("Error message")\n```\n\n')
        
        f.write('### 步骤 3: 验证翻译\n\n')
        f.write('- 运行 API 服务\n')
        f.write('- 测试各个端点的错误消息是否显示中文\n\n')
        
        f.write('## 文件清单\n\n')
        f.write('| 序号 | 文件 | 消息数 |\n')
        f.write('|------|------|--------|\n')
        
        sorted_items = sorted(all_results.items(), key=lambda x: sum(len(m) for m in x[1].values()), reverse=True)
        for i, (category, files) in enumerate(sorted_items, 1):
            file_total = sum(len(matches) for matches in files.values())
            f.write(f'| {i} | `{category}` | {file_total} |\n')
        
        f.write(f'| **合计** | | **{total_messages}** |\n\n')
        
        f.write('## 翻译条目\n\n')
        for category, files in sorted(all_results.items()):
            file_total = sum(len(matches) for matches in files.values())
            f.write(f'### {category} ({file_total} 条)\n\n')
            
            for pattern_name, matches in files.items():
                f.write(f'#### {pattern_name} ({len(matches)} 条)\n\n')
                unique_matches = list(dict.fromkeys(matches))  # 去重保持顺序
                for msg in unique_matches:
                    f.write(f'- `{msg}`\n')
                f.write('\n')
    
    print(f'\n计划已保存到: TRANSLATION_PLAN.md')
    print(f'总计: {total_messages} 条消息')

if __name__ == '__main__':
    main()
