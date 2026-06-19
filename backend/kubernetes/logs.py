from kubernetes.kubectl import run_kubectl

ERROR_KEYWORDS = ("exception", "error", "failed", "connection refused", "missing", "crash", "killed", "oomkilled")


def _is_relevant(line: str) -> bool:
    return any(kw in line.lower() for kw in ERROR_KEYWORDS)


def collect_logs(problematic_pods: list[dict], context: str = "") -> dict:
    logs = {}
    for pod in problematic_pods:
        name, namespace = pod["name"], pod["namespace"]
        result = run_kubectl(["logs", name, "-n", namespace, "--tail=50", "--previous"], context=context)
        if not result["success"]:
            result = run_kubectl(["logs", name, "-n", namespace, "--tail=50"], context=context)

        relevant = [line for line in result["stdout"].splitlines() if _is_relevant(line)]
        logs[f"{namespace}/{name}"] = relevant[:20] if relevant else result["stdout"].splitlines()[:10]

    return logs
