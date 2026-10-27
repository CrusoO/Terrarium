"""Unit tests stay on replay. A live sweep has to opt in outside this suite."""

import os

os.environ["CODEGEN_LLM_MODE"] = "replay"
os.environ["TERRARIUM_AGENTS"] = "stub"
os.environ.pop("DEMO_MODE", None)
os.environ.pop("TERRARIUM_KILL_SWITCH", None)
os.environ.pop("TERRARIUM_KILL_SWITCH_FILE", None)
