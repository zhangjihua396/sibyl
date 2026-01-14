#!/usr/bin/env python3
"""直接替换HTTP错误消息为中文。"""

import os

def get_translations():
    """返回HTTP错误消息的中文字典。"""
    return {
        "Not authenticated": "请先登录",
        "Invalid token": "登录凭证无效",
        "User not found": "用户不存在",
        "Session expired": "会话已过期",
        "Forbidden": "无权访问",
        "Permission denied": "权限不足",
        "Insufficient permissions": "权限不足",
        "Invalid credentials": "用户名或密码错误",
        "Invalid email or password": "邮箱或密码错误",
        "Current password is incorrect": "当前密码错误",
        "Organization not found": "组织不存在",
        "Project not found": "项目不存在",
        "Task not found": "任务不存在",
        "Entity not found": "实体不存在",
        "Team not found": "团队不存在",
        "API key not found": "API密钥不存在",
        "API key is invalid": "API密钥无效",
        "JWT secret not configured": "JWT密钥未配置",
        "GitHub OAuth is not configured": "GitHub OAuth未配置",
        "Missing code": "缺少授权码",
        "No organization context": "请选择组织",
        "Not a member": "不是组织成员",
        "User is not a member of this organization": "用户不是该组织成员",
        "User is already a member": "用户已是组织成员",
        "Organization name is required": "请输入组织名称",
        "Cannot remove the last organization owner": "无法移除最后一个组织所有者",
        "Cannot demote the last organization owner": "无法降级最后一个组织所有者",
        "No fields to update": "没有可更新的字段",
        "Invalid URL": "无效的URL",
        "Failed to enqueue job": "入队失败",
        "Graph service unavailable": "图谱服务不可用",
        "Crawl already in progress for this source": "此数据源已在爬取中",
        "No active crawl job to cancel": "没有活跃的爬取任务可取消",
        "No sources found to process": "没有找到要处理的数据源",
        "No unprocessed chunks found": "没有找到未处理的文本块",
        "Backup file path not recorded": "备份文件路径未记录",
        "Backup file not found on disk": "磁盘上未找到备份文件",
        "Backup job queued successfully": "备份任务已成功加入队列",
        "Cleanup job queued successfully": "清理任务已成功加入队列",
        "Failed to retrieve stats": "获取统计信息失败",
        "Failed to get job status": "获取任务状态失败",
        "Failed to cancel job": "取消任务失败",
        "Failed to get project metrics": "获取项目指标失败",
        "Failed to get organization metrics": "获取组织指标失败",
        "Cannot delete settings during setup mode": "设置模式下无法删除设置",
        "Setup is complete": "设置已完成",
        "Invalid token: missing user": "无效的令牌: 缺少用户信息",
        "Failed to initialize security context": "安全上下文初始化失败",
        "No password set": "未设置密码",
        "Connection not found": "连接不存在",
        "Cannot remove last login method": "无法移除最后的登录方式",
        "Device Login Failed": "设备登录失败",
        "Device Login": "设备登录",
        "Sign In to Approve": "登录以授权",
        "Approve Device Login": "批准设备登录",
        "Device Approved": "设备已授权",
        "Access Denied": "拒绝访问",
        "You can close this tab and return to your terminal": "您可以关闭此页面并返回终端",
        "You're all set": "设置完成",
        "This device code has expired or is invalid": "此设备代码已过期或无效",
        "Incorrect email or password": "邮箱或密码错误",
        "You need to sign in first": "请先登录",
        "Your session has expired": "会话已过期",
        "User account not found": "用户账户不存在",
        "No device code provided": "未提供设备代码",
        "Invalid action": "无效操作",
        "unsupported_grant_type": "不支持的授权类型",
        "No refresh token provided": "未提供刷新令牌",
        "Session not found or revoked": "会话不存在或已被撤销",
        "Invalid token claims": "无效的令牌声明",
    }

def replace_in_file(filepath, translations):
    """替换文件中的HTTP错误消息为中文。"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换引号内的错误消息
    for english, chinese in translations.items():
        content = content.replace(f'"{english}"', f'"{chinese}"')
        content = content.replace(f'\'{english}\'"', f'\'{chinese}\'"')
    
    # 移除i18n导入
    content = content.replace('from sibyl.i18n import t\n', '')
    content = content.replace('from sibyl import i18n\n', '')
    
    # 替换t()调用
    content = content.replace('t("', '"')
    content = content.replace('t(\'', '\'')
    content = content.replace('")', '"')
    content = content.replace('\')', '\'')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    """主函数。"""
    translations = get_translations()
    print(f"加载了 {len(translations)} 条翻译")
    
    # 处理apps目录下的Python文件
    for root, dirs, files in os.walk('apps'):
        if 'test' in root.lower() or 'i18n' in root.lower():
            continue
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                filepath = os.path.join(root, file)
                print(f"处理文件: {filepath}")
                replace_in_file(filepath, translations)
    
    print("替换完成！")

if __name__ == '__main__':
    main()
