import json
from ai.prompt_builder import build_prompt
from ai.llm_client import call_llm
from core.logging import logger


def _parse_response(raw: str) -> dict:
    try:
        # Strip markdown code fences if model returns them
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response: {e}\nRaw: {raw[:300]}")
        return {
            "root_cause": "Unable to parse AI response",
            "explanation": raw[:500],
            "fix": "Review the raw AI output above",
            "kubectl_commands": [],
            "prevention": "",
            "confidence": 0,
        }


def analyze(investigation: dict) -> dict:
    logger.info("Building prompt for AI analysis")
    messages = build_prompt(investigation)

    logger.info("Sending investigation to LLM")
    raw = call_llm(messages)

    logger.info("Parsing AI diagnosis")
    return _parse_response(raw)
