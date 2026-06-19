export interface DiagnosisResult {
  root_cause: string;
  explanation: string;
  fix: string;
  kubectl_commands: string[];
  prevention: string;
  confidence: number;
}

export interface InvestigationRecord {
  id: string;
  root_cause: string;
  confidence: number;
  status: string;
  created_at: string;
}

export interface Cluster {
  context: string;
  cluster: string;
  current: boolean;
}

export type ProgressStep =
  | "Checking Pods"
  | "Reading Logs"
  | "Analyzing Events"
  | "Inspecting Deployments"
  | "Checking Networking"
  | "AI Reasoning"
  | "Root Cause Found";

export const ALL_STEPS: ProgressStep[] = [
  "Checking Pods",
  "Reading Logs",
  "Analyzing Events",
  "Inspecting Deployments",
  "Checking Networking",
  "AI Reasoning",
  "Root Cause Found",
];
