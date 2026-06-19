from kubernetes.kubectl import run_kubectl


def inspect_network(context: str = "") -> dict:
    svc_result = run_kubectl(["get", "svc", "-A", "--no-headers"], context=context)
    ep_result = run_kubectl(["get", "endpoints", "-A", "--no-headers"], context=context)

    services = []
    if svc_result["success"]:
        for line in svc_result["stdout"].splitlines():
            parts = line.split()
            if len(parts) >= 4:
                services.append({"namespace": parts[0], "name": parts[1], "type": parts[2], "cluster_ip": parts[3]})

    missing_endpoints = []
    if ep_result["success"]:
        for line in ep_result["stdout"].splitlines():
            parts = line.split()
            if len(parts) >= 3 and parts[2] == "<none>":
                missing_endpoints.append({"namespace": parts[0], "name": parts[1]})

    return {
        "service_count": len(services),
        "services": services,
        "missing_endpoints": missing_endpoints,
        "has_networking_issues": len(missing_endpoints) > 0,
    }
