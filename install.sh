#!/usr/bin/env bash
# Sibyl Installer
# Usage: curl -fsSL https://sibyl.dev/install.sh | sh
#
# This script:
#   1. Installs uv (if not present)
#   2. Installs sibyl-cli via uv
#   3. Starts Sibyl (prompts for API keys on first run)

set -euo pipefail

# ============================================================================
# Colors (SilkCircuit palette)
# ============================================================================
PURPLE='\033[38;2;225;53;255m'
CYAN='\033[38;2;128;255;234m'
GREEN='\033[38;2;80;250;123m'
YELLOW='\033[38;2;241;250;140m'
RED='\033[38;2;255;99;99m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# ============================================================================
# Helpers
# ============================================================================
info() { echo -e "${CYAN}▸${RESET} $1"; }
success() { echo -e "${GREEN}✓${RESET} $1"; }
warn() { echo -e "${YELLOW}!${RESET} $1"; }
error() { echo -e "${RED}✗${RESET} $1"; exit 1; }

banner() {
    echo -e "${PURPLE}${BOLD}"
    cat << 'EOF'
   _____ _ __          __
  / ___/(_) /_  __  __/ /
  \__ \/ / __ \/ / / / /
 ___/ / / /_/ / /_/ / /
/____/_/_.___/\__, /_/
             /____/
EOF
    echo -e "${RESET}"
    echo -e "${DIM}Collective Intelligence Runtime${RESET}"
    echo
}

# ============================================================================
# Checks
# ============================================================================
check_os() {
    case "$(uname -s)" in
        Linux*)  OS=linux ;;
        Darwin*) OS=macos ;;
        *)       error "Unsupported OS: $(uname -s). Use Linux or macOS." ;;
    esac
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is required but not installed.\n\n  Install from: https://docs.docker.com/get-docker/"
    fi

    if ! docker info &> /dev/null; then
        error "Docker daemon is not running.\n\n  Start Docker and try again."
    fi

    success "Docker is available"
}

# ============================================================================
# Installation
# ============================================================================
install_uv() {
    if command -v uv &> /dev/null; then
        success "uv is already installed ($(uv --version))"
        return
    fi

    info "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # Add to PATH for this session
    export PATH="$HOME/.local/bin:$PATH"

    if command -v uv &> /dev/null; then
        success "uv installed successfully"
    else
        error "Failed to install uv"
    fi
}

install_sibyl() {
    info "Installing sibyl-cli..."

    if uv tool list 2>/dev/null | grep -q "sibyl-cli"; then
        warn "sibyl-cli is already installed, upgrading..."
        uv tool upgrade sibyl-cli
    else
        uv tool install sibyl-cli
    fi

    # Ensure tool bin is in PATH
    export PATH="$HOME/.local/bin:$PATH"

    if command -v sibyl &> /dev/null; then
        success "sibyl-cli installed successfully"
    else
        error "Failed to install sibyl-cli"
    fi
}

# ============================================================================
# Main
# ============================================================================
main() {
    banner

    check_os
    check_docker

    echo
    install_uv
    install_sibyl

    echo
    echo -e "${GREEN}${BOLD}Installation complete!${RESET}"
    echo
    echo -e "Starting Sibyl..."
    echo

    # Start Sibyl (will prompt for API keys on first run)
    sibyl local start
}

main "$@"
