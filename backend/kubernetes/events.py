from kubernetes.kubectl import run_kubectl

WARNING_REASONS = {"FailedScheduling", "BackOff", "FailedMount", "FailedPull", "ErrImagePull", "Unhealthy"}


def analyze_events(context: str = "") -> dict:
    result = run_kubectl(["get", "events", "-A", "--sort-by=.lastTimestamp", "--no-headers"], context=context)
    if not result["success"]:
        return {"warning_count": 0, "warnings": [], "error": result["stderr"]}

    warnings = []
    for line in result["stdout"].splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        if "Warning" in parts:
            idx = parts.index("Warning")
            reason = parts[idx + 1] if idx + 1 < len(parts) else "Unknown"
            obj = parts[idx + 2] if idx + 2 < len(parts) else "Unknown"
            message = " ".join(parts[idx + 3:])
            warnings.append({"reason": reason, "object": obj, "message": message[:200]})

    notable = [w for w in warnings if w["reason"] in WARNING_REASONS]
    return {
        "warning_count": len(warnings),
        "notable_warnings": notable,
        "all_warnings": warnings[:20],
    }
