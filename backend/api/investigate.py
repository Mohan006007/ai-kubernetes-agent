from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.diagnosis import DiagnosisResult
from services.orchestrator import run_investigation
from services.insforge import publish_progress, save_investigation
from ai.agent import analyze
from core.logging import logger

router = APIRouter()


def _friendly_error(e: Exception) -> str:
    msg = str(e).lower()
    if "kubectl not found" in msg:
        return "kubectl is not installed or not in PATH. Please install kubectl to continue."
    if "timeout" in msg:
        return "Connection to Kubernetes cluster timed out. Please verify the cluster is reachable."
    if "no such file" in msg or "kubeconfig" in msg:
        return "kubeconfig file not found. Please verify KUBECONFIG_PATH or ~/.kube/config exists."
    if "unauthorized" in msg or "forbidden" in msg:
        return "Access denied. Please verify your kubectl permissions for this cluster."
    if "llm call failed" in msg or "openrouter" in msg:
        return "AI reasoning failed. Please verify OPENROUTER_API_KEY is set correctly."
    if "connection refused" in msg or "unreachable" in msg:
        return "Unable to connect to Kubernetes cluster. Please verify the cluster is running."
    return f"Investigation failed: {e}"


class InvestigateRequest(BaseModel):
    session_id: str = ""
    user_id: str = ""
    context: str = ""


@router.post("/investigate")
def investigate(body: InvestigateRequest):
    try:
        logger.info(f"POST /investigate session={body.session_id} context={body.context or 'default'}")

        investigation = run_investigation(session_id=body.session_id, context=body.context)

        publish_progress(body.session_id, "AI Reasoning")
        diagnosis = analyze(investigation)

        publish_progress(body.session_id, "Root Cause Found", done=True)

        if body.user_id:
            save_investigation(
                user_id=body.user_id,
                root_cause=diagnosis.get("root_cause", ""),
                confidence=diagnosis.get("confidence", 0),
            )

        return {
            "status": "success",
            "diagnosis": DiagnosisResult(**diagnosis),
            "investigation": investigation,
        }
    except Exception as e:
        logger.error(f"Investigation failed: {e}")
        raise HTTPException(status_code=500, detail=_friendly_error(e))
