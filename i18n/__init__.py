"""Sibyl 国际化 (i18n) 模块。

提供统一的翻译功能，支持多语言切换。
与主项目分离，位于项目根目录的 i18n 文件夹中。
"""

from typing import Any

# 导入翻译字典
from .zh_CN import TRANSLATIONS

# 默认语言
DEFAULT_LANGUAGE = "zh_CN"


def t(text: str, language: str = DEFAULT_LANGUAGE, **kwargs: Any) -> str:
    """翻译文本为指定语言。

    Args:
        text: 需要翻译的原文
        language: 目标语言代码 (默认: zh_CN)
        **kwargs: 变量替换参数，用于带占位符的文本

    Returns:
        翻译后的文本，如果找不到翻译则返回原文

    Examples:
        >>> t("Hello")
        '你好'

        >>> t("User {name} logged in", name="张三")
        '用户张三已登录'

        >>> t("Not found", language="en")
        'Not found'
    """
    if language == "zh_CN":
        translated = TRANSLATIONS.get(text)
        if translated is not None:
            if kwargs:
                try:
                    return translated.format(**kwargs)
                except KeyError:
                    return text
            return translated
    return text


def get_available_languages() -> dict[str, str]:
    """获取可用的语言列表。

    Returns:
        语言代码到语言名称的映射字典
    """
    return {
        "zh_CN": "简体中文",
        "en": "English",
    }
