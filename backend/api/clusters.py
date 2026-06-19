from fastapi import APIRouter
from kubernetes.clusters import list_clusters

router = APIRouter()


@router.get("/clusters")
def clusters():
    return {"clusters": list_clusters()}
