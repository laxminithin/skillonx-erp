# Assignment — Operating Systems — Module 1 — Inside the Machine

**Subject:** Operating Systems  
**Module:** Module 1 — Inside the Machine  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define an operating system from the user view and the system view.

**Expected Key Points:**
- User: convenient interface to run programs.
- System: resource allocator (CPU, memory, I/O) and control program that prevents errors and interference.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is dual-mode operation? Name two privileged operations.

**Expected Key Points:**
- Hardware user vs kernel mode.
- Privileged: I/O, halt, setting the mode bit, programming the MMU, disabling interrupts.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** What happens during bootstrap from power-on until the first user process?

**Expected Key Points:**
- Firmware/POST, bootloader from disk/network, kernel loaded and initialised, devices/interrupts set up, init/systemd started.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is an interrupt? Distinguish interrupt from trap with one example each.

**Expected Key Points:**
- Interrupt: asynchronous (timer, disk).
- Trap: synchronous (syscall, page fault, /0).
- Both vector to handlers in kernel mode.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the system-call path from printf/write in an application to a driver.

**Expected Key Points:**
- Libc write stub, trap with syscall number, kernel copies args, VFS/driver, maybe block on I/O, return status to user.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare monolithic, microkernel and hybrid kernels with one OS example each.

**Expected Key Points:**
- Monolithic: Linux (most services in kernel).
- Microkernel: MINIX/QNX (servers).
- Hybrid: Windows NT (large kernel + some user services).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Why is a timer interrupt essential for a time-sharing OS?

**Expected Key Points:**
- Without it a CPU-bound loop never traps.
- Timer forces kernel entry so the scheduler can switch processes and account CPU time.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare programmed I/O and DMA. When is PIO still used?

**Expected Key Points:**
- PIO: CPU in the copy loop, simple devices/small transfers.
- DMA: bulk disks/NICs, one interrupt at completion.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Sketch dual-mode protection for a lab PC: mode bit, privileged I/O, syscall trap, and what happens if a student program tries inb/outb.

**Expected Key Points:**
- User bit set; I/O privileged; inb traps; OS delivers SIGSEGV or emulates.
- Kernel handlers run privileged then iret restores user mode.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare Type-1 and Type-2 hypervisors. Map ESXi vs VirtualBox-on-Windows. Why do sensitive instructions need to trap?

**Expected Key Points:**
- Type-1 bare metal; Type-2 hosted.
- Sensitive ops must trap (or be assisted) so guests cannot break isolation (Popek–Goldberg).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a system call? List five POSIX-style examples.

**Expected Key Points:**
- Controlled kernel service request: read, write, open, fork, exec, wait, exit, mmap.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the interrupt vector table? Who fills it?

**Expected Key Points:**
- Array of ISR addresses indexed by interrupt/trap number.
- Firmware/OS initialise it during boot; CPU indexes it on events.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** A vendor claims ‘our OS has no kernel mode; everything is a DLL’. Critique for a multi-user lab.

**Expected Key Points:**
- Without privilege, any student can disable interrupts, remap memory, steal passwords.
- Dual mode is required for protection.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** How do user programs pass arguments to system calls? Mention at least two conventions.

**Expected Key Points:**
- Registers, a block in memory whose address is in a register, or the user stack.
- Kernel must validate pointers.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** ‘The OS is a resource allocator and a control program.’ Expand with CPU, memory, I/O and protection examples from a college server.

**Expected Key Points:**
- Allocator: schedule CPU, allocate frames, spool printers.
- Control: dual mode, file permissions, killing runaway processes, isolation of VMs.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Timer every 5 ms. How many interrupts per second? If handling takes 50 μs, what fraction of CPU is lost to timer ISRs (ignore cache effects)?

**Expected Key Points:**
- 200 interrupts/s.
- 200 × 50e-6 = 0.01 s/s = 1% of CPU.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four OS services visible to users and four components typical of a kernel.

**Expected Key Points:**
- Services: program exec, I/O, files, comms, error detection.
- Kernel: scheduler, VM, VFS, drivers, IPC.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare a system call with a library call such as strlen. Which can switch mode?

**Expected Key Points:**
- strlen: user-space function, no mode switch.
- read: library stub then trap.
- Cost and privilege differ.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Propose whether a new teaching OS should be microkernel or monolithic for a 1-semester lab, with two reasons each way.

**Expected Key Points:**
- Monolithic: easier in-kernel debugging, fewer IPC bugs, Linux-like.
- Microkernel: isolation of drivers, smaller TCB, teaching IPC — but harder performance.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a virtual machine? Give one teaching use at VVIET.

**Expected Key Points:**
- Isolated duplicate of a computer via a VMM.
- Students can crash a guest Linux without harming the lab host.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Inside the Machine).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Inside and Machine in the context of Inside the Machine. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Operating Systems scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Inside as used in Inside the Machine. Include one precise example.

**Model answer:** Inside is a foundational construct in Inside the Machine. Example should name entities/operations and relate to Machine. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Inside and Machine. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Inside the Machine theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Inside Machine to a realistic campus/industry scenario relevant to Inside the Machine. State assumptions.

**Model answer:** Describe scenario, map concepts (Inside, Machine), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Machine and its role within Inside the Machine.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Inside if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Inside the Machine; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Inside while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Inside the Machine principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Inside the Machine that integrates Inside, Machine, and Inside Machine.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Machine in Inside the Machine.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Inside.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Inside and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Inside and Inside Machine: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Inside the Machine, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Inside Machine under constraints typical of Operating Systems.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Inside in Inside the Machine.

**Model answer:** Dependency chain with one counterexample showing what fails if Inside is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where expected measurably improves an outcome in Operating Systems.

**Model answer:** Context, intervention using expected, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Machine in Inside the Machine. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Inside in Inside the Machine: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Operating Systems.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Inside Machine for Inside the Machine.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Inside Machine.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Inside Machine in Operating Systems.

**Model answer:** Provide four definitions: include Inside, Machine, and two adjacent terms from Inside the Machine. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Machine in Inside the Machine. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Inside in Inside the Machine, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

