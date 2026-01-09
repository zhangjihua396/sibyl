"""Version information for sibyl-core.

Base version comes from VERSION file at repo root (read by hatchling at build time).
Runtime version adds git info for dev builds.
"""

from __future__ import annotations

import subprocess
from functools import lru_cache
from importlib.metadata import version as pkg_version
from pathlib import Path


@lru_cache(maxsize=1)
def _get_git_info() -> tuple[str, bool]:
    """Get git commit hash and whether we're on a release tag.

    Returns:
        (short_hash, is_release) - hash is empty string if not in git repo
    """
    try:
        # Find repo root
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            return "", False

        repo_root = Path(result.stdout.strip())

        # Get short commit hash
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            cwd=repo_root,
            timeout=5,
        )
        if result.returncode != 0:
            return "", False

        short_hash = result.stdout.strip()

        # Check if current commit is tagged with a version
        result = subprocess.run(
            ["git", "describe", "--tags", "--exact-match", "HEAD"],
            capture_output=True,
            text=True,
            cwd=repo_root,
            timeout=5,
        )
        is_release = result.returncode == 0 and result.stdout.strip().startswith("v")

        return short_hash, is_release
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return "", False


@lru_cache(maxsize=1)
def get_version() -> str:
    """Get the full version string.

    Returns:
        - Release: "0.1.0"
        - Dev build: "0.1.0+gabc1234"
    """
    try:
        base_version = pkg_version("sibyl-core")
    except Exception:
        base_version = "0.0.0"

    git_hash, is_release = _get_git_info()

    if is_release or not git_hash:
        return base_version

    # Dev build: append git hash
    return f"{base_version}+g{git_hash}"


__version__ = get_version()
