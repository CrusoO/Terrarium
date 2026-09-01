from __future__ import annotations

import os
import unittest

from terrarium_sandbox.runner import preview_url, session_slug


class PreviewUrlTests(unittest.TestCase):
    def tearDown(self) -> None:
        os.environ.pop("TERRARIUM_PREVIEW_MODE", None)

    def test_path_mode_is_same_origin(self) -> None:
        os.environ["TERRARIUM_PREVIEW_MODE"] = "path"
        self.assertEqual(
            preview_url("6a88e7526ba14962acb8c567d26a5dce"),
            "/preview/6a88e7526ba14962acb8c567d26a5dce/",
        )

    def test_host_mode_keeps_traefik_subdomain(self) -> None:
        os.environ["TERRARIUM_PREVIEW_MODE"] = "host"
        url = preview_url("abc123", host="127.0.0.1.nip.io")
        self.assertEqual(url, "http://abc123.127.0.0.1.nip.io")

    def test_slug_strips_unsafe_chars(self) -> None:
        self.assertEqual(session_slug("Hello World!"), "hello-world")


if __name__ == "__main__":
    unittest.main()
