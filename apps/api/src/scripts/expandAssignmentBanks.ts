import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../web/public/assessments');

const TYPES = [
  'DESCRIPTIVE',
  'SHORT_ANALYSIS',
  'USE_CASE',
  'CASE_STUDY',
  'PROBLEM_SOLVING',
  'DESIGN',
  'COMPARE_JUSTIFY',
  'APPLICATION',
  'RESEARCH_TASK',
  'CODE_EXPLANATION',
  'SCENARIO',
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'assignment.md') out.push(full);
  }
  return out;
}

function parseExisting(content) {
  const blocks = content.split(/^###\s+/m).slice(1);
  const items = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const heading = lines[0] || '';
    const m = heading.match(/^A\s*0*(\d+)\s*[·•|]\s*(.+)$/i);
    if (!m) continue;
    const parts = m[2].split(/\s*[·•|]\s*/).map((p) => p.trim());
    let difficulty = 'Intermediate';
    let marks = 10;
    let typeLabel = 'DESCRIPTIVE';
    for (const p of parts) {
      if (/^easy$/i.test(p)) difficulty = 'Easy';
      else if (/^intermediate|medium$/i.test(p)) difficulty = 'Intermediate';
      else if (/^difficult|hard$/i.test(p)) difficulty = 'Difficult';
      const mm = p.match(/^(\d+)\s*marks?$/i);
      if (mm) marks = Number(mm[1]);
      if (!/easy|intermediate|difficult|medium|hard|\d+\s*marks?|^CO\d+/i.test(p) && p.length > 1) {
        typeLabel = p;
      }
    }
    let question = '';
    let model = '';
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      const q = line.match(/^\*\*Question:\*\*\s*(.*)$/i);
      if (q) {
        question = q[1];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() && !/^\*\*/.test(lines[j].trim())) {
          question += ` ${lines[j].trim()}`;
          j += 1;
        }
        i = j - 1;
        continue;
      }
      const a = line.match(/^\*\*(?:Model answer|Expected Key Points):\*\*\s*(.*)$/i);
      if (a) {
        const buf = [a[1]];
        let j = i + 1;
        while (j < lines.length && !/^\*\*(Question|Mapping|Verification)/i.test(lines[j].trim())) {
          if (lines[j].trim()) buf.push(lines[j].trim());
          j += 1;
        }
        model = buf.filter(Boolean).join('\n');
        i = j - 1;
      }
    }
    items.push({
      id: Number(m[1]),
      difficulty,
      marks,
      typeLabel,
      question: question.trim(),
      model: model.trim(),
    });
  }
  return items;
}

function mapType(label) {
  const t = String(label || '')
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');
  const aliases = {
    DEFINITION: 'DESCRIPTIVE',
    SHORT_NOTES: 'DESCRIPTIVE',
    EXPLAIN: 'DESCRIPTIVE',
    LIST: 'SHORT_ANALYSIS',
    CONSTRUCTION: 'DESIGN',
    PRODUCT: 'PROBLEM_SOLVING',
    PROOF: 'PROBLEM_SOLVING',
    NUMERICAL: 'PROBLEM_SOLVING',
    COMPARE: 'COMPARE_JUSTIFY',
    CASE: 'CASE_STUDY',
    LAB: 'RESEARCH_TASK',
    ANALYSIS: 'SHORT_ANALYSIS',
  };
  if (TYPES.includes(t)) return t;
  return aliases[t] || 'DESCRIPTIVE';
}

function marksFor(d) {
  if (d === 'Easy') return 5;
  if (d === 'Difficult') return 15;
  return 10;
}

function keyPointsFromModel(model) {
  if (!model) {
    return [
      'State core definition/concept correctly',
      'Include one worked example or justification',
      'Conclude with implication or limitation',
    ];
  }
  const bullets = model
    .split(/(?<=\.)\s+/)
    .map((s) => s.replace(/^[-*]\s*/, '').trim())
    .filter((s) => s.length > 12)
    .slice(0, 5);
  if (bullets.length >= 2) return bullets;
  return [model];
}

