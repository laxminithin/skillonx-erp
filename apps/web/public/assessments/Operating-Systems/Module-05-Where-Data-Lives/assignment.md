# Assignment — Operating Systems — Module 5 — Where Data Lives

**Subject:** Operating Systems  
**Module:** Module 5 — Where Data Lives  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define file and directory. Contrast absolute and relative paths.

**Expected Key Points:**
- File: named persistent byte/record stream plus metadata.
- Directory: name→inode map.
- Absolute from root; relative from cwd.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is stored in a typical inode (metadata) versus in directory entries?

**Expected Key Points:**
- Inode: owner, mode, times, size, block pointers.
- Directory entry: name + inode number (and type).
- Names are not the inode’s primary key.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Contiguous file allocation: how it works, one plus, one minus.

**Expected Key Points:**
- Start block + length.
- Plus: sequential speed, simple random access.
- Minus: external fragmentation and costly growth.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Linked vs indexed file allocation.

**Expected Key Points:**
- Linked: next pointer per block (or FAT).
- Easy grow, poor random.
- Indexed: inode/index blocks of pointers; good random, extra I/O for the index.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare FCFS, SSTF, SCAN and C-SCAN disk scheduling.

**Expected Key Points:**
- FCFS fair/simple, long seeks.
- SSTF greedy, possible starvation.
- SCAN elevator both ways.
- C-SCAN one way + jump, more uniform wait.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is VFS? Why mount FAT and ext4 under one Unix tree?

**Expected Key Points:**
- Virtual file system switch.
- Common open/read/write; each FS registers operations.
- Users see /mnt/usb vs /home without new syscalls.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Head at 53, requests 98,183,37,122,14,124,65,67, disk 0–199. Compute SCAN toward 0 (include 0) and LOOK toward 0. Show the order and totals 236 vs 208.

**Expected Key Points:**
- SCAN order: 37,14,0,65,67,98,122,124,183; movement 236.
- LOOK: 37,14 then 65,67,98,122,124,183 (no 0); 16+23+51+2+31+24+2+59=208.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** NAS vs SAN for a college: home directories vs VM disk images.

**Expected Key Points:**
- Homes: NAS/NFS so any lab PC sees files.
- VM images: SAN/iSCSI blocks for performance and host-level FS/cluster FS.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Using the same 8 requests and head 53, compute FCFS (640), SSTF (236) and C-SCAN toward 199 including 199→0 (382). Comment on fairness vs total movement.

**Expected Key Points:**
- FCFS 640: fair arrivals, huge travel.
- SSTF 236: short total, far cylinder (183) last — starvation risk in other traces.
- C-SCAN 382: extra jump, smoother waits than SCAN’s reversal.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a student-project FS: inodes with 8 directs + one single indirect, 1 KB blocks, 4-byte addresses. Max file size? Discuss a directory as a file of name+inum records.

**Expected Key Points:**
- Indirect: 1024/4=256 pointers → 256 KB.
- Max ≈ 264 KB.
- Directory: linear or hashed entries; .
- ; path lookup component by component.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is sequential vs random file access? Which allocation fits each?

**Expected Key Points:**
- Sequential: next byte; contiguous/linked/streaming.
- Random: seek to offset; contiguous or indexed, not naive linked.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** FAT as linked allocation with the links in a table. One advantage vs pointers inside data blocks.

**Expected Key Points:**
- Links clustered in FAT: can cache the map, data blocks hold only data, easier recovery of the chain, still weak for huge random files without cache.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Hard link vs symbolic link. Why can’t you hard-link directories easily?

**Expected Key Points:**
- Hard link: extra name, same inode, same data, count in inode.
- Symlink: a path string.
- Directory hard links create cycles and break tree traversal/‘..’.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO5
**Question:** SSTF vs SCAN for an interactive lab server with occasional requests at both rims. Which would you pick and why?

**Expected Key Points:**
- SCAN/C-SCAN/LOOK: bounded wait, no rim starvation.
- SSTF might linger in the middle.
- Interactive systems value wait-time fairness.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** ‘A file system is a data structure on disk plus a cache and a VFS API.’ Expand: allocation, directories, consistency (fsck/journal) at a high level.

**Expected Key Points:**
- On disk: inodes, bitmaps, directories.
- Allocation methods.
- Crash: bitmap vs inode mismatch — journaling (ext4) or fsck.
- Not just a bag of sectors.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Indexed file, 4 KB blocks, inode in memory. Trace reading 1 byte at offset 20 000. Which pointers?

**Expected Key Points:**
- Offset 20000 / 4096 = block 4 remainder 3616.
- If 12 directs, use direct[4], one data I/O (plus inode already in memory).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four disk-arm algorithms in the BCS303 syllabus.

**Expected Key Points:**
- FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** C-SCAN vs C-LOOK: when do the totals differ?

**Expected Key Points:**
- If no requests near the rim, C-SCAN still seeks to the physical end then jumps; C-LOOK jumps from the last request to the first in the same direction, shorter empty travel.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** Propose storage for VVIET: NFS home (NAS), iSCSI lab images (SAN), local SSD scratch. Justify protocols and one backup idea.

**Expected Key Points:**
- NFS for shared homes and permissions.
- iSCSI LUNs for heavy VM disks.
- Local SSD for /tmp and compiles.
- Nightly snapshots of the NAS; replicate SAN volumes.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the elevator algorithm’s service order if the head is moving up and requests sit both above and below?

**Expected Key Points:**
- Service all above in order, then reverse and service below (SCAN), or jump to the bottom without servicing on the rewind (C-SCAN).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Where Data Lives).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Where and Data in the context of Where Data Lives. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Operating Systems scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Where as used in Where Data Lives. Include one precise example.

**Model answer:** Where is a foundational construct in Where Data Lives. Example should name entities/operations and relate to Data. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Where and Data. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Where Data Lives theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Lives to a realistic campus/industry scenario relevant to Where Data Lives. State assumptions.

**Model answer:** Describe scenario, map concepts (Where, Data), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Data and its role within Where Data Lives.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Where if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Where Data within Where Data Lives; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Where while building a solution involving Where Data. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Where Data Lives principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Where Data Lives that integrates Where, Data, and Lives.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Data in Where Data Lives.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Where.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Where and Data Lives. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Where and Lives: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Where Data Lives, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Lives under constraints typical of Operating Systems.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Where Data depends on earlier ideas such as Where in Where Data Lives.

**Model answer:** Dependency chain with one counterexample showing what fails if Where is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Data Lives measurably improves an outcome in Operating Systems.

**Model answer:** Context, intervention using Data Lives, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Data in Where Data Lives. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Where in Where Data Lives: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Operating Systems.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Lives for Where Data Lives.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Lives.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Lives in Operating Systems.

**Model answer:** Provide four definitions: include Where, Data, and two adjacent terms from Where Data Lives. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Data in Where Data Lives. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Where in Where Data Lives, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

