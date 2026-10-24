import { useAsync } from "./useAsync";
import { dashboardService, actionsService } from "../services";
import type { Action } from "../types";

export function useDashboard() {
  const stats = useAsync(() => dashboardService.getStats(), []);
  const performance = useAsync(() => dashboardService.getCampaignPerformance(), []);
  return { stats, performance };
}

export function useActions() {
  return useAsync<Action[]>(() => actionsService.list(), []);
}
