# Assignment — Computer Networks-I — Unit 5 — Data Link Control

**Subject:** Computer Networks-I  
**Module:** Unit 5 — Data Link Control  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is framing? Explain flag-based framing and the need for stuffing.

**Expected Key Points:**
- Frames need start/end marks.
- If the flag pattern can occur in data, stuffing (bit or byte) provides transparency.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define flow control and error control at the data-link layer.

**Expected Key Points:**
- Flow: don’t overrun the receiver.
- Error: detect bad/lost frames and recover (ARQ).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain Stop-and-Wait ARQ including lost frame and lost ACK.

**Expected Key Points:**
- Send one, wait.
- Timeout resends.
- Alternating seq nos drop duplicates if ACK was lost.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Draw (in words) an HDLC I-frame: flag, address, control, payload, FCS, flag.

**Expected Key Points:**
- 01111110 | address | control (seq/N(S), N(R)) | info | CRC | 01111110.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare GBN and Selective Repeat on window size, receiver memory, and retransmission traffic.

**Expected Key Points:**
- GBN: W≤2^n−1, simple receiver, extra retransmits.
- SR: W≤2^(n−1), buffers, fewer extra frames.
- SR better on noisy fat pipes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Tt=2 ms, Tp=8 ms. Find a and Stop-and-Wait efficiency. What GBN window is needed to fill the pipe (U→1)?

**Expected Key Points:**
- a=4, U=1/9≈11.1%.
- Need W ≥ 1+2a = 9, so W=9 (and n≥4 since 2^n−1≥9).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain bit stuffing for 0110111111101111110 (apply HDLC rule). Give the stuffed stream.

**Expected Key Points:**
- Stuff 0 after five 1s: 011011111011011111010.
- (Verify: groups of five 1s each gain a 0.)
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain PPP layers: framing, LCP, NCP. Why is PPP used on serial/DSL links?

**Expected Key Points:**
- Byte framing + FCS; LCP negotiates link; NCP (IPCP) configures IP.
- Designed for point-to-point, not shared Ethernet.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** 1 Mbps, 3000 km, v=3×10^8 m/s, frames 1000 bits, ACK 100 bits. Find SAW utilisation including ACK transmission.

**Expected Key Points:**
- Tt=1 ms, Tack=0.1 ms, Tp=10 ms.
- U = Tt/(Tt+Tack+2Tp)=1/21.1≈4.74%.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** n=5 sequence bits. Max GBN window? Max SR window? If a=20, which can fully utilise the channel?

**Expected Key Points:**
- GBN W=31; SR W=16.
- Need W≥1+40=41 to fill.
- Neither can fully utilise; GBN 31/41≈76%, SR 16/41≈39% (unless RTT shrinks).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO1
**Question:** Choose ARQ for (i) 10 m USB-like link (ii) satellite SCADA. Specify n and W with reasons.

**Expected Key Points:**
- (i) SAW or small GBN, n=1 or 3.
- (ii) SR or large GBN, size from BDP: W≈1+2a, n so that W fits the rule.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is piggybacking? When does it not help?

**Expected Key Points:**
- ACK on reverse data.
- No help if traffic is one-way (need S-frames/RR).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain character stuffing with FLAG and ESC bytes.

**Expected Key Points:**
- If FLAG or ESC appears in data, prefix ESC.
- Receiver destuffs.
- Used in byte-oriented protocols (PPP-like).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare HDLC I, S and U frames with one use of each.

**Expected Key Points:**
- I: user data+piggyback.
- S: RR, RNR, REJ/SREJ.
- U: mode setting (SABM, UA, DISC) without seq of I-frames.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Why must GBN window be at most 2^n−1, not 2^n?

**Expected Key Points:**
- Cumulative ACK of all-new vs all-old window would look identical if W=2^n.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** A student implements SR with one timer for the whole window. What goes wrong? What does Forouzan imply?

**Expected Key Points:**
- A single timer forces rewind-like behaviour.
- SR needs per-outstanding-frame timers (or smart timeout of the oldest) to retransmit only gaps.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four functions of the data-link layer in Forouzan’s treatment.

**Expected Key Points:**
- Framing, flow control, error control, addressing (and often MAC, but MAC is unit 6).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain RNR in HDLC as flow control.

**Expected Key Points:**
- Receiver Not Ready tells the sender to stop (busy).
- This is link-level flow control.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Data 01111110 is HDLC-stuffed. Write the stuffed bits and explain where the extra 0 goes.

**Expected Key Points:**
- After five 1s insert 0: 011111010.
- The stuffed 0 prevents the payload from looking like the flag 01111110.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write 200 words comparing SAW, GBN and SR with utilisation formulas and a satellite example.

**Expected Key Points:**
- Include a=Tp/Tt, U=1/(1+2a), U=W/(1+2a), sequence-bit rules, and when SR’s extra memory pays off.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 05 Data Link Control).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Data and Link in the context of Data Link Control. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Data as used in Data Link Control. Include one precise example.

**Model answer:** Data is a foundational construct in Data Link Control. Example should name entities/operations and relate to Link. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Data and Link. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Data Link Control theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Control to a realistic campus/industry scenario relevant to Data Link Control. State assumptions.

**Model answer:** Describe scenario, map concepts (Data, Link), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Link and its role within Data Link Control.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Data if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Data Link within Data Link Control; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Data while building a solution involving Data Link. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Data Link Control principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Control in Computer Networks I.

**Model answer:** Provide four definitions: include Data, Link, and two adjacent terms from Data Link Control. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Data Link Control that integrates Data, Link, and Control.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Link in Data Link Control.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Data.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Data and Link Control. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Data and Control: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Data Link Control, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Control under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Data Link depends on earlier ideas such as Data in Data Link Control.

**Model answer:** Dependency chain with one counterexample showing what fails if Data is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Link Control measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using Link Control, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Link in Data Link Control. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Data in Data Link Control: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Control for Data Link Control.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Control.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Link in Data Link Control. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Data in Data Link Control, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

