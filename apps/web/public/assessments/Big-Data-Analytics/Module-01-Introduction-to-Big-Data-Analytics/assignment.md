# Assignment — Big Data Analytics — Module 1 — Introduction to Big Data Analytics

**Subject:** Big Data Analytics  
**Module:** Module 1 — Introduction to Big Data Analytics  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define Big Data and explain Volume, Velocity and Variety with one campus example each.

**Expected Key Points:**
- Big Data is data whose scale, speed or diversity defeats traditional tools.
- Volume: years of CCTV.
- Velocity: RFID taps during exams.
- Variety: SQL marks + JSON logs + video.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish structured, semi-structured and unstructured data with one example each.

**Expected Key Points:**
- Structured: student table.
- Semi-structured: RFID JSON.
- Unstructured: lecture video or free-text feedback.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is data preprocessing? List four typical tasks.

**Expected Key Points:**
- Preparing raw data for analysis: profiling, cleaning (nulls/duplicates), integration, transformation/encoding, and reduction/sampling.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain descriptive, predictive and prescriptive analytics with one institute example each.

**Expected Key Points:**
- Descriptive: last-term pass percentage.
- Predictive: dropout risk.
- Prescriptive: recommended remedial timetable or bus dispatch.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare scale-up vs scale-out. Which fits Hadoop-style analytics and why?

**Expected Key Points:**
- Scale-up enlarges one SMP box (costly ceiling).
- Scale-out adds commodity nodes.
- Hadoop/HDFS assume scale-out with replication and parallelism.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare data lake and data warehouse. When should VVIET keep raw logs in a lake?

**Expected Key Points:**
- Lake: raw, schema-on-read, cheap, exploratory.
- Warehouse: cleaned, modelled, governed reports.
- Keep raw logs in a lake when future questions are unknown and replay must be possible.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain batch vs stream processing. Map two campus workloads to each.

**Expected Key Points:**
- Batch: high-throughput bounded jobs (nightly attendance aggregates).
- Stream: unbounded low-latency (live exam presence).
- ETL loads are batch; RFID dashboards are stream.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Draw and explain a reference Big Data architecture from sources to applications.

**Expected Key Points:**
- Layers: sources → ingest (Flume/Kafka/Sqoop) → storage (HDFS/object) → processing (MapReduce/Spark) → serving (warehouse/indexes) → apps (dashboards/ML).
- Mention batch and speed paths.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** The library wants to analyse 8 TB of gate logs and book-scan images. Identify Vs and a processing choice.

**Expected Key Points:**
- Volume 8 TB, Variety (logs+images), Velocity if scans are live, Veracity if badges fail.
- Use lake storage, batch for nightly heatmaps, stream if live occupancy is required.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design an analytics pipeline for 50,000 students’ clickstreams to predict course dropout. Specify storage, processing, features and ethics.

**Expected Key Points:**
- Ingest clicks to lake; clean sessions; features: login frequency, video completion, quiz delay; Spark/MLlib or similar; serve risk scores to mentors.
- Ethics: consent, bias, no punitive use without human review, retention limits.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Ingest 300 MB/s for 2 hours daily. Compute daily raw volume. Propose replication and a 30-day retention plan.

**Expected Key Points:**
- 300 MB/s × 7200 s = 2,160,000 MB ≈ 2.16 TB/day.
- 3× replication → ~6.5 TB/day stored.
- 30-day raw ≈ 65 TB replicated; tier to cheaper storage or compress after 7 days.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor says ‘buy a bigger SQL server and skip Hadoop’. Critique for mixed video+JSON+SQL at 80 TB.

**Expected Key Points:**
- Vertical scale hits cost/licensing; unstructured video and flexible JSON fight schema-on-write; backups and scans degrade OLTP.
- Hybrid: lake for raw, warehouse for governed SQL marts.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define veracity and give two campus causes of poor veracity.

**Expected Key Points:**
- Trust/quality of data.
- Causes: duplicate RFID taps, missing marks, spam feedback, clock skew on logs.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is Value in the Vs? Why can a 10 TB store still have low Value?

**Expected Key Points:**
- Value is usable insight.
- 10 TB of unlabelled, duplicated, unused logs produces no decision change.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain schema-on-write vs schema-on-read.

**Expected Key Points:**
- Schema-on-write: structure at ingest (RDBMS).
- Schema-on-read: store raw, interpret later (lakes).
- Trade control/quality vs flexibility/speed of ingest.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the analytics lifecycle? Why does skipping preprocessing hurt models?

**Expected Key Points:**
- Question → data → clean/integrate → model/analyse → visualise → act.
- Dirty joins and leaks make models overfit noise and mislead decisions.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** Exam cell wants both a 1-second malpractice alert and a 6-month board report. Propose Lambda-style design.

**Expected Key Points:**
- Speed layer: stream cameras/RFID to alert service.
- Batch layer: nightly recompute quality metrics.
- Serving layer: merge views for dashboards and statutory reports.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five Big Data sources relevant to an engineering college and the V each stresses.

**Expected Key Points:**
- CCTV (volume), RFID (velocity), LMS discussion text (variety), noisy Wi-Fi logs (veracity), placement outcomes used for counselling (value).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare OLTP student registration with OLAP/academic analytics.

**Expected Key Points:**
- OLTP: short ACID updates (register a course).
- Analytics: scans, aggregates, history (pass trends).
- Mixing heavy scans on OLTP harms registration latency.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write a 250-word note: ‘Big Data is not just more data — it is a change in architecture.’ Use VVIET examples.

**Expected Key Points:**
- Argue 5Vs, scale-out, schema-on-read, batch/stream split, preprocessing, and value/ethics.
- Contrast a single ERP database with a lake+warehouse+stream design for CCTV, RFID and LMS.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Introduction to Big Data Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Introduction and Big in the context of Introduction to Big Data Analytics. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Big Data Analytics scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Introduction as used in Introduction to Big Data Analytics. Include one precise example.

**Model answer:** Introduction is a foundational construct in Introduction to Big Data Analytics. Example should name entities/operations and relate to Big. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Introduction and Big. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Introduction to Big Data Analytics theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Data to a realistic campus/industry scenario relevant to Introduction to Big Data Analytics. State assumptions.

**Model answer:** Describe scenario, map concepts (Introduction, Big), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Big and its role within Introduction to Big Data Analytics.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Introduction if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Analytics within Introduction to Big Data Analytics; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Introduction while building a solution involving Analytics. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Introduction to Big Data Analytics principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Data in Big Data Analytics.

**Model answer:** Provide four definitions: include Introduction, Big, and two adjacent terms from Introduction to Big Data Analytics. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Introduction to Big Data Analytics that integrates Introduction, Big, and Data.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Big in Introduction to Big Data Analytics.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Introduction.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Introduction and Introduction Big. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Introduction and Data: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Introduction to Big Data Analytics, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Data under constraints typical of Big Data Analytics.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Analytics depends on earlier ideas such as Introduction in Introduction to Big Data Analytics.

**Model answer:** Dependency chain with one counterexample showing what fails if Introduction is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Introduction Big measurably improves an outcome in Big Data Analytics.

**Model answer:** Context, intervention using Introduction Big, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Big in Introduction to Big Data Analytics. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Introduction in Introduction to Big Data Analytics: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Big Data Analytics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Data for Introduction to Big Data Analytics.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Data.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Big in Introduction to Big Data Analytics. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Introduction in Introduction to Big Data Analytics, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

