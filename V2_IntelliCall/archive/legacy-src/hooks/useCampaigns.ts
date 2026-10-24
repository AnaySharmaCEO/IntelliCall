import { useAsync } from "./useAsync";
import { campaignsService } from "../services";
import type { Campaign } from "../types";

export function useCampaigns() {
  return useAsync<Campaign[]>(() => campaignsService.list(), []);
}

export function useCampaign(id: string) {
  return useAsync<Campaign | null>(() => campaignsService.get(id), [id]);
}
