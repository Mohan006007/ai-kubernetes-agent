import subprocess
from core.logging import logger


def run_kubectl(args: list[str], context: str = "") -> dict:
    cmd = ["kubectl"]
    if context:
        cmd += ["--context", context]
    cmd += args
    logger.info(f"kubectl {' '.join(cmd[1:])}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            logger.warning(f"kubectl error: {result.stderr.strip()}")
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except subprocess.TimeoutExpired:
        logger.error(f"kubectl timeout: {cmd}")
        return {"success": False, "stdout": "", "stderr": "timeout"}
    except FileNotFoundError:
        logger.error("kubectl not found")
        return {"success": False, "stdout": "", "stderr": "kubectl not found"}
