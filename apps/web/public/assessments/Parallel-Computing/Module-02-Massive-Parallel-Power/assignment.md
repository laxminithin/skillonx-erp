# Assignment — Parallel Computing — Module 2 — Massive Parallel Power

**Subject:** Parallel Computing  
**Module:** Module 2 — Massive Parallel Power  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain GPU SM, warp and CUDA core at teaching level.

**Expected Key Points:**
- SM: scheduler + shared mem + pipes.
- Warp: 32 SIMT threads.
- CUDA core: lane ALU.
- Many warps per SM hide memory latency.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define speedup and efficiency. Give units-free formulas.

**Expected Key Points:**
- S=T1/Tp, E=S/p.
- T1 should be a good serial baseline.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** State Amdahl’s law and compute S for s=0.1, p=4.

**Expected Key Points:**
- S=1/(0.1+0.9/4)=1/(0.1+0.225)=1/0.325≈3.08, not 4.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is hybrid CPU–GPU computing?

**Expected Key Points:**
- Host code + kernels; copies or unified memory; CPU for serial/irregular, GPU for data-parallel.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO5
**Question:** Amdahl vs Gustafson. When is each the right story for a lab report?

**Expected Key Points:**
- Fixed exam of n students: Amdahl/strong.
- Bigger mesh when you buy nodes: Gustafson/weak.
- Quote both formulas.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** s=0.15, p=32. Amdahl S. Gustafson scaled S if α=0.15. Compare.

**Expected Key Points:**
- Amdahl 1/(0.15+0.85/32)=1/(0.15+0.02656)≈5.66.
- Gustafson 0.15+32×0.85=27.35.
- Explain fixed vs scaled n.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Strong vs weak scaling plots: what you put on each axis and what ‘good’ looks like.

**Expected Key Points:**
- Strong: T or S vs p, n fixed; hope T~1/p.
- Weak: T vs p, n∝p; hope T flat.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** How to time CUDA including copies. Why cudaEvent and device sync matter.

**Expected Key Points:**
- Events around H2D, kernel, D2H; cudaDeviceSynchronize or event sync; warmup; don’t use printf timestamps on the host without sync.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** Kernel 0.3 ms, copies 12 ms. Propose two engineering fixes.

**Expected Key Points:**
- Move more work to GPU (fuse kernels), keep data on device, overlap streams, reduce precision, UVA/pinned memory, batch.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a scaling experiment for a 2D Jacobi solver on CPU threads then GPU. Metrics, n, p, pitfalls.

**Expected Key Points:**
- Strong n=1k^2, p=1,2,4,8; weak n∝p.
- Report S,E,GB/s.
- Pitfalls: turbo clocks, NUMA, PCIe, occupancy, not timing copies.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Occupancy 100% so the kernel is optimal.’ Critique.

**Expected Key Points:**
- Could be bandwidth-bound, bad coalescing, atomics, divergence, or register-starved alternative better.
- Profile with Nsight; roofline.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Massive parallel power is throughput, not clock. Contrast CPU latency design with GPU hiding.

**Expected Key Points:**
- CPUs: caches, branch pred, few threads.
- GPUs: huge TLP, SIMT, small caches/thread.
- Map algorithms accordingly.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five overheads that reduce efficiency.

**Expected Key Points:**
- Launch, memcpy, MPI, lock, imbalance, extra memory, false sharing, kernel call, allocation.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is load imbalance? One example in trapezoidal integration with adaptive intervals.

**Expected Key Points:**
- Hard subintervals starve other threads if static equal chunks.
- Use dynamic scheduling or rebuild partitions.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Why T1 must be a tuned serial code, not a crippled one.

**Expected Key Points:**
- Inflated T1 fakes speedup.
- Fair S uses a good compiler, -O2, and a serial algorithm not a contended lock.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** 40 SMs, max 64 warps/SM, kernel uses 8 warps/block and 8 blocks/SM. Occupancy?

**Expected Key Points:**
- 8×8=64 warps/SM → 64/64=100% occupancy (if registers/shared mem allow).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Lab: measure SAXPY S on 1..8 CPU threads and on GPU vs CPU T1. Discuss when GPU loses.

**Expected Key Points:**
- GPU loses on tiny n (launch+copy).
- Show break-even n.
- Plot E on CPU.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** PCIe 16 GB/s, kernel needs 4 GB in and 4 GB out. Lower bound on transfer time?

**Expected Key Points:**
- 8 GB / 16 GB/s = 0.5 s, ignoring overheads.
- Kernel must be fat enough to matter.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** Roofline-style plan: decide if a stencil is compute- or bandwidth-bound on a given GPU.

**Expected Key Points:**
- Arithmetic intensity FLOP/byte vs ridge point.
- Count loads of neighbours; cache reuse; then pick algorithm (tiling) vs more FLOPs.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define scalability in one paragraph.

**Expected Key Points:**
- Ability to keep efficiency acceptable as resources and possibly n grow; quantified by strong/weak plots, not by a single S.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Massive Parallel Power).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Massive and Parallel in the context of Massive Parallel Power. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Parallel Computing scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Massive as used in Massive Parallel Power. Include one precise example.

**Model answer:** Massive is a foundational construct in Massive Parallel Power. Example should name entities/operations and relate to Parallel. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Massive and Parallel. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Massive Parallel Power theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Power to a realistic campus/industry scenario relevant to Massive Parallel Power. State assumptions.

**Model answer:** Describe scenario, map concepts (Massive, Parallel), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Parallel and its role within Massive Parallel Power.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Massive if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Massive Parallel within Massive Parallel Power; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Massive while building a solution involving Massive Parallel. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Massive Parallel Power principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Power in Parallel Computing.

**Model answer:** Provide four definitions: include Massive, Parallel, and two adjacent terms from Massive Parallel Power. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Massive Parallel Power that integrates Massive, Parallel, and Power.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Parallel in Massive Parallel Power.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Massive.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Massive and Parallel Power. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Massive and Power: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Massive Parallel Power, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Power under constraints typical of Parallel Computing.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Massive Parallel depends on earlier ideas such as Massive in Massive Parallel Power.

**Model answer:** Dependency chain with one counterexample showing what fails if Massive is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Parallel Power measurably improves an outcome in Parallel Computing.

**Model answer:** Context, intervention using Parallel Power, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Parallel in Massive Parallel Power. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Massive in Massive Parallel Power: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Parallel Computing.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Power for Massive Parallel Power.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Power.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Parallel in Massive Parallel Power. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Massive in Massive Parallel Power, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

