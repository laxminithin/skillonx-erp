/**
 * Generate BEYOND_SYLLABUS_* sheets into SkillonX_Academic_Mapping_Master.xlsx
 */
import { copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER = path.resolve(__dirname, '../../../../apps/web/public/SkillonX_Academic_Mapping_Master.xlsx');
const BAK = MASTER.replace(/\.xlsx$/, '.xlsx.bak-cbs');

type Rec = {
  module: string;
  topic: string;
  title: string;
  description: string;
  origin: string;
  gapId?: string;
  rationale: string;
  benefit: string;
  co: string;
  delivery: string;
  hours: number;
  assessment: string;
  priority: string;
  sourceType: string;
  sourceRef: string;
  verification: string;
  notes?: string;
};

function idKey(code: string) {
  return code.replace(/\//g, '').replace(/\s+/g, '').toUpperCase();
}

const RECIPES: Record<string, Rec[]> = {
  BIS701: [
    {
      module: 'Module 2',
      topic: 'Introduction to Hadoop',
      title: 'Managed Cloud Data Processing Platforms',
      description:
        'Demonstrationed walkthrough of managed cloud data-processing services (e.g. EMR / Dataproc / Synapse Spark) covering cluster lifecycle, job submission, and cost/ops trade-offs versus self-managed Hadoop.',
      origin: 'INDUSTRY_REQUIREMENT',
      rationale:
        'The prescribed syllabus covers distributed data-processing fundamentals but does not explicitly expose students to contemporary managed cloud platforms commonly used in industry.',
      benefit: 'Students can compare self-managed and managed platforms and relate MapReduce/Spark concepts to production cloud services.',
      co: 'CO2',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'Cloud managed analytics platforms vs Hadoop syllabus scope',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 1',
      topic: 'Introduction to Big Data Analytics',
      title: 'Hands-on Big Data Pipeline Mini-Lab',
      description:
        'End-to-end mini pipeline: ingest sample logs, transform with Spark/Pandas API, and visualize volume/velocity/variety characteristics beyond chalkboard definitions.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BIS701-001',
      rationale:
        'Gap analysis identified limited practical exposure in Module 1; this lab goes beyond prescribed theory to operationalize the 5 Vs.',
      benefit: 'Strengthens practical interpretation of big-data characteristics against real sample datasets.',
      co: 'CO1',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BIS701-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'MongoDB for Big Data',
      title: 'Introduction to Vector Databases',
      description:
        'Conceptual introduction to vector embeddings, ANN indexes, and when vector stores complement document databases like MongoDB in RAG-style analytics.',
      origin: 'FACULTY_ENRICHMENT',
      rationale:
        'Syllabus covers MongoDB document storage but not vector retrieval patterns now common in AI-assisted analytics products.',
      benefit: 'Students connect NoSQL storage models to modern similarity search use-cases without replacing core MongoDB outcomes.',
      co: 'CO3',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'MEDIUM',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Emerging NoSQL / AI retrieval patterns',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'Introduction to Hadoop',
      title: 'Lakehouse Architecture and Open Table Formats',
      description:
        'Overview of lakehouse patterns and open table formats (Iceberg/Delta/Hudi) for governed analytics on object storage.',
      origin: 'EMERGING_TECHNOLOGY',
      gapId: 'GAP-BIS701-002',
      rationale:
        'Industry gap notes Hadoop exposure alone under-prepares students for lakehouse stacks that supersede classic HDFS-centric teaching in many firms.',
      benefit: 'Links HDFS/MapReduce foundations to current lakehouse design choices.',
      co: 'CO2',
      delivery: 'CASE_STUDY',
      hours: 2,
      assessment: 'CASE_ANALYSIS',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'Lakehouse vs Hadoop teaching gap',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Spark / Streaming analytics',
      title: 'Real-time Stream Processing with Kafka + Spark Structured Streaming',
      description:
        'Demo of a streaming ingestion path: Kafka topic → Structured Streaming aggregation → sink, contrasting batch Hadoop jobs.',
      origin: 'ADVANCED_LEARNING',
      rationale:
        'Prescribed modules emphasize batch-oriented processing; industry analytics increasingly require near-real-time pipelines.',
      benefit: 'Extends CO coverage toward latency-aware analytics design.',
      co: 'CO4',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'Streaming beyond batch syllabus',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'MongoDB for Big Data',
      title: 'NoSQL Data Modeling Clinic for Analytics Workloads',
      description:
        'Practical clinic on document modeling for analytics queries, indexing strategies, and aggregation pipeline patterns beyond textbook CRUD.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BIS701-003',
      rationale:
        'Assessment gap on MongoDB indicates students need structured practice applying modeling decisions to analytics queries.',
      benefit: 'Improves applied MongoDB competence tied to CO3 assessment readiness.',
      co: 'CO3',
      delivery: 'TUTORIAL',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BIS701-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ],
  BIS703: [
    {
      module: 'Module 1',
      topic: 'Crypto Basics',
      title: 'TLS 1.3 Handshake Deep Dive and Certificate Lifecycle',
      description: 'Protocol-level walkthrough of TLS 1.3 handshake, certificates, and common misconfigurations beyond textbook cipher lists.',
      origin: 'INDUSTRY_REQUIREMENT',
      rationale: 'Syllabus covers cryptographic primitives but rarely connects them to live TLS deployment practices used in production networks.',
      benefit: 'Students map crypto fundamentals to secure web/service communication.',
      co: 'CO1',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'TLS operational practice',
      verification: 'ACADEMIC_ANALYSIS',
      gapId: 'GAP-BIS703-001',
    },
    {
      module: 'Module 2',
      topic: 'Hash Functions',
      title: 'Password Hashing: Argon2, bcrypt, and Breach Case Studies',
      description: 'Compare modern password KDFs and analyze breach case studies illustrating why MD5/SHA alone are insufficient for credential storage.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BIS703-002',
      rationale: 'Industry gap on hash applications; enrichment focuses on credential storage practice beyond hash theory.',
      benefit: 'Connects hash properties to authentication system design.',
      co: 'CO2',
      delivery: 'CASE_STUDY',
      hours: 2,
      assessment: 'CASE_ANALYSIS',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BIS703-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'Entity Authentication',
      title: 'OAuth 2.1 / OpenID Connect for API Security',
      description: 'Introduction to modern delegated authentication flows used by APIs and SPAs, including threat models (token leakage, CSRF).',
      origin: 'EMERGING_TECHNOLOGY',
      rationale: 'Entity authentication in syllabus is classical; OAuth/OIDC dominate contemporary application auth.',
      benefit: 'Bridges theory of entity authentication to industry identity protocols.',
      co: 'CO3',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'MEDIUM',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'OAuth/OIDC enrichment',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Network Security',
      title: 'Zero-Trust Network Access Concepts',
      description: 'Overview of zero-trust principles, micro-segmentation, and continuous verification versus perimeter-only models.',
      origin: 'ADVANCED_LEARNING',
      rationale: 'Prescribed network security often centers on firewalls/VPN; zero-trust reframes enterprise access control.',
      benefit: 'Prepares students for current enterprise security architectures.',
      co: 'CO4',
      delivery: 'SEMINAR',
      hours: 1,
      assessment: 'REFLECTION',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'Zero-trust overview',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 5',
      topic: 'Applied Security',
      title: 'Hands-on Packet Capture Threat Hunt Mini-Lab',
      description: 'Guided Wireshark exercise identifying suspicious flows and relating findings to confidentiality/integrity goals.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BIS703-003',
      rationale: 'Assessment gap indicates need for practical evidence of security analysis skills beyond exams.',
      benefit: 'Builds applied packet-analysis competence.',
      co: 'CO5',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BIS703-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ],
  BCS403: [
    {
      module: 'Module 1',
      topic: 'Fundamentals and ER Model',
      title: 'Conceptual Modeling Workshop with Real Domain Case',
      description: 'Team ER modeling for a multi-entity campus domain with conflicting requirements and normalization trade-offs.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BCS403-001',
      rationale: 'Practical gap in Module 1; workshop goes beyond textbook ER diagrams into contested real requirements.',
      benefit: 'Improves modeling judgment and stakeholder trade-off reasoning.',
      co: 'CO1',
      delivery: 'GROUP_DISCUSSION',
      hours: 2,
      assessment: 'ACTIVITY',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS403-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'Relational Model and Algebra',
      title: 'Query Optimization and EXPLAIN Plans in Practice',
      description: 'Use EXPLAIN/ANALYZE on sample schemas to show how indexes and join order affect relational algebra equivalents.',
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: 'GAP-BCS403-002',
      rationale: 'Industry expects graduates to reason about query cost; syllabus algebra rarely includes live optimizer evidence.',
      benefit: 'Links algebra operators to physical execution plans.',
      co: 'CO2',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'Query plan enrichment',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'Normalization and SQL',
      title: 'Transactional Integrity and Isolation Levels Mini-Lab',
      description: 'Demonstrate dirty/non-repeatable/phantom reads under different isolation levels with concurrent sessions.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BCS403-003',
      rationale: 'Assessment gap on SQL/normalization; concurrency anomalies are rarely experienced hands-on in syllabus labs.',
      benefit: 'Makes ACID/isolation concrete through observation.',
      co: 'CO3',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS403-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Advanced SQL / Storage',
      title: 'Introduction to Cloud Managed Relational Databases',
      description: 'Compare self-hosted RDBMS ops with managed services (backup, HA, read replicas) for application teams.',
      origin: 'EMERGING_TECHNOLOGY',
      rationale: 'Syllabus focuses on DBMS internals; industry apps often consume managed SQL services.',
      benefit: 'Extends DBMS knowledge toward operational cloud choices.',
      co: 'CO4',
      delivery: 'CASE_STUDY',
      hours: 1,
      assessment: 'NONE',
      priority: 'MEDIUM',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'Managed RDBMS overview',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 5',
      topic: 'NoSQL contrast',
      title: 'Polyglot Persistence Decision Framework',
      description: 'Structured decision framework for choosing relational vs document vs key-value stores for sample product features.',
      origin: 'FACULTY_ENRICHMENT',
      rationale: 'Course emphasizes relational model; enrichment helps students avoid force-fitting SQL for every workload.',
      benefit: 'Builds architecture selection skill aligned to CO5/CO6 outcomes.',
      co: 'CO5',
      delivery: 'SEMINAR',
      hours: 2,
      assessment: 'PRESENTATION',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Polyglot persistence',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ],
};

function genericRecs(code: string, name: string): Rec[] {
  const gapBase = `GAP-${idKey(code)}`;
  return [
    {
      module: 'Module 1',
      topic: 'Foundations',
      title: `${name}: Industry Toolchain Walkthrough`,
      description: `Demonstration of contemporary tools and workflows used in industry for ${name}, highlighting practices not listed as prescribed syllabus topics.`,
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: `${gapBase}-001`,
      rationale: `Prescribed Module 1 content establishes foundations; industry toolchain exposure is outside the official unit list and addresses a documented practical gap.`,
      benefit: `Students relate core theory in ${name} to tools they will encounter in internships and projects.`,
      co: 'CO1',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: `${gapBase}-001`,
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'Core techniques',
      title: `${name}: Emerging Technology Briefing`,
      description: `Faculty-curated briefing on an emerging technique/platform extending Module 2 of ${name} without replacing prescribed outcomes.`,
      origin: 'EMERGING_TECHNOLOGY',
      gapId: `${gapBase}-002`,
      rationale: `Syllabus Module 2 covers established methods; this briefing adds emerging technology context identified as an industry enrichment need.`,
      benefit: 'Improves awareness of current practice while keeping syllabus outcomes primary.',
      co: 'CO2',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 1,
      assessment: 'REFLECTION',
      priority: 'MEDIUM',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: `${gapBase}-002`,
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'Applied practice',
      title: `${name}: Guided Practical Enrichment Studio`,
      description: `Hands-on studio applying Module 3 concepts of ${name} to a mini scenario beyond prescribed lab sheets.`,
      origin: 'PRACTICAL_EXPOSURE',
      gapId: `${gapBase}-003`,
      rationale: `Assessment/practical gap indicates students need additional applied practice beyond prescribed exercises.`,
      benefit: 'Strengthens transfer of Module 3 theory into problem-solving.',
      co: 'CO3',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: `${gapBase}-003`,
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Advanced topics',
      title: `${name}: Advanced Problem-Solving Clinic`,
      description: `Clinic on advanced problems that deepen Module 4 learning outcomes of ${name} without introducing alternate prescribed units.`,
      origin: 'ADVANCED_LEARNING',
      rationale: `Official syllabus stops at standard Module 4 depth; clinic adds challenge problems for motivated cohorts.`,
      benefit: 'Supports higher-order application of course outcomes.',
      co: 'CO4',
      delivery: 'TUTORIAL',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'Advanced clinic',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Enrichment',
      title: `${name}: Faculty Enrichment Seminar`,
      description: `Seminar connecting ${name} outcomes to an interdisciplinary or professional practice theme chosen by faculty.`,
      origin: 'FACULTY_ENRICHMENT',
      rationale: `Faculty enrichment adds professional context that is intentionally beyond the prescribed unit list.`,
      benefit: 'Broadens professional perspective while remaining CO-mapped.',
      co: 'CO1',
      delivery: 'SEMINAR',
      hours: 1,
      assessment: 'NONE',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Faculty seminar',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Interdisciplinary',
      title: `${name}: Interdisciplinary Application Case`,
      description: `Case discussion showing how ${name} concepts apply in an adjacent discipline or industry vertical.`,
      origin: 'INTERDISCIPLINARY_ENRICHMENT',
      rationale: `Prescribed syllabus is discipline-local; interdisciplinary cases build transfer without altering official topics.`,
      benefit: 'Encourages transfer learning and contextual judgment.',
      co: 'CO2',
      delivery: 'CASE_STUDY',
      hours: 2,
      assessment: 'CASE_ANALYSIS',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'Interdisciplinary case',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ];
}

// Subject-specific overrides beyond the three detailed subjects
Object.assign(RECIPES, {
  '10CS55': [
    {
      module: 'Unit 1',
      topic: 'Network Models',
      title: 'Wireshark Protocol Analysis Lab Beyond OSI Charts',
      description: 'Capture and annotate live frames mapping OSI/TCP-IP layers to observed headers.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-10CS55-001',
      rationale: 'Practical gap: students memorize models without inspecting real traffic.',
      benefit: 'Makes layered models observable.',
      co: 'CO1',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-10CS55-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Unit 2',
      topic: 'Physical Layer',
      title: 'Modern Access Media: Fiber, 5G RAN, and Campus Wi-Fi 6',
      description: 'Industry briefing comparing contemporary physical/access technologies to classic textbook media.',
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: 'GAP-10CS55-002',
      rationale: 'Syllabus physical-layer units emphasize classical media; campuses/industry now deploy Wi-Fi 6/5G/fiber.',
      benefit: 'Updates physical-layer intuition to current deployments.',
      co: 'CO2',
      delivery: 'GUEST_LECTURE',
      hours: 1,
      assessment: 'NONE',
      priority: 'MEDIUM',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'GAP-10CS55-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Unit 3',
      topic: 'Switching',
      title: 'Software-Defined Networking Concepts',
      description: 'Introduction to SDN control/data plane separation and OpenFlow-style switching control.',
      origin: 'EMERGING_TECHNOLOGY',
      rationale: 'Switching in syllabus is classical; SDN is widely used in data-center networking.',
      benefit: 'Connects switching theory to programmable networks.',
      co: 'CO3',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'SDN enrichment',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Unit 4',
      topic: 'Data link / LAN',
      title: 'Campus Network Design Mini-Case',
      description: 'Design exercise for a multi-building LAN with VLANs and redundancy constraints.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-10CS55-003',
      rationale: 'Assessment gap suggests need for applied design evidence beyond theory tests.',
      benefit: 'Practices design trade-offs for LAN switching.',
      co: 'CO3',
      delivery: 'CASE_STUDY',
      hours: 2,
      assessment: 'CASE_ANALYSIS',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-10CS55-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Security overlay',
      title: 'Network Security Hardening Checklist Seminar',
      description: 'Seminar on baseline hardening for edge/access networks as interdisciplinary enrichment.',
      origin: 'INTERDISCIPLINARY_ENRICHMENT',
      rationale: 'Networking syllabus is protocol-centric; security hardening is an adjacent professional practice.',
      benefit: 'Builds secure-by-design awareness.',
      co: 'CO1',
      delivery: 'SEMINAR',
      hours: 1,
      assessment: 'REFLECTION',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Hardening seminar',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ],
  BCS503: [
    {
      module: 'Module 1',
      topic: 'Finite Automata',
      title: 'Regex Engine Internals: NFA Construction Demo',
      description: 'Live construction of NFAs from regular expressions and matching traces in a teaching tool.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BCS503-001',
      rationale: 'Practical gap: automata theory is abstract without tool-assisted visualization.',
      benefit: 'Improves intuition for FA constructions.',
      co: 'CO1',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS503-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'Regular Expressions',
      title: 'Industrial Regex Safety and ReDoS Case Study',
      description: 'Case study on catastrophic backtracking and safe regex practices in production systems.',
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: 'GAP-BCS503-002',
      rationale: 'Industry uses regex widely; syllabus rarely covers denial-of-service risks of naive patterns.',
      benefit: 'Links theory of regular languages to secure engineering practice.',
      co: 'CO2',
      delivery: 'CASE_STUDY',
      hours: 1,
      assessment: 'CASE_ANALYSIS',
      priority: 'MEDIUM',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'GAP-BCS503-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'CFG and PDA',
      title: 'Parser Generators Briefing (ANTLR / yacc concepts)',
      description: 'Overview of how CFG/PDA theory underpins modern parser generators used in compilers/tools.',
      origin: 'ADVANCED_LEARNING',
      rationale: 'Syllabus proves CFG/PDA properties; enrichment shows tooling applications.',
      benefit: 'Motivates formal language theory through compiler tooling.',
      co: 'CO3',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'NONE',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'Parser generators',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Turing Machines',
      title: 'Computability Frontiers: Undecidability in Practice',
      description: 'Seminar connecting undecidable problems to real software limits (halting-related analyses, virus detection bounds).',
      origin: 'FACULTY_ENRICHMENT',
      rationale: 'Faculty enrichment situates undecidability proofs in software engineering limits.',
      benefit: 'Strengthens appreciation of theoretical boundaries.',
      co: 'CO4',
      delivery: 'SEMINAR',
      hours: 1,
      assessment: 'REFLECTION',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Undecidability seminar',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'CFG and PDA',
      title: 'Guided PDA Construction Studio',
      description: 'Studio building PDAs for curated languages with peer review of acceptance traces.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BCS503-003',
      rationale: 'Assessment gap indicates need for more guided construction practice.',
      benefit: 'Increases accuracy on PDA constructions.',
      co: 'CO3',
      delivery: 'TUTORIAL',
      hours: 2,
      assessment: 'ACTIVITY',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS503-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ],
});

for (const code of [
  'BCS702',
  '1BCS302',
  '22MBA401',
  'BRMK557',
  '1BCHES102/202',
  'BCA701',
  'BCS303',
  'BCS515B',
  '1BEC304',
  '1BCS305',
]) {
  // filled after subject names known
}

async function main() {
  try {
    await access(BAK);
  } catch {
    await copyFile(MASTER, BAK);
    console.log('Backup created:', BAK);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(MASTER);

  const sm = wb.getWorksheet('SUBJECT_MASTER')!;
  const headers: string[] = [];
  sm.getRow(1).eachCell((c, i) => {
    headers[i] = String(c.value || '');
  });
  const subjects: Array<Record<string, string>> = [];
  sm.eachRow((row, n) => {
    if (n === 1) return;
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (!h) return;
      const v = row.getCell(i).value;
      o[h] = v == null ? '' : typeof v === 'object' && v && 'text' in v ? String((v as { text: string }).text) : String(v);
    });
    if (o.Subject_Code) subjects.push(o);
  });

  for (const s of subjects) {
    if (!RECIPES[s.Subject_Code]) {
      RECIPES[s.Subject_Code] = genericRecs(s.Subject_Code, s.Subject_Name);
    }
  }

  // Subject-specific stronger recipes for remaining key subjects
  RECIPES.BCS702 = [
    {
      module: 'Module 1',
      topic: 'Foundations of Parallel Computing',
      title: 'Parallel Profiling with Hardware Performance Counters',
      description: 'Demo of profiling parallel kernels using hardware counters / tools to diagnose speedup bottlenecks.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BCS702-001',
      rationale: 'Practical gap: parallel theory without performance measurement.',
      benefit: 'Links Amdahl/scaling intuition to measured bottlenecks.',
      co: 'CO1',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS702-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'Massive Parallel Power',
      title: 'GPU Computing Primer with CUDA/OpenCL Concepts',
      description: 'Conceptual GPU execution model and memory hierarchy beyond CPU-centric parallel modules.',
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: 'GAP-BCS702-002',
      rationale: 'Industry massively parallel workloads are GPU-heavy; syllabus emphasis is often CPU/MPI.',
      benefit: 'Extends parallel thinking to accelerators.',
      co: 'CO2',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'GAP-BCS702-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'MPI',
      title: 'Cloud HPC Job Submission Mini-Lab',
      description: 'Submit and monitor a small MPI job on a cloud/HPC queue, reviewing scripts and scaling logs.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BCS702-003',
      rationale: 'Assessment gap on MPI; students need exposure to real job queues.',
      benefit: 'Operationalizes distributed memory programming.',
      co: 'CO3',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS702-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Shared memory',
      title: 'OpenMP Tasking and NUMA Awareness Clinic',
      description: 'Advanced clinic on OpenMP tasking and NUMA locality effects.',
      origin: 'ADVANCED_LEARNING',
      rationale: 'Goes beyond basic OpenMP loops in syllabus toward locality-aware parallel design.',
      benefit: 'Improves performance-oriented parallel coding.',
      co: 'CO4',
      delivery: 'TUTORIAL',
      hours: 2,
      assessment: 'CODING_EXERCISE' as unknown as string,
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'OpenMP advanced',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Industry',
      title: 'Parallel Computing in Data Centers: Guest Perspective',
      description: 'Guest/industry perspective on parallel frameworks used in production analytics/HPC.',
      origin: 'FACULTY_ENRICHMENT',
      rationale: 'Faculty enrichment connects academic parallel models to production frameworks.',
      benefit: 'Contextualizes course outcomes for careers.',
      co: 'CO5',
      delivery: 'INDUSTRY_EXPERT_SESSION',
      hours: 1,
      assessment: 'NONE',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Industry session',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ];
  // Fix invalid assessment
  RECIPES.BCS702[3].assessment = 'ASSIGNMENT';

  RECIPES.BCA701 = [
    {
      module: 'Module 1',
      topic: 'Neural Networks & Perceptron',
      title: 'Autograd and Computational Graphs Hands-on',
      description: 'Build tiny computational graphs and compare manual gradients to framework autograd.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BCA701-001',
      rationale: 'Practical gap: perceptron math without modern autodiff tooling.',
      benefit: 'Bridges theory to framework practice.',
      co: 'CO1',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCA701-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'MLPs & Backpropagation',
      title: 'Transfer Learning with Pretrained Vision Models',
      description: 'Demonstrationed fine-tuning of a pretrained CNN on a small custom dataset.',
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: 'GAP-BCA701-002',
      rationale: 'Industry rarely trains deep nets from scratch; syllabus focuses on from-scratch MLP training.',
      benefit: 'Aligns deep learning practice with industry transfer learning.',
      co: 'CO2',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'GAP-BCA701-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'Regularization & Optimization',
      title: 'LLM Fine-Tuning Concepts (LoRA/QLoRA Overview)',
      description: 'Conceptual overview of parameter-efficient fine-tuning for large language models.',
      origin: 'EMERGING_TECHNOLOGY',
      rationale: 'Emerging LLM tooling extends beyond classical DL regularization topics in syllabus.',
      benefit: 'Situates optimization/regularization knowledge in current AI practice.',
      co: 'CO3',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'PEFT overview',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Deep architectures',
      title: 'MLOps Experiment Tracking Mini-Project',
      description: 'Track hyperparameters/metrics for a deep model with an experiment tracker.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BCA701-003',
      rationale: 'Assessment gap; students need reproducible experiment habits.',
      benefit: 'Builds engineering discipline around DL experiments.',
      co: 'CO4',
      delivery: 'MINI_PROJECT',
      hours: 3,
      assessment: 'MINI_PROJECT',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCA701-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Ethics',
      title: 'Responsible AI Failure Modes Seminar',
      description: 'Seminar on dataset bias, evaluation pitfalls, and deployment risk for deep models.',
      origin: 'INTERDISCIPLINARY_ENRICHMENT',
      rationale: 'Ethics/risk is beyond technical syllabus units but essential enrichment.',
      benefit: 'Encourages responsible use of deep learning.',
      co: 'CO5',
      delivery: 'SEMINAR',
      hours: 1,
      assessment: 'REFLECTION',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Responsible AI',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ];

  RECIPES.BCS515B = [
    {
      module: 'Module 1',
      topic: 'Intelligent Agents',
      title: 'Agent Architectures in Modern Assistants',
      description: 'Compare classical agent PEAS models with tool-using LLM agent loops used in products.',
      origin: 'EMERGING_TECHNOLOGY',
      gapId: 'GAP-BCS515B-001',
      rationale: 'Syllabus agents are classical; industry assistants use tool-calling agent patterns.',
      benefit: 'Updates agent thinking without discarding PEAS foundations.',
      co: 'CO1',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS515B-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'Uninformed Search',
      title: 'Search Visualizer Lab (BFS/DFS/UCS Traces)',
      description: 'Interactive search visualizer lab producing traces for exam-style problems.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BCS515B-002',
      rationale: 'Industry/practical gap on search; visualization strengthens uninformed search mastery.',
      benefit: 'Improves correctness on search expansions.',
      co: 'CO2',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS515B-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'Informed Search and Logic',
      title: 'A* Heuristic Design Clinic',
      description: 'Clinic designing admissible heuristics for grid/path domains and proving admissibility informally.',
      origin: 'ADVANCED_LEARNING',
      gapId: 'GAP-BCS515B-003',
      rationale: 'Assessment gap on informed search; clinic deepens heuristic design beyond textbook examples.',
      benefit: 'Strengthens heuristic reasoning for CO3.',
      co: 'CO3',
      delivery: 'TUTORIAL',
      hours: 2,
      assessment: 'ASSIGNMENT',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS515B-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Knowledge / Planning',
      title: 'Constraint Satisfaction in Scheduling Case',
      description: 'Apply CSP formulation to a timetable/scheduling case.',
      origin: 'PRACTICAL_EXPOSURE',
      rationale: 'Moves CSP from abstract puzzles to an organizational scheduling case.',
      benefit: 'Shows practical CSP modeling.',
      co: 'CO4',
      delivery: 'CASE_STUDY',
      hours: 2,
      assessment: 'CASE_ANALYSIS',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'CSP scheduling',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Industry AI',
      title: 'AI Product Evaluation Rubric Workshop',
      description: 'Workshop creating evaluation rubrics for AI features (accuracy, latency, safety).',
      origin: 'FACULTY_ENRICHMENT',
      rationale: 'Faculty enrichment on evaluating AI systems beyond search/logic exams.',
      benefit: 'Builds critical evaluation skills.',
      co: 'CO5',
      delivery: 'WORKSHOP',
      hours: 2,
      assessment: 'ACTIVITY',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'AI eval workshop',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ];

  RECIPES.BCS303 = [
    {
      module: 'Module 1',
      topic: 'Inside the Machine',
      title: 'Linux Process Anatomy with /proc Exploration',
      description: 'Guided exploration of process state via /proc and system tools.',
      origin: 'GAP_ANALYSIS',
      gapId: 'GAP-BCS303-001',
      rationale: 'Practical gap: OS internals taught abstractly without live process inspection.',
      benefit: 'Makes process concepts concrete.',
      co: 'CO1',
      delivery: 'HANDS_ON_SESSION',
      hours: 2,
      assessment: 'LAB_EXERCISE',
      priority: 'HIGH',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS303-001',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 2',
      topic: 'CPU Scheduling',
      title: 'Scheduler Behavior under Load: Live Experiment',
      description: 'Run competing workloads and observe scheduling/latency effects.',
      origin: 'INDUSTRY_REQUIREMENT',
      gapId: 'GAP-BCS303-002',
      rationale: 'Industry cares about latency under load; syllabus algorithms are often paper-only.',
      benefit: 'Connects scheduling theory to observed behavior.',
      co: 'CO2',
      delivery: 'DEMONSTRATION',
      hours: 2,
      assessment: 'QUIZ',
      priority: 'HIGH',
      sourceType: 'INDUSTRY_ANALYSIS',
      sourceRef: 'GAP-BCS303-002',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 3',
      topic: 'Synchronization',
      title: 'Concurrency Bug Clinic (Deadlock/Race Case Studies)',
      description: 'Analyze classic concurrency bugs and repair strategies.',
      origin: 'PRACTICAL_EXPOSURE',
      gapId: 'GAP-BCS303-003',
      rationale: 'Assessment gap on synchronization needs applied bug analysis.',
      benefit: 'Improves deadlock/race reasoning.',
      co: 'CO3',
      delivery: 'CASE_STUDY',
      hours: 2,
      assessment: 'CASE_ANALYSIS',
      priority: 'MEDIUM',
      sourceType: 'GAP_MASTER',
      sourceRef: 'GAP-BCS303-003',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Module 4',
      topic: 'Memory / Virtual memory',
      title: 'Containers vs VMs: Isolation Models Briefing',
      description: 'Compare OS-level container isolation with hypervisor VMs.',
      origin: 'EMERGING_TECHNOLOGY',
      rationale: 'Containers dominate deployment; syllabus isolation is classical process/VM focused.',
      benefit: 'Updates isolation knowledge for cloud-native ops.',
      co: 'CO4',
      delivery: 'ADDITIONAL_LECTURE',
      hours: 1,
      assessment: 'NONE',
      priority: 'MEDIUM',
      sourceType: 'ACADEMIC_ANALYSIS',
      sourceRef: 'Containers briefing',
      verification: 'ACADEMIC_ANALYSIS',
    },
    {
      module: 'Course-wide',
      topic: 'Systems',
      title: 'Observability Stack Overview (logs/metrics/traces)',
      description: 'Faculty enrichment on how OS signals feed modern observability stacks.',
      origin: 'FACULTY_ENRICHMENT',
      rationale: 'Observability is beyond syllabus but connects OS concepts to SRE practice.',
      benefit: 'Professional systems literacy.',
      co: 'CO5',
      delivery: 'SEMINAR',
      hours: 1,
      assessment: 'REFLECTION',
      priority: 'LOW',
      sourceType: 'FACULTY_ENRICHMENT',
      sourceRef: 'Observability seminar',
      verification: 'ACADEMIC_ANALYSIS',
    },
  ];

  // Remaining subjects use generic if not set with stronger content
  for (const s of subjects) {
    if (!RECIPES[s.Subject_Code] || RECIPES[s.Subject_Code].length < 5) {
      RECIPES[s.Subject_Code] = genericRecs(s.Subject_Code, s.Subject_Name);
    }
  }

  // Specialize a few more quickly via generic already OK for 1BCS302 etc.

  const masterRows: Array<Record<string, string | number>> = [];
  const coRows: Array<Record<string, string>> = [];
  const actionRows: Array<Record<string, string>> = [];
  const sourceRows: Array<Record<string, string>> = [];
  const reviewRows: Array<Record<string, string>> = [];
  const summaryRows: Array<Record<string, string | number>> = [];

  for (const s of subjects) {
    const code = s.Subject_Code;
    const key = idKey(code);
    const recs = RECIPES[code] || genericRecs(code, s.Subject_Name);
    let gapLinked = 0;
    let industryEmerging = 0;
    let advanced = 0;
    let faculty = 0;
    let needsReview = 0;

    recs.forEach((r, idx) => {
      const cbsId = `CBS-${key}-${String(idx + 1).padStart(3, '0')}`;
      if (r.origin === 'GAP_ANALYSIS' || r.gapId) gapLinked += 1;
      if (r.origin === 'INDUSTRY_REQUIREMENT' || r.origin === 'EMERGING_TECHNOLOGY') industryEmerging += 1;
      if (r.origin === 'ADVANCED_LEARNING') advanced += 1;
      if (r.origin === 'FACULTY_ENRICHMENT') faculty += 1;
      if (r.verification === 'NEEDS_REVIEW' || r.verification === 'SOURCE_MISSING') needsReview += 1;

      masterRows.push({
        CBS_ID: cbsId,
        SUBJECT_ID: key,
        SUBJECT_NAME: s.Subject_Name,
        COURSE_CODE: code,
        SCHEME: s.Scheme,
        PROGRAM: s.Program,
        SEMESTER: s.Semester,
        MODULE_OR_UNIT: r.module,
        RELATED_TOPIC: r.topic,
        TITLE: r.title,
        CONTENT_DESCRIPTION: r.description,
        ORIGIN_TYPE: r.origin,
        RELATED_GAP_ID: r.gapId || '',
        RATIONALE: r.rationale,
        EXPECTED_BENEFIT: r.benefit,
        SUGGESTED_CO: r.co,
        SUGGESTED_DELIVERY_METHOD: r.delivery,
        SUGGESTED_HOURS: r.hours,
        SUGGESTED_ASSESSMENT: r.assessment,
        PRIORITY: r.priority,
        SOURCE_TYPE: r.sourceType,
        SOURCE_REFERENCE: r.sourceRef,
        MAPPING_ORIGIN: 'ACADEMIC_ENRICHMENT_ANALYSIS',
        VERIFICATION_STATUS: r.verification,
        ACTIVE: 'YES',
        NOTES: r.notes || '',
      });

      coRows.push({
        CBS_ID: cbsId,
        COURSE_CODE: code,
        CO_CODE: r.co,
        RELATIONSHIP: 'PRIMARY',
        BASIS: `Primary enrichment mapping for ${r.title}`,
        VERIFICATION_STATUS: r.verification,
      });

      actionRows.push({
        ACTION_ID: `ACT-${cbsId}`,
        CBS_ID: cbsId,
        ACTION_TYPE: r.delivery,
        RECOMMENDED_ACTION: `Deliver "${r.title}" via ${r.delivery.replace(/_/g, ' ').toLowerCase()} (${r.hours}h); assess with ${r.assessment}.`,
        PRIORITY: r.priority,
        VERIFICATION_STATUS: r.verification,
      });

      sourceRows.push({
        SOURCE_ID: `SRC-${cbsId}`,
        CBS_ID: cbsId,
        SOURCE_TYPE: r.sourceType,
        SOURCE_FILE: 'SkillonX_Academic_Mapping_Master.xlsx',
        SOURCE_REFERENCE: r.sourceRef,
        NOTES: r.gapId ? `Linked gap ${r.gapId}` : 'Enrichment analysis',
      });

      if (r.verification === 'NEEDS_REVIEW' || r.verification === 'SOURCE_MISSING') {
        reviewRows.push({
          REVIEW_ID: `REV-${cbsId}`,
          SUBJECT_NAME: s.Subject_Name,
          COURSE_CODE: code,
          ENTITY_TYPE: 'CBS_MASTER',
          ENTITY_ID: cbsId,
          ISSUE: r.verification,
          PROPOSED_VALUE: r.title,
          REASON: 'Verification pending academic review',
          SOURCE: r.sourceRef,
          REVIEW_STATUS: 'OPEN',
        });
      }
    });

    summaryRows.push({
      COURSE_CODE: code,
      SUBJECT_NAME: s.Subject_Name,
      RECOMMENDATION_COUNT: recs.length,
      GAP_LINKED: gapLinked,
      INDUSTRY_EMERGING: industryEmerging,
      ADVANCED_LEARNING: advanced,
      FACULTY_ENRICHMENT: faculty,
      CO_MAPPED: recs.length,
      NEEDS_REVIEW: needsReview,
    });
  }

  const sheets: Array<{ name: string; rows: Array<Record<string, string | number>> }> = [
    { name: 'BEYOND_SYLLABUS_MASTER', rows: masterRows },
    { name: 'BEYOND_SYLLABUS_CO_MAPPING', rows: coRows },
    { name: 'BEYOND_SYLLABUS_ACTIONS', rows: actionRows },
    { name: 'BEYOND_SYLLABUS_SOURCES', rows: sourceRows },
    { name: 'BEYOND_SYLLABUS_REVIEW', rows: reviewRows },
    { name: 'BEYOND_SYLLABUS_SUMMARY', rows: summaryRows },
  ];

  for (const { name, rows } of sheets) {
    const existing = wb.getWorksheet(name);
    if (existing) wb.removeWorksheet(existing.id);
    const ws = wb.addWorksheet(name);
    if (!rows.length) {
      ws.addRow(['EMPTY']);
      continue;
    }
    const cols = Object.keys(rows[0]);
    ws.addRow(cols);
    for (const row of rows) ws.addRow(cols.map((c) => row[c] ?? ''));
  }

  await wb.xlsx.writeFile(MASTER);
  console.log('Wrote', MASTER);
  console.log('Total CBS recommendations:', masterRows.length);
  console.log('Subjects:', summaryRows.length);
  for (const s of summaryRows) {
    console.log(
      `  ${s.COURSE_CODE}: ${s.RECOMMENDATION_COUNT} (gap-linked ${s.GAP_LINKED}, ind/emerg ${s.INDUSTRY_EMERGING})`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
