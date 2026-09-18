# Assignment — Computer Networks-I — Unit 2 — Physical Layer-I

**Subject:** Computer Networks-I  
**Module:** Unit 2 — Physical Layer-I  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define analog and digital signals. Give one example of each in a campus network.

**Expected Key Points:**
- Analog: continuous microphone voltage or FM radio.
- Digital: NRZ bits on UTP or PCM voice on a PBX trunk.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define attenuation, distortion and noise. Name one cause of each on copper.

**Expected Key Points:**
- Attenuation: ohmic/skin-effect loss.
- Distortion: delay/gain vs frequency (dispersion).
- Noise: thermal kTB, crosstalk, impulse from motors.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State Nyquist’s theorem for a noiseless channel and explain each symbol in C = 2B log2(L).

**Expected Key Points:**
- B is bandwidth (Hz), L is number of discrete signal levels, C is max bit rate.
- The 2B term is the maximum independent pulses/s (Nyquist).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** State Shannon’s capacity formula and the meaning of SNR.

**Expected Key Points:**
- C = B log2(1+SNR).
- SNR is signal power over noise power (linear).
- SNRdB = 10 log10(SNR).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** A noiseless 4 kHz channel uses 8 levels. Find the Nyquist bit rate. If noise appears with SNR = 31, find Shannon capacity and comment.

**Expected Key Points:**
- Nyquist: 2×4000×3 = 24 kbps.
- Shannon: 4000×log2(32) = 20 kbps.
- Noise lowers the reliable rate below the noiseless multilevel figure if L was optimistic.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Voice is band-limited to 4 kHz, sampled at Nyquist rate, 8 bits/sample. Find PCM bit rate. How many such calls fit in a 1.536 Mbps payload?

**Expected Key Points:**
- 8000×8 = 64 kbps.
- 1.536×10^6 / 64000 = 24 calls (T1 payload).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare NRZ-L, NRZ-I, Manchester and AMI. Which is preferred for clock recovery and why?

**Expected Key Points:**
- NRZ-L: level=bit.
- NRZ-I: invert on 1.
- Manchester: mid-bit edge every bit (best clock, 2× baud).
- AMI: 0=0 V, 1s alternate polarity (some timing, DC balance).
- Manchester preferred when a separate clock is unavailable.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain ASK, FSK, PSK and QAM. Which is most bandwidth-efficient for the same symbol rate?

**Expected Key Points:**
- ASK: amplitude.
- FSK: frequency (wider spectrum).
- QAM: amplitude+phase.
- QAM (and high-order PSK) carry more bits/symbol, hence more bps/Hz.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** B = 3 kHz, SNRdB = 30. Compute Shannon capacity. How many signal levels would Nyquist need to match this rate on a noiseless 3 kHz channel? Is that L realistic once noise exists?

**Expected Key Points:**
- C ≈ 3000 log2(1001) ≈ 29.9 kbps.
- Nyquist: 2×3000×log2(L)=29900 ⇒ log2(L)≈4.983 ⇒ L≈32.
- Noise means those 32 levels cannot all be distinguished; Shannon already includes that.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** A 16-QAM modem uses 1 Mbaud. Find bit rate. If raised-cosine excess bandwidth α = 0.25, estimate required RF bandwidth ≈ (1+α)/T.

**Expected Key Points:**
- Bit rate = 4 bits/symbol × 1×10^6 = 4 Mbps.
- T=1 μs; B ≈ 1.25 MHz (baseband equivalent symbol-rate bandwidth (1+α)/T).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** A lab needs to send 1 Mbps through 200 m of noisy UTP. Propose analog vs digital baseband, a line code, and how you would use Nyquist/Shannon in the justification.

**Expected Key Points:**
- Prefer digital baseband with a self-clocking code (Manchester or 4B/5B+MLT) plus maybe a simple scrambler.
- Measure B and SNR; Shannon must exceed 1 Mbps; Nyquist sets levels if the channel is nearly noiseless.
- Repeaters/equalisers fight attenuation/distortion.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is baud rate? Why can baud differ from bit rate?

