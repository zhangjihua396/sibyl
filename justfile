# Sibyl development tasks

default:
    @just --list

# Lint (ruff + pyright)
lint:
    uv run ruff check .
    uv run pyright

# Fix (ruff fix + format)
fix:
    uv run ruff check --fix .
    uv run ruff format .

# Fix all (including unsafe fixes)
fix-all:
    uv run ruff check --fix --unsafe-fixes .
    uv run ruff format .

# Run tests
test *args:
    uv run pytest {{args}}

# Run the server
serve:
    uv run sibyl serve
