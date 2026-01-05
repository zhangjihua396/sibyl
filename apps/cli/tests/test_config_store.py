"""Tests for CLI config store."""

from pathlib import Path
from unittest.mock import patch

from sibyl_cli import config_store


class TestConfigStore:
    """Test config store operations."""

    def test_default_config_structure(self) -> None:
        """Default config has expected structure."""
        config = config_store.DEFAULT_CONFIG
        assert "server" in config
        assert "defaults" in config
        assert "paths" in config
        assert "active_context" in config
        assert "contexts" in config

    def test_default_server_url(self) -> None:
        """Default server URL is localhost:3334."""
        assert config_store.DEFAULT_CONFIG["server"]["url"] == "http://localhost:3334"

    def test_get_nested_value(self) -> None:
        """Can get nested values with dot notation."""
        test_config = {"level1": {"level2": {"value": "found"}}}
        result = config_store._get_nested(test_config, "level1.level2.value")
        assert result == "found"

    def test_get_nested_value_missing(self) -> None:
        """Returns default for missing nested values."""
        test_config = {"level1": {}}
        result = config_store._get_nested(test_config, "level1.level2.value", "default")
        assert result == "default"

    def test_set_nested_value(self) -> None:
        """Can set nested values with dot notation."""
        test_config: dict = {}
        config_store._set_nested(test_config, "level1.level2.value", "set")
        assert test_config["level1"]["level2"]["value"] == "set"

    def test_deep_copy(self) -> None:
        """Deep copy creates independent copy."""
        original = {"a": {"b": "value"}}
        copied = config_store._deep_copy(original)
        copied["a"]["b"] = "changed"
        assert original["a"]["b"] == "value"

    def test_deep_merge(self) -> None:
        """Deep merge combines dicts correctly."""
        base = {"a": {"b": 1, "c": 2}}
        override = {"a": {"b": 10, "d": 3}}
        config_store._deep_merge(base, override)
        assert base["a"]["b"] == 10
        assert base["a"]["c"] == 2
        assert base["a"]["d"] == 3


class TestContext:
    """Test Context dataclass."""

    def test_context_defaults(self) -> None:
        """Context has sensible defaults."""
        ctx = config_store.Context(name="test")
        assert ctx.name == "test"
        assert ctx.server_url == "http://localhost:3334"
        assert ctx.org_slug is None
        assert ctx.default_project is None
        assert ctx.insecure is False

    def test_context_to_dict(self) -> None:
        """Context can be converted to dict."""
        ctx = config_store.Context(
            name="prod",
            server_url="https://sibyl.example.com",
            org_slug="myorg",
            default_project="project_abc",
            insecure=True,
        )
        d = ctx.to_dict()
        assert d["server_url"] == "https://sibyl.example.com"
        assert d["org_slug"] == "myorg"
        assert d["default_project"] == "project_abc"
        assert d["insecure"] is True

    def test_context_from_dict(self) -> None:
        """Context can be created from dict."""
        data = {
            "server_url": "https://api.example.com",
            "org_slug": "testorg",
            "default_project": "project_xyz",
            "insecure": False,
        }
        ctx = config_store.Context.from_dict("staging", data)
        assert ctx.name == "staging"
        assert ctx.server_url == "https://api.example.com"
        assert ctx.org_slug == "testorg"
        assert ctx.default_project == "project_xyz"

    def test_context_from_dict_missing_optional(self) -> None:
        """Context handles missing optional fields."""
        data = {"server_url": "http://localhost:3334"}
        ctx = config_store.Context.from_dict("local", data)
        assert ctx.org_slug is None
        assert ctx.default_project is None
        assert ctx.insecure is False


class TestPathMappings:
    """Test path-to-project mappings."""

    def test_resolve_project_no_mappings(self) -> None:
        """Returns None when no mappings exist."""
        with patch.object(config_store, "get_path_mappings", return_value={}):
            result = config_store.resolve_project_from_cwd()
            assert result is None

    def test_get_current_context_no_mappings(self) -> None:
        """Returns None tuple when no mappings exist."""
        with patch.object(config_store, "get_path_mappings", return_value={}):
            project, path = config_store.get_current_context()
            assert project is None
            assert path is None


