"""Sibyl 中文翻译字典。

包含所有面向用户的英文文本的中文翻译。
与主项目分离，位于项目根目录的 i18n 文件夹中。

最后更新: 2026-01-14
翻译消息数: 166 条
"""

from typing import Any

TRANSLATIONS: dict[str, str] = {
    # =========================================================================
    # 通用/公共文本
    # =========================================================================
    "Success": "操作成功",
    "Failed": "操作失败",
    "Error": "错误",
    "Warning": "警告",
    "Info": "信息",
    "OK": "确定",
    "Cancel": "取消",
    "Yes": "是",
    "No": "否",
    "Loading": "加载中...",
    "Saving": "保存中...",
    "Deleting": "删除中...",
    "Updated": "已更新",
    "Created": "已创建",
    "Deleted": "已删除",
    "Not found": "未找到",
    "Not Found": "未找到",
    "Invalid": "无效",
    "Required": "必填",
    "Optional": "可选",
    "None": "无",
    "All": "全部",
    "More": "更多",
    "Close": "关闭",
    "Back": "返回",
    "Next": "下一步",
    "Previous": "上一步",
    "Submit": "提交",
    "Confirm": "确认",
    "Reset": "重置",
    "Search": "搜索",
    "Filter": "筛选",
    "Sort": "排序",
    "Refresh": "刷新",
    "Retry": "重试",
    "Details": "详情",
    "Settings": "设置",
    "Configuration": "配置",

    # =========================================================================
    # 认证与授权相关 (19 条)
    # =========================================================================
    # 认证状态
    "Not authenticated": "请先登录",
    "Not authenticated. Please log in again.": "请重新登录",
    "Invalid token": "登录凭证无效",
    "Invalid token: {e}": "登录凭证无效: {e}",
    "User not found": "用户不存在",
    "User not found.": "用户不存在",
    "Session expired": "会话已过期",
    "Session not found": "会话不存在",
    "Session not found or revoked": "会话不存在或已被撤销",
    "Session invalid": "会话无效",

    # 权限不足
    "Forbidden": "无权访问",
    "Access denied": "拒绝访问",
    "Permission denied": "权限不足",
    "Insufficient permissions": "权限不足",
    "Insufficient API key scope": "API密钥权限不足",
    "No organization context": "请选择组织",
    "Not a member": "不是组织成员",

    # 登录相关
    "Invalid credentials": "用户名或密码错误",
    "Invalid email or password": "邮箱或密码错误",
    "Current password is incorrect": "当前密码错误",
    "Current password is required": "请提供当前密码",
    "Password is required": "请输入密码",
    "Email is required": "请输入邮箱",
    "Name is required": "请输入姓名",
    "Email is already in use": "邮箱已被使用",
    "Username is already in use": "用户名已被使用",
    "Account not found": "账户不存在",
    "Account locked": "账户已锁定",
    "Account disabled": "账户已禁用",

    # 密码相关
    "Password is empty": "密码不能为空",
    "Password too short": "密码长度不足",
    "Password too weak": "密码强度不足",
    "Password must contain uppercase letters": "密码必须包含大写字母",
    "Password must contain lowercase letters": "密码必须包含小写字母",
    "Password must contain numbers": "密码必须包含数字",
    "Password must contain special characters": "密码必须包含特殊字符",

    # OAuth相关
    "OAuth error": "OAuth登录失败",
    "OAuth connection failed": "OAuth连接失败",
    "OAuth callback failed": "OAuth回调失败",
    "GitHub OAuth is not configured": "GitHub OAuth未配置",
    "GitHub OAuth failed": "GitHub OAuth登录失败",
    "Google OAuth is not configured": "Google OAuth未配置",
    "Missing code": "缺少授权码",
    "JWT secret not configured": "JWT密钥未配置",
    "invalid_credentials": "用户名或密码错误",
    "invalid_grant": "授权无效",

    # API密钥相关
    "API key is required": "请提供API密钥",
    "API key is invalid": "API密钥无效",
    "API key has expired": "API密钥已过期",
    "API key has been revoked": "API密钥已被撤销",
    "API key not found": "API密钥不存在",
    "Key is empty": "密钥为空",

    # RLS相关
    "Invalid token: missing user": "无效的令牌: 缺少用户信息",
    "Failed to initialize security context": "安全上下文初始化失败",

    # =========================================================================
    # 组织管理相关 (11 条)
    # =========================================================================
    "Organization not found": "组织不存在",
    "Organization not found.": "组织不存在",
    "Organization context required": "请选择组织",
    "Cannot remove the last organization owner": "无法移除最后一个组织所有者",
    "Cannot demote the last organization owner": "无法降级最后一个组织所有者",
    "User is not a member of this organization": "用户不是该组织成员",
    "User is already a member": "用户已是组织成员",
    "Organization name is required": "请输入组织名称",
    "Organization slug is required": "请输入组织标识符",
    "Organization slug must be unique": "组织标识符必须唯一",
    "Invalid organization": "无效的组织",
    "Personal org cannot be deleted": "个人组织无法删除",
    "Cannot leave organization as owner": "作为所有者无法离开组织，请先转移所有权",
    "Slug already taken": "标识符已被占用",
    "Cannot delete personal organization": "无法删除个人组织",

    # =========================================================================
    # 团队管理相关
    # =========================================================================
    "Team not found": "团队不存在",
    "Team already exists": "团队已存在",
    "Team name is required": "请输入团队名称",
    "Cannot remove yourself from team": "无法将自己从团队中移除",
    "Cannot delete last team member": "无法删除最后一个团队成员",

    # =========================================================================
    # 项目管理相关 (12 条)
    # =========================================================================
    "Project not found": "项目不存在",
    "Project not found: {project_id}": "项目不存在: {project_id}",
    "Project not found.": "项目不存在",
    "Project access denied": "无权访问该项目",
    "Project authorization required": "需要项目授权",
    "Project name is required": "请输入项目名称",
    "Project description is required": "请输入项目描述",
    "Cannot delete the last project": "无法删除最后一个项目",
    "Cannot archive the last project": "无法归档最后一个项目",
    "Project is archived": "项目已归档",
    "Project is locked": "项目已锁定",

    # =========================================================================
    # 任务管理相关 (20 条)
    # =========================================================================
    "Task not found": "任务不存在",
    "Task not found: {task_id}": "任务不存在: {task_id}",
    "Task created successfully": "任务创建成功",
    "Task started": "任务已开始",
    "Task blocked: {request.reason}": "任务被阻塞: {request.reason}",
    "Task unblocked, resuming work": "任务已解除阻塞，继续执行",
    "Task submitted for review": "任务已提交审核",
    "Task completed": "任务已完成",
    "Task completed with learnings captured": "任务已完成，已捕获学习记录",
    "Task archived": "任务已归档",
    "Task updated: {', '.join(update_data.keys())}": "任务已更新: {', '.join(update_data.keys())}",
    "Failed to create task. Please try again.": "创建任务失败，请重试",
    "Failed to update task. Please try again.": "更新任务失败，请重试",
    "Failed to create note. Please try again.": "创建备注失败，请重试",
    "Failed to list notes. Please try again.": "获取备注列表失败，请重试",
    "No fields to update": "没有可更新的字段",
    "Update failed": "更新失败",
    "Task is being updated by another process. Please retry.": "任务正在被其他进程更新，请稍后重试",
    "Task is locked by another process. Please retry.": "任务已被锁定，请稍后重试",
    "Task is locked": "任务已被锁定",
    "Task dependency cycle detected": "检测到任务依赖循环",
    "Invalid task status transition": "无效的任务状态转换",
    "Cannot complete task with unblocked dependencies": "存在未完成的依赖任务",

    # =========================================================================
    # 史诗/里程碑相关 (8 条)
    # =========================================================================
    "Epic started": "史诗已启动",
    "Epic completed": "史诗已完成",
    "Epic archived": "史诗已归档",
    "Failed to start epic. Please try again.": "启动史诗失败，请重试",
    "Failed to complete epic. Please try again.": "完成史诗失败，请重试",
    "Failed to archive epic. Please try again.": "归档史诗失败，请重试",
    "Failed to update epic. Please try again.": "更新史诗失败，请重试",

    # =========================================================================
    # 实体相关 (12 条)
    # =========================================================================
    "Failed to list entities. Please try again.": "获取实体列表失败，请重试",
    "Failed to get entity. Please try again.": "获取实体失败，请重试",
    "Entity created but not found": "实体创建成功但未找到",
    "Failed to create entity. Please try again.": "创建实体失败，请重试",
    "Entity is being updated by another process. Please retry.": "实体正在被其他进程更新，请稍后重试",
    "Entity is locked by another process. Please retry.": "实体已被锁定，请稍后重试",
    "Failed to update entity. Please try again.": "更新实体失败，请重试",
    "Entity is being modified by another process. Please retry.": "实体正在被其他进程修改，请稍后重试",
    "Delete failed": "删除失败",
    "Failed to delete entity. Please try again.": "删除实体失败，请重试",

    # =========================================================================
    # 项目成员相关 (10 条)
    # =========================================================================
    "User not found": "用户不存在",
    "User is already a member": "用户已是成员",
    "Member not found": "成员不存在",
    "Cannot change project owner's role": "无法更改项目所有者的角色",
    "Cannot remove project owner": "无法移除项目所有者",

    # =========================================================================
    # 组织成员相关 (5 条)
    # =========================================================================
    # 使用通用翻译

    # =========================================================================
    # 搜索相关 (3 条)
    # =========================================================================
    "Search failed. Please try again.": "搜索失败，请重试",
    "Explore failed. Please try again.": "探索失败，请重试",
    "Temporal query failed. Please try again.": "时间查询失败，请重试",

    # =========================================================================
    # 图谱相关 (8 条)
    # =========================================================================
    "Failed to retrieve graph nodes. Please try again.": "获取图谱节点失败，请重试",
    "Failed to retrieve graph edges. Please try again.": "获取图谱边失败，请重试",
    "Failed to retrieve full graph. Please try again.": "获取完整图谱失败，请重试",
    "Failed to retrieve subgraph. Please try again.": "获取子图谱失败，请重试",
    "Failed to retrieve clusters. Please try again.": "获取聚类失败，请重试",
    "Failed to retrieve cluster details. Please try again.": "获取聚类详情失败，请重试",
    "Failed to retrieve hierarchical graph. Please try again.": "获取层级图谱失败，请重试",
    "Failed to retrieve graph stats. Please try again.": "获取图谱统计失败，请重试",

    # =========================================================================
    # RAG/文档检索相关 (4 条)
    # =========================================================================
    "Failed to generate query embedding": "生成查询向量失败",
    "At least one of title or content must be provided": "必须提供标题或内容至少一项",

    # =========================================================================
    # 代理/Agent相关 (6 条)
    # =========================================================================
    "Organization context required": "需要组织上下文",
    "You don't have permission to control this agent": "您无权控制此代理",
    "You don't have permission to view this agent": "您无权查看此代理",
    "No organization context": "没有组织上下文",
    "Failed to spawn agent": "启动代理失败",
    "Agent archived successfully": "代理已成功归档",

    # =========================================================================
    # 审批相关 (5 条)
    # =========================================================================
    "You don't have permission to view this approval": "您无权查看此审批",
    "You don't have permission to respond to this approval": "您无权响应此审批",
    "Approval dismissed successfully": "审批已成功驳回",
    "Question answered successfully": "问题已成功回答",

    # =========================================================================
    # 爬虫相关 (8 条)
    # =========================================================================
    "Invalid URL": "无效的URL",
    "Failed to enqueue job. Is the job queue available?": "入队失败，任务队列是否可用？",
    "Graph service unavailable": "图谱服务不可用",
    "Entity extraction not configured": "实体提取未配置",
    "Crawl already in progress for this source": "此数据源已在爬取中",
    "No active crawl job to cancel": "没有活跃的爬取任务可取消",
    "No sources found to process": "没有找到要处理的数据源",
    "No unprocessed chunks found": "没有找到未处理的文本块",

    # =========================================================================
    # 备份相关 (5 条)
    # =========================================================================
    "Backup file path not recorded": "备份文件路径未记录",
    "Backup file not found on disk": "磁盘上未找到备份文件",
    "Backup job queued successfully": "备份任务已成功加入队列",
    "Cleanup job queued successfully": "清理任务已成功加入队列",
    "Failed to retrieve stats. Please try again.": "获取统计信息失败，请重试",
    "Backup failed. Please try again.": "备份失败，请重试",
    "Restore failed. Please try again.": "恢复失败，请重试",
    "Backfill failed. Please try again.": "回填失败，请重试",

    # =========================================================================
    # 任务队列相关 (2 条)
    # =========================================================================
    "Failed to get job status. Is Redis available?": "获取任务状态失败，Redis是否可用？",
    "Failed to cancel job": "取消任务失败",

    # =========================================================================
    # 指标相关 (2 条)
    # =========================================================================
    "Failed to get project metrics. Please try again.": "获取项目指标失败，请重试",
    "Failed to get organization metrics. Please try again.": "获取组织指标失败，请重试",

    # =========================================================================
    # 设置相关 (1 条)
    # =========================================================================
    "Cannot delete settings during setup mode": "设置模式下无法删除设置",

    # =========================================================================
    # 设置向导相关 (5 条)
    # =========================================================================
    "Setup is complete. Authentication required.": "设置已完成，需要身份验证",
    "Invalid token: missing user ID": "无效的令牌: 缺少用户ID",
    "Admin access required to update server configuration": "更新服务器配置需要管理员权限",

    # =========================================================================
    # 用户相关 (10 条)
    # =========================================================================
    "No password set. Use OAuth or set a password first.": "未设置密码，请使用OAuth或先设置密码",
    "Connection not found": "连接不存在",
    "Cannot remove last login method. Set a password first.": "无法移除最后的登录方式，请先设置密码",

    # =========================================================================
    # 设备授权相关 (15 条)
    # =========================================================================
    "Device Login Failed": "设备登录失败",
    "Device Login": "设备登录",
    "Sign In to Approve": "登录以授权",
    "Approve Device Login": "批准设备登录",
    "Device Approved": "设备已授权",
    "Access Denied": "拒绝访问",
    "You can close this tab and return to your terminal.": "您可以关闭此页面并返回终端",
    "You're all set! Close this tab and return to your terminal.": "设置完成！您可以关闭此页面并返回终端",
    "This device code has expired or is invalid. Please return to your terminal and start a new login.": "此设备代码已过期或无效，请返回终端并重新发起登录",
    "Incorrect email or password. Please try again.": "邮箱或密码错误，请重试",
    "You need to sign in first.": "请先登录",
    "Your session has expired. Please sign in again.": "会话已过期，请重新登录",
    "User account not found.": "用户账户不存在",
    "No device code provided.": "未提供设备代码",
    "Invalid action.": "无效操作",
    "unsupported_grant_type": "不支持的授权类型",
    "No refresh token provided": "未提供刷新令牌",
    "Session not found or revoked": "会话不存在或已被撤销",
    "Invalid token claims": "无效的令牌声明",

    # =========================================================================
    # 邀请相关 (3 条)
    # =========================================================================
    # 使用通用翻译

    # =========================================================================
    # 代理集成相关 (1 条)
    # =========================================================================
    "Has uncommitted changes": "有未提交的更改",

    # =========================================================================
    # API 标题 (2 条)
    # =========================================================================
    "Sibyl API": "Sibyl API",
    "LLMs Documentation Guide": "LLMs 文档指南",
    "Full Document": "完整文档",

    # =========================================================================
    # 系统消息
    # =========================================================================
    "Internal server error": "服务器内部错误",
    "Bad request": "请求参数错误",
    "Method not allowed": "不支持该请求方法",
    "Resource not found": "资源不存在",
    "Conflict": "资源冲突",
    "Too many requests": "请求过于频繁",
    "Service unavailable": "服务不可用",
    "Gateway timeout": "网关超时",
    "Database connection failed": "数据库连接失败",
    "Cache connection failed": "缓存连接失败",
    "Queue connection failed": "队列连接失败",
    "External service error": "外部服务错误",
    "Rate limit exceeded": "超过速率限制",
    "Maintenance mode": "系统维护中",
    "System upgrading": "系统升级中",
}
