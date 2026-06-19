import os
import yaml
from core.logging import logger


def _kubeconfig_path() -> str:
    return os.environ.get("KUBECONFIG", os.path.expanduser("~/.kube/config"))


def list_clusters() -> list[dict]:
    path = _kubeconfig_path()
    if not os.path.exists(path):
        logger.warning(f"kubeconfig not found at {path}")
        return []

    try:
        with open(path) as f:
            config = yaml.safe_load(f)

        current = config.get("current-context", "")
        contexts = config.get("contexts") or []
        clusters = []

        for ctx in contexts:
            name = ctx.get("name", "")
            cluster_name = (ctx.get("context") or {}).get("cluster", name)
            clusters.append({
                "context": name,
                "cluster": cluster_name,
                "current": name == current,
            })

        return clusters
    except Exception as e:
        logger.error(f"Failed to parse kubeconfig: {e}")
        return []
