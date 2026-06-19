from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.health import router as health_router
from api.investigate import router as investigate_router
from api.clusters import router as clusters_router
from core.logging import logger

app = FastAPI(title="AI Kubernetes Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(investigate_router)
app.include_router(clusters_router)


@app.on_event("startup")
def startup():
    logger.info("AI Kubernetes Agent backend started")
