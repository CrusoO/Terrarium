from __future__ import annotations

import unittest

from terrarium_api.github_sync import default_repo_name, repo_ready, repo_slug, safe_files


class GitHubSyncTests(unittest.TestCase):
    def test_repo_slug_prefixes_terrarium(self) -> None:
        self.assertEqual(repo_slug("My Calculator!", "abc123def"), "terrarium-my-calculator")

    def test_default_repo_name_includes_session(self) -> None:
        self.assertEqual(default_repo_name("abc123def"), "terrarium-app-abc123de")
        self.assertFalse(repo_ready({"userId": "u1"}))
        self.assertTrue(repo_ready({"owner": "me", "repo": "terrarium-app"}))

    def test_safe_files_drops_parent_paths(self) -> None:
        files = safe_files(
            {
                "src/App.jsx": "ok",
                "../secret": "no",
                ".terrarium-ready": "1",
            }
        )
        self.assertEqual(files, {"src/App.jsx": "ok"})


if __name__ == "__main__":
    unittest.main()
