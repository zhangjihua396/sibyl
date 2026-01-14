import os
import re

# 读取web_all_english.txt文件
def read_all_strings():
    file_path = os.path.join(os.getcwd(), 'web_all_english.txt')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return content

# 解析字符串，分类为文件和字符串
def parse_strings(content):
    lines = content.split('\n')
    current_file = None
    all_strings = []
    file_strings = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 检查是否是文件名行
        if line.startswith('===') and line.endswith('==='):
            current_file = line[3:-3].strip()
            if current_file not in file_strings:
                file_strings[current_file] = []
        elif current_file:
            # 跳过行号前缀（如果有）
            if '→' in line:
                line = line.split('→', 1)[1].strip()
            # 添加字符串到当前文件
            if line:
                file_strings[current_file].append(line)
                all_strings.append(line)
    
    return all_strings, file_strings

# 判断是否是UI文本
def is_ui_text(s):
    # 跳过空字符串
    if not s:
        return False
    
    # 跳过技术字符串
    tech_patterns = [
        r'^\d+$',  # 纯数字
        r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',  # UUID
        r'^https?://',  # URL
        r'^/[^\s]+$',  # 路径
        r'^[A-Za-z0-9_\.-]+\.(js|ts|tsx|jsx|css|scss|json|md|html)$',  # 文件名
        r'^[a-z0-9-]+$',  # CSS类名或短标识符
        r'^[A-Z_]+$',  # 常量
        r'^[0-9]+px$',  # 像素值
        r'^[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+$',  # 四个数字（可能是颜色或尺寸）
        r'^flex|grid|block|inline|hidden|absolute|relative|fixed$',  # CSS布局属性
        r'^bg-|text-|border-|rounded-|p-|m-|w-|h-|flex-|grid-',  # Tailwind CSS类
        r'^[a-z]+$',  # 单字（可能是技术术语）
        r'^[A-Z][a-z]*$',  # 单个大写开头的单词（可能是组件名）
        r'^#?[0-9a-fA-F]{3,6}$',  # 颜色代码
        r'^_blank|_self|_parent|_top$',  # HTML target属性值
        r'^noopener|noreferrer$',  # HTML rel属性值
        r'^submit|button|reset$',  # HTML按钮类型
        r'^GET|POST|PUT|DELETE$',  # HTTP方法
        r'^font-',  # 字体类
        r'^animate-',  # 动画类
        r'^overflow-',  # 溢出类
        r'^transition-',  # 过渡类
        r'^shadow-',  # 阴影类
        r'^cursor-',  # 光标类
        r'^z-\d+$',  # z-index类
        r'^col-span-\d+$',  # 网格列跨度
        r'^row-span-\d+$',  # 网格行跨度
        r'^sm:|md:|lg:|xl:|2xl:',  # 响应式前缀
        r'^hover:|focus:|active:|disabled:',  # 状态前缀
    ]
    
    for pattern in tech_patterns:
        if re.match(pattern, s):
            return False
    
    # 保留较长的字符串和明显的UI文本
    ui_patterns = [
        r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$',  # 多个大写开头的单词（可能是标题）
        r'^[a-z]+(\s+[a-z]+)+$',  # 多个小写单词（可能是句子或短语）
        r'.+\.$',  # 以句号结尾（可能是句子）
        r'.+\?',  # 以问号结尾（可能是问题）
        r'^Loading\.\.\.$',  # 加载提示
        r'^Error\s+.+$',  # 错误提示
        r'^Success\s+.+$',  # 成功提示
        r'^Please\s+.+$',  # 请求操作
        r'^Add\s+.+$',  # 添加操作
        r'^Edit\s+.+$',  # 编辑操作
        r'^Delete\s+.+$',  # 删除操作
        r'^Save\s+.+$',  # 保存操作
        r'^Cancel\s+.+$',  # 取消操作
        r'^Confirm\s+.+$',  # 确认操作
        r'^View\s+.+$',  # 查看操作
        r'^Create\s+.+$',  # 创建操作
        r'^Update\s+.+$',  # 更新操作
        r'^Remove\s+.+$',  # 移除操作
        r'^Connect\s+.+$',  # 连接操作
        r'^Disconnect\s+.+$',  # 断开连接操作
        r'^Revoke\s+.+$',  # 撤销操作
        r'^Generate\s+.+$',  # 生成操作
        r'^Copy\s+.+$',  # 复制操作
        r'^Download\s+.+$',  # 下载操作
        r'^Upload\s+.+$',  # 上传操作
        r'^Import\s+.+$',  # 导入操作
        r'^Export\s+.+$',  # 导出操作
        r'^Search\s+.+$',  # 搜索操作
        r'^Filter\s+.+$',  # 过滤操作
        r'^Sort\s+.+$',  # 排序操作
        r'^Refresh\s+.+$',  # 刷新操作
        r'^Clear\s+.+$',  # 清除操作
        r'^Reset\s+.+$',  # 重置操作
        r'^Toggle\s+.+$',  # 切换操作
        r'^Expand\s+.+$',  # 展开操作
        r'^Collapse\s+.+$',  # 折叠操作
        r'^Show\s+.+$',  # 显示操作
        r'^Hide\s+.+$',  # 隐藏操作
        r'^Enable\s+.+$',  # 启用操作
        r'^Disable\s+.+$',  # 禁用操作
        r'^Activate\s+.+$',  # 激活操作
        r'^Deactivate\s+.+$',  # 停用操作
        r'^Complete\s+.+$',  # 完成操作
        r'^Pending\s+.+$',  # 待处理操作
        r'^In\s+Progress\s+.+$',  # 进行中操作
        r'^Failed\s+.+$',  # 失败操作
        r'^Successfully\s+.+$',  # 成功完成
        r'^Failed\s+to\s+.+$',  # 失败提示
        r'^Are\s+you\s+sure\s+.+$',  # 确认提示
        r'^You\s+are\s+about\s+to\s+.+$',  # 警告提示
        r'^This\s+will\s+.+$',  # 后果说明
        r'^No\s+.+$\s+yet$',  # 空状态提示
        r'^Try\s+adjusting\s+.+$',  # 建议提示
        r'^Please\s+enter\s+.+$',  # 输入提示
        r'^Please\s+select\s+.+$',  # 选择提示
        r'^Please\s+wait\s+.+$',  # 等待提示
        r'^Loading\s+.+$',  # 加载提示
        r'^Processing\s+.+$',  # 处理提示
        r'^Saving\s+.+$',  # 保存提示
        r'^Deleting\s+.+$',  # 删除提示
        r'^Updating\s+.+$',  # 更新提示
        r'^Creating\s+.+$',  # 创建提示
        r'^Connecting\s+.+$',  # 连接提示
        r'^Disconnecting\s+.+$',  # 断开连接提示
        r'^Revoking\s+.+$',  # 撤销提示
        r'^Generating\s+.+$',  # 生成提示
        r'^Copying\s+.+$',  # 复制提示
        r'^Downloading\s+.+$',  # 下载提示
        r'^Uploading\s+.+$',  # 上传提示
        r'^Importing\s+.+$',  # 导入提示
        r'^Exporting\s+.+$',  # 导出提示
        r'^Searching\s+.+$',  # 搜索提示
        r'^Filtering\s+.+$',  # 过滤提示
        r'^Sorting\s+.+$',  # 排序提示
        r'^Refreshing\s+.+$',  # 刷新提示
        r'^Clearing\s+.+$',  # 清除提示
        r'^Resetting\s+.+$',  # 重置提示
    ]
    
    # 检查是否匹配UI模式
    for pattern in ui_patterns:
        if re.match(pattern, s):
            return True
    
    # 保留长度大于3的字符串（可能是UI文本）
    if len(s) > 3:
        # 排除明显的技术字符串
        if not re.match(r'^[a-z0-9-]+$', s):
            return True
    
    return False