class TestWorktreeResolution:
    """Test git worktree detection and resolution."""

    def test_resolve_worktree_regular_repo(self, tmp_path: Path) -> None:
        """Regular repo (directory .git) returns None."""
        # Create a regular git repo structure
        git_dir = tmp_path / ".git"
        git_dir.mkdir()

        result = config_store._resolve_worktree_main_repo(tmp_path)
        assert result is None

    def test_resolve_worktree_no_git(self, tmp_path: Path) -> None:
        """Directory without .git returns None."""
        result = config_store._resolve_worktree_main_repo(tmp_path)
        assert result is None

    def test_resolve_worktree_detects_worktree(self, tmp_path: Path) -> None:
        """Worktree with .git file resolves to main repo."""
        # Set up main repo structure
        main_repo = tmp_path / "main-repo"
        main_repo.mkdir()
        main_git = main_repo / ".git"
        main_git.mkdir()
        worktrees_dir = main_git / "worktrees" / "feature-branch"
        worktrees_dir.mkdir(parents=True)

        # Set up worktree
        worktree = tmp_path / "worktree-feature"
        worktree.mkdir()
        git_file = worktree / ".git"
        git_file.write_text(f"gitdir: {worktrees_dir}")

        result = config_store._resolve_worktree_main_repo(worktree)
        assert result == main_repo

    def test_resolve_worktree_nested_path(self, tmp_path: Path) -> None:
        """Worktree resolution works from nested subdirectory."""
        # Set up main repo structure
        main_repo = tmp_path / "main-repo"
        main_repo.mkdir()
        main_git = main_repo / ".git"
        main_git.mkdir()
        worktrees_dir = main_git / "worktrees" / "feature-branch"
        worktrees_dir.mkdir(parents=True)

        # Set up worktree with nested dir
        worktree = tmp_path / "worktree-feature"
        worktree.mkdir()
        git_file = worktree / ".git"
        git_file.write_text(f"gitdir: {worktrees_dir}")
        nested = worktree / "src" / "deep" / "path"
        nested.mkdir(parents=True)

        result = config_store._resolve_worktree_main_repo(nested)
        assert result == main_repo

    def test_resolve_project_from_worktree(self, tmp_path: Path) -> None:
        """resolve_project_from_cwd uses main repo link when in worktree."""
        # Set up main repo structure
        main_repo = tmp_path / "main-repo"
        main_repo.mkdir()
        main_git = main_repo / ".git"
        main_git.mkdir()
        worktrees_dir = main_git / "worktrees" / "feature-branch"
        worktrees_dir.mkdir(parents=True)

        # Set up worktree
        worktree = tmp_path / "worktree-feature"
        worktree.mkdir()
        git_file = worktree / ".git"
        git_file.write_text(f"gitdir: {worktrees_dir}")

        # Mock mappings - only main repo is linked
        mappings = {str(main_repo): "project_abc123"}

        with (
            patch.object(config_store, "get_path_mappings", return_value=mappings),
            patch("os.getcwd", return_value=str(worktree)),
        ):
            result = config_store.resolve_project_from_cwd()
            assert result == "project_abc123"

    def test_get_current_context_from_worktree(self, tmp_path: Path) -> None:
        """get_current_context returns main repo path when in worktree."""
        # Set up main repo structure
        main_repo = tmp_path / "main-repo"
        main_repo.mkdir()
        main_git = main_repo / ".git"
        main_git.mkdir()
        worktrees_dir = main_git / "worktrees" / "feature-branch"
        worktrees_dir.mkdir(parents=True)

        # Set up worktree
        worktree = tmp_path / "worktree-feature"
        worktree.mkdir()
        git_file = worktree / ".git"
        git_file.write_text(f"gitdir: {worktrees_dir}")

        # Mock mappings - only main repo is linked
        mappings = {str(main_repo): "project_abc123"}

        with (
            patch.object(config_store, "get_path_mappings", return_value=mappings),
            patch("os.getcwd", return_value=str(worktree)),
        ):
            project_id, matched_path = config_store.get_current_context()
            assert project_id == "project_abc123"
            assert matched_path == str(main_repo)

    def test_direct_match_preferred_over_worktree(self, tmp_path: Path) -> None:
        """Direct cwd match takes precedence if longer than worktree match."""
        # Set up main repo structure
        main_repo = tmp_path / "main-repo"
        main_repo.mkdir()
        main_git = main_repo / ".git"
        main_git.mkdir()
        worktrees_dir = main_git / "worktrees" / "feature-branch"
        worktrees_dir.mkdir(parents=True)

        # Set up worktree with specific subpath linked
        worktree = tmp_path / "worktree-feature"
        worktree.mkdir()
        git_file = worktree / ".git"
        git_file.write_text(f"gitdir: {worktrees_dir}")
        subdir = worktree / "specific-subdir"
        subdir.mkdir()

        # Both main repo AND the worktree subdir are linked
        # The more specific (longer) path should win
        mappings = {
            str(main_repo): "project_main",
            str(subdir): "project_subdir",
        }

        with (
            patch.object(config_store, "get_path_mappings", return_value=mappings),
            patch("os.getcwd", return_value=str(subdir)),
        ):
            result = config_store.resolve_project_from_cwd()
            # Direct match to subdir is longer, so it wins
            assert result == "project_subdir"
