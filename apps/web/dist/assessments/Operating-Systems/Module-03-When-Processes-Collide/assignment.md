# Assignment — Operating Systems — Module 3 — When Processes Collide

**Subject:** Operating Systems  
**Module:** Module 3 — When Processes Collide  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a race condition? Give a count++ example.

**Expected Key Points:**
- Shared count; two threads read the same value and both write +1, losing an update.
- Critical section must be atomic wrt that variable.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State the critical-section problem’s three requirements.

**Expected Key Points:**
- Mutual exclusion, progress, bounded waiting.
- (Optional 4th in some texts: processes may run at different speeds.)
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a semaphore? Distinguish wait and signal.

**Expected Key Points:**
- Integer + atomic P/V.
- wait: decrement or block.
- signal: increment or wake a waiter.
- Used for mutex and producer–consumer.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** List Coffman’s four conditions with one sentence each.

**Expected Key Points:**
- Mutex: exclusive resources.
- Hold-and-wait: hold while requesting.
- No preemption: cannot steal.
- Circular wait: cycle of waits.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain Peterson’s algorithm for two processes. Argue mutex briefly.

**Expected Key Points:**
- flag[i]=true, turn=j, spin while flag[j]&&turn==j.
- If both in, turn is one value so only one fails the wait.
- Remainder clears flag[i].
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare deadlock prevention vs avoidance vs detection.

**Expected Key Points:**
- Prevention: break a Coffman rule (no hold-and-wait, resource order).
- Avoidance: Banker/safe states.
- Detection: RAG/wait-for + recovery (kill/preempt).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write semaphore-based bounded buffer wait/signal order for produce and consume.

**Expected Key Points:**
- Produce: wait(empty); wait(mutex); insert; signal(mutex); signal(full).
- Consume: wait(full); wait(mutex); remove; signal(mutex); signal(empty).
- Never invert mutex with empty/full carelessly.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Dining philosophers: show the deadlock and one correct strategy.

**Expected Key Points:**
- All take left then right → cycle.
- Fixes: allow at most n−1 to sit, asymmetric (last philosopher opposite order), or atomic take-two via a waiter/monitor.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Apply Banker. Allocation P0(0,1,0) P1(2,0,0) P2(3,0,2) P3(2,1,1) P4(0,0,2); Max P0(7,5,3) P1(3,2,2) P2(9,0,2) P3(2,2,2) P4(4,3,3); Available (3,3,2). Compute Need, a safe sequence, and whether P1 may be granted (1,0,2).

**Expected Key Points:**
- Need: (7,4,3),(1,2,2),(6,0,0),(0,1,1),(4,3,1).
- Safety: P1,P3,P4,P0,P2.
- Request (1,0,2)≤Need and ≤Available; new Available (2,3,0) still safe (P1,P3,P4,P0,P2).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a readers–writers lock that does not starve writers. Sketch counters and who waits.

**Expected Key Points:**
- Writer preference or fair ticket/FIFO: new readers wait if a writer is waiting.
- writerCount/waitingWriters; readers wait on okToRead; writers on okToWrite; mutex around state.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define deadlock vs livelock vs starvation.

**Expected Key Points:**
- Deadlock: circular wait, no progress.
- Livelock: states change but no useful progress.
- Starvation: one process waits forever while others proceed.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a monitor? Role of wait/signal on condition variables.

**Expected Key Points:**
- Module with implicit mutex.
- wait releases the monitor and sleeps; signal/broadcast wakes waiters (Mesa: waiter reacquires and rechecks the condition).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** How does resource ordering prevent circular wait? Give an example with printer then tape.

**Expected Key Points:**
- All processes request increasing IDs (printer=1, tape=2).
- Cannot hold tape and wait printer if that would invert order.
- Breaks cycles.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** Two processes: P holds A wants B; Q holds B wants A. Draw RAG and propose recovery.

**Expected Key Points:**
- Cycle P–A–Q–B–P (single instance).
- Recover: abort one, or preempt A from P if the resource is preemptible (rare for mutexes — usually abort).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Mutexes are not enough for producer–consumer.’ Explain why empty/full (or conditions) are required besides exclusion.

**Expected Key Points:**
- Mutex serialises the buffer structure but a full buffer needs the producer to wait for space; empty needs the consumer to wait for data.
- Signalling is not exclusion.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Binary semaphore mutex=1. T1 wait, T2 wait, T1 signal. Who runs the CS and in what order of entry?

**Expected Key Points:**
- T1 acquires (mutex=0), T2 blocks.
- T1 signal wakes T2, which then owns the CS.
- Mutual exclusion holds; T2 delayed — not deadlock.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List three deadlock recovery methods.

**Expected Key Points:**
- Abort all deadlocked processes; abort one at a time until cycle breaks; preempt resources (and roll back) if possible.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** Binary vs counting semaphore with a three-printer office example.

**Expected Key Points:**
- Counting S=3 allows three concurrent users.
- Each wait takes a printer; signal returns one.
- A binary lock would allow only one printer in use.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Specify Banker data structures (Available, Max, Allocation, Need) and the safety algorithm in steps.

**Expected Key Points:**
- Need=Max−Allocation.
- Work=Available; Finish=false.
- Repeat: find i with ¬Finish and Need_i≤Work; Work+=Allocation_i; Finish_i=true.
- If all Finish, safe.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a RAG? When does a cycle imply deadlock?

**Expected Key Points:**
- Bipartite graph processes/resources with request and assignment edges.
- If every resource type has a single instance, a cycle ⇔ deadlock.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 When Processes Collide).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast When and Processes in the context of When Processes Collide. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Operating Systems scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of When as used in When Processes Collide. Include one precise example.

**Model answer:** When is a foundational construct in When Processes Collide. Example should name entities/operations and relate to Processes. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on When and Processes. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with When Processes Collide theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Collide to a realistic campus/industry scenario relevant to When Processes Collide. State assumptions.

**Model answer:** Describe scenario, map concepts (When, Processes), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Processes and its role within When Processes Collide.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to When if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to When Processes within When Processes Collide; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies When while building a solution involving When Processes. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using When Processes Collide principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in When Processes Collide that integrates When, Processes, and Collide.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Processes in When Processes Collide.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to When.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both When and Processes Collide. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving When and Collide: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from When Processes Collide, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Collide under constraints typical of Operating Systems.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how When Processes depends on earlier ideas such as When in When Processes Collide.

**Model answer:** Dependency chain with one counterexample showing what fails if When is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Processes Collide measurably improves an outcome in Operating Systems.

**Model answer:** Context, intervention using Processes Collide, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Processes in When Processes Collide. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with When in When Processes Collide: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Operating Systems.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Collide for When Processes Collide.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Collide.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Collide in Operating Systems.

**Model answer:** Provide four definitions: include When, Processes, and two adjacent terms from When Processes Collide. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Processes in When Processes Collide. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about When in When Processes Collide, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

