import { useAsync } from "./useAsync";
import { outcomesService } from "../services";
import type { Outcome } from "../types";

export function useOutcomes() {
  return useAsync<Outcome[]>(() => outcomesService.list(), []);
}

export function useOutcomeFunnel() {
  return useAsync<{ stage: string; count: number }[]>(() => outcomesService.getFunnel(), []);
}