function inferCo(question, index, totalCos = 5) {
  const q = question.toLowerCase();
  const rules = [
    [/\b(define|what is|list|identify|basic|introduce|alphabet|overview)\b/, 1],
    [/\b(explain|describe|compare|distinguish|properties|regular|dfa|nfa)\b/, 2],
    [/\b(design|construct|build|convert|implement|algorithm|protocol)\b/, 3],
    [/\b(prove|justify|analyse|analyze|evaluate|critique|pumping|complexity)\b/, 4],
    [/\b(apply|case|scenario|real[- ]world|industry|project|research|lab)\b/, 5],
  ];
  for (const [re, co] of rules) {
    if (re.test(q)) return `CO${Math.min(co, totalCos)}`;
  }
  return `CO${(index % totalCos) + 1}`;
}

function shorten(text, salt) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  const slice = clean.slice(0, 90);
  return slice.length < clean.length ? `${slice}…` : slice || `topic-${salt + 1}`;
}

function expansionSeeds(existing, moduleTitle) {
  const topics = existing.map((e) => e.question).slice(0, 12);
  const stems = [
    {
      difficulty: 'Easy',
      type: 'DESCRIPTIVE',
      make: (t, i) => ({
        q: `Summarise the key idea behind this module topic in your own words, then give one campus/lab example: “${shorten(t, i)}”.`,
        model: 'Accurate summary of concept; concrete example; clear terminology.',
      }),
    },
    {
      difficulty: 'Easy',
      type: 'SHORT_ANALYSIS',
      make: (t, i) => ({
        q: `Identify two common student misconceptions related to: “${shorten(t, i)}”. Correct each briefly.`,
        model: 'Two plausible misconceptions; precise corrections; why they arise.',
      }),
    },
    {
      difficulty: 'Intermediate',
      type: 'APPLICATION',
      make: (t, i) => ({
        q: `Apply the concept in “${shorten(t, i)}” to a new input/scenario of your choice. Show steps and state the outcome.`,
        model: 'Valid scenario; correct stepwise application; final result with reasoning.',
      }),
    },
    {
      difficulty: 'Intermediate',
      type: 'USE_CASE',
      make: (t, i) => ({
        q: `Propose a realistic use-case where “${shorten(t, i)}” improves system behaviour. Discuss assumptions and failure modes.`,
        model: 'Credible use-case; assumptions listed; at least one failure/limitation.',
      }),
    },
    {
      difficulty: 'Intermediate',
      type: 'COMPARE_JUSTIFY',
      make: (t, i) => ({
        q: `Compare two alternative approaches relevant to “${shorten(t, i)}”. Justify which you would choose for a time-constrained academic project.`,
        model: 'Clear comparison criteria; trade-offs; justified recommendation.',
      }),
    },
    {
      difficulty: 'Intermediate',
      type: 'SCENARIO',
      make: (t, i) => ({
        q: `A teammate claims a shortcut that contradicts “${shorten(t, i)}”. Diagnose the claim and explain the correct reasoning.`,
        model: 'Identify the flaw; restate correct principle; give a counter-example.',
      }),
    },
    {
      difficulty: 'Difficult',
      type: 'PROBLEM_SOLVING',
      make: (t, i) => ({
        q: `Solve a non-trivial problem that requires combining ideas from “${shorten(t, i)}” with another topic in ${moduleTitle}. Show working.`,
        model: 'Problem statement clarity; multi-step solution; correctness checks.',
      }),
    },
    {
      difficulty: 'Difficult',
      type: 'DESIGN',
      make: (t, i) => ({
        q: `Design a solution/artefact (automaton, schema, protocol, or algorithm sketch) that demonstrates mastery of “${shorten(t, i)}”. Document design choices.`,
        model: 'Complete design; justified choices; edge cases considered.',
      }),
    },
    {
      difficulty: 'Difficult',
      type: 'CASE_STUDY',
      make: (t, i) => ({
        q: `Write a mini case study: an organisation adopts practices related to “${shorten(t, i)}”. Analyse benefits, risks, and metrics of success.`,
        model: 'Context; benefits; risks; measurable success criteria.',
      }),
    },
    {
      difficulty: 'Intermediate',
      type: 'RESEARCH_TASK',
      make: (t, i) => ({
        q: `Find one reputable reference (textbook section / standard / paper) that deepens “${shorten(t, i)}”. Cite it and list three takeaways for this module.`,
        model: 'Valid citation; three substantive takeaways; link to module outcomes.',
      }),
    },
  ];

  const out = [];
  for (let n = 0; n < 20; n += 1) {
    const stem = stems[n % stems.length];
    const topic = topics[n % Math.max(topics.length, 1)] || moduleTitle;
    const made = stem.make(topic, n);
    out.push({
      difficulty: stem.difficulty,
      marks: marksFor(stem.difficulty),
      typeLabel: stem.type,
      question: made.q,
      model: made.model,
    });
  }
  return out;
}

