import axios from "axios";
import { Cluster } from "@/types";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export async function getClusters(): Promise<Cluster[]> {
  const { data } = await apiClient.get("/clusters");
  return data.clusters as Cluster[];
}

export async function runInvestigation(sessionId: string, userId: string, context: string) {
  const { data } = await apiClient.post("/investigate", {
    session_id: sessionId,
    user_id: userId,
    context,
  });
  return data;
}
