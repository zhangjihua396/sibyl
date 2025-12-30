"""Sibyl color palette - single source of truth.

Electric meets elegant. Used across all Sibyl components for
consistent terminal output and styling.
"""

from __future__ import annotations

# =============================================================================
# Hex Colors (Rich/CSS)
# =============================================================================

ELECTRIC_PURPLE = "#e135ff"
NEON_CYAN = "#80ffea"
CORAL = "#ff6ac1"
ELECTRIC_YELLOW = "#f1fa8c"
SUCCESS_GREEN = "#50fa7b"
ERROR_RED = "#ff6363"
DIM = "#555566"

# =============================================================================
# ANSI 24-bit Escape Codes (direct terminal output)
# =============================================================================

ANSI_ELECTRIC_PURPLE = "\033[38;2;225;53;255m"
ANSI_NEON_CYAN = "\033[38;2;128;255;234m"
ANSI_CORAL = "\033[38;2;255;106;193m"
ANSI_ELECTRIC_YELLOW = "\033[38;2;241;250;140m"
ANSI_SUCCESS_GREEN = "\033[38;2;80;250;123m"
ANSI_ERROR_RED = "\033[38;2;255;99;99m"
ANSI_DIM = "\033[38;2;85;85;102m"
ANSI_RESET = "\033[0m"
ANSI_BOLD = "\033[1m"

# =============================================================================
# Log Level Color Mapping
# =============================================================================

LEVEL_COLORS: dict[str, str] = {
    "trace": ANSI_DIM,
    "debug": ANSI_DIM,
    "info": ANSI_NEON_CYAN,
    "warning": ANSI_ELECTRIC_YELLOW,
    "warn": ANSI_ELECTRIC_YELLOW,
    "error": ANSI_ERROR_RED,
    "critical": ANSI_ELECTRIC_PURPLE,
    "fatal": ANSI_ELECTRIC_PURPLE,
}
