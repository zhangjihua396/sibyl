# Sibyl i18n 国际化模块

> 与主项目分离的翻译基础设施

## 目录结构

```
i18n/
├── __init__.py      # 导出 t() 翻译函数
├── zh_CN.py         # 中文字典 (166 条翻译)
└── README.md        # 本文件
```

## 使用方法

### 1. 在项目中引用翻译模块

```python
from sibyl import i18n

# 基本翻译
message = i18n.t("Not authenticated")
# 输出: "请先登录"

# 带变量替换
message = i18n.t("Task not found: {task_id}", task_id="abc123")
# 输出: "任务不存在: abc123"
```

### 2. 在 FastAPI 中使用

```python
from fastapi import HTTPException
from sibyl import i18n

@app.get("/items/{item_id}")
async def read_item(item_id: str):
    item = get_item(item_id)
    if item is None:
        raise HTTPException(
            status_code=404,
            detail=i18n.t("Item not found")
        )
    return item
```

### 3. 添加新的翻译

在 `zh_CN.py` 中添加新的翻译条目：

```python
TRANSLATIONS: dict[str, str] = {
    # ... 现有翻译 ...

    # 新翻译
    "Your new message": "您的新消息",
}
```

## 支持的语言

| 语言代码 | 语言名称 | 状态 |
|----------|----------|------|
| zh_CN | 简体中文 | ✅ 完整 |
| en | English | ⏳ 待实现 |

## 翻译流程

1. **扫描**: 运行 `python scan_translations.py` 扫描项目中需要翻译的文本
2. **添加**: 在 `zh_CN.py` 中添加翻译条目
3. **使用**: 在代码中使用 `i18n.t("Your message")` 替换硬编码文本
4. **验证**: 测试应用确保翻译正确显示

## 扫描翻译

在项目根目录运行：

```bash
python scan_translations.py
```

这将生成 `TRANSLATION_PLAN.md` 文档，列出所有需要翻译的文本。

## 符号链接

本模块通过符号链接与主项目连接：

```bash
# Windows (PowerShell 管理员)
cd apps/api/src/sibyl
mklink /D i18n ..\..\..\..\i18n

# Linux/macOS
cd apps/api/src/sibyl
ln -s ../../../i18n i18n
```

## 统计

- **总翻译数**: 166 条
- **类别数**: 20+ 个
- **最近更新**: 2026-01-14
