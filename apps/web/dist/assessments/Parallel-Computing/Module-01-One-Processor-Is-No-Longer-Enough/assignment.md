# Assignment — Parallel Computing — Module 1 — One Processor Is No Longer Enough

**Subject:** Parallel Computing  
**Module:** Module 1 — One Processor Is No Longer Enough  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why ‘one processor is no longer enough’: clock, power wall, and multicore.

**Expected Key Points:**
- ILP/clock stalled; power/heat; vendors add cores.
- Software must expose parallelism or sit idle on 7 of 8 cores.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define data parallelism and task parallelism with one campus example each.

**Expected Key Points:**
- Data: same GPA formula on 10,000 students.
- Task: rendering + physics + AI as concurrent modules.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** State Flynn’s SISD, SIMD, MIMD with one example each.

**Expected Key Points:**
- SISD: scalar core.
- SIMD: AVX/GPU warp.
- MIMD: multicore/cluster.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is SPMD? How do MPI ranks differ if the program is the same?

**Expected Key Points:**
- One binary; rank/id and data partitions differ.
- if(rank==0) special-cases I/O.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare shared vs distributed memory. Which model for a 16-core PC vs a 16-PC lab?

**Expected Key Points:**
- Shared: OpenMP on the PC.
- Distributed: MPI in the lab.
- Hybrid: MPI+OpenMP on a cluster of multicore PCs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain cache coherence vs false sharing. Give a 2-thread C sketch that false-shares.

**Expected Key Points:**
- Coherence keeps a line consistent.
- Two ints in one line, each owned by a thread, cause write ping-pong.
- Pad to 64 bytes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** UMA vs NUMA and why first-touch placement matters.

**Expected Key Points:**
- UMA: flat latency.
- NUMA: local vs remote.
- First-touch allocates pages on the touching socket; init on rank 0 can strand data.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** MPI vs OpenMP: processes, communication, scaling, ease of incremental parallelisation.

**Expected Key Points:**
- OpenMP: pragmas on loops, shared bugs (races).
- MPI: explicit messages, scales multi-node, more rewrite.
- Hybrid common.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** T1=60s, 20% serial, p=6 on the parallel part (Amdahl). Compute S and E. Show working.

**Expected Key Points:**
- S=1/(0.2+0.8/6)=1/(0.2+0.1333)=1/0.3333=3. S/p=3/6=50%.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a parallelisation plan for VVIET’s 50,000-student transcript export: data vs task, shared vs cluster, expected bottlenecks.

**Expected Key Points:**
- Data-parallel per student; OpenMP on a server; MPI if many files/nodes; I/O serial fraction (Amdahl); avoid false sharing on a global counter; measure T1, Tp.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor says ‘buy 32 cores, get 32× on any C code.’ Critique with Amdahl and memory walls.

**Expected Key Points:**
- Serial fraction caps S.
- Memory bandwidth/coherence may cap before 32×.
- Some codes speed up <2×.
- Need profile + parallel algorithm.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write ~200 words: ‘Parallel hardware without a parallel algorithm is idle silicon.’ Use SIMD, MIMD, MPI, OpenMP.

**Expected Key Points:**
- Map workloads to models; mention SPMD; coherence and messages as communication; measurement of speedup/efficiency.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four reasons a parallel program can be slower than serial.

**Expected Key Points:**
- Overheads, load imbalance, too much communication, false sharing, insufficient work, lock contention, NUMA, I/O serialisation.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a race condition in shared memory? One OpenMP example.

**Expected Key Points:**
- Two threads write the same sum without reduction/critical.
- Non-atomic ++ on a shared total.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** How can a GPU be SIMD/SIMT while a cluster is MIMD?

**Expected Key Points:**
- Warp lockstep vs independent node OS images.
- Both can run SPMD source.
- Hybrid CPU-GPU + MPI is common.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** Two sockets, threads 0–7 on socket 0 all pounding socket-1 DRAM. Diagnose and fix.

**Expected Key Points:**
- NUMA remote traffic.
- Pin threads, first-touch allocate per socket, use numactl, partition arrays.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Lab: time a serial SAXPY vs OpenMP vs (if available) MPI on 4 ranks on one node. Report S, E, and one bottleneck.

**Expected Key Points:**
- Protocol: pin, repeat timings, warmup.
- Expect OpenMP > naive MPI on one node due to message cost.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Consistency vs coherence with a store-load example on two cores.

**Expected Key Points:**
- Coherence: one address.
- Consistency: whether core B sees core A’s store before A’s later store to another address.
- Relaxed CPUs need fences.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define speedup and efficiency. When is E=1?

**Expected Key Points:**
- S=T1/Tp, E=S/p.
- E=1 is linear speedup (no overhead, perfect parallel).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Propose a hybrid MPI+OpenMP layout for 4 nodes × 8 cores. Who communicates, who shares cache?

**Expected Key Points:**
- 1 MPI rank per node (or per socket), 8 OpenMP threads per rank.
- MPI at node boundaries; OpenMP inside.
- Discuss mapping and I/O rank 0.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 One Processor Is No Longer Enough).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast One and Processor in the context of One Processor Is No Longer Enough. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Parallel Computing scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of One as used in One Processor Is No Longer Enough. Include one precise example.

**Model answer:** One is a foundational construct in One Processor Is No Longer Enough. Example should name entities/operations and relate to Processor. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on One and Processor. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with One Processor Is No Longer Enough theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Is to a realistic campus/industry scenario relevant to One Processor Is No Longer Enough. State assumptions.

**Model answer:** Describe scenario, map concepts (One, Processor), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Processor and its role within One Processor Is No Longer Enough.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to One if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to No within One Processor Is No Longer Enough; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies One while building a solution involving No. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using One Processor Is No Longer Enough principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Is in Parallel Computing.

**Model answer:** Provide four definitions: include One, Processor, and two adjacent terms from One Processor Is No Longer Enough. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in One Processor Is No Longer Enough that integrates One, Processor, and Is.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Processor in One Processor Is No Longer Enough.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to One.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both One and Longer. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving One and Is: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from One Processor Is No Longer Enough, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Is under constraints typical of Parallel Computing.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how No depends on earlier ideas such as One in One Processor Is No Longer Enough.

**Model answer:** Dependency chain with one counterexample showing what fails if One is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Longer measurably improves an outcome in Parallel Computing.

**Model answer:** Context, intervention using Longer, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Processor in One Processor Is No Longer Enough. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with One in One Processor Is No Longer Enough: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Parallel Computing.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Is for One Processor Is No Longer Enough.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Is.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Processor in One Processor Is No Longer Enough. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about One in One Processor Is No Longer Enough, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