# 过滤字符串，分类为可翻译和不可翻译
def filter_strings(all_strings):
    translatable = []
    non_translatable = []
    
    for s in all_strings:
        if is_ui_text(s):
            translatable.append(s)
        else:
            non_translatable.append(s)
    
    return translatable, non_translatable

# 分析翻译风险
def analyze_risk(translatable, non_translatable, file_strings):
    risk_analysis = {
        'total_strings': len(translatable) + len(non_translatable),
        'translatable': len(translatable),
        'non_translatable': len(non_translatable),
        'unique_translatable': len(set(translatable)),
        'unique_non_translatable': len(set(non_translatable)),
        'files_with_translatable': 0,
        'files_with_most_translatable': [],
    }
    
    # 统计每个文件的可翻译字符串数量
    file_translatable_count = {}
    for file, strings in file_strings.items():
        count = 0
        for s in strings:
            if is_ui_text(s):
                count += 1
        if count > 0:
            risk_analysis['files_with_translatable'] += 1
            file_translatable_count[file] = count
    
    # 找出可翻译字符串最多的前10个文件
    sorted_files = sorted(file_translatable_count.items(), key=lambda x: x[1], reverse=True)[:10]
    risk_analysis['files_with_most_translatable'] = sorted_files
    
    # 技术风险
    technical_risks = [
        '直接字符串替换可能导致代码语法错误',
        '可能误替换技术字符串（如变量名、函数名）',
        '可能影响应用的国际化支持（如果未来需要）',
        '可能导致UI布局问题（如中文文本长度不同）',
        '可能影响搜索和过滤功能（如果依赖英文文本）',
    ]
    
    # 质量风险
    quality_risks = [
        '翻译不一致（相同英文对应不同中文）',
        '专业术语翻译不准确',
        '上下文缺失导致翻译错误',
        'UI文本长度变化导致布局问题',
        '翻译后可能失去原有的简洁性和清晰度',
    ]
    
    return risk_analysis, technical_risks, quality_risks

