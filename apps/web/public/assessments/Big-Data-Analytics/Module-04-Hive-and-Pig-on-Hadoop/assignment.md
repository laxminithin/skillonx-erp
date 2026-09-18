# Assignment — Big Data Analytics — Module 4 — Hive and Pig on Hadoop

**Subject:** Big Data Analytics  
**Module:** Module 4 — Hive and Pig on Hadoop  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is Hive? Explain metastore and warehouse directory.

**Expected Key Points:**
- Hive: SQL warehouse on Hadoop.
- Metastore: schemas/partitions.
- Warehouse: HDFS path for managed data.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write HQL to create an external CSV table students(usn, name, dept, cgpa) partitioned by year.

**Expected Key Points:**
- CREATE EXTERNAL TABLE students(...) PARTITIONED BY (year int) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' LOCATION '...'; plus MSCK/ALTER ADD PARTITION.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** Managed vs external tables.

**Expected Key Points:**
- Managed: Hive owns data, DROP may delete.
- External: Hive owns metadata, files remain for other tools.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Write Pig Latin: load attendance, filter present='Y', group by dept, count.

**Expected Key Points:**
- A=LOAD...; B=FILTER A BY present=='Y'; C=GROUP B BY dept; D=FOREACH C GENERATE group, COUNT(B); STORE D.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO3
**Question:** Design Hive tables for Digital Campus: raw CSV dumps → cleaned ORC facts partitioned by date.

**Expected Key Points:**
- External raw CSV; insert into managed ORC PARTITIONED BY (dt) with columnar SerDe; partition by report date; bucket by usn if joins need it.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO1
**Question:** Hive vs Pig vs Spark SQL — when each?

**Expected Key Points:**
- Hive: ad-hoc/BI SQL.
- Pig: legacy ETL data-flow.
- Spark SQL: faster general engine, streaming+ML.
- Many campuses now Spark, but syllabus still Hive/Pig.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Partitions vs buckets with a query example.

**Expected Key Points:**
- PARTITIONED BY (dept) skips directories; CLUSTERED BY (usn) INTO N BUCKETS hashes files for sampling/joins.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** SerDe role. Contrast CSV vs ORC.

**Expected Key Points:**
- SerDe parses files to rows.
- CSV: cheap ingest, fat scans.
- ORC: compression, indexes, column prune.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Given 2 TB logs partitioned by day, write HQL for weekly unique USNs and discuss why missing partition filter is disastrous.

**Expected Key Points:**
- Filter dt BETWEEN ...
- then COUNT DISTINCT usn.
- Without dt predicate Hive may scan 2 TB.
- Show partition pruning in EXPLAIN.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain map join, partition pruning, and vectorized/ORC predicate pushdown.

**Expected Key Points:**
- Broadcast small table; skip directories; ORC stripe stats skip row groups.
- Combine for interactive-ish SQL still in seconds, not ms.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is HQL?

**Expected Key Points:**
- Hive Query Language — SQL-like, compiled to cluster jobs.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five Pig operators and what they do.

**Expected Key Points:**
- LOAD, FILTER, FOREACH/GENERATE, JOIN, GROUP, ORDER, DISTINCT, STORE, SPLIT, UNION.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO3
**Question:** Pig cleans dirty RFID; Hive serves principal dashboards. Draw the pipeline.

**Expected Key Points:**
- HDFS raw → Pig script → ORC cleaned → Hive external/managed table → HQL/BI.
- Metastore after clean.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Why Hive is a poor choice for updating one student’s phone number 10,000 times/day.

**Expected Key Points:**
- Not OLTP; jobs have seconds–minutes startup; no efficient single-row mutate like RDBMS.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Specify a lab: create partitioned ORC table, load 7 days, query one day, show EXPLAIN difference with/without partition filter.

**Expected Key Points:**
- Include DDL, LOAD/INSERT, SELECT COUNT, EXPLAIN, and file listing of partition dirs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** All data in one giant unpartitioned CSV called campus.csv. Critique for Hive.

**Expected Key Points:**
- Full scans, no prune, poor compression, no column skip, metastore one blob, terrible for date queries.
- Split + columnar + partition.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** RCFile — why was it introduced?

**Expected Key Points:**
- Column-oriented storage on HDFS so queries read only needed columns, improving I/O vs row files.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** Hive views vs tables.

**Expected Key Points:**
- Views are saved queries (logical); tables have storage.
- Views don’t by themselves store ORC.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** 365 partitions, 8 buckets, 5 columns ORC. A query needs 1 day and 1 column. What is skipped conceptually?

**Expected Key Points:**
- 364 day dirs skipped; ~4/5 columns skipped in ORC (plus unread buckets if sampling).
- Still read that day’s relevant column stripes.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Hive is SQL, but it is not MySQL.’ Explain execution, latency, and schema-on-read.

**Expected Key Points:**
- Parser similar, runtime is distributed batch on files; metastore+SerDe; seconds of latency; no typical row-level UPDATE workload; schema applied when reading files.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Hive and Pig on Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Hive and Pig in the context of Hive and Pig on Hadoop. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Big Data Analytics scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Hive as used in Hive and Pig on Hadoop. Include one precise example.

**Model answer:** Hive is a foundational construct in Hive and Pig on Hadoop. Example should name entities/operations and relate to Pig. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Hive and Pig. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Hive and Pig on Hadoop theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply on to a realistic campus/industry scenario relevant to Hive and Pig on Hadoop. State assumptions.

**Model answer:** Describe scenario, map concepts (Hive, Pig), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Pig and its role within Hive and Pig on Hadoop.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Hive if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Hadoop within Hive and Pig on Hadoop; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Hive while building a solution involving Hadoop. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Hive and Pig on Hadoop principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying on in Big Data Analytics.

**Model answer:** Provide four definitions: include Hive, Pig, and two adjacent terms from Hive and Pig on Hadoop. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Hive and Pig on Hadoop that integrates Hive, Pig, and on.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Pig in Hive and Pig on Hadoop.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Hive.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Hive and Hive Pig. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Hive and on: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Hive and Pig on Hadoop, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling on under constraints typical of Big Data Analytics.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Hadoop depends on earlier ideas such as Hive in Hive and Pig on Hadoop.

**Model answer:** Dependency chain with one counterexample showing what fails if Hive is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Hive Pig measurably improves an outcome in Big Data Analytics.

**Model answer:** Context, intervention using Hive Pig, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Pig in Hive and Pig on Hadoop. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Hive in Hive and Pig on Hadoop: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Big Data Analytics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to on for Hive and Pig on Hadoop.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of on.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Pig in Hive and Pig on Hadoop. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Hive in Hive and Pig on Hadoop, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

