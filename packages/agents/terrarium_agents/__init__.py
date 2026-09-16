"""Intent, Code Generator, Editor, Self-Healing, Smart Match — filled in Phase 2/5."""

from terrarium_agents.codegen import (
    CodeGeneratorError,
    SessionPlan,
    build_session_plan,
    draft_files,
    generate,
    load_template,
)
from terrarium_agents.editor import EditorAgentError, run_editor
from terrarium_agents.heal import (
    MAX_HEAL_ATTEMPTS,
    HealAgentError,
    HealDecision,
    next_heal_attempt,
    run_heal,
)
from terrarium_agents.intent import IntentAgent, IntentError, classify_intent

__all__ = [
    "CodeGeneratorError",
    "EditorAgentError",
    "HealAgentError",
    "HealDecision",
    "IntentAgent",
    "IntentError",
    "MAX_HEAL_ATTEMPTS",
    "SessionPlan",
    "build_session_plan",
    "classify_intent",
    "draft_files",
    "generate",
    "load_template",
    "next_heal_attempt",
    "run_editor",
    "run_heal",
]
