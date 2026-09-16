from __future__ import annotations

import unittest
from unittest.mock import patch

from terrarium_agents.llm import (
    DEFAULT_NVIDIA_CODEGEN_MODEL,
    _loads_object,
    bedrock_model_ids,
    complete_json,
)


class LlmParseTests(unittest.TestCase):
    def test_loads_json_object(self) -> None:
        parsed = _loads_object('{"files": {"index.html": "<html></html>"}}')
        self.assertEqual(parsed, {"files": {"index.html": "<html></html>"}})

    def test_strips_think_and_fences(self) -> None:
        parsed = _loads_object(
            "<think>planning</think>\n```json\n{\"index.html\": \"<html></html>\"}\n```"
        )
        self.assertEqual(parsed, {"index.html": "<html></html>"})

    def test_bedrock_eu_ids_add_inference_prefix(self) -> None:
        ids = bedrock_model_ids("anthropic.claude-sonnet-4-6", "eu-central-1")
        self.assertEqual(ids[0], "anthropic.claude-sonnet-4-6")
        self.assertIn("eu.anthropic.claude-sonnet-4-6", ids)

    def test_bedrock_us_ids_stay_plain(self) -> None:
        ids = bedrock_model_ids("anthropic.claude-sonnet-4-6", "us-east-1")
        self.assertEqual(ids, ["anthropic.claude-sonnet-4-6"])

    def test_nvidia_fallback_does_not_use_bedrock_model_id(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "NVIDIA_API_KEY": "test",
            "BEDROCK_MODEL": "anthropic.claude-sonnet-4-6",
        }
        with (
            patch.dict("os.environ", env, clear=True),
            patch("terrarium_agents.llm._bedrock_json", return_value=None),
            patch("terrarium_agents.llm._nvidia_json", return_value={"files": {}}) as nvidia,
        ):
            payload = complete_json("system", "user", purpose="codegen")

        self.assertEqual(payload, {"files": {}})
        self.assertEqual(nvidia.call_args.args[2], DEFAULT_NVIDIA_CODEGEN_MODEL)

    def test_nvidia_first_codegen_tries_coding_model_before_bedrock(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "NVIDIA_API_KEY": "test",
            "BEDROCK_MODEL": "anthropic.claude-sonnet-4-6",
        }
        with (
            patch.dict("os.environ", env, clear=True),
            patch("terrarium_agents.llm._nvidia_json", return_value={"files": {}}) as nvidia,
            patch("terrarium_agents.llm._bedrock_json", return_value=None) as bedrock,
        ):
            payload = complete_json("system", "user", purpose="codegen", nvidia_first=True)

        self.assertEqual(payload, {"files": {}})
        self.assertEqual(nvidia.call_args.args[2], DEFAULT_NVIDIA_CODEGEN_MODEL)
        bedrock.assert_not_called()


if __name__ == "__main__":
    unittest.main()
