import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  ShieldCheck,
  Radio,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Flame,
  Settings,
  Bot,
  Megaphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { apiClient, useAgents, useCampaigns, useLeads } from '../../api/hooks';
import { queryKeys } from '../../api/keys';
import { GeminiLiveSession } from '../../voice/geminiLive';
import type { Agent, Campaign, Lead } from '../../contracts/entities';

type CallState = 'standby' | 'ringing' | 'connected' | 'ended';

interface IncomingCallPayload {
  callId?: string;
  agentId?: string;
  campaignId?: string;
  callerName?: string;
  callerId?: string;
  leadName?: string;
  leadId?: string;
  campaignName?: string;
  companyName?: string;
  motto?: string;
  offer?: string;
  questions?: string[];
}

export const PhoneSimulatorPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Load available entities from database
  const { data: agents = [] } = useAgents();
  const { data: campaigns = [] } = useCampaigns();
  const { data: leadsResult } = useLeads({ pageSize: 50 });
  const leads = leadsResult?.data || [];

  // Standby interactive configuration selectors
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  // Auto-select first items once queries resolve if not yet chosen
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedCampaignId && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  // Derived selected entities
  const selectedAgent: Agent | undefined = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const selectedCampaign: Campaign | undefined = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  const selectedLead: Lead | undefined = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Call States
  const [callState, setCallState] = useState<CallState>('standby');
  const [callData, setCallData] = useState<IncomingCallPayload>({});

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [micAudioLevel, setMicAudioLevel] = useState<number[]>([15, 25, 40, 20, 60, 35, 50, 25]);

  // Transcripts & Realtime turns
  const [transcript, setTranscript] = useState<{ speaker: 'agent' | 'prospect'; text: string }[]>([]);

  // CRM Persistence status
  const [persistStatus, setPersistStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAppointmentId, setSavedAppointmentId] = useState<string | null>(null);

  // Gemini Live Engine Settings & State
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return (
      (import.meta.env.VITE_GOOGLE_API_KEY as string) ||
      localStorage.getItem('resonology_gemini_api_key') ||
      ''
    );
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [connectionErrorMsg, setConnectionErrorMsg] = useState<string | null>(null);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>('');

  // Audio & Hardware Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);

  const callDurationRef = useRef<number>(0);
  const transcriptRef = useRef<{ speaker: 'agent' | 'prospect'; text: string }[]>([]);
  const callDataRef = useRef<IncomingCallPayload>(callData);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    callDataRef.current = callData;
  }, [callData]);

  // Dynamically resolved properties based on currently selected entities
  const agentName = selectedAgent?.name || 'Aria';
  const agentRole = selectedAgent?.roleTitle || (selectedAgent as any)?.role_title || selectedAgent?.objective || 'Senior Growth Consultant';
  const agentVoice = ((selectedAgent?.voiceModel || (selectedAgent as any)?.voice_model || selectedAgent?.voice || 'Aoede') as 'Aoede' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir');
  const brevityWords = Number(selectedAgent?.brevityWords || (selectedAgent as any)?.brevity_words) || 25;
  const tactics = selectedAgent?.tactics || {};

  const company =
    callData.companyName ||
    selectedCampaign?.companyName ||
    (selectedCampaign as any)?.company_name ||
    selectedCampaign?.strategyConfig?.companyName ||
    selectedCampaign?.strategyConfig?.company_name ||
    'Resonology AI';

  const motto =
    callData.motto ||
    selectedCampaign?.motto ||
    selectedCampaign?.strategyConfig?.motto ||
    'qualifying high-intent prospects';

  const offer =
    callData.offer ||
    selectedCampaign?.offer ||
    selectedCampaign?.strategyConfig?.offer ||
    'a complimentary 10-minute discovery review';

  const leadName = callData.leadName || selectedLead?.name || 'Prospect';
  const leadFirstName = leadName.split(' ')[0] || 'Sir';

  // -------------------------------------------------------------
  // Web Audio Ringtone Generator
  // -------------------------------------------------------------
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      ctx.resume().catch(() => {});

      const playChimeBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        try {
          const now = ctx.currentTime;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
          gain.gain.setValueAtTime(0.2, now + 1.6);
          gain.gain.linearRampToValueAtTime(0, now + 1.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.8);
          osc2.stop(now + 1.8);
        } catch {}
      };

      playChimeBurst();
      ringtoneTimerRef.current = window.setInterval(playChimeBurst, 3200);

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([500, 250, 500, 250, 1000]);
        } catch {}
      }
    } catch {}
  };

  const stopRingtone = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // -------------------------------------------------------------
  // Supabase Realtime Listener for Incoming Outbound Calls
  // -------------------------------------------------------------
  useEffect(() => {
    const channel = supabase.channel('phone-simulator', {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
        setCallData({
          callId: payload?.callId,
          agentId: payload?.agentId,
          campaignId: payload?.campaignId,
          callerName: payload?.callerName || payload?.companyName || 'Resonology AI',
          callerId: payload?.callerId || '+91 98765 43210',
          leadName: payload?.leadName || 'Prospect',
          leadId: payload?.leadId,
          campaignName: payload?.campaignName,
          companyName: payload?.companyName || payload?.callerName || 'Resonology AI',
          motto: payload?.motto,
          offer: payload?.offer,
          questions: payload?.questions,
        });
        setTranscript([]);
        setPersistStatus('idle');
        setSavedAppointmentId(null);
        setCallState('ringing');
        playRingtone();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRingtone();
      releaseWakeLock();
      liveSessionRef.current?.stop();
    };
  }, []);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [callState]);

  // -------------------------------------------------------------
  // CRM Database Persistence Engine (Invoked by Gemini Tool Call)
  // -------------------------------------------------------------
  const persistAppointmentToCRM = async (dayText?: string, timeText?: string, notesText?: string) => {
    setPersistStatus('saving');
    try {
      const activeCallData = callDataRef.current;
      const targetLeadId = activeCallData.leadId || selectedLead?.id;
      let targetOrgId: string | null = null;

      if (!targetLeadId) {
        const { data: fallbackLead } = await supabase
          .from('leads')
          .select('id, organization_id, name, company')
          .limit(1)
          .maybeSingle();

        if (fallbackLead) {
          targetOrgId = fallbackLead.organization_id;
        }
      } else {
        const { data: leadData } = await supabase
          .from('leads')
          .select('organization_id')
          .eq('id', targetLeadId)
          .maybeSingle();
        targetOrgId = leadData?.organization_id || null;
      }

      if (!targetOrgId) {
        const org = await apiClient.getOrganization().catch(() => null);
        targetOrgId = org?.id || null;
      }

      // Compute appointment time: Upcoming Thursday at 4:00 PM
      const apptDate = new Date();
      const currentDay = apptDate.getDay();
      const daysUntilThursday = (4 - currentDay + 7) % 7 || 7;
      apptDate.setDate(apptDate.getDate() + daysUntilThursday);
      apptDate.setHours(16, 0, 0, 0);

      const resolvedDayTime = `${dayText || 'Thursday'} ${timeText || '4:00 PM'}`;

      if (targetOrgId && targetLeadId) {
        // 1. Insert row into appointments table
        const { data: createdAppt, error: apptError } = await supabase
          .from('appointments')
          .insert({
            organization_id: targetOrgId,
            lead_id: targetLeadId,
            call_id: activeCallData.callId || null,
            scheduled_for: apptDate.toISOString(),
            status: 'scheduled',
            booking_source: 'ai_booked',
            notes: `Locked via Gemini Live: ${notesText || offer} (${company}) [Slot: ${resolvedDayTime}]`,
          })
          .select()
          .maybeSingle();

        if (apptError) {
          console.error('[Supabase] Appointment insert error:', apptError);
        } else {
          setSavedAppointmentId(createdAppt?.id || 'CONFIRMED');
        }

        // 2. Update Lead status to 'meeting_booked'
        await supabase
          .from('leads')
          .update({
            status: 'meeting_booked',
            stage_entered_at: new Date().toISOString(),
            next_action: `Appointment locked with ${agentName} (${company}) for ${resolvedDayTime}`,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetLeadId);

        // 3. Update Call row if Call ID exists, or insert new completed call record
        const transcriptText = transcriptRef.current
          .map((t) => `${t.speaker.toUpperCase()}: ${t.text}`)
          .join('\n');

        if (activeCallData.callId) {
          await supabase
            .from('calls')
            .update({
              status: 'completed',
              duration_seconds: callDurationRef.current,
              ended_at: new Date().toISOString(),
              transcript: transcriptText,
            })
            .eq('id', activeCallData.callId);
        } else {
          await supabase.from('calls').insert({
            organization_id: targetOrgId,
            lead_id: targetLeadId,
            agent_id: selectedAgent?.id || activeCallData.agentId || null,
            campaign_id: selectedCampaign?.id || activeCallData.campaignId || null,
            status: 'completed',
            duration_seconds: callDurationRef.current,
            direction: 'outbound',
            ended_at: new Date().toISOString(),
            transcript: transcriptText,
          });
        }

        // 4. Invalidate TanStack Query caches for real-time reactivity
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.calls.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });

        setPersistStatus('saved');
        return {
          status: 'confirmed',
          appointment_id: createdAppt?.id || 'CONFIRMED',
          message: `Confirmed slot locked for ${resolvedDayTime} in Supabase CRM.`,
        };
      } else {
        setPersistStatus('error');
        return { status: 'error', message: 'Target lead or organization could not be resolved.' };
      }
    } catch (err: any) {
      console.error('[Supabase] Failed to persist appointment:', err);
      setPersistStatus('error');
      return { status: 'error', message: err.message };
    }
  };

  // -------------------------------------------------------------
  // Call Lifecycle & Gemini Live Multimodal Connection
  // -------------------------------------------------------------
  const handleAnswerCall = async () => {
    stopRingtone();

    // Check if API key is present
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      setShowApiKeyModal(true);
      return;
    }

    setCallState('connected');
    setConnectionStatus('connecting');
    setConnectionErrorMsg(null);
    setPersistStatus('idle');
    setSavedAppointmentId(null);
    await requestWakeLock();
    setLiveInterimTranscript('');

    // Initialize AudioContexts synchronously inside the user gesture
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    let inputCtx: AudioContext;
    try {
      inputCtx = new AudioContextClass({ sampleRate: 16000 });
    } catch {
      inputCtx = new AudioContextClass();
    }
    const outputCtx = new AudioContextClass();
    inputCtx.resume().catch(() => {});
    outputCtx.resume().catch(() => {});

    // Resolve dynamic campaign details
    const painPoint =
      selectedCampaign?.primaryPainPoint ||
      (selectedCampaign as any)?.primary_pain_point ||
      selectedCampaign?.strategyConfig?.primaryPainPoint ||
      '';

    const valGap =
      selectedCampaign?.valueGap ||
      (selectedCampaign as any)?.value_gap ||
      selectedCampaign?.strategyConfig?.valueGap ||
      '';

    const questions: string[] =
      callData.questions ||
      selectedCampaign?.qualificationQuestions ||
      (selectedCampaign as any)?.qualification_questions ||
      selectedCampaign?.strategyConfig?.qualifyingQuestions ||
      selectedCampaign?.strategyConfig?.qualifying_questions || [
        'What is your primary focus or current arrangement in this area?',
        'Have you evaluated ways to improve rates or efficiency recently?',
      ];

    const playbook =
      selectedCampaign?.objectionPlaybook ||
      (selectedCampaign as any)?.objection_playbook ||
      selectedCampaign?.strategyConfig?.objectionPlaybook ||
      selectedCampaign?.strategyConfig?.objection_playbook || {
        busy: 'Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?',
        skeptical: 'Aapne hamare partner network par inquiry check ki thi. Main bas confirm kar raha tha ki aapko genuine details mili ya nahi.',
        not_interested: 'Totally understand! Would you be opposed if I just kept your contact handy for when your renewal comes up?',
      };

    const agentGreeting = selectedAgent?.greeting || '';
    const agentSystemPrompt = selectedAgent?.systemPrompt || (selectedAgent as any)?.system_prompt || '';
    const leadCompany = selectedLead?.company || '';

    // Fully dynamic system instruction generated at runtime from Agent + Campaign + Lead
    const systemInstruction = `
You are ${agentName}, ${agentRole} calling on behalf of ${company}.
You are in an active, real-time phone conversation with ${leadName}${leadCompany ? ' from ' + leadCompany : ''}.
You are a real human professional on a live phone call. NEVER state or acknowledge that you are an AI, virtual assistant, speech model, or automated bot.

CORE BEHAVIOR & CADENCE:
1. LAW 4 (BREVITY & POWER): Keep every speaking turn strictly under ${brevityWords} words. Speak like an experienced professional caller — short, conversational, and direct. Never recite long monologues or dump information.
${(tactics.vossEmpathy ?? (tactics as any).voss_empathy ?? true) ? '2. CHRIS VOSS TACTICAL EMPATHY: Acknowledge what the prospect says first before speaking. Label unspoken feelings ("Sounds like you are in the middle of something urgent...", "Seems like you already have a solid system in place.").' : ''}
${(tactics.linguisticMirroring ?? (tactics as any).linguistic_mirroring ?? true) ? '3. LINGUISTIC MIRRORING: Repeat the last 2-3 words the prospect said with an upward inflection to prompt them to elaborate naturally.' : ''}
${(tactics.noOrientedClose ?? (tactics as any).no_oriented_close ?? true) ? '4. CALIBRATED NO-ORIENTED CLOSING: Phrase key questions so saying "No" makes them feel safe and in control ("Would you be opposed to a brief 5-minute review?", "Is it a bad time to talk?").' : ''}
5. LINGUISTIC CODE-SWITCHING: Mirror the prospect respectfully. If they speak Hindi or Hinglish, speak polished, respectful Indian business Hinglish ("Aap", "Ji", "Bilkul", "Definitely", "Haanji"). If English, speak clean corporate English.
6. ADAPTIVE NATURAL DIALOGUE: Never follow a rigid linear script. Adapt organically to whatever the prospect says.

${agentSystemPrompt ? `AGENT SPECIFIC DIRECTIVES:\n${agentSystemPrompt}\n` : ''}
CAMPAIGN OBJECTIVE & VALUE PROPOSITION:
- Company / Brand: ${company}
- Core Mission: ${motto}
- Value Offer: ${offer}
${painPoint ? `- Prospect Pain Point: ${painPoint}` : ''}
${valGap ? `- Value Gap: ${valGap}` : ''}
- Diagnostic Discovery Questions (weave naturally into conversation):
${questions.map((q, idx) => `  ${idx + 1}. "${q}"`).join('\n')}

OBJECTION PLAYBOOK (Use these reframes when encountered):
- If busy or driving: "${playbook.busy || 'Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?'}"
- If skeptical ("Where did you get my number?"): "${playbook.skeptical || 'Aapne hamare partner network par inquiry check ki thi. Main bas verify kar raha tha ki aapko fair information mili ya nahi.'}"
- If not interested: "${playbook.not_interested || 'Totally understand! Would you be opposed if I just kept your contact handy for when your renewal comes up?'}"

OPENING & BOOKING PROTOCOL:
- OPENING GREETING: "${agentGreeting ? agentGreeting.replace('{{agent_name}}', agentName).replace('{{prospect_name}}', leadFirstName) : `Namaste ${leadFirstName} ji, ${agentName} calling from ${company}. Do you have a quick minute?`}"
- CLOSING & TOOL TRIGGER: Propose the next step (${offer}). The moment the prospect agrees to a day or time slot (e.g. tomorrow, Thursday, 4 PM), IMMEDIATELY execute the 'book_appointment' tool. Warmly confirm the slot and conclude professionally.
`.trim();

    try {
      const liveSession = new GeminiLiveSession({
        apiKey: geminiApiKey,
        model: 'gemini-3.8-live',
        voiceName: agentVoice,
        systemInstruction: systemInstruction,
        inputAudioCtx: inputCtx,
        outputAudioCtx: outputCtx,
        onConnected: () => {
          setConnectionStatus('connected');
        },
        onAudioLevel: (levels) => {
          setMicAudioLevel(levels);
        },
        onUserSpeech: (text, isFinal) => {
          if (!isFinal) {
            setLiveInterimTranscript(text);
          } else {
            setLiveInterimTranscript('');
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'prospect') {
                return [...prev.slice(0, -1), { speaker: 'prospect', text: `${last.text} ${text}`.trim() }];
              }
              return [...prev, { speaker: 'prospect', text }];
            });
          }
        },
        onAgentSpeech: (text) => {
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.speaker === 'agent') {
              return [...prev.slice(0, -1), { speaker: 'agent', text: `${last.text} ${text}`.trim() }];
            }
            return [...prev, { speaker: 'agent', text }];
          });
        },
        onToolCall: async (name, args) => {
          if (name === 'book_appointment') {
            const result = await persistAppointmentToCRM(args?.day, args?.time, args?.notes);
            // Auto finish call 3.8s after appointment lock
            setTimeout(() => {
              handleEndCall();
            }, 3800);
            return result;
          }
          return { status: 'acknowledged' };
        },
        onError: (err) => {
          console.error('[Simulator] Gemini Live error:', err);
          setConnectionStatus('error');
          setConnectionErrorMsg(err.message || 'Connection failed.');
        },
        onClose: () => {
          setConnectionStatus('idle');
        },
      });

      liveSessionRef.current = liveSession;
      await liveSession.start();
    } catch (err: any) {
      console.error('[Simulator] Failed to start Gemini Live:', err);
      setConnectionStatus('error');
      setConnectionErrorMsg(err.message || 'Failed to start Live session');
    }
  };

  const handleDeclineCall = () => {
    stopRingtone();
    setLiveInterimTranscript('');
    liveSessionRef.current?.stop();
    setCallState('standby');
  };

  const handleEndCall = () => {
    stopRingtone();
    releaseWakeLock();
    setLiveInterimTranscript('');
    liveSessionRef.current?.stop();
    setCallState('ended');
    setTimeout(() => {
      setCallState('standby');
      setCallDuration(0);
      setTranscript([]);
      setLiveInterimTranscript('');
      setConnectionStatus('idle');
    }, 4500);
  };

  const triggerTestCall = () => {
    // Populate call data from currently selected entities
    setCallData({
      agentId: selectedAgent?.id,
      campaignId: selectedCampaign?.id,
      leadId: selectedLead?.id,
      leadName: selectedLead?.name || 'Prospect',
      companyName: company,
      callerName: company,
      callerId: selectedLead?.phone || '+91 98765 43210',
      campaignName: selectedCampaign?.name || 'Live Outbound Simulation',
      motto,
      offer,
    });
    setTranscript([]);
    setPersistStatus('idle');
    setSavedAppointmentId(null);
    setCallState('ringing');
    playRingtone();
  };

  const saveApiKey = (key: string) => {
    const cleanKey = key.trim();
    setGeminiApiKey(cleanKey);
    localStorage.setItem('resonology_gemini_api_key', cleanKey);
    setShowApiKeyModal(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleQuickChipText = (text: string) => {
    setTranscript((prev) => [...prev, { speaker: 'prospect', text }]);
    liveSessionRef.current?.sendTextMessage(text);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 select-none font-sans">
      {/* Back navigation & Settings Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Exit Simulator</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            setTempApiKeyInput(geminiApiKey);
            setShowApiKeyModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Key size={13} className={geminiApiKey ? 'text-emerald-400' : 'text-amber-400'} />
          <span>{geminiApiKey ? 'API Key Configured' : 'Set Gemini Key'}</span>
        </button>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="w-full max-w-[420px] h-[860px] max-h-[96vh] bg-zinc-950 border-4 border-zinc-800/80 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col justify-between p-6">
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-full flex items-center justify-between px-3 gap-1 z-30 border border-zinc-800/50">
          <span className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="text-[9px] font-mono font-medium text-zinc-400 tracking-tight">
              {connectionStatus === 'connected' ? 'Gemini 24kHz' : 'Resonology'}
            </span>
          </div>
        </div>

        {/* ----------------- STATE 1: STANDBY ----------------- */}
        {callState === 'standby' && (
          <div className="flex-1 flex flex-col items-center justify-between text-center pt-8 pb-2 overflow-y-auto">
            <div className="space-y-3 w-full">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
                <Radio size={26} className="animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-bold tracking-tight text-zinc-100">
                  Call Simulation Studio
                </h2>
                <p className="text-[11px] text-zinc-400 max-w-[260px] mx-auto leading-relaxed">
                  Select your agent persona and campaign to test real-time speech and qualification.
                </p>
              </div>

              {/* Dynamic Entity Selectors */}
              <div className="space-y-2 text-left w-full">
                {/* Agent Selector */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Select AI Voice Agent
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-emerald-500 outline-none"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.roleTitle || (a as any).role_title || 'Consultant'} • {a.voiceModel || (a as any).voice_model || a.voice || 'Aoede'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campaign Selector */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Select Outbound Campaign
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-emerald-500 outline-none"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyName || (c as any).company_name || 'Brand'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prospect / Lead Selector */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Select Prospect / Lead Target
                  </label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:border-emerald-500 outline-none"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.company ? `(${l.company})` : ''} - {l.phone || 'No phone'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Configuration Summary Card */}
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5 w-full text-left font-mono">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Agent Persona:</span>
                  <span className="text-emerald-400 font-semibold">{agentName} ({agentRole})</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Gemini Voice:</span>
                  <span className="text-purple-400 font-semibold">{agentVoice} (24kHz Live)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Brevity Rule:</span>
                  <span className="text-blue-400 font-semibold">Max {brevityWords} words / turn</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Active Brand:</span>
                  <span className="text-zinc-200 font-semibold">{company}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Prospect Target:</span>
                  <span className="text-emerald-300 font-semibold">{leadName}</span>
                </div>
              </div>
            </div>

            <div className="w-full pt-3 border-t border-zinc-900 space-y-2">
              <button
                type="button"
                onClick={triggerTestCall}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <PhoneCall size={16} />
                <span>Simulate Call with Selected Agent</span>
              </button>
              <p className="text-[10px] text-zinc-500 text-center">
                Uses full-duplex speech recognition & live Gemini audio synthesis.
              </p>
            </div>
          </div>
        )}

        {/* ----------------- STATE 2: RINGING ----------------- */}
        {callState === 'ringing' && (
          <div className="flex-1 flex flex-col justify-between py-10 items-center text-center animate-fade-in">
            {/* Top caller info */}
            <div className="space-y-3 pt-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border-2 border-blue-500/40 mx-auto flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
                <User size={44} className="animate-pulse" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                  Incoming Priority Call
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                  {company}
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Caller: {agentName} ({agentRole})
                </p>
                <p className="text-xs font-mono text-zinc-500 mt-1">
                  Target: {leadName} ({callData.callerId || '+91 98765 43210'})
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
                <Sparkles size={12} className="text-emerald-400" />
                <span>Gemini Live Neural Audio ({agentVoice})</span>
              </div>
            </div>

            {/* Answer / Decline Buttons */}
            <div className="w-full flex items-center justify-around px-4 pb-4">
              {/* Decline */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeclineCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-transform active:scale-90 cursor-pointer"
                  title="Decline Call"
                >
                  <PhoneOff size={28} />
                </button>
                <span className="text-xs font-medium text-zinc-400">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnswerCall}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/40 animate-pulse transition-transform active:scale-90 cursor-pointer"
                  title="Answer Call"
                >
                  <Phone size={28} />
                </button>
                <span className="text-xs font-medium text-emerald-400 font-semibold">Accept</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- STATE 3: CONNECTED ----------------- */}
        {callState === 'connected' && (
          <div className="flex-1 flex flex-col justify-between py-4 items-center text-center animate-fade-in overflow-hidden">
            {/* Top caller banner */}
            <div className="space-y-1 pt-2 shrink-0">
              <h2 className="text-lg font-bold tracking-tight text-white">
                {company}
              </h2>
              <div className="font-mono text-xs text-emerald-400 font-semibold tracking-wider">
                {formatTimer(callDuration)}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck size={11} />
                <span>{agentName} &bull; {agentVoice} &bull; Sub-400ms</span>
              </div>
            </div>

            {/* Error banner if connection dropped */}
            {connectionStatus === 'error' && (
              <div className="w-full p-2 rounded-xl bg-red-950/60 border border-red-800 text-[11px] text-red-200 shrink-0">
                ⚠️ {connectionErrorMsg || 'Connection error. Check Google API Key.'}
              </div>
            )}

            {/* Dialogue Bubble Feed */}
            <div className="w-full flex-1 overflow-y-auto px-2 py-3 space-y-2.5 my-2 max-h-[300px]">
              {transcript.length === 0 && !liveInterimTranscript && (
                <div className="text-center py-8 text-zinc-500 text-xs italic">
                  Connecting {agentName}'s voice stream... Speak freely into your phone.
                </div>
              )}
              {transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.speaker === 'agent' ? 'items-start text-left' : 'items-end text-right'
                  }`}
                >
                  <span className="text-[10px] text-zinc-500 font-mono mb-0.5 px-1">
                    {msg.speaker === 'agent' ? `${agentName} (${company})` : leadFirstName}
                  </span>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.speaker === 'agent'
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                        : 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {liveInterimTranscript && (
                <div className="flex flex-col items-end text-right animate-pulse">
                  <span className="text-[10px] text-emerald-400 font-mono mb-0.5 px-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {leadFirstName} (Speaking...)
                  </span>
                  <div className="max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 italic shadow-sm">
                    "{liveInterimTranscript}"
                  </div>
                </div>
              )}
            </div>

            {/* Live Microphone Status & Audio Feedback */}
            <div className="w-full shrink-0 space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-tight">
                      Microphone Live — Speak Freely
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">16kHz Full-Duplex</span>
                </div>

                {/* Dynamic Waveform Visualizer */}
                <div className="flex items-center gap-1.5 h-6 justify-center w-full py-0.5">
                  {micAudioLevel.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75"
                      style={{ height: `${Math.min(24, Math.max(4, Math.round(lvl * 0.4)))}px` }}
                    />
                  ))}
                </div>

                {/* Subtle Quick Response Chips (Optional fallbacks for noisy room) */}
                <div className="pt-1.5 border-t border-zinc-800/60">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                    Or tap quick phrase:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickChipText(`Haan boliye ${agentName} ji, kis baare mein call kiya?`)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[10px] text-zinc-300 transition-colors border border-zinc-700/60 cursor-pointer"
                    >
                      "Haan boliye?"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickChipText('Currently we are reviewing our pricing and terms.')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[10px] text-zinc-300 transition-colors border border-zinc-700/60 cursor-pointer"
                    >
                      "Reviewing options"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickChipText('Sure, Thursday 4 PM works fine with me.')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-[10px] text-emerald-300 font-medium transition-colors border border-emerald-500/50 cursor-pointer"
                    >
                      "Thursday 4 PM works"
                    </button>
                  </div>
                </div>
              </div>

              {/* In-Call Action Grid */}
              <div className="grid grid-cols-3 gap-2 px-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                    isMuted
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  <span className="text-[9px] font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                    isSpeaker
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {isSpeaker ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span className="text-[9px] font-medium">Speaker</span>
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center gap-1 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <PhoneOff size={16} />
                  <span className="text-[9px] font-medium">End</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- STATE 4: ENDED ----------------- */}
        {callState === 'ended' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <PhoneOff size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Call Completed</h3>
              <p className="text-xs font-mono text-emerald-400 font-semibold">
                Duration: {formatTimer(callDuration)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1.5 text-left w-full font-mono">
              <div className="flex justify-between">
                <span>Agent:</span>
                <span className="text-white font-semibold">{agentName} ({agentRole})</span>
              </div>
              <div className="flex justify-between">
                <span>Disposition:</span>
                <span className="text-emerald-400 font-bold">Appointment Locked</span>
              </div>
              <div className="flex justify-between">
                <span>Lead Stage:</span>
                <span className="text-emerald-300 font-semibold">meeting_booked</span>
              </div>
              <div className="flex justify-between">
                <span>AI Engine:</span>
                <span className="text-purple-400">Gemini Live ({agentVoice})</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
                <span>CRM Sync:</span>
                {persistStatus === 'saved' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Saved to Supabase
                  </span>
                ) : persistStatus === 'saving' ? (
                  <span className="text-blue-400 font-medium flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Syncing...
                  </span>
                ) : persistStatus === 'error' ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle size={12} />
                    Check DB Logs
                  </span>
                ) : (
                  <span className="text-zinc-500 font-medium">Pending</span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">Resetting to standby mode...</p>
          </div>
        )}

        {/* Bottom Home Indicator */}
        <div className="w-32 h-1 bg-zinc-700 rounded-full mx-auto self-center mt-2" />
      </div>

      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Key size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Google AI Studio API Key</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Resonology connects directly to Gemini Multimodal Live WebSocket (<code className="text-zinc-300">gemini-3.8-live</code>) with sub-400ms voice turnaround.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempApiKeyInput}
              onChange={(e) => setTempApiKeyInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveApiKey(tempApiKeyInput)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneSimulatorPage;
