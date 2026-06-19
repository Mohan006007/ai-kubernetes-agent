from kubernetes.kubectl import run_kubectl

UNHEALTHY_STATUSES = {"CrashLoopBackOff", "ImagePullBackOff", "Pending", "Error", "OOMKilled", "ContainerCreating", "StartError", "ErrImagePull", "Terminating", "Unknown", "Init:Error"}


def inspect_pods(context: str = "") -> dict:
    result = run_kubectl(["get", "pods", "-A", "--no-headers"], context=context)
    if not result["success"]:
        return {"healthy": False, "error": result["stderr"], "problematic_pods": []}

    problematic = []
    for line in result["stdout"].splitlines():
        parts = line.split()
        if len(parts) < 4:
            continue
        namespace, name, _ready, status = parts[0], parts[1], parts[2], parts[3]
        if any(s in status for s in UNHEALTHY_STATUSES):
            problematic.append({"name": name, "namespace": namespace, "status": status})

    return {"healthy": len(problematic) == 0, "problematic_pods": problematic}
