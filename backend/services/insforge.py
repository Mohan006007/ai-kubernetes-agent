import httpx
from core.config import settings
from core.logging import logger


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.insforge_anon_key}",
        "Content-Type": "application/json",
    }


def _db_url(table: str) -> str:
    return f"{settings.insforge_base_url}/api/database/records/{table}"


def publish_progress(session_id: str, step: str, done: bool = False) -> None:
    if not settings.insforge_base_url:
        return
    try:
        with httpx.Client(timeout=5) as client:
            client.post(
                f"{settings.insforge_base_url}/api/realtime/publish",
                headers=_headers(),
                json={
                    "channel": f"investigation:{session_id}",
                    "event": "progress",
                    "payload": {"step": step, "done": done},
                },
            )
            r = client.post(
                _db_url("investigation_progress"),
                headers=_headers(),
                json=[{"session_id": session_id, "step": step, "done": done}],
            )
            if r.status_code not in (200, 201):
                logger.warning(f"investigation_progress insert failed {r.status_code}: {r.text}")
    except Exception as e:
        logger.warning(f"publish_progress failed: {e}")


def save_investigation(user_id: str, root_cause: str, confidence: int) -> None:
    if not settings.insforge_base_url:
        return
    try:
        with httpx.Client(timeout=5) as client:
            r = client.post(
                _db_url("investigations"),
                headers=_headers(),
                json=[{"user_id": user_id, "root_cause": root_cause, "confidence": confidence}],
            )
            if r.status_code not in (200, 201):
                logger.warning(f"investigations insert failed {r.status_code}: {r.text}")
            else:
                logger.info(f"Investigation saved for user={user_id}")
    except Exception as e:
        logger.warning(f"save_investigation failed: {e}")
