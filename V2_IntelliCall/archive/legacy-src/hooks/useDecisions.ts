import { useState, useCallback } from "react";
import { useAsync } from "./useAsync";
import { decisionsService } from "../services";
import type { Decision } from "../types";

export function useDecisions() {
  return useAsync<Decision[]>(() => decisionsService.list(), []);
}

export function useDecision(id: string) {
  return useAsync<Decision | null>(() => decisionsService.get(id), [id]);
}

export function useDecisionActions() {
  const [loading, setLoading] = useState(false);

  const approve = useCallback(async (id: string, userId = "user_1"): Promise<Decision | null> => {
    setLoading(true);
    try {
      return await decisionsService.approve(id, userId);
    } finally {
      setLoading(false);
    }
  }, []);

  const override = useCallback(async (id: string, userId = "user_1"): Promise<Decision | null> => {
    setLoading(true);
    try {
      return await decisionsService.override(id, userId);
    } finally {
      setLoading(false);
    }
  }, []);

  return { approve, override, loading };
}
