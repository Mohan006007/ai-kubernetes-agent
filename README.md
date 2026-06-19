# AI Kubernetes Agent 🤖

An AI-powered Kubernetes troubleshooting agent that investigates cluster failures, analyzes logs and events, identifies root causes, and suggests fixes using LLM reasoning.

> Built with Amazon Q Developer + InsForge + OpenRouter

---

## Demo Screenshots

### Dashboard - Cluster Selection & Diagnosis
![Dashboard](screenshots/01-dashboard-cluster-diagnosis.png)

### InsForge Authentication
![Auth](screenshots/02-insforge-authentication.png)

### Investigation History - Database
![DB Investigations](screenshots/03-insforge-database-investigations.png)

### Investigation Progress - Real-time Steps
![DB Progress](screenshots/04-insforge-investigation-progress.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12 |
| AI/LLM | OpenRouter (GPT-4o-mini) via InsForge |
| Auth & DB | InsForge (PostgreSQL + Auth) |
| Container | Docker, Docker Compose |
| K8s Access | kubectl |

---

## Features

- 🔍 Multi-cluster support via kubeconfig
- 🧠 AI-powered root cause analysis with confidence scoring
- 📊 Real-time investigation progress tracking
- 💾 Investigation history stored in InsForge PostgreSQL
- 🔐 User authentication via InsForge
- 🛠️ Suggested kubectl fixes with prevention tips

## Supported Kubernetes Problems

- CrashLoopBackOff
- ImagePullBackOff / ErrImagePull
- OOMKilled
- Pending Pods
- StartError / OCI Runtime Errors
- Deployment Rollout Failures
- Service Selector Mismatch
- DNS Resolution Problems
- Readiness/Liveness Probe Failures

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- kubectl configured with cluster access
- InsForge account + API key
- OpenRouter API key

### Setup

```bash
git clone https://github.com/Mohan006007/ai-kubernetes-agent.git
cd ai-kubernetes-agent
git checkout dev
```

Create `backend/.env`:
```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
KUBECONFIG_PATH=/root/.kube/config
```

Run:
```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## Architecture

```text
User → Frontend (Next.js)
         → FastAPI Backend
              → Investigation Layer (kubectl)
                   → AI Agent (OpenRouter LLM)
                        → InsForge (Auth + DB + Realtime)
                             → Diagnosis Result → User
```

---

## Built With

- [Amazon Q Developer](https://aws.amazon.com/q/developer/) - AI coding assistant
- [InsForge](https://insforge.dev) - Backend as a Service
- [OpenRouter](https://openrouter.ai) - LLM API gateway

---

## Author

**Mohanakrishnan A G**
- GitHub: [@Mohan006007](https://github.com/Mohan006007)