function formatQuestion(id, item) {
  const type = mapType(item.typeLabel);
  const points = keyPointsFromModel(item.model);
  const pointBlock = points.map((p) => `- ${p.replace(/^[-*]\s*/, '')}`).join('\n');
  return `### A${String(id).padStart(2, '0')}  ·  ${item.difficulty}  ·  ${item.marks} marks  ·  ${type}  ·  ${item.co}
**Question:** ${item.question}

**Expected Key Points:**
${pointBlock}
**Mapping Basis:** ${item.basis}
**Verification:** ACADEMIC_ANALYSIS
`;
}

function rewriteFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const existing = parseExisting(content);
  if (!existing.length) {
    console.warn('No questions parsed:', file);
    return { file, before: 0, after: 0 };
  }

  const rel = path.relative(ROOT, file);
  const parts = rel.split(path.sep);
  const subject = parts[0];
  const moduleFolder = parts[1] || '';
  const moduleTitle = moduleFolder.replace(/[-_]+/g, ' ');

  const headerSubject =
    content.match(/\*\*Subject:\*\*\s*(.+)/i)?.[1]?.trim() || subject.replace(/-/g, ' ');
  const headerModule = content.match(/\*\*Module:\*\*\s*(.+)/i)?.[1]?.trim() || moduleTitle;

  const upgraded = existing.map((e, idx) => {
    const co = inferCo(e.question, idx);
    return {
      ...e,
      marks: marksFor(e.difficulty),
      typeLabel: mapType(e.typeLabel),
      co,
      basis: `Question assesses outcomes aligned with ${co} using module content (${moduleTitle}).`,
    };
  });

  const extras = expansionSeeds(existing, moduleTitle).map((e, idx) => {
    const co = inferCo(e.question, existing.length + idx);
    return {
      ...e,
      co,
      basis: `Extended bank item for ${co}; derived from module themes without paraphrasing prior stems.`,
    };
  });

  const all = [...upgraded, ...extras].slice(0, 40);
  const counts = { Easy: 0, Intermediate: 0, Difficult: 0 };
  for (const q of all) counts[q.difficulty] += 1;
  const totalMarks = all.reduce((s, q) => s + q.marks, 0);
  const body = all.map((q, i) => formatQuestion(i + 1, q)).join('\n');

  const out = `# Assignment — ${headerSubject} — ${headerModule}

**Subject:** ${headerSubject}  
**Module:** ${headerModule}  
**Questions:** 40  
**Mix:** ${counts.Easy} Easy · ${counts.Intermediate} Intermediate · ${counts.Difficult} Difficult  
**Bank total:** ${totalMarks} marks (faculty select a subset for one CIE assignment)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

${body}`;

  fs.writeFileSync(file, out);
  return { file: rel, before: existing.length, after: all.length, counts };
}

const files = walk(ROOT);
const reports = files.map(rewriteFile);
console.log(JSON.stringify({ root: ROOT, files: reports.length, sample: reports.slice(0, 3), totals: reports.length }, null, 2));
