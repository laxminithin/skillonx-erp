# Assignment — Big Data Analytics — Module 2 — Introduction to Hadoop

**Subject:** Big Data Analytics  
**Module:** Module 2 — Introduction to Hadoop  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain HDFS architecture with NameNode, DataNode and blocks.

**Expected Key Points:**
- NN: namespace+block map.
- DN: block store+heartbeats.
- Files split into large blocks, replicated.
- Clients read/write data from DNs after NN metadata.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is replication factor? Why is 3 a common default?

**Expected Key Points:**
- Number of copies per block.
- 3 balances durability vs storage (survives two failures with rack-aware placement) at 3× cost.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain MapReduce map, shuffle and reduce with word count.

**Expected Key Points:**
- Map emits (word,1); shuffle groups by word; reduce sums counts to (word,total).
- Output written to HDFS.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is YARN? Name RM, NM and AM roles.

**Expected Key Points:**
- Cluster OS for apps.
- RM: global schedule.
- NM: node agent.
- AM: per-app container negotiation and task management.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain rack awareness and typical 3-replica placement.

**Expected Key Points:**
- First replica on writer node, second off-rack, third on different node of the remote rack.
- Survives node and rack failures without 3-rack cost.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare HDFS with a local POSIX filesystem for 200 MB video files.

**Expected Key Points:**
- HDFS: large blocks, replication, streaming, limited random write.
- POSIX: small files, in-place edit, no automatic 3-way replica.
- Analytics wants HDFS.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Role of fsimage, edit log and Secondary NameNode. Why SNN ≠ HA.

**Expected Key Points:**
- fsimage checkpoint + edits for namespace.
- SNN merges to shorten startup.
- HA needs hot standby and shared edits, not merely SNN.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** File 1.5 GB, block 128 MB, replication 3. Compute blocks, maps (1:1 split), and stored copies.

**Expected Key Points:**
- Blocks = ceil(1536/128)=12.
- Stored copies=36.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a 12-node Hadoop cluster for 80 TB raw logs/year. Discuss disks, replication, NN RAM, YARN.

**Expected Key Points:**
- Estimate logical vs raw with RF=3; DN disks; NN metadata RAM; dedicated NN/RM; rack layout; maybe EC for cold data; Spark on YARN.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Walk through client write pipeline failure of one DN in the pipeline.

**Expected Key Points:**
- Pipeline of 3 DNs; ack from downstream; if a DN dies, NN allocates a new replica location and pipeline is reconstructed; file complete only after RF satisfied or policy.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five Hadoop ecosystem tools and one use each.

**Expected Key Points:**
- Hive warehousing, Pig ETL, HBase random access, Sqoop RDBMS bridge, Flume logs, Spark in-memory, Oozie workflows.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a YARN container?

**Expected Key Points:**
- A granted bundle of CPU/memory (and locality) in which a task/AM attempt runs, launched by NM.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Why large HDFS blocks reduce NameNode pressure.

**Expected Key Points:**
- Metadata is per block, not per byte.
- 128 MB blocks ⇒ fewer blocks ⇒ NN RAM and heartbeats stay feasible.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO4
**Question:** MRv1 JobTracker vs YARN.

**Expected Key Points:**
- JobTracker mixed cluster resources and job control (scalability bottleneck).
- YARN splits RM/NM/AM so multiple app types share the cluster.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO5
**Question:** NameNode disk fills with edits; cluster ‘hangs’ for writes. Diagnose and prevent.

**Expected Key Points:**
- Edits not checkpointed; SNN/HA journal issues; disk full.
- Fix: checkpoint, enlarge NN disks, monitor, HA JournalNodes, alerts on edit lag.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** 20 DNs in 2 racks of 10. Explain how you would rack-configure and why.

**Expected Key Points:**
- Enable rack topology script; avoid one-rack cluster; place RM/NN with care; ensure second replica leaves rack; balanced rack capacity.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define input split vs HDFS block.

**Expected Key Points:**
- Block: stored chunk.
- Split: logical map input, usually block-aligned but can be different for some formats.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Draw HDFS read/write paths and label NN vs DN traffic.

**Expected Key Points:**
- Metadata RPC to NN; block streaming to DNs; pipeline for writes; checksums; client never streams file bytes through NN.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Hadoop moves compute to data.’ Explain locality with YARN/MapReduce.

**Expected Key Points:**
- Tasks scheduled on nodes holding the block to avoid network storm; rack-local fallback; AM asks for local containers; shuffle still networks reduce inputs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Heartbeat and block report: who sends what?

**Expected Key Points:**
- DataNodes heartbeat to NN (I’m alive) and send block reports (what I store) so NN can detect dead nodes and under-replicated blocks.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Introduction to Hadoop).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Introduction and Hadoop in the context of Introduction to Hadoop. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Big Data Analytics scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Introduction as used in Introduction to Hadoop. Include one precise example.

**Model answer:** Introduction is a foundational construct in Introduction to Hadoop. Example should name entities/operations and relate to Hadoop. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Introduction and Hadoop. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Introduction to Hadoop theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Introduction Hadoop to a realistic campus/industry scenario relevant to Introduction to Hadoop. State assumptions.

**Model answer:** Describe scenario, map concepts (Introduction, Hadoop), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Hadoop and its role within Introduction to Hadoop.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Introduction if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Introduction to Hadoop; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Introduction while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Introduction to Hadoop principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Introduction to Hadoop that integrates Introduction, Hadoop, and Introduction Hadoop.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Hadoop in Introduction to Hadoop.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Introduction.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Introduction and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Introduction and Introduction Hadoop: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Introduction to Hadoop, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Introduction Hadoop under constraints typical of Big Data Analytics.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Introduction in Introduction to Hadoop.

**Model answer:** Dependency chain with one counterexample showing what fails if Introduction is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where expected measurably improves an outcome in Big Data Analytics.

**Model answer:** Context, intervention using expected, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Hadoop in Introduction to Hadoop. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Introduction in Introduction to Hadoop: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Big Data Analytics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Introduction Hadoop for Introduction to Hadoop.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Introduction Hadoop.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Introduction Hadoop in Big Data Analytics.

**Model answer:** Provide four definitions: include Introduction, Hadoop, and two adjacent terms from Introduction to Hadoop. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Hadoop in Introduction to Hadoop. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Introduction in Introduction to Hadoop, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

