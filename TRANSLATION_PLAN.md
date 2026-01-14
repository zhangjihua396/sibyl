# Sibyl 项目翻译计划

> 最后更新: 2026-01-14
> 状态: ✅ 已完成

## 目录

1. [概览](#概览)
2. [基础设施](#基础设施)
3. [翻译统计](#翻译统计)
4. [使用方法](#使用方法)
5. [验证结果](#验证结果)

## 概览

| 项目 | 数值 |
|------|------|
| **总消息数** | 150+ 条 |
| **已翻译文件** | 27 个 |
| **翻译文件位置** | `i18n/zh_CN.py` (独立于主项目) |

## 基础设施

### 目录结构

```
E:\sibyl-main\
├── i18n/                          # ✅ 已创建
│   ├── __init__.py               # 导出 t() 函数
│   ├── zh_CN.py                  # 166 条翻译
│   └── README.md                 # 使用说明
│
└── apps/api/src/sibyl/
    └── i18n/ → E:\sibyl-main\i18n  # ✅ 符号链接
```

### i18n 模块功能

```python
from sibyl.i18n import t

# 基本翻译
t("Not authenticated")          # → "请先登录"
t("Task created successfully")  # → "任务创建成功"

# 带变量替换
t("Task not found: {task_id}", task_id="abc")
# → "任务不存在: abc"
```

## 翻译统计

### 已翻译文件

| 序号 | 文件 | 消息数 | 状态 |
|------|------|--------|------|
| 1 | api/routes/auth.py | 17 | ✅ |
| 2 | api/routes/tasks.py | 14 | ✅ |
| 3 | api/auth/dependencies.py | 14 | ✅ |
| 4 | api/routes/entities.py | 12 | ✅ |
| 5 | api/routes/orgs.py | 11 | ✅ |
| 6 | api/routes/project_members.py | 10 | ✅ |
| 7 | api/routes/users.py | 10 | ✅ |
| 8 | api/routes/crawler.py | 8 | ✅ |
| 9 | api/routes/epics.py | 8 | ✅ |
| 10 | api/routes/graph.py | 8 | ✅ |
| 11 | api/routes/agents.py | 6 | ✅ |
| 12 | api/routes/approvals.py | 5 | ✅ |
| 13 | api/routes/backups.py | 5 | ✅ |
| 14 | api/routes/org_members.py | 5 | ✅ |
| 15 | api/routes/setup.py | 5 | ✅ |
| 16 | api/routes/admin.py | 4 | ✅ |
| 17 | api/routes/rag.py | 4 | ✅ |
| 18 | api/routes/org_invitations.py | 3 | ✅ |
| 19 | api/routes/search.py | 3 | ✅ |
| 20 | api/auth/rls.py | 3 | ✅ |
| 21 | api/routes/jobs.py | 2 | ✅ |
| 22 | api/routes/metrics.py | 2 | ✅ |
| 23 | api/auth/authorization.py | 1 | ✅ |
| 24 | api/auth/mcp_oauth.py | 1 | ✅ |
| 25 | api/agents/integration.py | 1 | ✅ |
| 26 | api/crawler/llms_parser.py | 1 | ✅ |
| 27 | api/crawler/service.py | 1 | ✅ |

## 使用方法

### 1. 在代码中使用

```python
from sibyl.i18n import t

# HTTP 异常
raise HTTPException(status_code=401, detail=t("Not authenticated"))

# 成功消息
success(t("Task created successfully"))
```

### 2. 添加新翻译

在 `i18n/zh_CN.py` 中添加：

```python
TRANSLATIONS: dict[str, str] = {
    # ... 现有翻译 ...
    "Your new message": "您的新消息",
}
```

### 3. 批量翻译

运行批量翻译脚本：

```bash
python batch_translate.py
```

## 验证结果

```bash
cd apps/api
python -c "from sibyl.api.app import create_api_app; app = create_api_app(); print('✅ App 创建成功!')"
```

输出:
```
✅ App 创建成功!
```

## 下次继续

如果翻译中断，按以下步骤继续：

1. **运行扫描**: `python scan_translations.py`
2. **更新计划**: `python batch_translate.py`
3. **验证**: `python -c "from sibyl.api.app import create_api_app; app = create_api_app()"`

---

**翻译完成时间**: 2026-01-14
