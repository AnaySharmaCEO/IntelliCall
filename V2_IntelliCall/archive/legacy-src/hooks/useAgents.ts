import { useAsync } from "./useAsync";
import { agentsService } from "../services";
import type { Agent } from "../types";

export function useAgents() {
  return useAsync<Agent[]>(() => agentsService.list(), []);
}

export function useAgent(id: string) {
  return useAsync<Agent | null>(() => agentsService.get(id), [id]);
}