# 制定分阶段翻译计划
def create_translation_plan(risk_analysis, file_strings):
    # 按文件类型分组
    file_types = {
        'components': [],
        'pages': [],
        'layouts': [],
        'utils': [],
        'styles': [],
        'other': [],
    }
    
    for file in file_strings.keys():
        if 'component' in file.lower() or '.tsx' in file.lower() and 'page' not in file.lower():
            file_types['components'].append(file)
        elif 'page' in file.lower():
            file_types['pages'].append(file)
        elif 'layout' in file.lower():
            file_types['layouts'].append(file)
        elif 'util' in file.lower() or 'helper' in file.lower():
            file_types['utils'].append(file)
        elif 'css' in file.lower() or 'style' in file.lower():
            file_types['styles'].append(file)
        else:
            file_types['other'].append(file)
    
    # 分阶段计划
    plan = {
        'phase1': {
            'name': '核心页面和组件',
            'description': '翻译主要页面和核心组件的UI文本',
            'files': file_types['pages'][:10] + file_types['components'][:10],
            'estimated_strings': 500,
            'risk_level': 'medium',
            'goals': [
                '翻译首页、仪表盘等核心页面',
                '翻译导航栏、侧边栏等全局组件',
                '建立基础翻译词典',
                '验证翻译效果',
            ],
        },
        'phase2': {
            'name': '功能页面和组件',
            'description': '翻译功能页面和相关组件的UI文本',
            'files': file_types['pages'][10:] + file_types['components'][10:20],
            'estimated_strings': 1000,
            'risk_level': 'medium-high',
            'goals': [
                '翻译设置页面、用户管理等功能页面',
                '翻译表单、弹窗等交互组件',
                '扩展翻译词典',
                '优化翻译质量',
            ],
        },
        'phase3': {
            'name': '剩余页面和组件',
            'description': '翻译剩余页面和组件的UI文本',
            'files': file_types['components'][20:] + file_types['layouts'],
            'estimated_strings': 500,
            'risk_level': 'medium',
            'goals': [
                '翻译所有剩余组件',
                '翻译布局文件',
                '统一翻译风格',
                '修复翻译问题',
            ],
        },
        'phase4': {
            'name': '工具文件和其他',
            'description': '翻译工具文件和其他剩余文件的UI文本',
            'files': file_types['utils'] + file_types['other'],
            'estimated_strings': 200,
            'risk_level': 'low',
            'goals': [
                '翻译工具函数中的UI文本',
                '翻译其他剩余文件',
                '全面测试翻译效果',
                '完成最终优化',
            ],
        },
    }
    
    return plan

# 设计回退机制
def design_rollback_strategy():
    rollback = {
        'method': 'Git回退',
        'steps': [
            '在开始翻译前，确保当前代码已提交到Git',
            '为每个翻译阶段创建一个新的Git分支',
            '每个阶段翻译完成后，进行测试并提交代码',
            '如果发现问题，使用以下命令回退：',
            '  - 回退单个文件：git checkout HEAD -- <file_path>',
            '  - 回退整个阶段：git checkout <previous_branch>',
            '  - 撤销最后一次提交：git revert HEAD',
            '  - 重置到指定提交：git reset --hard <commit_hash>',
            '在回退后，分析问题并调整翻译策略',
            '重新开始翻译，避免之前的错误',
        ],
        'best_practices': [
            '定期提交翻译进度，避免大量未提交的更改',
            '为每个翻译文件创建备份',
            '建立翻译测试流程，及时发现问题',
            '保持翻译词典的一致性，避免重复翻译',
            '在翻译前，先测试少量字符串，验证翻译效果',
        ],
    }
    
    return rollback

