# Assignment — Computer Networks-I — Unit 3 — Physical Layer-II & Switching

**Subject:** Computer Networks-I  
**Module:** Unit 3 — Physical Layer-II & Switching  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain FDM with a diagram-in-words. What is a guard band?

**Expected Key Points:**
- Each channel occupies a frequency slot on a shared analog link.
- Guard bands are unused gaps that reduce adjacent-channel interference.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain TDM. Distinguish synchronous and statistical TDM.

**Expected Key Points:**
- TDM shares time.
- Synchronous: fixed slot per source (empty if idle).
- Statistical: slots go to busy sources; frames carry source ids.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define WDM and state one advantage on campus backbone fibre.

**Expected Key Points:**
- WDM is optical multiplexing by wavelength.
- Advantage: many Gbps channels on one fibre without extra cables.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain circuit switching phases: setup, data transfer, teardown.

**Expected Key Points:**
- Setup reserves a dedicated path; data flows with little per-bit processing; teardown releases switches/slots for others.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare datagram and virtual-circuit packet switching on routing, state, and reordering.

**Expected Key Points:**
- Datagram: per-packet lookup, no connection state, possible reorder/loss of different paths.
- VC: setup, labels, same path, in-order more likely, state in switches.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare circuit switching and packet switching for a 1-hour voice call vs a 1-second bursty file.

**Expected Key Points:**
- Voice: circuit (or VC) gives constant delay.
- Bursty file: packet switching shares links; a reserved circuit would idle.
- Quantify waste conceptually.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain FHSS and DSSS. Give one standard that uses each (Bluetooth hopping vs 802.11b DSSS).

**Expected Key Points:**
- FHSS: hop frequencies by PN (Bluetooth).
- DSSS: chip code spreads each bit (802.11b).
- Both resist narrowband interference.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** Eight analog 4 kHz channels, FDM, 1 kHz guard between adjacent channels. Find total bandwidth. If instead PCM+TDM at 8 kHz×8 bits, find aggregate bit rate ignoring extra framing.

**Expected Key Points:**
- FDM: 8×4 + 7×1 = 39 kHz.
- TDM: 8×64 kbps = 512 kbps.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Message 2×10^6 bits. Path of 3 links at 2 Mbps each, Tp = 5 ms/link, proc = 0. Store-and-forward packets of 2000 bits vs one circuit with 150 ms setup. Compare total times.

**Expected Key Points:**
- Packet Tt = 1 ms.
- First packet: 3×1 + 3×5 = 18 ms; remaining 999 packets add 999 ms at the bottleneck → ≈ 1.017 s.
- Circuit: 150 ms + 2e6/2e6 + 15 ms prop = 1.165 s.
- Packets win here.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** T1: show 1.544 Mbps. What fraction of bits is payload vs framing? How many 64 kbps calls?

**Expected Key Points:**
- 24×8×8000=1.536 Mbps payload, +8 kbps framing = 1.544 Mbps.
- Payload fraction = 192/193 ≈ 99.5%.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** A college needs 4 analog CCTV channels on one coax and 30 PCM phones on one trunk. Propose FDM vs TDM choices and justify.

**Expected Key Points:**
- CCTV analog: FDM (or digitise then TDM/Ethernet).
- Phones: already PCM → synchronous TDM (E1/T1) or VoIP packets.
- Do not FDM 30 digital phones as analog FM without reason.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is store-and-forward delay? Give the formula for n hops of equal rate R and packet length L (ignore prop).

**Expected Key Points:**
- Delay = n × (L/R).
- Each switch waits for the whole packet.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why empty slots occur in synchronous TDM and how statistical TDM reduces that waste.

**Expected Key Points:**
- Fixed assignment cannot skip idle sources.
- Statistical multiplexers transmit only occupied slots with addressing, at the cost of headers and possible delay.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain message switching versus packet switching.

**Expected Key Points:**
- Message switching stores entire messages (e.g.
- a whole email file) before forwarding — large buffers and delay.
- Packet switching cuts messages into packets for pipelining and fairness.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare FDM and TDM on synchronisation, digital friendliness, and guard requirements.

**Expected Key Points:**
- FDM needs analog filters/guards and suits analog.
- TDM needs slot sync and suits PCM/digital.
- TDM waste is empty slots; FDM waste is guards.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** During setup of a circuit-switched video call the path is busy so the call fails, while a packet-video app still starts at lower quality. Explain.

**Expected Key Points:**
- Circuit needs a free dedicated path or it is blocked.
- Packet video shares and adapts rate; it is not blocked the same way but may suffer loss/jitter.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List three differences between a physical circuit and a virtual circuit.

**Expected Key Points:**
- Physical circuit: dedicated analog/TDM resource, no packet headers needed.
- VC: packet switching with labels, statistical sharing possible, setup of identifiers not copper.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain spreading gain in DSSS qualitatively. If chip rate is 11 Mcps and bit rate 1 Mbps, what is the ratio?

**Expected Key Points:**
- The spectrum is spread by ~chip/bit.
- Gain ≈ 11e6/1e6 = 11 (11:1), improving resistance to narrowband jammers.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** DSSS chip rate 11 Mcps, bit rate 1 Mbps. Spreading gain? If FHSS hops among 79 channels of 1 MHz, what is the hopping set size?

**Expected Key Points:**
- Gain ≈ 11 Mcps / 1 Mbps = 11.
- FHSS uses 79 hop frequencies (classic Bluetooth-style 2.4 GHz set).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write 200 words on ‘Why the Internet chose datagrams.’ Include VC alternatives (X.25/ATM) and IP.

**Expected Key Points:**
- Discuss robustness to failures, no per-flow state in core, and IP’s simplicity versus ATM VC QoS.
- Use a campus routing flap as an example.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 03 Physical Layer II Switching).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Physical and Layer in the context of Physical Layer-II & Switching. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Physical as used in Physical Layer-II & Switching. Include one precise example.

**Model answer:** Physical is a foundational construct in Physical Layer-II & Switching. Example should name entities/operations and relate to Layer. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Physical and Layer. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Physical Layer-II & Switching theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply II to a realistic campus/industry scenario relevant to Physical Layer-II & Switching. State assumptions.

**Model answer:** Describe scenario, map concepts (Physical, Layer), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Layer and its role within Physical Layer-II & Switching.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Physical if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Switching within Physical Layer-II & Switching; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Physical while building a solution involving Switching. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Physical Layer-II & Switching principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying II in Computer Networks I.

**Model answer:** Provide four definitions: include Physical, Layer, and two adjacent terms from Physical Layer-II & Switching. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Physical Layer-II & Switching that integrates Physical, Layer, and II.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Layer in Physical Layer-II & Switching.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Physical.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Physical and Physical Layer. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Physical and II: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Physical Layer-II & Switching, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling II under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Switching depends on earlier ideas such as Physical in Physical Layer-II & Switching.

**Model answer:** Dependency chain with one counterexample showing what fails if Physical is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Physical Layer measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using Physical Layer, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Layer in Physical Layer-II & Switching. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Physical in Physical Layer-II & Switching: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to II for Physical Layer-II & Switching.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of II.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Layer in Physical Layer-II & Switching. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Physical in Physical Layer-II & Switching, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

