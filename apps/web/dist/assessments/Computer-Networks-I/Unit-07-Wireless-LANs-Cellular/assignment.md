# Assignment — Computer Networks-I — Unit 7 — Wireless LANs & Cellular

**Subject:** Computer Networks-I  
**Module:** Unit 7 — Wireless LANs & Cellular  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain 802.11 architecture: STA, AP, BSS, ESS, DS.

**Expected Key Points:**
- STA: wireless client.
- AP: portal to DS.
- BSS: AP+STAs (or IBSS).
- DS: typically Ethernet interconnecting APs.
- ESS: multiple BSS, one SSID.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define DCF and PCF.

**Expected Key Points:**
- DCF: distributed CSMA/CA.
- PCF: optional contention-free polling by the AP (rarely deployed).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain SIFS, DIFS and why ACK uses SIFS.

**Expected Key Points:**
- SIFS is shortest → ACKs/CTS beat new DATA.
- DIFS = SIFS+2 slots for new DCF data, lower priority than ACK.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a piconet and a scatternet in Bluetooth?

**Expected Key Points:**
- Piconet: 1 master + ≤7 active slaves.
- Scatternet: overlapping piconets via a bridging device.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare hub, switch, router and gateway with OSI layer and a campus example of each.

**Expected Key Points:**
- Hub: L1 lab dump (avoid).
- Switch: L2 department LAN.
- Router: L3 campus edge.
- Gateway: email/VoIP protocol translation or firewall.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare 802.11 CSMA/CA with 802.3 CSMA/CD.

**Expected Key Points:**
- Radio is half-duplex at the STA, collisions hard to detect while sending; use CA, ACKs, NAV.
- Copper shared Ethernet could CD and jam.
- Today both often sit on switches/APs without classic CD.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the hidden-terminal problem and how RTS/CTS plus NAV help.

**Expected Key Points:**
- A and C both send to B.
- RTS/CTS lets B announce Duration; C sets NAV and defers even if it never heard A’s DATA.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain cellular fundamentals: cell, cluster, frequency reuse, MSC, handoff.

**Expected Key Points:**
- Space divided into cells; cluster of N unique channel sets; reuse at distance D; MSC switches calls; handoff changes cell during a call.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Hexagonal cells, R=1.5 km, N=7. Find D. If 70 channels total, channels per cell?

**Expected Key Points:**
- D=R√(3N)=1.5√21≈6.87 km.
- 70/7=10 channels per cell.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** 802.11b: DIFS=50 μs, backoff 3 slots of 20 μs, 1000-byte DATA at 11 Mbps, SIFS=10 μs, ACK 304 μs. Approximate channel occupancy of one successful DATA+ACK ignoring PHY preamble details.

**Expected Key Points:**
- DIFS+backoff=50+60=110 μs.
- DATA=8000/11e6≈727 μs.
- +SIFS+ACK=10+304.
- Total≈1.15 ms.
- (Preamble would add in a full Forouzan-style timing.)
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design campus WLAN: ESS vs many SSIDs, where to use RTS/CTS, and how APs connect to wired switches/routers.

**Expected Key Points:**
- One ESS SSID, APs as BSS on switched DS, controller optional.
- RTS/CTS if hidden nodes/long frames.
- APs on access switches; inter-subnet via routers; roaming L2 inside VLAN.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define SSID. Can two ESS use the same SSID?

**Expected Key Points:**
- SSID names the WLAN.
- Yes, but overlapping same-SSID ESS without planning confuses STAs; normally one campus ESS per SSID.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four 802.11 frame types/fields a VTU answer should mention (management/control/data, Duration, addresses).

**Expected Key Points:**
- Management: beacon/assoc.
- Control: RTS/CTS/ACK.
- Data: payload.
- Fields: Frame Control, Duration/NAV, up to 4 MACs, Seq, FCS.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare Bluetooth and 802.11 for a classroom: range, access method, topology, power.

**Expected Key Points:**
- BT: WPAN, FHSS, master/slave, very low power, ~10 m.
- 802.11: WLAN, CSMA/CA, AP infrastructure, higher power/range, internet access.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain 1G–4G in one line each (AMPS, GSM/CDMA, UMTS/CDMA2000, LTE).

**Expected Key Points:**
- 1G analog voice.
- 2G digital voice/SMS.
- 3G mobile data (WCDMA etc.).
- 4G all-IP LTE broadband.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** VoIP on Wi-Fi chops when a hidden laptop does large downloads. Propose 802.11 MAC mitigations.

**Expected Key Points:**
- Enable RTS/CTS, QoS (EDCA/WMM) to prioritise voice, band-steer, reduce airtime of downloads (11n/ac, wired where possible), check AP placement to reduce hidden nodes.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is an IBSS?

**Expected Key Points:**
- Independent BSS (ad-hoc): STAs talk without an AP.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Why do connecting devices ‘change collision and broadcast domains’ differently?

**Expected Key Points:**
- Repeater/hub: neither broken.
- Switch: collision yes, broadcast no (per VLAN).
- Router: both (broadcasts don’t cross IP networks).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Find N for (i,j)=(1,1) and (2,2). Which cluster is denser in reuse (smaller N) and what is the capacity trade-off?

**Expected Key Points:**
- N(1,1)=3; N(2,2)=12.
- N=3 reuses more aggressively (higher capacity per area) but co-channel cells are closer, so interference is worse.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write 200 words on frequency reuse. Include N=i^2+ij+j^2 and a 7-cell example.

**Expected Key Points:**
- Explain co-channel interference vs capacity.
- Smaller N → more capacity, more interference.
- Use D=R√(3N).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 07 Wireless LANs Cellular).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Wireless and LANs in the context of Wireless LANs & Cellular. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Wireless as used in Wireless LANs & Cellular. Include one precise example.

**Model answer:** Wireless is a foundational construct in Wireless LANs & Cellular. Example should name entities/operations and relate to LANs. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Wireless and LANs. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Wireless LANs & Cellular theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Cellular to a realistic campus/industry scenario relevant to Wireless LANs & Cellular. State assumptions.

**Model answer:** Describe scenario, map concepts (Wireless, LANs), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on LANs and its role within Wireless LANs & Cellular.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Wireless if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Wireless LANs within Wireless LANs & Cellular; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Wireless while building a solution involving Wireless LANs. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Wireless LANs & Cellular principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Cellular in Computer Networks I.

**Model answer:** Provide four definitions: include Wireless, LANs, and two adjacent terms from Wireless LANs & Cellular. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Wireless LANs & Cellular that integrates Wireless, LANs, and Cellular.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on LANs in Wireless LANs & Cellular.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Wireless.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Wireless and LANs Cellular. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Wireless and Cellular: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Wireless LANs & Cellular, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Cellular under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Wireless LANs depends on earlier ideas such as Wireless in Wireless LANs & Cellular.

**Model answer:** Dependency chain with one counterexample showing what fails if Wireless is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where LANs Cellular measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using LANs Cellular, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving LANs in Wireless LANs & Cellular. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Wireless in Wireless LANs & Cellular: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Cellular for Wireless LANs & Cellular.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Cellular.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around LANs in Wireless LANs & Cellular. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Wireless in Wireless LANs & Cellular, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

