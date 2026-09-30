/**
 * Structured NL → intent + tool plan for Alumni Assistant (C8).
 * Deterministic keyword rules — LLM must not invent candidates.
 */
import type { AssistantToolName } from './typesAssistant.js';
import { HIGH_RISK_ACTIONS } from './typesAssistant.js';

export type StructuredPlan = {
  intent: string;
  tools: Array<{ name: AssistantToolName; args: Record<string, unknown> }>;
  uncertainties: string[];
  blocked?: { reason: string; code: string } | null;
  unavailable?: string[];
};

const DOMAIN_MAP: Array<{ re: RegExp; domain: string }> = [
  { re: /\bcyber\s*security|infosec|info.?sec\b/i, domain: 'cybersecurity' },
  { re: /\b\bai\b|artificial intelligence|machine learning|\bml\b/i, domain: 'AI' },
  { re: /\bdata science|analytics\b/i, domain: 'data science' },
  { re: /\bcloud|devops\b/i, domain: 'cloud' },
  { re: /\bstartup|founder\b/i, domain: 'startup' },
];

const DEPT_MAP: Array<{ re: RegExp; code: string }> = [
  { re: /\bise\b|information science/i, code: 'ISE' },
  { re: /\bcse\b|computer science/i, code: 'CSE' },
  { re: /\bece\b|electronics/i, code: 'ECE' },
  { re: /\bmech\b|mechanical/i, code: 'MECH' },
];

function extractDomain(q: string): string | null {
  for (const m of DOMAIN_MAP) if (m.re.test(q)) return m.domain;
  return null;
}

function extractDept(q: string): string | null {
  for (const m of DEPT_MAP) if (m.re.test(q)) return m.code;
  return null;
}

