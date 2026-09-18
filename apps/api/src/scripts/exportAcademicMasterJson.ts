/**
 * Convert Excel academic masters into source-controlled JSON.
 * Excel remains an authoring utility; production seeding reads these JSON files.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { parseCopoWorkbook } from '../modules/copo/workbookParser.js';
import { parseGapWorkbook } from '../modules/gapAnalysis/workbookParser.js';
import { parseCbsWorkbook } from '../modules/contentBeyondSyllabus/workbookParser.js';
import { parseCoEvalWorkbook } from '../modules/coEvaluation/workbookParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PUBLIC = path.join(ROOT, 'apps/web/public');
const OUT = path.join(ROOT, 'apps/api/seeds/academic');
const MASTER = path.join(PUBLIC, 'SkillonX_Academic_Mapping_Master.xlsx');

function cellStr(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null && 'text' in (value as object)) {
    return String((value as { text?: unknown }).text ?? '').trim();
  }
  if (typeof value === 'object' && value !== null && 'result' in (value as object)) {
    return String((value as { result?: unknown }).result ?? '').trim();
  }
  return String(value).trim();
}

function normalizeCode(code: string) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function parseModules(raw: string, subjectCode: string) {
  if (!raw) return [];
  const parts = raw
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((part, idx) => {
    const match = part.match(/^(M|U)(\d+)\s+(.*)$/i);
    const moduleNumber = match ? Number(match[2]) : idx + 1;
    const title = match ? match[3].trim() : part;
    const prefix = match ? match[1].toUpperCase() : 'M';
    return {
      subjectCode: normalizeCode(subjectCode),
      moduleNumber,
      moduleCode: `${prefix}${moduleNumber}`,
      title,
      sortOrder: moduleNumber,
    };
  });
}

const JAVA_CBS = [
  {
    cbsId: 'CBS-1BCS302-001',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 1',
    relatedTopic: 'Java Fundamentals / toolchain',
    title: 'Git and GitHub workflow for Java projects',
    contentDescription:
      'Hands-on Git/GitHub workflow for Java coursework: branching, pull requests, .gitignore for Maven/Gradle, and collaborative review of OOP assignments.',
    originType: 'INDUSTRY_REQUIREMENT',
    relatedGapId: 'GAP-1BCS302-001',
    rationale:
      'The prescribed OOP-with-Java syllabus does not include professional source-control workflow used on every industry Java team.',
    expectedBenefit: 'Students can version Java labs and mini-projects with industry-standard GitHub practice.',
    suggestedCo: 'CO1',
    suggestedDeliveryMethod: 'HANDS_ON_SESSION',
    suggestedHours: 2,
    suggestedAssessment: 'LAB_EXERCISE',
    priority: 'HIGH',
    sourceType: 'INDUSTRY_ANALYSIS',
    sourceReference: 'Git/GitHub Java project workflow',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: 'Subject-specific enrichment for 1BCS302',
    category: 'INDUSTRY_TOOL',
    difficulty: 'BEGINNER',
    resourceType: 'TOOLING',
    industryRelevance: 'HIGH',
    expectedOutcome: 'A GitHub repository with a Java lab and a documented branch/PR workflow.',
  },
  {
    cbsId: 'CBS-1BCS302-002',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 4',
    relatedTopic: 'Exceptions and quality',
    title: 'Unit testing with JUnit',
    contentDescription:
      'Introduction to JUnit 5: assertions, test classes, parameterized tests, and testing exception paths for OOP assignments.',
    originType: 'PRACTICAL_EXPOSURE',
    relatedGapId: 'GAP-1BCS302-003',
    rationale: 'Prescribed Java labs rarely require automated tests; industry Java code is validated with JUnit.',
    expectedBenefit: 'Students can write unit tests for classes, methods, and exception handling.',
    suggestedCo: 'CO4',
    suggestedDeliveryMethod: 'HANDS_ON_SESSION',
    suggestedHours: 2,
    suggestedAssessment: 'LAB_EXERCISE',
    priority: 'HIGH',
    sourceType: 'GAP_MASTER',
    sourceReference: 'GAP-1BCS302-003',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'HANDS_ON_LAB',
    difficulty: 'INTERMEDIATE',
    resourceType: 'TESTING',
    industryRelevance: 'HIGH',
    expectedOutcome: 'A JUnit test suite covering core classes from a course mini-assignment.',
  },
  {
    cbsId: 'CBS-1BCS302-003',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 2',
    relatedTopic: 'Classes, methods, and build',
    title: 'Maven / Gradle basics',
    contentDescription:
      'Build a small Java project with Maven or Gradle: dependencies, standard directory layout, and running tests from the build tool.',
    originType: 'INDUSTRY_REQUIREMENT',
    relatedGapId: 'GAP-1BCS302-001',
    rationale: 'Syllabus compiles isolated programs; industry Java work is organized around Maven/Gradle builds.',
    expectedBenefit: 'Students can create, build, and test a multi-class Java project with a standard build tool.',
    suggestedCo: 'CO2',
    suggestedDeliveryMethod: 'DEMONSTRATION',
    suggestedHours: 2,
    suggestedAssessment: 'ASSIGNMENT',
    priority: 'HIGH',
    sourceType: 'INDUSTRY_ANALYSIS',
    sourceReference: 'Maven/Gradle Java project layout',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'INDUSTRY_TOOL',
    difficulty: 'BEGINNER',
    resourceType: 'BUILD_TOOL',
    industryRelevance: 'HIGH',
    expectedOutcome: 'A Maven or Gradle project that compiles and runs JUnit tests.',
  },
  {
    cbsId: 'CBS-1BCS302-004',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 3',
    relatedTopic: 'Packages, interfaces, and services',
    title: 'REST API development with Spring Boot introduction',
    contentDescription:
      'Introductory Spring Boot REST controller exposing a simple OOP domain model (DTO, service, in-memory repository) beyond core Java syntax.',
    originType: 'EMERGING_TECHNOLOGY',
    relatedGapId: 'GAP-1BCS302-002',
    rationale: 'Industry Java roles expect familiarity with Spring Boot APIs; the syllabus stops at core OOP.',
    expectedBenefit: 'Students can map OOP classes to a minimal REST API.',
    suggestedCo: 'CO3',
    suggestedDeliveryMethod: 'ADDITIONAL_LECTURE',
    suggestedHours: 2,
    suggestedAssessment: 'MINI_PROJECT',
    priority: 'MEDIUM',
    sourceType: 'INDUSTRY_ANALYSIS',
    sourceReference: 'Spring Boot REST introduction',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'REAL_WORLD_APPLICATION',
    difficulty: 'INTERMEDIATE',
    resourceType: 'FRAMEWORK',
    industryRelevance: 'HIGH',
    expectedOutcome: 'A running Spring Boot service with at least two REST endpoints over a Java domain model.',
  },
  {
    cbsId: 'CBS-1BCS302-005',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 3',
    relatedTopic: 'Inheritance, packages and interfaces',
    title: 'Design patterns (Strategy, Factory, Observer)',
    contentDescription:
      'Apply three GoF patterns to a Java case (payment strategy, object factory, event observers) using interfaces taught in Module 3.',
    originType: 'ADVANCED_LEARNING',
    relatedGapId: null,
    rationale: 'Syllabus covers interfaces and inheritance but not named design patterns used in Java interviews and codebases.',
    expectedBenefit: 'Students can recognize and implement common OOP design patterns.',
    suggestedCo: 'CO3',
    suggestedDeliveryMethod: 'TUTORIAL',
    suggestedHours: 2,
    suggestedAssessment: 'ASSIGNMENT',
    priority: 'MEDIUM',
    sourceType: 'ACADEMIC_ANALYSIS',
    sourceReference: 'GoF patterns on Java OOP outcomes',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'ADVANCED_TOPIC',
    difficulty: 'INTERMEDIATE',
    resourceType: 'LECTURE_PLUS_EXERCISE',
    industryRelevance: 'MEDIUM',
    expectedOutcome: 'A short Java implementation demonstrating Strategy, Factory, and Observer.',
  },
  {
    cbsId: 'CBS-1BCS302-006',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 5',
    relatedTopic: 'Enums, wrappers and generics / collections',
    title: 'Java collections performance comparison',
    contentDescription:
      'Measure ArrayList vs LinkedList vs HashMap vs TreeMap for insert/lookup/iterate workloads and relate results to Big-O intuition.',
    originType: 'ADVANCED_LEARNING',
    relatedGapId: null,
    rationale: 'Collections APIs are used in labs without comparing performance characteristics needed for real systems.',
    expectedBenefit: 'Students can choose collection types based on measured cost, not only syntax.',
    suggestedCo: 'CO5',
    suggestedDeliveryMethod: 'CASE_STUDY',
    suggestedHours: 1,
    suggestedAssessment: 'QUIZ',
    priority: 'MEDIUM',
    sourceType: 'ACADEMIC_ANALYSIS',
    sourceReference: 'Java collections complexity comparison',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'ADVANCED_TOPIC',
    difficulty: 'INTERMEDIATE',
    resourceType: 'BENCHMARK',
    industryRelevance: 'MEDIUM',
    expectedOutcome: 'A comparison table of collection operations with measured timings.',
  },
  {
    cbsId: 'CBS-1BCS302-007',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Course-wide',
    relatedTopic: 'Persistence mini-project',
    title: 'JDBC mini-project',
    contentDescription:
      'Build a small JDBC CRUD application mapping OOP entities to relational tables (prepared statements, transactions, resource cleanup).',
    originType: 'PRACTICAL_EXPOSURE',
    relatedGapId: 'GAP-1BCS302-003',
    rationale: 'Core Java OOP does not include database access; JDBC is the standard next professional skill.',
    expectedBenefit: 'Students can persist Java objects with JDBC and explain SQL injection safety.',
    suggestedCo: 'CO2',
    suggestedDeliveryMethod: 'MINI_PROJECT',
    suggestedHours: 3,
    suggestedAssessment: 'MINI_PROJECT',
    priority: 'HIGH',
    sourceType: 'GAP_MASTER',
    sourceReference: 'GAP-1BCS302-003',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'MINI_PROJECT',
    difficulty: 'INTERMEDIATE',
    resourceType: 'PROJECT',
    industryRelevance: 'HIGH',
    expectedOutcome: 'A JDBC CRUD mini-project with at least one transactional use case.',
  },
  {
    cbsId: 'CBS-1BCS302-008',
    subjectKey: '1BCS302',
    subjectName: 'Object Oriented Programming with Java',
    courseCode: '1BCS302',
    scheme: '2025',
    program: 'Computer Science and Engineering',
    semester: '3',
    moduleUnit: 'Module 4',
    relatedTopic: 'Exceptions, threads, and diagnostics',
    title: 'Debugging and profiling Java applications',
    contentDescription:
      'Use an IDE debugger (breakpoints, watches) and a basic profiler/JFR overview to diagnose exceptions, leaks, and hot methods in a Java lab.',
    originType: 'INDUSTRY_REQUIREMENT',
    relatedGapId: 'GAP-1BCS302-001',
    rationale: 'Students often debug with print statements; professional Java work uses debugger and profiler workflows.',
    expectedBenefit: 'Students can isolate defects and explain a simple performance hotspot.',
    suggestedCo: 'CO4',
    suggestedDeliveryMethod: 'DEMONSTRATION',
    suggestedHours: 2,
    suggestedAssessment: 'ACTIVITY',
    priority: 'MEDIUM',
    sourceType: 'INDUSTRY_ANALYSIS',
    sourceReference: 'Java debugger and profiler workflow',
    mappingOrigin: 'ACADEMIC_ANALYSIS',
    verificationStatus: 'ACADEMIC_ANALYSIS',
    active: true,
    notes: null,
    category: 'INDUSTRY_TOOL',
    difficulty: 'BEGINNER',
    resourceType: 'TOOLING',
    industryRelevance: 'HIGH',
    expectedOutcome: 'A short debug/profile note capturing a breakpoint session and one hotspot.',
  },
];

async function writeJson(name: string, data: unknown) {
  const file = path.join(OUT, name);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  const count = Array.isArray(data) ? data.length : 1;
  console.log(`wrote ${name} (${count})`);
}

async function extractModulesFromSubjectSheet() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(MASTER);
  const sm = wb.getWorksheet('SUBJECT_MASTER');
  if (!sm) return [];
  const headers: string[] = [];
  sm.getRow(1).eachCell((c, i) => {
    headers[i] = String(c.value || '');
  });
  const modules: Array<Record<string, unknown>> = [];
  sm.eachRow((row, n) => {
    if (n === 1) return;
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) rec[h] = cellStr(row.getCell(i).value);
    });
    if (!rec.Subject_Code) return;
    modules.push(...parseModules(rec.Modules || '', rec.Subject_Code));
  });
  return modules;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const buffer = await readFile(MASTER);

  const copo = await parseCopoWorkbook(buffer);
  const gap = await parseGapWorkbook(buffer);
  const cbs = await parseCbsWorkbook(buffer);
  const coEval = await parseCoEvalWorkbook(buffer);
  const modules = await extractModulesFromSubjectSheet();

  const schemes = [...new Map(
    copo.subjects.map((s) => {
      const year = Number(String(s.scheme).replace(/[^0-9]/g, '')) || null;
      const code = year ? `VTU-${year}` : normalizeCode(s.scheme);
      return [
        code,
        {
          schemeCode: code,
          name: year ? `VTU ${year} Scheme` : s.scheme,
          university: s.university || 'Visvesvaraya Technological University',
          startYear: year,
          effectiveAcademicYear: year ? String(year) : s.scheme,
        },
      ];
    }),
  ).values()];

  const programs = [...new Map(
    copo.subjects.map((s) => {
      const name = s.program.trim();
      const code = name
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .toUpperCase()
        .slice(0, 32);
      return [
        `${s.scheme}|${code}`,
        {
          programCode: code,
          name,
          scheme: s.scheme,
          degree: /mba|master of business/i.test(name) ? 'MBA' : 'B.E.',
        },
      ];
    }),
  ).values()];

  const javaIds = new Set(JAVA_CBS.map((r) => r.cbsId));
  const cbsItems = [
    ...cbs.items.filter((item) => normalizeCode(item.courseCode) !== '1BCS302'),
    ...JAVA_CBS,
  ];
  const cbsCoLinks = [
    ...cbs.coLinks.filter((l) => !String(l.cbsId).startsWith('CBS-1BCS302-')),
    ...JAVA_CBS.map((r) => ({
      cbsId: r.cbsId,
      courseCode: r.courseCode,
      coCode: r.suggestedCo,
      relationship: 'PRIMARY',
      basis: r.rationale,
      verificationStatus: r.verificationStatus,
    })),
  ];
  const cbsActions = [
    ...cbs.actions.filter((a) => !javaIds.has(String(a.cbsId))),
    ...JAVA_CBS.map((r) => ({
      actionId: `ACT-${r.cbsId}`,
      cbsId: r.cbsId,
      actionType: r.suggestedDeliveryMethod,
      recommendedAction: r.title,
      priority: r.priority,
      verificationStatus: r.verificationStatus,
    })),
  ];
  const cbsSources = [
    ...cbs.sources.filter((s) => !javaIds.has(String(s.cbsId))),
    ...JAVA_CBS.map((r) => ({
      sourceId: `SRC-${r.cbsId}`,
      cbsId: r.cbsId,
      sourceType: r.sourceType,
      sourceFile: 'academic-master-seed',
      sourceReference: r.sourceReference,
      notes: r.notes,
    })),
  ];

  await writeJson('schemes.json', schemes);
  await writeJson('programs.json', programs);
  await writeJson(
    'subjects.json',
    copo.subjects.map((s) => ({
      university: s.university,
      scheme: s.scheme,
      program: s.program,
      semesterNumber: s.semester,
      subjectCode: normalizeCode(s.code),
      subjectName: s.name,
      courseType: s.courseType,
      credits: s.credits,
      lectureHours: s.lectureHours,
      tutorialHours: s.tutorialHours,
      practicalHours: s.practicalHours,
      coCount: s.coCount,
      sourceUrl: s.sourceUrl,
      sourcePage: s.sourcePage,
      verificationStatus: s.verificationStatus,
      importReady: s.importReady,
      slidesSubject: s.slidesSubject,
    })),
  );
  await writeJson('modules.json', modules);
  await writeJson(
    'cos.json',
    copo.outcomes.map((c) => ({
      scheme: c.scheme,
      program: c.program,
      subjectCode: normalizeCode(c.subjectCode),
      coCode: c.coCode,
      statement: c.statement,
      bloomsLevel: c.bloomsLevel,
      source: c.source,
      page: c.page,
      status: c.status,
    })),
  );
  await writeJson('pos.json', copo.programOutcomes);
  await writeJson('psos.json', copo.programSpecificOutcomes);
  await writeJson('sdgs.json', copo.sdgs);
  await writeJson('copo.json', copo.mappings);
  await writeJson('copso.json', copo.coPsoMappings);
  await writeJson('cosdg.json', copo.coSdgMappings);
  await writeJson(
    'mapping-justifications.json',
    [
      ...copo.mappings.map((m) => ({
        kind: 'CO_PO',
        subjectCode: normalizeCode(m.subjectCode),
        coCode: m.coCode,
        targetCode: m.poCode,
        strength: m.strength,
        justification: m.justification,
        status: m.mappingStatus,
      })),
      ...copo.coPsoMappings.map((m) => ({
        kind: 'CO_PSO',
        subjectCode: normalizeCode(m.subjectCode),
        coCode: m.coCode,
        targetCode: m.psoCode,
        strength: m.strength,
        justification: m.rationale,
        status: m.verificationStatus,
      })),
      ...copo.coSdgMappings.map((m) => ({
        kind: 'CO_SDG',
        subjectCode: normalizeCode(m.subjectCode),
        coCode: m.coCode,
        targetCode: m.sdgCode,
        strength: m.relevance,
        justification: m.rationale,
        status: m.verificationStatus,
      })),
    ].filter((j) => j.justification),
  );
  await writeJson('gap-analysis.json', gap.gaps);
  await writeJson('gap-co.json', gap.coLinks);
  await writeJson('gap-outcomes.json', gap.outcomeLinks);
  await writeJson('recommended-actions.json', gap.actions);
  await writeJson('gap-sources.json', gap.sources);
  await writeJson('beyond-syllabus.json', cbsItems);
  await writeJson('beyond-syllabus-co.json', cbsCoLinks);
  await writeJson('beyond-syllabus-actions.json', cbsActions);
  await writeJson('beyond-syllabus-sources.json', cbsSources);
  await writeJson('co-evaluation.json', {
    assessmentComponents: coEval.assessmentComponents,
    structures: coEval.structures,
    courseComponents: coEval.courseComponents,
    coMasters: coEval.coMasters,
    componentMappings: coEval.componentMappings,
    justifications: coEval.justifications,
    sources: coEval.sources,
    summaries: coEval.summaries,
  });

  const subjectCodes = copo.subjects.map((s) => normalizeCode(s.code));
  const manifest = {
    sourceFile: 'SkillonX_Academic_Mapping_Master.xlsx',
    generatedAt: new Date().toISOString(),
    counts: {
      schemes: schemes.length,
      programs: programs.length,
      subjects: copo.subjects.length,
      modules: modules.length,
      cos: copo.outcomes.length,
      pos: copo.programOutcomes.length,
      psos: copo.programSpecificOutcomes.length,
      sdgs: copo.sdgs.length,
      copo: copo.mappings.length,
      copso: copo.coPsoMappings.length,
      cosdg: copo.coSdgMappings.length,
      gaps: gap.gaps.length,
      recommendedActions: gap.actions.length,
      beyondSyllabus: cbsItems.length,
    },
    subjects: subjectCodes,
    warnings: [...copo.warnings, ...gap.warnings, ...cbs.warnings, ...coEval.warnings].slice(0, 50),
  };
  await writeJson('manifest.json', manifest);
  console.log('\nExport complete.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
