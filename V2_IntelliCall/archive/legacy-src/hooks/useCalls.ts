import { useState, useCallback } from "react";
import { useAsync } from "./useAsync";
import { callsService } from "../services";
import type { Call, TranscriptLine } from "../types";

export function useCalls() {
  return useAsync<Call[]>(() => callsService.list(), []);
}

export function useCall(id: string) {
  return useAsync<Call | null>(() => callsService.get(id), [id]);
}

export function useTranscript(callId: string) {
  return useAsync<TranscriptLine[]>(() => callsService.getTranscript(callId), [callId]);
}

export function useCallActions() {
  const [loading, setLoading] = useState(false);

  const createCall = useCallback(
    async (data: { lead_id: string; campaign_id: string; agent_id: string; mode: "now" | "schedule"; scheduled_for?: string }): Promise<Call | null> => {
      setLoading(true);
      try {
        return await callsService.create(data);
      } finally {
        setLoading(false);
      }
    }, []
  );

  const cancelScheduled = useCallback(async (callId: string): Promise<Call | null> => {
    setLoading(true);
    try {
      return await callsService.cancelScheduled(callId);
    } finally {
      setLoading(false);
    }
  }, []);

  const reschedule = useCallback(async (callId: string, scheduledFor: string): Promise<Call | null> => {
    setLoading(true);
    try {
      return await callsService.reschedule(callId, scheduledFor);
    } finally {
      setLoading(false);
    }
  }, []);

  const progressLiveState = useCallback(async (callId: string, status: Call["status"]): Promise<Call | null> => {
    return callsService.progressLiveState(callId, status);
  }, []);

  return { createCall, cancelScheduled, reschedule, progressLiveState, loading };
}
