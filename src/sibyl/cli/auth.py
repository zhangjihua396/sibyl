"""Auth-related CLI commands."""

from __future__ import annotations

import typer

from sibyl.cli.auth_store import clear_access_token, read_auth_data, set_access_token
from sibyl.cli.client import SibylClientError, get_client
from sibyl.cli.common import error, print_json, run_async, success

app = typer.Typer(help="Authentication and credentials")


@app.command("status")
def status_cmd() -> None:
    data = read_auth_data()
    token = str(data.get("access_token", "")).strip()
    if token:
        success("Auth token found in ~/.sibyl/auth.json")
    else:
        error("No auth token found (set one with: sibyl auth set-token <token>)")


@app.command("set-token")
def set_token_cmd(token: str) -> None:
    set_access_token(token.strip())
    success("Auth token saved to ~/.sibyl/auth.json")


@app.command("clear-token")
def clear_token_cmd() -> None:
    clear_access_token()
    success("Auth token cleared")


@app.command("local-signup")
def local_signup_cmd(
    email: str = typer.Option(..., "--email", "-e", help="Email address"),
    password: str = typer.Option(..., "--password", "-p", help="Password (min 8 chars)"),
    name: str = typer.Option(..., "--name", "-n", help="Display name"),
) -> None:
    """Create a local user and save the returned access token."""
    client = get_client()

    @run_async
    async def _run() -> dict:
        return await client.local_signup(email=email, password=password, name=name)

    try:
        result = _run()
        token = str(result.get("access_token", "")).strip()
        if token:
            set_access_token(token)
            success("Auth token saved to ~/.sibyl/auth.json")
        print_json(result)
    except SibylClientError as e:
        error(str(e))


@app.command("local-login")
def local_login_cmd(
    email: str = typer.Option(..., "--email", "-e", help="Email address"),
    password: str = typer.Option(..., "--password", "-p", help="Password"),
) -> None:
    """Log in via local credentials and save the returned access token."""
    client = get_client()

    @run_async
    async def _run() -> dict:
        return await client.local_login(email=email, password=password)

    try:
        result = _run()
        token = str(result.get("access_token", "")).strip()
        if token:
            set_access_token(token)
            success("Auth token saved to ~/.sibyl/auth.json")
        print_json(result)
    except SibylClientError as e:
        error(str(e))


api_key_app = typer.Typer(help="API key management")
app.add_typer(api_key_app, name="api-key")


@api_key_app.command("list")
def api_key_list() -> None:
    client = get_client()

    @run_async
    async def _run() -> dict:
        return await client.list_api_keys()

    try:
        result = _run()
        print_json(result)
    except SibylClientError as e:
        error(str(e))


@api_key_app.command("create")
def api_key_create(
    name: str = typer.Option(..., "--name", "-n", help="Display name for this key"),
    live: bool = typer.Option(True, "--live/--test", help="Use sk_live_ (default) or sk_test_"),
) -> None:
    client = get_client()

    @run_async
    async def _run() -> dict:
        return await client.create_api_key(name=name, live=live)

    try:
        result = _run()
        print_json(result)
    except SibylClientError as e:
        error(str(e))


@api_key_app.command("revoke")
def api_key_revoke(api_key_id: str) -> None:
    client = get_client()

    @run_async
    async def _run() -> dict:
        return await client.revoke_api_key(api_key_id)

    try:
        result = _run()
        print_json(result)
    except SibylClientError as e:
        error(str(e))
