import { useAsync } from "./useAsync";
import { leadsService } from "../services";
import type { Lead } from "../types";

export function useLeads() {
  return useAsync<Lead[]>(() => leadsService.list(), []);
}

export function useLead(id: string) {
  return useAsync<Lead | null>(() => leadsService.get(id), [id]);
}
