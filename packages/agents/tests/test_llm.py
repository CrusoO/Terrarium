from __future__ import annotations

import unittest
from unittest.mock import patch

from terrarium_agents.llm import (
    DEFAULT_GEMINI_CODEGEN_MODEL,
    DEFAULT_NVIDIA_CODEGEN_MODEL,
    _loads_object,
    bedrock_model_ids,
    codegen_providers,
    complete_json,
    gemini_json_timeout_ms,
    llm_provider_order,
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

    def test_gemini_plan_timeout_is_shorter_than_codegen(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            self.assertEqual(gemini_json_timeout_ms("plan"), 45_000)
            self.assertEqual(gemini_json_timeout_ms("codegen"), 180_000)
        with patch.dict("os.environ", {"GEMINI_PLAN_TIMEOUT_S": "20"}, clear=True):
            self.assertEqual(gemini_json_timeout_ms("plan"), 20_000)

    def test_bedrock_eu_ids_add_inference_prefix(self) -> None:
        ids = bedrock_model_ids("anthropic.claude-sonnet-4-6", "eu-central-1")
        self.assertEqual(ids[0], "eu.anthropic.claude-sonnet-4-6")
        self.assertIn("anthropic.claude-sonnet-4-6", ids)

    def test_bedrock_us_ids_try_inference_profile_first(self) -> None:
        ids = bedrock_model_ids("anthropic.claude-sonnet-4-6", "us-east-1")
        self.assertEqual(ids[0], "us.anthropic.claude-sonnet-4-6")
        self.assertIn("anthropic.claude-sonnet-4-6", ids)

    def test_codegen_order_bedrock_then_gemini_without_nvidia_flag(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "GEMINI_API_KEY": "test",
            "NVIDIA_API_KEY": "stale-key",
        }
        with patch.dict("os.environ", env, clear=True):
            order = llm_provider_order("codegen")
            plan_order = llm_provider_order("plan")
        self.assertEqual(order, ["bedrock"])
        self.assertEqual(plan_order, ["bedrock", "gemini"])

    def test_explicit_gemini_order_does_not_call_bedrock(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "GEMINI_API_KEY": "test",
            "TERRARIUM_LLM_PROVIDER_ORDER": "gemini",
            "TERRARIUM_ENABLE_GEMINI_CODEGEN": "1",
        }
        with patch.dict("os.environ", env, clear=True):
            order = llm_provider_order("codegen")
            plan_order = llm_provider_order("plan")
        self.assertEqual(order, ["gemini"])
        self.assertEqual(plan_order, ["gemini"])

    def test_nvidia_only_when_explicitly_enabled(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "GEMINI_API_KEY": "test",
            "NVIDIA_API_KEY": "test",
            "TERRARIUM_ENABLE_NVIDIA": "1",
        }
        with patch.dict("os.environ", env, clear=True):
            order = llm_provider_order("codegen")
        self.assertEqual(order, ["bedrock", "nvidia"])

    def test_gemini_fallback_after_bedrock_misses(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "GEMINI_API_KEY": "test",
            "TERRARIUM_CODEGEN_STREAM": "0",
        }
        with (
            patch.dict("os.environ", env, clear=True),
            patch("terrarium_agents.llm._bedrock_json", return_value=None),
            patch("terrarium_agents.llm._gemini_json", return_value={"files": {}}) as gemini,
        ):
            payload = complete_json("system", "user", purpose="codegen")

        self.assertIsNone(payload)
        gemini.assert_not_called()

    def test_rejected_aws_token_adds_gemini_for_codegen_only(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "GEMINI_API_KEY": "test",
        }
        with patch.dict("os.environ", env, clear=True):
            rejected = codegen_providers(
                "exhausted_ids:ClientError:An error occurred (UnrecognizedClientException)"
            )
            missed = codegen_providers("empty_stream")
        self.assertEqual(rejected, ["bedrock", "gemini"])
        self.assertEqual(missed, ["bedrock"])

    def test_nvidia_codegen_when_enabled_and_others_fail(self) -> None:
        env = {
            "TERRARIUM_AGENTS": "live",
            "AWS_ACCESS_KEY_ID": "test",
            "AWS_SECRET_ACCESS_KEY": "test",
            "NVIDIA_API_KEY": "test",
            "TERRARIUM_ENABLE_NVIDIA": "1",
            "TERRARIUM_CODEGEN_STREAM": "0",
        }
        with (
            patch.dict("os.environ", env, clear=True),
            patch("terrarium_agents.llm._bedrock_json", return_value=None),
            patch("terrarium_agents.llm._gemini_json", return_value=None),
            patch("terrarium_agents.llm._nvidia_json", return_value={"files": {}}) as nvidia,
        ):
            payload = complete_json("system", "user", purpose="codegen")

        self.assertEqual(payload, {"files": {}})
        self.assertEqual(nvidia.call_args.args[2], DEFAULT_NVIDIA_CODEGEN_MODEL)


if __name__ == "__main__":
    unittest.main()
