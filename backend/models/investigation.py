from pydantic import BaseModel


class InvestigationResult(BaseModel):
    pods: dict = {}
    logs: dict = {}
    events: dict = {}
    deployments: dict = {}
    network: dict = {}


class InvestigationResponse(BaseModel):
    status: str
    investigation: InvestigationResult