# 生成翻译词典
def generate_translation_dict(translatable):
    # 去重
    unique_translatable = list(set(translatable))
    
    # 生成基础翻译词典（示例）
    translation_dict = {
        # 常见UI文本
        'Dashboard': '仪表板',
        'Loading...': '加载中...',
        'Save': '保存',
        'Cancel': '取消',
        'Delete': '删除',
        'Edit': '编辑',
        'Add': '添加',
        'View': '查看',
        'Create': '创建',
        'Update': '更新',
        'Remove': '移除',
        'Connect': '连接',
        'Disconnect': '断开连接',
        'Revoke': '撤销',
        'Generate': '生成',
        'Copy': '复制',
        'Download': '下载',
        'Upload': '上传',
        'Import': '导入',
        'Export': '导出',
        'Search': '搜索',
        'Filter': '过滤',
        'Sort': '排序',
        'Refresh': '刷新',
        'Clear': '清除',
        'Reset': '重置',
        'Toggle': '切换',
        'Expand': '展开',
        'Collapse': '折叠',
        'Show': '显示',
        'Hide': '隐藏',
        'Enable': '启用',
        'Disable': '禁用',
        'Activate': '激活',
        'Deactivate': '停用',
        'Complete': '完成',
        'Pending': '待处理',
        'In Progress': '进行中',
        'Failed': '失败',
        'Success': '成功',
        'Successfully': '成功',
        'Failed to': '失败',
        'Are you sure': '您确定吗',
        'You are about to': '您将要',
        'This will': '这将',
        'No': '没有',
        'yet': '尚未',
        'Try adjusting': '尝试调整',
        'Please enter': '请输入',
        'Please select': '请选择',
        'Please wait': '请等待',
    }
    
    return translation_dict

# 主函数
def main():
    # 读取和解析字符串
    content = read_all_strings()
    all_strings, file_strings = parse_strings(content)
    
    # 过滤字符串
    translatable, non_translatable = filter_strings(all_strings)
    
    # 分析风险
    risk_analysis, technical_risks, quality_risks = analyze_risk(translatable, non_translatable, file_strings)
    
    # 制定翻译计划
    translation_plan = create_translation_plan(risk_analysis, file_strings)
    
    # 设计回退机制
    rollback_strategy = design_rollback_strategy()
    
    # 生成翻译词典
    translation_dict = generate_translation_dict(translatable)
    
    # 打印结果
    print("=== 翻译分析报告 ===")
    print(f"\n总字符串数: {risk_analysis['total_strings']}")
    print(f"可翻译字符串数: {risk_analysis['translatable']} ({len(set(translatable))} 唯一)")
    print(f"不可翻译字符串数: {risk_analysis['non_translatable']} ({len(set(non_translatable))} 唯一)")
    print(f"包含可翻译字符串的文件数: {risk_analysis['files_with_translatable']}")
    
    print("\n=== 可翻译字符串示例 ===")
    for s in list(set(translatable))[:20]:
        print(f"  - {s}")
    
    print("\n=== 不可翻译字符串示例 ===")
    for s in list(set(non_translatable))[:20]:
        print(f"  - {s}")
    
    print("\n=== 翻译风险分析 ===")
    print("\n技术风险:")
    for risk in technical_risks:
        print(f"  - {risk}")
    
    print("\n质量风险:")
    for risk in quality_risks:
        print(f"  - {risk}")
    
    print("\n=== 分阶段翻译计划 ===")
    for phase, details in translation_plan.items():
        print(f"\n{phase}: {details['name']}")
        print(f"  描述: {details['description']}")
        print(f"  文件数: {len(details['files'])}")
        print(f"  估计字符串数: {details['estimated_strings']}")
        print(f"  风险等级: {details['risk_level']}")
        print(f"  目标:")
        for goal in details['goals']:
            print(f"    - {goal}")
    
    print("\n=== 回退机制 ===")
    print(f"方法: {rollback_strategy['method']}")
    print("步骤:")
    for step in rollback_strategy['steps']:
        print(f"  - {step}")
    
    print("\n最佳实践:")
    for practice in rollback_strategy['best_practices']:
        print(f"  - {practice}")
    
    print("\n=== 翻译词典示例 ===")
    for en, zh in list(translation_dict.items())[:20]:
        print(f"  '{en}': '{zh}',")
    
    print("\n=== 结论 ===")
    print(f"1. 总共需要翻译 {risk_analysis['translatable']} 条字符串，分布在 {risk_analysis['files_with_translatable']} 个文件中。")
    print("2. 建议采用分阶段翻译策略，从核心页面和组件开始，逐步扩展到所有文件。")
    print("3. 翻译过程中需要注意技术风险和质量风险，建立完善的测试和回退机制。")
    print("4. 建议建立统一的翻译词典，确保翻译一致性。")
    print("5. 在每个阶段翻译完成后，进行充分测试，确保应用功能正常。")

if __name__ == "__main__":
    main()