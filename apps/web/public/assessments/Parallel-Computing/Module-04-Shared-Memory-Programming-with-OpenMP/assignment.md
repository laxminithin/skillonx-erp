# Assignment — Parallel Computing — Module 4 — Shared-Memory Programming with OpenMP

**Subject:** Parallel Computing  
**Module:** Module 4 — Shared-Memory Programming with OpenMP  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain #pragma omp parallel versus #pragma omp parallel for.

**Expected Key Points:**
- parallel: all threads run the block.
- parallel for: spawn+workshare a for.
- Show a 4-line example of each.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define shared, private and reduction with one variable example each.

**Expected Key Points:**
- shared n; private i; reduction(+:sum).
- What is initialised, what is combined.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write an OpenMP trapezoidal sketch with reduction. Label h and the loop bounds.

**Expected Key Points:**
- h=(b-a)/n; sum ends; parallel for reduction of interior points; integral *= h (or include h in the formula carefully).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** What does a barrier do in OpenMP? Where are implicit barriers?

**Expected Key Points:**
- Team join. End of parallel, end of for/sections/single unless nowait.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO5
**Question:** critical vs atomic vs reduction for summing an array. Which to use and why.

**Expected Key Points:**
- reduction best.
- atomic OK for one location.
- critical heaviest.
- Mention false sharing of a scalar vs reduction copies.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** static vs dynamic vs guided. Give one loop that matches each.

**Expected Key Points:**
- SAXPY: static.
- Adaptive mesh: dynamic.
- Decreasing leftover work: guided.
- Discuss chunk size.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** False sharing: draw a 64-byte line and two thread-private counters that sit on it. Fix.

**Expected Key Points:**
- Pad to 64 B, or use reduction, or index by thread*PAD.
- Show before/after timings conceptually.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** default(none) and why lecturers recommend it.

**Expected Key Points:**
- Forces every variable to be classified; catches unintended sharing.
- More verbose, fewer races.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Show a race on hist[bin[i]]++ and three fixes (atomic, locks per bin, private hist+reduce).

**Expected Key Points:**
- Atomic on the bin; or 256 locks; or thread-local histograms then combine.
- Trade contention vs memory.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Parallelise a recursive tree walk with OpenMP tasks. Cutoff, taskwait, load balance.

**Expected Key Points:**
- Spawn tasks for big subtrees; cutoff to serial below size C; taskgroup; avoid too-fine tasks.
- Compare to parallel for on a flattened array.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Program prints different sums each run, n=1e7. Checklist.

**Expected Key Points:**
- Missing reduction; nowait+early print; unsynced I/O; uninitialised private; nested parallel oversubscription; SIMD reduction mismatch.
- How to compile -fopenmp and OMP_NUM_THREADS.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** OpenMP + cache: blocked matmul. Where are pragmas, collapse, schedule?

**Expected Key Points:**
- collapse(2) on i,j tiles; k inner; static; avoid false sharing of C rows; set tile to L1.
- Contrast naive parallel for i.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five OpenMP clauses and one use each.

**Expected Key Points:**
- private, shared, reduction, schedule, nowait, collapse, firstprivate, num_threads.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is lastprivate? Example: last index processed.

**Expected Key Points:**
- Copies the last serial iteration’s private value out.
- for i..n x=a[i]; lastprivate(x) ⇒ x=a[n-1].
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** single vs master vs a locked print.

**Expected Key Points:**
- single: one thread, implicit barrier.
- master: thread 0, no implicit barrier.
- Critical print from all is serialised I/O.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** Nested parallel regions spawn 8×8=64 threads accidentally. Diagnose.

**Expected Key Points:**
- OMP_NESTED/omp_set_nested and max_active_levels.
- Usually flatten or disable nesting.
- Oversubscription.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Lab: trapezoidal with static vs dynamic vs reduction vs racy. Table of results and times.

**Expected Key Points:**
- Show racy wrong answers; reduction correct; dynamic overhead on uniform f.
- Marks for OMP_NUM_THREADS sweep.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** How OpenMP relates to the fork-join model.

**Expected Key Points:**
- Team fork at parallel, join at the end.
- Worksharing inside.
- Nested fork possible.
- Serial between regions.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘OpenMP is easy to get running and easy to get wrong.’ Discuss races, sharing defaults, and false sharing.

**Expected Key Points:**
- Incremental pragmas vs silent races.
- default(none), reductions, padding, tools (ThreadSanitizer).
- Contrast MPI’s explicitness.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a canonical loop that omp for can workshare?

**Expected Key Points:**
- Integer index, monotone to a loop-invariant bound, no break that the compiler cannot see — the OpenMP canonical form.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Shared Memory Programming with OpenMP).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Shared and Memory in the context of Shared-Memory Programming with OpenMP. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Parallel Computing scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Shared as used in Shared-Memory Programming with OpenMP. Include one precise example.

**Model answer:** Shared is a foundational construct in Shared-Memory Programming with OpenMP. Example should name entities/operations and relate to Memory. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Shared and Memory. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Shared-Memory Programming with OpenMP theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Programming to a realistic campus/industry scenario relevant to Shared-Memory Programming with OpenMP. State assumptions.

**Model answer:** Describe scenario, map concepts (Shared, Memory), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Memory and its role within Shared-Memory Programming with OpenMP.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Shared if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to with within Shared-Memory Programming with OpenMP; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Shared while building a solution involving with. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Shared-Memory Programming with OpenMP principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Programming in Parallel Computing.

**Model answer:** Provide four definitions: include Shared, Memory, and two adjacent terms from Shared-Memory Programming with OpenMP. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Shared-Memory Programming with OpenMP that integrates Shared, Memory, and Programming.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Memory in Shared-Memory Programming with OpenMP.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Shared.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Shared and OpenMP. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Shared and Programming: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Shared-Memory Programming with OpenMP, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Programming under constraints typical of Parallel Computing.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how with depends on earlier ideas such as Shared in Shared-Memory Programming with OpenMP.

**Model answer:** Dependency chain with one counterexample showing what fails if Shared is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where OpenMP measurably improves an outcome in Parallel Computing.

**Model answer:** Context, intervention using OpenMP, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Memory in Shared-Memory Programming with OpenMP. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Shared in Shared-Memory Programming with OpenMP: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Parallel Computing.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Programming for Shared-Memory Programming with OpenMP.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Programming.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Memory in Shared-Memory Programming with OpenMP. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Shared in Shared-Memory Programming with OpenMP, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

