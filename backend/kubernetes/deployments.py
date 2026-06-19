from kubernetes.kubectl import run_kubectl


def inspect_deployments(context: str = "") -> dict:
    result = run_kubectl(["get", "deployments", "-A", "--no-headers"], context=context)
    if not result["success"]:
        return {"healthy": False, "error": result["stderr"], "unhealthy_deployments": []}

    unhealthy = []
    for line in result["stdout"].splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        namespace, name, ready, up_to_date, available = parts[0], parts[1], parts[2], parts[3], parts[4]
        desired, current = (ready.split("/") + ["0"])[:2]
        if desired != current:
            unhealthy.append({
                "name": name,
                "namespace": namespace,
                "ready": ready,
                "up_to_date": up_to_date,
                "available": available,
            })

    return {"healthy": len(unhealthy) == 0, "unhealthy_deployments": unhealthy}
