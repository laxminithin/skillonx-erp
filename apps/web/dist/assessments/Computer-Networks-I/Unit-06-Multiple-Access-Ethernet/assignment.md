# Assignment — Computer Networks-I — Unit 6 — Multiple Access & Ethernet

**Subject:** Computer Networks-I  
**Module:** Unit 6 — Multiple Access & Ethernet  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain pure and slotted ALOHA. State S(G) for each and the maxima.

**Expected Key Points:**
- Pure: send anytime, S=G e^{−2G}, max 1/(2e)≈18.4% at G=0.5.
- Slotted: slot aligned, S=G e^{−G}, max 1/e≈36.8% at G=1.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define CSMA. Why does it reduce collisions relative to ALOHA?

**Expected Key Points:**
- Listen before talk.
- If another station is already sending, you defer, avoiding some overlaps ALOHA would cause.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish CSMA/CD and CSMA/CA with the network type that uses each.

**Expected Key Points:**
- CD: wired Ethernet half-duplex, abort+jam.
- CA: 802.11, IFS+backoff+ACK, optional RTS/CTS.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List three controlled-access methods and one sentence each.

**Expected Key Points:**
- Reservation: stations reserve future slots.
- Polling: primary invites secondaries.
- Token: only token holder may send.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare FDMA, TDMA and CDMA.

**Expected Key Points:**
- CDMA: codes, overlapping in time/freq.
- CDMA needs power control; TDMA needs tight timing; FDMA needs filters/guards.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** A shared 1 Mbps channel uses pure ALOHA, G=0.2. Find S and the successful throughput in kbps.

**Expected Key Points:**
- S=0.2 e^{−0.4}≈0.134.
- Throughput ≈ 134 kbps.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain 1-persistent, nonpersistent and p-persistent CSMA.

**Expected Key Points:**
- 1-p: send as soon as idle (greedy).
- Nonpersistent: if busy, wait random then sense again.
- p-p: if idle, send with prob p in a slot.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain Ethernet frame fields: dest MAC, src MAC, type/length, payload, FCS. What is the maximum payload?

**Expected Key Points:**
- 6+6+2+payload+4 FCS.
- Max payload 1500 bytes (standard); min 46 bytes padded.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** 10 Mbps, 2500 m, v=2×10^8 m/s, min frame 512 bits. Compute Tp, Tt_min, a, and CSMA/CD efficiency 1/(1+6.44a).

**Expected Key Points:**
- Tp=12.5 μs, Tt=51.2 μs, a≈0.244, η=1/(1+1.57)≈0.389 (about 39%).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Slotted ALOHA, 10 stations, each 10 packets/s, packet 1000 bits, channel 1 Mbps. Find G and S. Is the channel overloaded?

**Expected Key Points:**
- Offered 10×10×1000=100 kbps so G=0.1.
- S=0.1 e^{−0.1}≈0.090.
- Lightly loaded, not at the 0.368 peak.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** A lab of 24 PCs needs a LAN. Compare one big hub vs a switch, collision domains, and 100/1000 Mbps choice.

**Expected Key Points:**
- Hub: one collision domain, CSMA/CD, poor.
- Switch: per-port domains, full-duplex, Fast/Gigabit.
- Prefer switched 1G to servers, 100/1000 to PCs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a jam signal in Ethernet?

**Expected Key Points:**
- A short sequence sent after collision detection so all stations know a collision occurred.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Outline Ethernet evolution: 10 Mbps, Fast, Gigabit (and that frames stayed 802.3).

**Expected Key Points:**
- 10BASE5/2/T CSMA/CD → 100BASE-TX → 1000BASE-T; same MAC addressing/frame, different PHYs; switches made CD rare.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare a collision domain and a broadcast domain. Effect of a switch vs a router.

**Expected Key Points:**
- Switch: breaks collision domains, not IP broadcast domains (unless VLANs).
- Router: breaks broadcast domains.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain binary exponential backoff. Why cap k at 10?

**Expected Key Points:**
- After k collisions pick 0…2^min(k,10)−1 slots.
- Capping prevents unbounded wait; 16 collisions typically discard.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** Two hosts full-duplex through a switch still ‘see collisions’ in a student report. What is likely confused?

**Expected Key Points:**
- They may mean Ethernet error counters, duplex mismatch (one side half-duplex), or IP loss.
- Full-duplex point-to-point has no CSMA/CD collisions.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define G and S in ALOHA analysis.

**Expected Key Points:**
- G is offered load in frames per frame time (including retries).
- S is throughput of successful frames per frame time.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Why does slotted ALOHA double the efficiency of pure ALOHA?

**Expected Key Points:**
- Vulnerable period halves from 2T to T, so the exponential is e^{−G} not e^{−2G}.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Why is the 10 Mbps Ethernet minimum frame 512 bits? If Tp(max)=25.6 μs, show Tt ≥ 2 Tp.

**Expected Key Points:**
- Collision must still be heard while sending.
- Tt_min = 512/10e6 = 51.2 μs ≥ 2×25.6 μs.
- That is the 64-byte minimum (excluding preamble).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write 200 words: ‘From ALOHA to switched Gigabit Ethernet.’ Include why CSMA/CD faded.

**Expected Key Points:**
- Random access → sensing → CD → cheap switches/full-duplex eliminating shared medium.
- Keep frame format compatibility.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 06 Multiple Access Ethernet).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Multiple and Access in the context of Multiple Access & Ethernet. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Multiple as used in Multiple Access & Ethernet. Include one precise example.

**Model answer:** Multiple is a foundational construct in Multiple Access & Ethernet. Example should name entities/operations and relate to Access. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Multiple and Access. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Multiple Access & Ethernet theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Ethernet to a realistic campus/industry scenario relevant to Multiple Access & Ethernet. State assumptions.

**Model answer:** Describe scenario, map concepts (Multiple, Access), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Access and its role within Multiple Access & Ethernet.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Multiple if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Multiple Access within Multiple Access & Ethernet; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Multiple while building a solution involving Multiple Access. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Multiple Access & Ethernet principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Ethernet in Computer Networks I.

**Model answer:** Provide four definitions: include Multiple, Access, and two adjacent terms from Multiple Access & Ethernet. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Multiple Access & Ethernet that integrates Multiple, Access, and Ethernet.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Access in Multiple Access & Ethernet.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Multiple.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Multiple and Access Ethernet. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Multiple and Ethernet: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Multiple Access & Ethernet, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Ethernet under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Multiple Access depends on earlier ideas such as Multiple in Multiple Access & Ethernet.

**Model answer:** Dependency chain with one counterexample showing what fails if Multiple is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Access Ethernet measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using Access Ethernet, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Access in Multiple Access & Ethernet. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Multiple in Multiple Access & Ethernet: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Ethernet for Multiple Access & Ethernet.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Ethernet.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Access in Multiple Access & Ethernet. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Multiple in Multiple Access & Ethernet, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

