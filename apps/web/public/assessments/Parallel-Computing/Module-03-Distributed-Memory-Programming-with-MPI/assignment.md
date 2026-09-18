# Assignment — Parallel Computing — Module 3 — Distributed-Memory Programming with MPI

**Subject:** Parallel Computing  
**Module:** Module 3 — Distributed-Memory Programming with MPI  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain rank, size, communicator and MPI_COMM_WORLD.

**Expected Key Points:**
- Size processes numbered 0..size-1 in a context.
- WORLD is the initial set after Init.
- Sends need dest rank + comm + tag.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a collective operation? Name four.

**Expected Key Points:**
- All ranks in the comm call it.
- Bcast, Reduce, Scatter, Gather, Allreduce, Barrier, Allgather.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Show why two blocking Sends then Recvs can deadlock.

**Expected Key Points:**
- If both use synchronous/rendezvous Send, each waits for Recv that never is posted.
- Draw the wait cycle.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** MPI_Sendrecv: why it exists.

**Expected Key Points:**
- Coupled send and recv that the library can implement without user-induced deadlock on a swap.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write local bounds for rank r, p=8, n=1000 trapezoids on [0,1]. Who gets the remainder?

**Expected Key Points:**
- Base count=125, remainder 0 so equal.
- If n=1001, first n%p ranks get 126.
- Give [a_r,b_r].
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Implement π by MPI trapezoidal: which collectives and why Reduce not Gather for the sum.

**Expected Key Points:**
- Bcast params; local sum; Reduce SUM.
- Gather of n partials is overkill when only the scalar sum is needed.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Bcast vs Scatter vs Allgather with a 16-word array and p=4.

**Expected Key Points:**
- Bcast: all see 16.
- Scatter: each sees 4.
- Allgather: each ends with 16 concatenated local pieces.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Derived types: describe a matrix row vs column in C (row-major) for a halo exchange.

**Expected Key Points:**
- Row is contiguous MPI_FLOAT count=n.
- Column is Type_vector n blocks, stride n.
- Commit, send, free.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Non-blocking communication and buffer safety.

**Expected Key Points:**
- Do not write the send buffer or read the recv buffer until Wait.
- Request objects.
- Overlap with local compute.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Design MPI odd-even sort for p ranks, n/p keys each. Phases, compare-split, complexity.

**Expected Key Points:**
- Local sort O((n/p) log(n/p)); p phases of neighbour exchange+merge.
- Bandwidth (n/p) per phase.
- Contrast sample sort.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Program hangs in Bcast. Give a checklist of causes.

**Expected Key Points:**
- Not all ranks call it; different root; different comm; earlier unmatched blocking Send; mixed with threads without MPI_Init_thread; rank 0 crashed before Bcast.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Parallelise 1D Jacobi with 1-cell halos in MPI. Datatypes, overlap, termination.

**Expected Key Points:**
- Decompose segments; Type for halo; Irecv halo, compute interior, Wait, compute edges; Allreduce max residual.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List point-to-point vs collective calls (three each).

**Expected Key Points:**
- P2P: Send, Recv, Isend, Irecv, Sendrecv.
- Coll: Bcast, Reduce, Scatter, Gather, Allreduce, Barrier.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Tags and MPI_ANY_SOURCE: uses and dangers.

**Expected Key Points:**
- Tags distinguish message kinds.
- ANY_SOURCE is flexible but can mismatch order; still match comm and (usually) tag.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Tree vs linear Bcast: messages for p=8.

**Expected Key Points:**
- Linear: 7 sequential sends from root.
- Binomial tree: log p rounds, better on fat machines.
- MPI library picks an algorithm.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** p does not divide n in Scatter of ints. What API?

**Expected Key Points:**
- MPI_Scatterv with sendcounts/displs, or pad n.
- Uneven Scatter without Scatterv is incorrect.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Lab: deadlock demo + Sendrecv fix + time π for p=1,2,4. Rubric.

**Expected Key Points:**
- Show hang (or document eager escape), fix, plot S, discuss reduction vs print-local-wrong-π.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** MPI+OpenMP hybrid: MPI_Init_thread levels.

**Expected Key Points:**
- SINGLE, FUNNELED, SERIALIZED, MULTIPLE.
- Pick FUNNELED if only master MPI.
- Map 1 rank/socket + OpenMP.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Collectives are not just for convenience — they encode scalable algorithms.’ Discuss Bcast/Reduce trees and Allreduce.

**Expected Key Points:**
- Libraries use binomial/recursive-doubling/Rabenseifner.
- Users should call Allreduce not hand-rolled O(p) rings on big p.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** What does MPI_Barrier guarantee?

**Expected Key Points:**
- No rank leaves until all have entered.
- It does not move user arrays.
- Used for timing and some handshakes.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Distributed Memory Programming with MPI).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Distributed and Memory in the context of Distributed-Memory Programming with MPI. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Parallel Computing scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Distributed as used in Distributed-Memory Programming with MPI. Include one precise example.

**Model answer:** Distributed is a foundational construct in Distributed-Memory Programming with MPI. Example should name entities/operations and relate to Memory. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Distributed and Memory. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Distributed-Memory Programming with MPI theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Programming to a realistic campus/industry scenario relevant to Distributed-Memory Programming with MPI. State assumptions.

**Model answer:** Describe scenario, map concepts (Distributed, Memory), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Memory and its role within Distributed-Memory Programming with MPI.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Distributed if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to with within Distributed-Memory Programming with MPI; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Distributed while building a solution involving with. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Distributed-Memory Programming with MPI principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Programming in Parallel Computing.

**Model answer:** Provide four definitions: include Distributed, Memory, and two adjacent terms from Distributed-Memory Programming with MPI. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Distributed-Memory Programming with MPI that integrates Distributed, Memory, and Programming.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Memory in Distributed-Memory Programming with MPI.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Distributed.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Distributed and MPI. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Distributed and Programming: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Distributed-Memory Programming with MPI, show intermediate results, box the final answer, and sanity-check.

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
**Question:** Explain how with depends on earlier ideas such as Distributed in Distributed-Memory Programming with MPI.

**Model answer:** Dependency chain with one counterexample showing what fails if Distributed is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where MPI measurably improves an outcome in Parallel Computing.

**Model answer:** Context, intervention using MPI, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Memory in Distributed-Memory Programming with MPI. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Distributed in Distributed-Memory Programming with MPI: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Parallel Computing.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Programming for Distributed-Memory Programming with MPI.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Programming.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Memory in Distributed-Memory Programming with MPI. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Distributed in Distributed-Memory Programming with MPI, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

