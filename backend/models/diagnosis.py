from pydantic import BaseModel


class DiagnosisResult(BaseModel):
    root_cause: str = ""
    explanation: str = ""
    fix: str = ""
    kubectl_commands: list[str] = []
    prevention: str = ""
    confidence: int = 0
