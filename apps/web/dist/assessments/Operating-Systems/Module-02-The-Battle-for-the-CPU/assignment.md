# Assignment — Operating Systems — Module 2 — The Battle for the CPU

**Subject:** Operating Systems  
**Module:** Module 2 — The Battle for the CPU  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define process and list the typical contents of a PCB.

**Expected Key Points:**
- Process = program in execution.
- PCB: PID, state, PC, GPRs, scheduling info, memory maps, open files, accounting, parent/child links.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a context switch? Why is it pure overhead?

**Expected Key Points:**
- Save/restore CPU and memory-management state to run another process.
- No user work is done during the switch.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Draw and explain process states: new, ready, running, waiting, terminated.

**Expected Key Points:**
- New: being created.
- Ready: waiting for CPU.
- Running: on CPU.
- Waiting: blocked on event.
- Terminated: finished, PCB may linger as zombie until wait.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish process and thread with a browser example.

**Expected Key Points:**
- Process: isolated address space.
- Threads: share heap/code, own stacks.
- Browser: UI thread + renderer threads in one process (or process-per-tab models).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare shared memory and message passing IPC.

**Expected Key Points:**
- Shared memory: map pages, fast, needs mutex/sem.
- Messages: send/receive via kernel, simpler sharing, extra copies.
- Pipes/sockets vs shm.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain FCFS and the convoy effect with long CPU job + short jobs.

**Expected Key Points:**
- FCFS runs in arrival order.
- A long job arriving first makes many short jobs wait, raising mean wait and lowering interactivity.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Fully work RR: P1=24, P2=3, P3=3 ms, all arrive at 0, quantum 4 ms, ready order P1,P2,P3. Gantt, waiting, average wait.

**Expected Key Points:**
- Gantt: P1 0–4, P2 4–7, P3 7–10, P1 10–30.
- Completion 30,7,10.
- Wait = C−burst = 6,4,7.
- Average wait = 17/3 ms.
- Average TAT = 47/3 ms.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare SJF and SRTF using P1(0,8), P2(1,4), P3(2,9), P4(3,5).

**Expected Key Points:**
- SJF NP: P1 then P2,P4,P3; avg wait 7.75.
- SRTF: P1, preempt for P2 at 1, then P4, finish P1, then P3; avg wait 6.5.
- Preemption helps.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** For bursts 24,3,3 at t=0 compute FCFS, SJF and RR(q=4) average waiting times and comment on the convoy.

**Expected Key Points:**
- FCFS 17, SJF 3, RR 17/3 ≈ 5.67.
- FCFS convoy: shorts wait 24+27.
- RR lets shorts finish after one slice of the long job.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain MLFQ. How do CPU-bound jobs sink and interactive jobs stay responsive? Mention starvation control.

**Expected Key Points:**
- Several queues, decreasing priority/increasing q.
- Jobs that use full quantum drop.
- I/O-bound stay high.
- Aging/boost avoids starvation in the basement queue.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the ready queue vs a device queue?

**Expected Key Points:**
- Ready: processes waiting for CPU.
- Device/wait: processes blocked until that I/O or event completes.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the degree of multiprogramming? How does it relate to CPU utilisation (intuitively)?

**Expected Key Points:**
- Number of processes in memory.
- More processes can overlap I/O of one with CPU of another, raising utilisation until memory pressure.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Exponential averaging for SJF: τ_{n+1} = α t_n + (1−α) τ_n. Role of α.

**Expected Key Points:**
- t_n measured last burst, τ predicted.
- Large α weights recent bursts; α=0 freezes the initial guess; α=1 uses only the last burst.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO5
**Question:** Quantum 100 ms vs 1 ms on a campus lab. Discuss responsiveness vs overhead (assume 0.5 ms switch).

**Expected Key Points:**
- q=100: ~0.5% switch overhead, sluggish interactive feel.
- q=1: ~33% overhead.
- Choose a few tens of ms typically.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a scheduler mix for a server: interactive SSH, batch Hadoop, FIFO real-time alarm. Mention queues and preemption.

**Expected Key Points:**
- MLFQ or two-level: RT FIFO/priority above, interactive RR, batch low-priority FCFS/CFS.
- Avoid priority inversion with inheritance if locks used.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** RR q=2: P1=10, P2=5, P3=8 all at 0. Produce the Gantt chart and each process’s waiting time.

**Expected Key Points:**
- Order repeating P1,P2,P3: finishes P2 at 15 wait 10; P3 at 21 wait 13; P1 at 23 wait 13.
- (Slots: 0–2 P1, 2–4 P2, 4–6 P3, 6–8 P1, 8–10 P2, 10–12 P3, 12–14 P1, 14–15 P2 done, 15–17 P3, 17–19 P1, 19–21 P3 done, 21–23 P1 done.)
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four scheduling criteria (metrics) used to compare algorithms.

**Expected Key Points:**
- CPU utilisation, throughput, turnaround time, waiting time, response time, fairness.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** Preemptive vs non-preemptive scheduling. Give one algorithm of each.

**Expected Key Points:**
- Non-preemptive: FCFS, SJF.
- Preemptive: RR, SRTF, preemptive priority.
- Preemption needs a timer and extra switches.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Shortest job first is optimal but unfair.’ Discuss prediction, starvation of long jobs, and aging/feedback alternatives.

**Expected Key Points:**
- SJF/SRTF minimise mean wait given known bursts but long jobs wait.
- Predict with exponential average.
- Starvation → aging or MLFQ so long jobs eventually run.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** What information must be saved on a context switch besides general registers?

**Expected Key Points:**
- PC/PSW, stack pointer, FPU/SIMD if used, memory-management registers (page-table base), thread-local/kernel stack pointers.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 The Battle for the CPU).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Battle and for in the context of The Battle for the CPU. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Operating Systems scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Battle as used in The Battle for the CPU. Include one precise example.

**Model answer:** Battle is a foundational construct in The Battle for the CPU. Example should name entities/operations and relate to for. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Battle and for. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with The Battle for the CPU theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply CPU to a realistic campus/industry scenario relevant to The Battle for the CPU. State assumptions.

**Model answer:** Describe scenario, map concepts (Battle, for), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on for and its role within The Battle for the CPU.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Battle if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Battle for within The Battle for the CPU; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Battle while building a solution involving Battle for. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using The Battle for the CPU principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in The Battle for the CPU that integrates Battle, for, and CPU.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on for in The Battle for the CPU.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Battle.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Battle and for CPU. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Battle and CPU: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from The Battle for the CPU, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling CPU under constraints typical of Operating Systems.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Battle for depends on earlier ideas such as Battle in The Battle for the CPU.

**Model answer:** Dependency chain with one counterexample showing what fails if Battle is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where for CPU measurably improves an outcome in Operating Systems.

**Model answer:** Context, intervention using for CPU, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving for in The Battle for the CPU. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Battle in The Battle for the CPU: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Operating Systems.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to CPU for The Battle for the CPU.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of CPU.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying CPU in Operating Systems.

**Model answer:** Provide four definitions: include Battle, for, and two adjacent terms from The Battle for the CPU. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around for in The Battle for the CPU. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Battle in The Battle for the CPU, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

