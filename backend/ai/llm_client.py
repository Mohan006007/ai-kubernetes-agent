import json
import httpx
from core.config import settings
from core.logging import logger

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o-mini"
MAX_RETRIES = 2


def call_llm(messages: list[dict]) -> str:
    model = settings.openrouter_model or DEFAULT_MODEL
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-kubernetes-agent",
        "X-Title": "AI Kubernetes Agent",
    }
    payload = {"model": model, "messages": messages}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"LLM request attempt {attempt} model={model}")
            with httpx.Client(timeout=60) as client:
                response = client.post(OPENROUTER_URL, headers=headers, json=payload)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                logger.info("LLM response received")
                return content
        except httpx.TimeoutException:
            logger.warning(f"LLM timeout on attempt {attempt}")
        except httpx.HTTPStatusError as e:
            logger.error(f"LLM HTTP error {e.response.status_code}: {e.response.text}")
            break
        except Exception as e:
            logger.error(f"LLM unexpected error: {e}")
            break

    raise RuntimeError("LLM call failed after retries")
