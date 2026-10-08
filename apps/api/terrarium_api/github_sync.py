"""Create or update a GitHub repo from a Terrarium FileMap. Never logs tokens."""

from __future__ import annotations

import base64
import logging
import re
from pathlib import Path

import httpx

from terrarium_api.session_log import SessionEventLog
from terrarium_api.settings import ssl_verify

logger = logging.getLogger(__name__)

_API = "https://api.github.com"
_SKIP_NAMES = {".terrarium-ready"}


def repo_slug(name: str, session_id: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)[:40].strip("-")
    if not slug:
        slug = f"terrarium-{session_id[:8]}"
    if not slug.startswith("terrarium-"):
        slug = f"terrarium-{slug}"
    return slug[:100]


def default_repo_name(session_id: str) -> str:
    return repo_slug(f"app-{session_id[:8]}", session_id)


def repo_ready(binding: dict[str, str] | None) -> bool:
    return bool(binding and binding.get("owner") and binding.get("repo"))


def safe_files(files: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for rel, body in files.items():
        path = Path(rel)
        if path.is_absolute() or ".." in path.parts:
            continue
        name = path.as_posix()
        if name.startswith("./"):
            name = name[2:]
        name = name.lstrip("/")
        if not name or name in _SKIP_NAMES:
            continue
        if len(body.encode("utf-8")) > 1_000_000:
            continue
        out[name] = body
    return out


class GitHubError(RuntimeError):
    pass


def _headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def github_user(token: str) -> dict[str, str]:
    with httpx.Client(timeout=20.0, verify=ssl_verify()) as client:
        response = client.get(f"{_API}/user", headers=_headers(token))
    if response.status_code >= 400:
        raise GitHubError("GitHub login expired. Connect GitHub again.")
    data = response.json()
    login = str(data.get("login") or "")
    if not login:
        raise GitHubError("GitHub did not return a username.")
    return {"login": login}


def ensure_repo(
    token: str, name: str, description: str, *, private: bool = True
) -> dict[str, str]:
    user = github_user(token)
    login = user["login"]
    with httpx.Client(timeout=30.0, verify=ssl_verify()) as client:
        created = client.post(
            f"{_API}/user/repos",
            headers=_headers(token),
            json={
                "name": name,
                "private": private,
                "auto_init": True,
                "description": description[:350] or "Generated with Terrarium",
            },
        )
        if created.status_code == 201:
            data = created.json()
        elif created.status_code == 422:
            existing = client.get(f"{_API}/repos/{login}/{name}", headers=_headers(token))
            if existing.status_code >= 400:
                raise GitHubError(f"Could not open GitHub repo {login}/{name}.")
            data = existing.json()
        else:
            raise GitHubError("Could not create the GitHub repo.")
    return {
        "owner": str(data.get("owner", {}).get("login") or login),
        "repo": str(data.get("name") or name),
        "branch": str(data.get("default_branch") or "main"),
        "htmlUrl": str(data.get("html_url") or f"https://github.com/{login}/{name}"),
    }


def push_files(token: str, repo: dict[str, str], files: dict[str, str], message: str) -> str:
    owner = repo["owner"]
    name = repo["repo"]
    branch = repo.get("branch") or "main"
    payload = safe_files(files)
    if not payload:
        raise GitHubError("No safe files to push.")
    headers = _headers(token)
    with httpx.Client(timeout=45.0, verify=ssl_verify()) as client:
        ref = client.get(f"{_API}/repos/{owner}/{name}/git/ref/heads/{branch}", headers=headers)
        if ref.status_code == 404:
            ref = client.get(f"{_API}/repos/{owner}/{name}/git/ref/heads/master", headers=headers)
            branch = "master"
        if ref.status_code >= 400:
            raise GitHubError("Could not read the repo branch.")
        commit_sha = str(ref.json()["object"]["sha"])
        commit = client.get(f"{_API}/repos/{owner}/{name}/git/commits/{commit_sha}", headers=headers)
        commit.raise_for_status()
        base_tree = str(commit.json()["tree"]["sha"])
        tree_items: list[dict[str, str]] = []
        for path, body in payload.items():
            blob = client.post(
                f"{_API}/repos/{owner}/{name}/git/blobs",
                headers=headers,
                json={
                    "content": base64.b64encode(body.encode("utf-8")).decode("ascii"),
                    "encoding": "base64",
                },
            )
            if blob.status_code >= 400:
                raise GitHubError(f"Could not upload {path}.")
            tree_items.append(
                {
                    "path": path,
                    "mode": "100644",
                    "type": "blob",
                    "sha": str(blob.json()["sha"]),
                }
            )
        tree = client.post(
            f"{_API}/repos/{owner}/{name}/git/trees",
            headers=headers,
            json={"base_tree": base_tree, "tree": tree_items},
        )
        if tree.status_code >= 400:
            raise GitHubError("Could not build the Git tree.")
        new_commit = client.post(
            f"{_API}/repos/{owner}/{name}/git/commits",
            headers=headers,
            json={
                "message": message,
                "tree": str(tree.json()["sha"]),
                "parents": [commit_sha],
            },
        )
        if new_commit.status_code >= 400:
            raise GitHubError("Could not create the Git commit.")
        update = client.patch(
            f"{_API}/repos/{owner}/{name}/git/refs/heads/{branch}",
            headers=headers,
            json={"sha": str(new_commit.json()["sha"])},
        )
        if update.status_code >= 400:
            raise GitHubError("Could not update the GitHub branch.")
    return str(new_commit.json().get("html_url") or repo.get("htmlUrl") or "")


async def sync_session_to_github(
    log: SessionEventLog,
    session_id: str,
    files: dict[str, str],
    *,
    user_id: str | None = None,
    repo_name: str | None = None,
    message: str = "Update generated app from Terrarium",
) -> dict[str, str] | None:
    binding = await log.load_github_repo(session_id)
    owner_id = user_id or (binding or {}).get("userId")
    if not owner_id:
        return None
    token = await log.resolve_github_token(owner_id, session_id)
    if not token:
        return None
    if not repo_ready(binding):
        name = repo_slug(repo_name or default_repo_name(session_id), session_id)
        created = ensure_repo(token, name, "Generated with Terrarium")
        created["userId"] = owner_id
        binding = created
        await log.save_github_repo(session_id, binding)
    push_files(token, binding, files, message)
    await log.save_github_repo(session_id, binding)
    logger.info("GitHub synced %s to %s/%s", session_id, binding.get("owner"), binding.get("repo"))
    return binding
