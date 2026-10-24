// Mock conversation state data keyed by call_id
// Shaped to match what ConversationStatePanel expects

export interface ConversationStateMock {
  known_facts: { label: string; value: string; known: boolean }[];
  objective: string;
  detected_intent: string | null;
  open_objection: string | null;
  next_question: string | null;
}

export const mockConversationStates: Record<string, ConversationStateMock> = {
  call_1: {
    known_facts: [
      { label: "Company", value: "Northwind Logistics", known: true },
      { label: "Team size", value: "8 reps", known: true },
      { label: "Pain point", value: "Inconsistent outbound calls", known: true },
      { label: "Budget authority", value: "", known: false },
      { label: "Budget confirmed", value: "", known: false },
      { label: "Decision timeline", value: "", known: false },
    ],
    objective: "Confirm budget authority and decision timeline for Q3 implementation",
    detected_intent: "Interested",
    open_objection: "Budget uncertainty",
    next_question: "Who else would need to be involved in a final decision?",
  },
  call_2: {
    known_facts: [
      { label: "Company", value: "Fieldstone Retail", known: true },
      { label: "Budget", value: "Allocated this quarter", known: true },
      { label: "Urgency", value: "This week", known: true },
      { label: "Authority", value: "COO (decision-maker)", known: true },
      { label: "Prior evaluation", value: "Trialed a competitor last year", known: true },
    ],
    objective: "Book a discovery call and confirm solution fit",
    detected_intent: "Ready to buy",
    open_objection: null,
    next_question: null,
  },
  call_3: {
    known_facts: [
      { label: "Company", value: "Granite Capital", known: true },
      { label: "Role", value: "Director of Finance", known: true },
      { label: "Decision-maker", value: "", known: false },
      { label: "Budget", value: "", known: false },
      { label: "Timeline", value: "", known: false },
    ],
    objective: "Identify decision-maker and confirm initiative exists",
    detected_intent: "Exploring",
    open_objection: "Leadership approval needed",
    next_question: "What does the decision-making process look like for a tool like this?",
  },
};
