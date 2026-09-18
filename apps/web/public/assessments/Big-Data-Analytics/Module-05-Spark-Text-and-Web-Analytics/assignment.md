# Assignment — Big Data Analytics — Module 5 — Spark, Text and Web Analytics

**Subject:** Big Data Analytics  
**Module:** Module 5 — Spark, Text and Web Analytics  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain Spark driver, executor, RDD, transformation and action.

**Expected Key Points:**
- Driver plans; executors run tasks; RDD partitioned immutable data; transformations lazy; actions trigger jobs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write Spark word-count as a sequence of API calls and mark wide vs narrow.

**Expected Key Points:**
- textFile (narrow read) → flatMap tokenize (narrow) → mapToPair (narrow) → reduceByKey (wide) → save/collect (action).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is TF-IDF? Why stopwords score low?

**Expected Key Points:**
- TF in-doc frequency; IDF log(N/df).
- Stopwords appear in almost all docs → tiny IDF.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Types of web mining: content, structure, usage.

**Expected Key Points:**
- Content: text/topics.
- Structure: links/PageRank.
- Usage: logs/sessions/clicks.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Spark DAG, stages and shuffle boundaries with a join example.

**Expected Key Points:**
- Narrow pipelines one stage; join/groupBy shuffle → new stage.
- Failed stage rerun using lineage.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain PageRank with damping. Compute two-node toy ranks after one iteration (show working).

**Expected Key Points:**
- Use PR= (1-d)/N + d Σ PR/out.
- State assumptions for t=0 uniform 1/N; show numeric update.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Spark vs Hadoop MapReduce for PageRank-20-iterations.

**Expected Key Points:**
- MR: 20 jobs, disk each time.
- Spark: persist graph, 20 in-memory iterations, less I/O.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Design a text-mining pipeline for course-feedback sentiment.

**Expected Key Points:**
- Clean, tokenize, stopword, TF-IDF or embeddings, classify, evaluate F1, dashboard.
- Ethics: anonymise.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO1
**Question:** Design a mini campus search engine: crawl, invert index in Spark, PageRank, query API. List RDDs/DataFrames.

**Expected Key Points:**
- Docs RDD, links RDD, inverted index (term→postings), PageRank vector, merge score.
- Persist indexes; serve via API not collect-all.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Graph: A→B, B→A, A→C. d=0.85, N=3, start uniform. Show one PageRank iteration for C.

**Expected Key Points:**
- C’s in-links from A only.
- PR_A/2 contributes (A outdegree 2).
- Write formula and number.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five Spark actions and five transformations.

**Expected Key Points:**
- Actions: count, collect, saveAsTextFile, reduce, first.
- Transformations: map, filter, flatMap, reduceByKey, join, distinct.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a web graph?

**Expected Key Points:**
- Directed graph of pages (nodes) and hyperlinks (edges), used by structure mining/PageRank.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO3
**Question:** Spark job OOMs on executors during join. Give four concrete mitigations.

**Expected Key Points:**
- Filter early, broadcast small side, salting skew keys, raise partitions, persist wisely, avoid collect, AQE/skew join.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** cache vs checkpoint.

**Expected Key Points:**
- Cache: reuse, lineage kept.
- Checkpoint: cut lineage to reliable storage for long iterative graphs.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Specify a lab: compute TF-IDF on 1000 notices and PageRank on a 50-node intranet graph; deliverables and marks split.

**Expected Key Points:**
- Code, explain plan, top terms, top pages, short report on damping and tokenization choices.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Team ranks search only by TF and ignores links/spam farms. Critique.

**Expected Key Points:**
- Keyword stuffing wins; hubs/authorities ignored; need PageRank/quality, anchors, maybe usage.
- Show a spam scenario.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is lazy evaluation in Spark? Benefit?

**Expected Key Points:**
- Transformations record plan; compute on action.
- Fusion of maps, skip unneeded work if later filtered.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Narrow vs wide with map, filter, reduceByKey, join.

**Expected Key Points:**
- map/filter narrow; reduceByKey/join wide (shuffle).
- Stage = pipeline until wide.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** How text mining and PageRank together improve a search engine.

**Expected Key Points:**
- Text: relevance to query.
- PageRank: query-independent quality.
- Combine scores; handle dangling/spam; evaluate NDCG.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Streaming plus batch: live click counts and nightly TF-IDF reindex. Sketch Kappa/Lambda on Spark.

**Expected Key Points:**
- Spark Streaming/Structured Streaming for counts; nightly batch jobs rebuild index; serving layer; exactly-once caveats.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Spark Text and Web Analytics).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Spark and Text in the context of Spark, Text and Web Analytics. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Big Data Analytics scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Spark as used in Spark, Text and Web Analytics. Include one precise example.

**Model answer:** Spark is a foundational construct in Spark, Text and Web Analytics. Example should name entities/operations and relate to Text. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Spark and Text. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Spark, Text and Web Analytics theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Web to a realistic campus/industry scenario relevant to Spark, Text and Web Analytics. State assumptions.

**Model answer:** Describe scenario, map concepts (Spark, Text), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Text and its role within Spark, Text and Web Analytics.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Spark if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Analytics within Spark, Text and Web Analytics; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Spark while building a solution involving Analytics. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Spark, Text and Web Analytics principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Web in Big Data Analytics.

**Model answer:** Provide four definitions: include Spark, Text, and two adjacent terms from Spark, Text and Web Analytics. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Spark, Text and Web Analytics that integrates Spark, Text, and Web.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Text in Spark, Text and Web Analytics.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Spark.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Spark and Spark Text. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Spark and Web: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Spark, Text and Web Analytics, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Web under constraints typical of Big Data Analytics.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Analytics depends on earlier ideas such as Spark in Spark, Text and Web Analytics.

**Model answer:** Dependency chain with one counterexample showing what fails if Spark is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Spark Text measurably improves an outcome in Big Data Analytics.

**Model answer:** Context, intervention using Spark Text, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Text in Spark, Text and Web Analytics. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Spark in Spark, Text and Web Analytics: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Big Data Analytics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Web for Spark, Text and Web Analytics.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Web.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Text in Spark, Text and Web Analytics. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Spark in Spark, Text and Web Analytics, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

