"""Tests for task API validation and locking behavior."""

import pytest
from pydantic import ValidationError

from sibyl_core.models.tasks import TaskComplexity, TaskPriority, TaskStatus


class TestUpdateTaskRequestValidation:
    """Tests for UpdateTaskRequest schema validation."""

    def test_valid_status_accepted(self) -> None:
        """Valid TaskStatus values are accepted."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        # All valid statuses should work
        for status in TaskStatus:
            req = UpdateTaskRequest(status=status)
            assert req.status == status

    def test_invalid_status_rejected(self) -> None:
        """Invalid status values are rejected with validation error."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        # 'in_progress' is NOT a valid TaskStatus (should be 'doing')
        with pytest.raises(ValidationError) as exc_info:
            UpdateTaskRequest(status="in_progress")  # type: ignore[arg-type]

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "status" in str(errors[0]["loc"])

    def test_valid_priority_accepted(self) -> None:
        """Valid TaskPriority values are accepted."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        for priority in TaskPriority:
            req = UpdateTaskRequest(priority=priority)
            assert req.priority == priority

    def test_invalid_priority_rejected(self) -> None:
        """Invalid priority values are rejected."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        with pytest.raises(ValidationError) as exc_info:
            UpdateTaskRequest(priority="urgent")  # type: ignore[arg-type]

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "priority" in str(errors[0]["loc"])

    def test_valid_complexity_accepted(self) -> None:
        """Valid TaskComplexity values are accepted."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        for complexity in TaskComplexity:
            req = UpdateTaskRequest(complexity=complexity)
            assert req.complexity == complexity

    def test_invalid_complexity_rejected(self) -> None:
        """Invalid complexity values are rejected."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        with pytest.raises(ValidationError) as exc_info:
            UpdateTaskRequest(complexity="huge")  # type: ignore[arg-type]

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "complexity" in str(errors[0]["loc"])

    def test_all_fields_optional(self) -> None:
        """All fields in UpdateTaskRequest are optional."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        req = UpdateTaskRequest()
        assert req.status is None
        assert req.priority is None
        assert req.complexity is None
        assert req.title is None

    def test_partial_update(self) -> None:
        """Partial updates with only some fields work."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        req = UpdateTaskRequest(status=TaskStatus.DOING, tags=["urgent"])
        assert req.status == TaskStatus.DOING
        assert req.tags == ["urgent"]
        assert req.priority is None


class TestCreateTaskRequestValidation:
    """Tests for CreateTaskRequest schema validation."""

    def test_default_values(self) -> None:
        """CreateTaskRequest has correct default enum values."""
        from sibyl.api.routes.tasks import CreateTaskRequest

        req = CreateTaskRequest(title="Test task", project_id="proj_123")
        assert req.status == TaskStatus.TODO
        assert req.priority == TaskPriority.MEDIUM
        assert req.complexity == TaskComplexity.MEDIUM

    def test_invalid_status_rejected(self) -> None:
        """Invalid status values are rejected on create."""
        from sibyl.api.routes.tasks import CreateTaskRequest

        with pytest.raises(ValidationError):
            CreateTaskRequest(
                title="Test task",
                project_id="proj_123",
                status="in_progress",  # type: ignore[arg-type]
            )

    def test_valid_status_accepted(self) -> None:
        """Valid status values work on create."""
        from sibyl.api.routes.tasks import CreateTaskRequest

        req = CreateTaskRequest(
            title="Test task",
            project_id="proj_123",
            status=TaskStatus.BACKLOG,
            priority=TaskPriority.HIGH,
            complexity=TaskComplexity.COMPLEX,
        )
        assert req.status == TaskStatus.BACKLOG
        assert req.priority == TaskPriority.HIGH
        assert req.complexity == TaskComplexity.COMPLEX


class TestCommonInvalidStatusValues:
    """Tests for commonly confused status values."""

    def test_in_progress_is_invalid(self) -> None:
        """'in_progress' is NOT valid for tasks (use 'doing' instead)."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        with pytest.raises(ValidationError):
            UpdateTaskRequest(status="in_progress")  # type: ignore[arg-type]

    def test_doing_is_valid(self) -> None:
        """'doing' is the correct status for active work."""
        from sibyl.api.routes.tasks import UpdateTaskRequest

        req = UpdateTaskRequest(status=TaskStatus.DOING)
        assert req.status == TaskStatus.DOING
        assert str(req.status) == "doing"

    def test_status_enum_vs_epic_status(self) -> None:
        """TaskStatus and EpicStatus have different values for 'active'."""
        from sibyl_core.models.tasks import EpicStatus

        # Tasks use 'doing'
        assert TaskStatus.DOING.value == "doing"

        # Epics use 'in_progress'
        assert EpicStatus.IN_PROGRESS.value == "in_progress"

        # Verify they're different
        assert TaskStatus.DOING.value != EpicStatus.IN_PROGRESS.value