function extractYears(q: string): { min?: number; max?: number } {
  const range = q.match(/\b(20\d{2})\s*[–\-]\s*(20\d{2})\b/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = q.match(/\b(20\d{2})\b/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return {};
}

function detectHighRiskOverride(q: string): StructuredPlan | null {
  const lower = q.toLowerCase();
  if (
    /ignore (all |previous |prior )?instructions|bypass (rbac|permission|auth)|export all alumni emails|override consent|merge identities? without|approve recognition automatically|send campaign now|disable suppression/.test(
      lower,
    )
  ) {
    return {
      intent: 'BLOCKED_INJECTION',
      tools: [],
      uncertainties: [],
      blocked: {
        reason: 'Request attempts to bypass governance or inject instructions. Denied.',
        code: 'PROMPT_INJECTION_OR_HIGH_RISK',
      },
    };
  }
  for (const action of HIGH_RISK_ACTIONS) {
    const label = action.replace(/_/g, ' ');
    if (lower.includes(`autonomously ${label}`) || lower.includes(`auto ${label}`)) {
      return {
        intent: 'BLOCKED_HIGH_RISK',
        tools: [],
        uncertainties: [],
        blocked: {
          reason: `Autonomous ${action} is denied. Human workflow required.`,
          code: 'HIGH_RISK_DENIED',
        },
      };
    }
  }
  return null;
}

function detectUnavailable(q: string): string[] {
  const out: string[] = [];
  if (/whatsapp|read rate|open rate|delivery rate/i.test(q)) out.push('WhatsApp/SMS delivery and open/read telemetry are UNAVAILABLE (C4).');
  if (/linkedin|social listening|social enrichment/i.test(q)) out.push('LinkedIn/social enrichment is not available.');
  if (/donor wealth|net worth|loyalty score|gratitude score|relationship value score/i.test(q)) {
    out.push('Donor wealth / loyalty / gratitude scores are unsupported.');
  }
  if (/\bnba\b|\bnaac\b/i.test(q) && /criterion|criteria|standard/i.test(q)) {
    out.push('No hard-coded NBA/NAAC criteria — only institution-configured C7 mappings.');
  }
  if (/research (publication|grant|outcome)/i.test(q)) {
    out.push('Research data is limited because a dedicated Research module is not available.');
  }
  return out;
}

/**
 * Translate natural language into structured C1–C7 tool calls.
 */
export function planFromQuestion(
  question: string,
  context?: { alumniProfileId?: number | null; surface?: string | null },
): StructuredPlan {
  const blocked = detectHighRiskOverride(question);
  if (blocked) return blocked;

  const q = question.trim();
  const unavailable = detectUnavailable(q);
  const domain = extractDomain(q);
  const deptCode = extractDept(q);
  const years = extractYears(q);
  const uncertainties: string[] = [];
  const tools: StructuredPlan['tools'] = [];

  const ctxId = context?.alumniProfileId ?? null;

  // Contextual single-alumni questions
  if (ctxId && (/this alumn|why (was|were) (this|they)|when did we last|what is pending|who owns/i.test(q) || context?.surface)) {
    if (/why|suggested|match/i.test(q)) {
      tools.push({ name: 'EXPLAIN_MATCH', args: { alumniProfileId: ctxId } });
      tools.push({ name: 'GET_INTELLIGENCE', args: { alumniProfileId: ctxId } });
    } else if (/contact|pending|owner|relationship|follow.?up|outcome/i.test(q)) {
      tools.push({ name: 'GET_RELATIONSHIP', args: { alumniProfileId: ctxId } });
    } else if (/recogni|reciproc/i.test(q)) {
      tools.push({ name: 'GET_RECIPROCITY', args: { alumniProfileId: ctxId } });
      tools.push({ name: 'GET_RECOGNITION', args: { alumniProfileId: ctxId } });
    } else {
      tools.push({ name: 'GET_ALUMNI_360', args: { alumniProfileId: ctxId } });
      tools.push({ name: 'GET_RELATIONSHIP', args: { alumniProfileId: ctxId } });
    }
    return { intent: 'CONTEXTUAL_ALUMNI', tools, uncertainties, unavailable };
  }

  if (/why (was|were).*(suggested|matched|shortlist)/i.test(q)) {
    const idMatch = q.match(/alumni(?:\s+profile)?\s*#?\s*(\d+)/i);
    tools.push({
      name: 'EXPLAIN_MATCH',
      args: { alumniProfileId: idMatch ? Number(idMatch[1]) : ctxId },
    });
    return { intent: 'EXPLAIN_MATCH', tools, uncertainties, unavailable };
  }

  if (/impact|how many students|mentorship.*benefited|internship outcomes|measurable alumni|compare.*department/i.test(q)) {
    tools.push({
      name: 'GET_IMPACT_METRIC',
      args: { departmentCode: deptCode, questionHint: q.slice(0, 200) },
    });
    if (/evidence|verified/i.test(q)) tools.push({ name: 'GET_EVIDENCE', args: {} });
    if (/gap|weak evidence/i.test(q)) tools.push({ name: 'GET_EVIDENCE_GAPS', args: {} });
    return { intent: 'IMPACT', tools, uncertainties, unavailable };
  }

  if (/accreditation|evidence pack|nba|naac|mapping/i.test(q)) {
    tools.push({ name: 'GET_ACCREDITATION', args: {} });
    tools.push({ name: 'GET_EVIDENCE_GAPS', args: {} });
    return { intent: 'ACCREDITATION', tools, uncertainties, unavailable };
  }

  if (/refresh|stale|data quality|career.?data|missing alumni evidence|lack beneficiary/i.test(q)) {
    tools.push({ name: 'GET_DATA_QUALITY', args: { departmentCode: deptCode } });
    return { intent: 'DATA_QUALITY', tools, uncertainties, unavailable };
  }

  if (/open (institutional )?needs|no suitable alumni|unmatched need/i.test(q)) {
    tools.push({ name: 'GET_OPEN_NEEDS', args: { departmentCode: deptCode } });
    return { intent: 'OPEN_NEEDS', tools, uncertainties, unavailable };
  }

  if (/match|mentor|expert session|workshop|recruitment.?capable|willing to (mentor|support|recruit)/i.test(q)) {
    const dimension = /recruit/i.test(q)
      ? 'RECRUITMENT'
      : /intern/i.test(q)
        ? 'INTERNSHIP'
        : /expert|session|workshop/i.test(q)
          ? 'EXPERT_SESSION'
          : 'MENTORSHIP';
    tools.push({
      name: 'SEARCH_ALUMNI',
      args: {
        dimension,
        domain,
        departmentCode: deptCode,
        willingness: 'WILLING',
        graduationYearMin: years.min,
        graduationYearMax: years.max,
        locationHint: /\bbengaluru|bangalore\b/i.test(q) ? 'Bengaluru' : null,
      },
    });
    tools.push({
      name: 'FIND_MATCHES',
      args: { type: dimension, domain, departmentCode: deptCode },
    });
    return { intent: 'MATCH_OR_SEARCH', tools, uncertainties, unavailable };
  }

  if (/recogni|contributed repeatedly|no recent.*recognition|consider for recognition/i.test(q)) {
    tools.push({ name: 'GET_RECOGNITION', args: { considerOnly: true } });
    tools.push({ name: 'GET_RECIPROCITY', args: {} });
    return { intent: 'RECOGNITION', tools, uncertainties, unavailable };
  }

  if (/suppress|should not be contacted|fatigue|engagement audience|draft engagement/i.test(q)) {
    tools.push({ name: 'GET_ENGAGEMENT', args: { departmentCode: deptCode, domain } });
    return { intent: 'ENGAGEMENT', tools, uncertainties, unavailable };
  }

  if (/relationship|last contact|pending follow|owns this relationship/i.test(q)) {
    const idMatch = q.match(/alumni(?:\s+profile)?\s*#?\s*(\d+)/i);
    if (idMatch || ctxId) {
      tools.push({ name: 'GET_RELATIONSHIP', args: { alumniProfileId: Number(idMatch?.[1] || ctxId) } });
    } else {
      uncertainties.push('Specify an alumnus (or open from Alumni 360 / CRM) for relationship questions.');
    }
    return { intent: 'RELATIONSHIP', tools, uncertainties, unavailable };
  }

  // Default: structured alumni search
  tools.push({
    name: 'SEARCH_ALUMNI',
    args: {
      domain,
      departmentCode: deptCode,
      graduationYearMin: years.min,
      graduationYearMax: years.max,
      locationHint: /\bbengaluru|bangalore\b/i.test(q) ? 'Bengaluru' : null,
      queryText: q.slice(0, 200),
    },
  });
  if (!domain && !deptCode && !years.min) {
    uncertainties.push('Query was broad; results use authorised search filters only.');
  }
  return { intent: 'SEARCH', tools, uncertainties, unavailable };
}