**Expected Key Points:**
- Baud is symbols (signal elements) per second.
- Bit rate = baud × bits/symbol.
- Manchester: 2 bauds/bit; 16-QAM: 4 bits/symbol.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain thermal noise and why it sets a floor on SNR.

**Expected Key Points:**
- Thermal (Johnson) noise ≈ kTB.
- It is unavoidable; raising B admits more noise.
- SNR cannot be made infinite, so Shannon capacity is finite.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare analog and digital transmission of a voice signal. Include PCM in the discussion.

**Expected Key Points:**
- Analog: modulate the voice waveform (AM/FM).
- Digital: PCM then line-code or QAM.
- Digital allows regeneration, FEC and TDM; analog accumulates noise.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why Manchester doubles bandwidth relative to NRZ for the same bit rate.

**Expected Key Points:**
- Each bit forces a mid-interval transition, so the fundamental pulse rate is 2×, and the spectrum occupies about twice the bandwidth of NRZ.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** A projector link works at 2 m but fails at 30 m with the same 100 Mbps PHY. Discuss attenuation, noise and whether a better line code or media would help.

**Expected Key Points:**
- Attenuation and possibly NEXT grow with length; SNR drops below what Shannon/the PHY need.
- Fixes: shorter run, better Cat cable, fibre, or a PHY with equalisation/FEC—not merely a different textbook line code on the same SNR.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four types of noise named by Forouzan and one source of each.

**Expected Key Points:**
- Thermal (resistors), induced (motors/power lines), crosstalk (adjacent pairs), impulse (lightning/switching).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain quantization noise in PCM. If you add one bit to each sample, what happens to quantization SNR (approximately)?

**Expected Key Points:**
- Quantization error is bounded by half a step.
- One extra bit halves the step and improves SQNR by about 6 dB.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** Convert SNR = 1000 to dB. Then find Shannon capacity of a 3 kHz channel with that SNR.

**Expected Key Points:**
- SNRdB = 10 log10(1000) = 30 dB.
- C = 3000 log2(1+1000) = 3000 log2(1001) ≈ 29.9 kbps.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write a 200-word comparison of Nyquist and Shannon as used in VTU numericals. Include when each applies.

**Expected Key Points:**
- Nyquist: noiseless, choose L.
- Shannon: noisy, SNR known.
- Real links: Shannon is the cap; Nyquist warns that more levels need more SNR.
- Work a 3 kHz telephone-like example.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 02 Physical Layer I).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Physical and Layer in the context of Physical Layer-I. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Physical as used in Physical Layer-I. Include one precise example.

**Model answer:** Physical is a foundational construct in Physical Layer-I. Example should name entities/operations and relate to Layer. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Physical and Layer. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Physical Layer-I theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply I to a realistic campus/industry scenario relevant to Physical Layer-I. State assumptions.

**Model answer:** Describe scenario, map concepts (Physical, Layer), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Layer and its role within Physical Layer-I.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Physical if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Physical Layer within Physical Layer-I; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Physical while building a solution involving Physical Layer. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Physical Layer-I principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying I in Computer Networks I.

**Model answer:** Provide four definitions: include Physical, Layer, and two adjacent terms from Physical Layer-I. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Physical Layer-I that integrates Physical, Layer, and I.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Layer in Physical Layer-I.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Physical.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Physical and Layer I. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Physical and I: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Physical Layer-I, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling I under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Physical Layer depends on earlier ideas such as Physical in Physical Layer-I.

**Model answer:** Dependency chain with one counterexample showing what fails if Physical is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Layer I measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using Layer I, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Layer in Physical Layer-I. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Physical in Physical Layer-I: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to I for Physical Layer-I.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Layer in Physical Layer-I. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Physical in Physical Layer-I, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

