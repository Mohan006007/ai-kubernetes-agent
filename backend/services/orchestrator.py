from kubernetes.pods import inspect_pods
from kubernetes.logs import collect_logs
from kubernetes.events import analyze_events
from kubernetes.deployments import inspect_deployments
from kubernetes.network import inspect_network
from services.insforge import publish_progress
from core.logging import logger


def run_investigation(session_id: str = "", context: str = "") -> dict:
    logger.info(f"Starting investigation context={context or 'default'}")

    publish_progress(session_id, "Checking Pods")
    pods = inspect_pods(context=context)
    logger.info(f"Pods: {len(pods.get('problematic_pods', []))} problematic")

    publish_progress(session_id, "Reading Logs")
    logs = collect_logs(pods.get("problematic_pods", []), context=context)
    logger.info(f"Logs: collected for {len(logs)} pods")

    publish_progress(session_id, "Analyzing Events")
    events = analyze_events(context=context)
    logger.info(f"Events: {events.get('warning_count', 0)} warnings")

    publish_progress(session_id, "Inspecting Deployments")
    deployments = inspect_deployments(context=context)
    logger.info(f"Deployments: {len(deployments.get('unhealthy_deployments', []))} unhealthy")

    publish_progress(session_id, "Checking Networking")
    network = inspect_network(context=context)
    logger.info(f"Network: {len(network.get('missing_endpoints', []))} missing endpoints")

    return {
        "pods": pods,
        "logs": logs,
        "events": events,
        "deployments": deployments,
        "network": network,
    }
