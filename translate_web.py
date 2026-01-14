#!/usr/bin/env python3
"""翻译 apps/web 前端文件中的英文文本为中文。"""

import os
import re

# 前端UI翻译字典
WEB_TRANSLATIONS = {
    # 通用
    "Loading...": "加载中...",
    "Loading": "加载中",
    "Failed": "失败",
    "Success": "成功",
    "Error": "错误",
    "Warning": "警告",
    "Info": "提示",
    "Close": "关闭",
    "Cancel": "取消",
    "Confirm": "确认",
    "Save": "保存",
    "Delete": "删除",
    "Edit": "编辑",
    "Add": "添加",
    "Search": "搜索",
    "Filter": "筛选",
    "Clear": "清除",
    "Refresh": "刷新",
    "Back": "返回",
    "Next": "下一步",
    "Previous": "上一步",
    "Submit": "提交",
    "Skip": "跳过",
    "Done": "完成",
    "Yes": "是",
    "No": "否",
    "OK": "确定",
    "More": "更多",
    "Actions": "操作",
    "Settings": "设置",
    
    # 面包屑导航
    "Breadcrumb": "面包屑导航",
    
    # 代理相关
    "Agents": "智能代理",
    "Failed to load agent": "加载代理失败",
    "Failed to load agents": "加载代理列表失败",
    "Tokens used": "已使用令牌数",
    "Create Agent": "创建代理",
    "Agent Settings": "代理设置",
    "Agent Name": "代理名称",
    
    # 实体相关
    "Entities": "知识实体",
    "Entity": "实体",
    "Browse and manage knowledge entities": "浏览和管理知识实体",
    "Search entities...": "搜索实体...",
    "Failed to load entities": "加载实体失败",
    "Loading entities...": "加载实体中...",
    "Enter description...": "输入描述...",
    "Enter content...": "输入内容...",
    "Entity name": "实体名称",
    "Create Entity": "创建实体",
    "Related Entities": "相关实体",
    
    # 任务相关
    "Tasks": "任务",
    "Task": "任务",
    "Failed to load task": "加载任务失败",
    "Failed to load tasks": "加载任务列表失败",
    "Search tasks...": "搜索任务...",
    "Create Task": "创建任务",
    "Task name": "任务名称",
    "Task description": "任务描述",
    
    # 史诗相关
    "Epics": "史诗",
    "Epic": "史诗",
    "Search epics...": "搜索史诗...",
    "Failed to load epic": "加载史诗失败",
    "Failed to load epics": "加载史诗列表失败",
    "Create Epic": "创建史诗",
    
    # 图表相关
    "Graph": "图谱",
    "Loading graph...": "加载图谱中...",
    "Close panel": "关闭面板",
    "Zoom in": "放大",
    "Zoom out": "缩小",
    "Fit to view": "适应视图",
    "Reset view": "重置视图",
    "Entities per cluster": "每簇实体数",
    
    # 项目相关
    "Projects": "项目",
    "Project": "项目",
    "Manage your development projects": "管理您的开发项目",
    "Failed to load projects": "加载项目失败",
    "Loading projects...": "加载项目中...",
    "Project name": "项目名称",
    "Create Project": "创建项目",
    
    # 搜索相关
    "Search": "搜索",
    "Find knowledge, documentation, and code": "查找知识、文档和代码",
    "Searching...": "搜索中...",
    "Search failed": "搜索失败",
    "No documentation found": "未找到文档",
    "Try different keywords or check if sources have been crawled": "请尝试其他关键词或检查数据源是否已爬取",
    
    # 设置相关
    "Settings": "设置",
    "Manage your account, preferences, and team settings": "管理您的账户、偏好设置和团队设置",
    "Loading settings...": "加载设置中...",
    
    # 管理设置
    "Admin": "管理",
    "Uptime": "运行时间",
    "Total Entities": "实体总数",
    "Server": "服务器",
    "Graph Status": "图谱状态",
    "AI Settings": "AI设置",
    "System": "系统",
    "Powers vector embeddings for semantic search. Uses text-embedding-3-small model.": "为语义搜索提供向量嵌入支持，使用 text-embedding-3-small 模型。",
    "Powers entity extraction and built-in agents. Uses Claude Haiku for extraction.": "支持实体提取和内置代理，使用 Claude Haiku 进行提取。",
    
    # 数据设置
    "Data": "数据",
    "Skip existing entities (recommended)": "跳过已存在的实体（推荐）",
    "Loading data settings...": "加载数据设置中...",
    
    # 组织设置
    "Organizations": "组织",
    "My Organization": "我的组织",
    "Organization name": "组织名称",
    "Remove member": "移除成员",
    "Team": "团队",
    "Teams": "团队",
    "slug": "标识符",
    "Role": "角色",
    "Owner": "所有者",
    "Member": "成员",
    "Admin": "管理员",
    
    # 个人资料设置
    "Profile": "个人资料",
    "Your name": "您的姓名",
    "Tell us about yourself...": "介绍一下您自己...",
    "Avatar URL": "头像URL",
    "https://example.com/avatar.jpg": "https://example.com/avatar.jpg",
    
    # 安全设置
    "Security": "安全",
    "Enter current password": "输入当前密码",
    "Enter new password (min 8 characters)": "输入新密码（最少8个字符）",
    "Confirm new password": "确认新密码",
    "Show passwords": "显示密码",
    "Revoke session": "撤销会话",
    "Revoke": "撤销",
    "Session": "会话",
    "Sessions": "会话",
    "Active": "活跃",
    "Inactive": "不活跃",
    "Last active": "最后活跃",
    "Current device": "当前设备",
    "Password": "密码",
    "Change Password": "修改密码",
    
    # 数据源相关
    "Sources": "数据源",
    "Source": "数据源",
    "Loading sources...": "加载数据源中...",
    "Crawl": "爬取",
    "Crawl Progress": "爬取进度",
    "Crawling": "爬取中",
    "Crawl Depth": "爬取深度",
    "One pattern per line": "每行一个模式",
    "Chunks": "文本块",
    "Type": "类型",
    "Document content (Markdown supported)...": "文档内容（支持Markdown）...",
    "Words": "字数",
    "Tokens": "令牌数",
    "Crawled": "已爬取",
    "Add Source": "添加数据源",
    "Crawl Now": "立即爬取",
    "Stop Crawl": "停止爬取",
    
    # 登录相关
    "Sign In": "登录",
    "Sign Up": "注册",
    "Sign Out": "退出",
    "Login": "登录",
    "Logout": "退出",
    "Email": "邮箱",
    "Password": "密码",
    "Forgot Password": "忘记密码",
    "Remember me": "记住我",
    
    # 错误消息
    "Not authenticated": "请先登录",
    "Invalid credentials": "用户名或密码错误",
    "Session expired": "会话已过期",
    "Permission denied": "权限不足",
    "Resource not found": "资源不存在",
    "Internal server error": "服务器内部错误",
    
    # 其他UI文本
    "Documentation": "文档",
    "Code": "代码",
    "Knowledge": "知识",
    "No results found": "未找到结果",
    "Clear search": "清除搜索",
    "Show more": "显示更多",
    "Show less": "显示更少",
    "Copy": "复制",
    "Copied": "已复制",
    "Download": "下载",
    "Upload": "上传",
    "Drag and drop": "拖放",
    "Drop files here": "将文件拖放到此处",
}

def replace_in_file(filepath):
    """替换文件中的英文文本为中文。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    changes = 0
    for english, chinese in WEB_TRANSLATIONS.items():
        if f'"{english}"' in content:
            content = content.replace(f'"{english}"', f'"{chinese}"')
            changes += 1
        elif f"'{english}'" in content:
            content = content.replace(f"'{english}'", f"'{chinese}'")
            changes += 1
    
    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"已翻译 {filepath}: {changes} 处")
        return changes
    return 0

def main():
    """主函数。"""
    total = 0
    file_count = 0
    
    for root, dirs, files in os.walk('apps/web'):
        rel_root = os.path.relpath(root, 'apps/web')
        if any(skip in rel_root.lower() for skip in ['test', 'node_modules', '.git', '.storybook', '.next']):
            continue
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, f)
                changes = replace_in_file(filepath)
                if changes > 0:
                    total += changes
                    file_count += 1
    
    print(f"\n翻译完成！共翻译 {total} 处文本到 {file_count} 个文件")

if __name__ == '__main__':
    main()
