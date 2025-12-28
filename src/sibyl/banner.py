"""Sibyl startup banner.

✦ SIBYL — knowledge echoes forward
"""

from rich.console import Console
from rich.text import Text

from sibyl import __version__

# SilkCircuit colors
ELECTRIC_PURPLE = "#e135ff"
NEON_CYAN = "#80ffea"
CORAL = "#ff6ac1"
DIM = "#555566"


def print_banner(*, component: str | None = None) -> None:
    """Print the Sibyl startup banner.

    Args:
        component: Optional component name (e.g., "worker", "api")
    """
    console = Console(stderr=True)

    # Build the banner
    banner = Text()
    banner.append("✦ ", style=f"bold {ELECTRIC_PURPLE}")
    banner.append("SIBYL", style=f"bold {NEON_CYAN}")
    banner.append(" — ", style=DIM)
    banner.append("knowledge echoes forward", style=f"italic {CORAL}")
    banner.append("  ", style="default")
    banner.append(f"v{__version__}", style=f"dim {ELECTRIC_PURPLE}")

    if component:
        banner.append(f"  [{component}]", style=f"dim {NEON_CYAN}")

    console.print(banner)
