# Assignment — Operating Systems — Module 4 — Memory Is an Illusion

**Subject:** Operating Systems  
**Module:** Module 4 — Memory Is an Illusion  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain logical vs physical addresses and the role of the MMU.

**Expected Key Points:**
- CPU emits virtual/logical addresses.
- MMU + page tables/TLB produce physical frame+offset.
- User never sees RAM addresses.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define paging. What is a page vs a frame?

**Expected Key Points:**
- Process virtual memory is split into equal pages.
- Physical memory is split into frames of the same size.
- A page maps to a frame.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a page fault? List the main handler steps.

**Expected Key Points:**
- Trap on not-present page.
- Validate, allocate/evict frame, read page from backing store, update PTE, restart the instruction.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** TLB: why it exists, hit vs miss.

**Expected Key Points:**
- Page tables are in memory (slow).
- TLB caches translations.
- Miss: walk tables, then fill TLB.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare contiguous memory allocation with paging: fragmentation and relocation.

**Expected Key Points:**
- Contiguous: external fragmentation, easy base+limit.
- Paging: almost no external frag, internal in last page, relocation via page table.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain demand paging and the valid bit.

**Expected Key Points:**
- Pages start invalid.
- First reference faults and is loaded.
- Valid=1 after load.
- Illegal addresses remain invalid and kill/signal the process.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Fully work LRU for 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 with 3 frames. Show the resident set after each reference and the fault count.

**Expected Key Points:**
- LRU, 3 frames (oldest→newest).
- 7* [7]; 0* [7,0]; 1* [7,0,1]; 2* evict 7 [0,1,2]; hit 0 [1,2,0]; 3* evict 1 [2,0,3]; hit 0 [2,3,0]; 4* evict 2 [3,0,4]; 2* evict 3 [0,4,2]; 3* evict 0 [4,2,3]; 0* evict 4 [2,3,0]; hit 3 [2,0,3]; hit 2 [0,3,2]; 1* evict 0 [3,2,1]; hit 2 [3,1,2]; 0* evict 3 [1,2,0]; hit 1 [2,0,1]; 7* evict 2 [0,1,7]; hit 0 [1,7,0]; hit 1 [7,0,1].
- Faults = 12 (hits = 8).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** FIFO vs LRU vs Optimal on the same string (3 frames). Quote 15, 12, 9 and interpret.

**Expected Key Points:**
- FIFO ignores recency (15).
- LRU uses past (12).
- Optimal uses future (9) — a bound, not an online OS policy.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Demonstrate Belady’s anomaly for FIFO on 1,2,3,4,1,2,5,1,2,3,4,5 with 3 and 4 frames. Show both frame traces.

**Expected Key Points:**
- 3 frames: 9 faults (hits: the 1,2 after 5, and last 5).
- 4 frames: 10 faults (only two hits: the 1,2 after the first four).
- More frames ⇒ more faults.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Working-set model and thrashing. How should the degree of multiprogramming adapt?

**Expected Key Points:**
- WS(Δ) = pages in last Δ refs.
- If Σ WS > RAM, cut multiprogramming (swap out a process) rather than shrinking everyone’s frames into a fault storm.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Internal vs external fragmentation with one paging example and one partition example.

**Expected Key Points:**
- Internal: 6 KB process, 4 KB pages → 2 KB unused in page 2.
- External: 10 MB hole split as 4+6 while a 8 MB process waits.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is Belady’s anomaly? Which famous algorithm shows it?

**Expected Key Points:**
- Faults can increase when frames increase.
- FIFO (and some clock variants) can; stack algorithms (LRU, Optimal) cannot.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** Page 4 KB, 32-bit VA, TLB 10 ns, memory 80 ns, hit 98%, one-level table. Compute EAT.

**Expected Key Points:**
- Hit: 10+80=90.
- Miss: 10+80 (PTE)+80 (data)=170.
- EAT=0.98×90+0.02×170=88.2+3.4=91.6 ns.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Locality of reference: temporal vs spatial, with a loop example.

**Expected Key Points:**
- Temporal: reuse of loop code/counters.
- Spatial: sequential array elements in a page.
- Makes small resident sets viable.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a simple virtual-memory system: page size choice (4 KB vs 1 MB), TLB, and clock (second-chance) instead of true LRU.

**Expected Key Points:**
- 4 KB: less internal waste, bigger tables.
- 1 MB: opposite.
- Clock: circular scan of reference bits.
- Dirty bit to skip writes.
- ASID to avoid full TLB flush.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** A VM guest is thrashing while the host has free RAM. Give two causes and two fixes.

**Expected Key Points:**
- Guest working set > guest RAM balloon; host swapping the guest.
- Fixes: more guest RAM, balloon driver, disable nested overcommit, prepaging/working-set in guest.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List PTE bits commonly stored besides the frame number.

**Expected Key Points:**
- Valid/present, read/write, user/supervisor, accessed/referenced, dirty/modified, caching disable, NX if supported.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** Demand paging vs loading the whole process at exec. Trade-offs for a 200 MB MATLAB on a student PC.

**Expected Key Points:**
- Demand: fast start, less RAM if not all code is used, fault I/O later.
- Whole load: slow start, more RAM, fewer later faults.
- Demand is the modern default.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Virtual memory is an illusion that depends on locality.’ Explain translation, faults, replacement and thrashing.

**Expected Key Points:**
- VA→PA via tables/TLB; only hot pages resident; replacement (LRU/clock) when RAM is full; if locality breaks or RAM is too small, fault rate explodes (thrash).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Why restart the faulting instruction after a page-in, rather than skipping it?

**Expected Key Points:**
- The instruction did not complete (e.g.
- After the page is present it must execute correctly.
- CPUs save enough state to restart.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Memory Is an Illusion).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Memory and Is in the context of Memory Is an Illusion. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Operating Systems scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Memory as used in Memory Is an Illusion. Include one precise example.

**Model answer:** Memory is a foundational construct in Memory Is an Illusion. Example should name entities/operations and relate to Is. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Memory and Is. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Memory Is an Illusion theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply an to a realistic campus/industry scenario relevant to Memory Is an Illusion. State assumptions.

**Model answer:** Describe scenario, map concepts (Memory, Is), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Is and its role within Memory Is an Illusion.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Memory if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Illusion within Memory Is an Illusion; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Memory while building a solution involving Illusion. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Memory Is an Illusion principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Memory Is an Illusion that integrates Memory, Is, and an.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Is in Memory Is an Illusion.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Memory.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Memory and Memory Is. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Memory and an: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Memory Is an Illusion, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling an under constraints typical of Operating Systems.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Illusion depends on earlier ideas such as Memory in Memory Is an Illusion.

**Model answer:** Dependency chain with one counterexample showing what fails if Memory is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Memory Is measurably improves an outcome in Operating Systems.

**Model answer:** Context, intervention using Memory Is, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Is in Memory Is an Illusion. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Memory in Memory Is an Illusion: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Operating Systems.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to an for Memory Is an Illusion.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of an.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying an in Operating Systems.

**Model answer:** Provide four definitions: include Memory, Is, and two adjacent terms from Memory Is an Illusion. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Is in Memory Is an Illusion. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Memory in Memory Is an Illusion, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

