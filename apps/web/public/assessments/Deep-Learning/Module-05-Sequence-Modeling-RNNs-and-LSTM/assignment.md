# Assignment — Deep Learning — Module 5 — Sequence Modeling RNNs and LSTM

**Subject:** Deep Learning  
**Module:** Module 5 — Sequence Modeling RNNs and LSTM  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What does it mean to unfold a computational graph? Why share θ?

**Expected Key Points:**
- Replicate the recurrent body T times for a sequence of length T.
- Sharing θ is the definition of recurrence and keeps parameter count independent of T.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write the vanilla RNN recurrence h_t = tanh(W_h h_{t−1} + W_x x_t + b).

**Expected Key Points:**
- State is a compressed history.
- Same W for all t.
- Output y_t = g(W_y h_t).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Encoder–decoder seq2seq: roles of encoder, context, decoder.

**Expected Key Points:**
- Encoder consumes source; context (final h or attention later) conditions the decoder; decoder emits the target one token at a time.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Name the LSTM gates and one sentence each.

**Expected Key Points:**
- Forget: erase cell.
- Input: write candidate.
- Output: expose cell to h_t.
- Cell c_t is the memory.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Why vanilla RNNs fail on long dependencies, with a 0.9^T or tanh′ numerical sketch. How LSTM gates help.

**Expected Key Points:**
- Product of |∂h/∂h|<1 → 0 as T grows (0.9^50≈0.005).
- LSTM forget≈1 leaves a path whose local derivative is ~1, so early errors can reach early t.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO1
**Question:** LSTM vs GRU vs vanilla RNN: state, gates, typical parameter ratio, when you might pick GRU.

**Expected Key Points:**
- Vanilla: one tanh, vanishes.
- LSTM: c + 3 gates (4 maps).
- GRU: 2 gates, no c, ~3/4 of LSTM params.
- GRU for speed/memory on mobile; LSTM if you want explicit cell.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Bidirectional RNNs: equations in words, one good task, one forbidden deployment.

**Expected Key Points:**
- h⃗_t from the past, h⃖_t from the future, concat.
- Good: NER on a full sentence.
- Bad: real-time keystroke LM that must not see future keys.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Recursive vs recurrent nets with a parse-tree example.

**Expected Key Points:**
- Recurrent: time chain of words.
- Recursive: combine (‘campus’, ‘library’) with a shared composer up the tree; the graph shape is the tree, not T clocks.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Deep RNNs (stacked layers) vs wide single-layer RNNs.

**Expected Key Points:**
- Depth: each t, several nonlinear transforms of the current summary (like deep MLPs).
- Width: bigger h.
- Stacking often represents hierarchy (characters→words→phrases).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Campus chatbot: seq2seq LSTM, hidden 256, max T=40. Estimate encoder LSTM params (4 gates, assume x=256 after embedding). Discuss teacher forcing vs decode, and vanishing.

**Expected Key Points:**
- Params 4×((256+256)×256+256)=4×131328=525312 per LSTM layer (plus embeddings).
- Train with teacher forcing; decode greedily/beam; exposure bias.
- Clip grads; maybe 2 layers; bidirectional encoder OK (offline).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** d_x=d_h=128. LSTM params vs GRU with 3 maps. Also 0.99^200 vs 0.9^200 (order of magnitude) as gated vs vanishing intuition.

**Expected Key Points:**
- LSTM 4×((256)×128+128)=4×32896=131584.
- GRU 3×32896=98688.
- 0.99^200≈0.13 (still alive); 0.9^200≈1.4×10^−10 (dead).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Bidirectional LSTM is always better; use it for next-word prediction in a live editor.’ Critique.

**Expected Key Points:**
- BiLSTM peeks at future words — cheating on LM and unusable live.
- For LM use unidirectional (or causal) models.
- BiLSTM is for labelling a complete utterance.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four sequence tasks suited to RNNs/seq2seq.

**Expected Key Points:**
- POS tagging, translation, speech recognition, captioning, language modelling, time-series forecasting (any four).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is BPTT? What is truncated BPTT?

**Expected Key Points:**
- AD on the unfolded net, summing into shared W.
- Truncated: cap the unroll (e.g.
- 30) for memory/stability, accepting biased long gradients.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Teacher forcing and exposure bias, with one mitigation idea.

**Expected Key Points:**
- Train on gold y_{t−1}; test on predicted ŷ_{t−1}.
- Errors compound.
- Mitigate: scheduled sampling, beam search, seq-level losses (conceptual).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** How unfolding turns a cyclic graph into a DAG that backprop can run on.

**Expected Key Points:**
- Cycles in ‘loop forever’ become a finite DAG of copies 1..T with edges only forward in time; reverse-mode then walks T..1.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** A translator’s BLEU collapses on sentences longer than 30 although short ones are fine. Bottleneck diagnosis and two fixes (module-level).

**Expected Key Points:**
- Single final-state context forgets early source tokens (vanishing + bottleneck).
- Fixes: deeper/LSTM encoder, reverse source (historical), later attention (mention as extension), split sentences, bidirectional encoder.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define the cell state c_t in an LSTM versus h_t.

**Expected Key Points:**
- c_t is the linear, gated memory (carry).
- h_t is the gated, usually tanh-squashed exposed state used as the recurrent output.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Draw one LSTM cell: show x_t, h_{t−1}, c_{t−1}, the three σ gates, tanh candidate, and outputs c_t, h_t.

**Expected Key Points:**
- Label f, i, o, elementwise × and +, matching c_t = f⊙c_{t−1}+i⊙ĉ, h_t=o⊙tanh(c_t).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Unify vanishing gradients: MLPs (Module 3, 0.25^L), CNNs (depth, residuals), RNNs (0.9^T, LSTM gates). Why architecture is part of optimisation.

**Expected Key Points:**
- The same product-of-Jacobians story on different axes.
- Skips and gates insert near-identity paths.
- Regularisers and η cannot revive a 10^−10 factor.
- Sequence modelling succeeds when the graph’s derivatives stay well-scaled through time.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Sequence Modeling RNNs and LSTM).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Sequence and Modeling in the context of Sequence Modeling RNNs and LSTM. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Deep Learning scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Sequence as used in Sequence Modeling RNNs and LSTM. Include one precise example.

**Model answer:** Sequence is a foundational construct in Sequence Modeling RNNs and LSTM. Example should name entities/operations and relate to Modeling. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Sequence and Modeling. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Sequence Modeling RNNs and LSTM theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply RNNs to a realistic campus/industry scenario relevant to Sequence Modeling RNNs and LSTM. State assumptions.

**Model answer:** Describe scenario, map concepts (Sequence, Modeling), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Modeling and its role within Sequence Modeling RNNs and LSTM.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Sequence if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to LSTM within Sequence Modeling RNNs and LSTM; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Sequence while building a solution involving LSTM. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Sequence Modeling RNNs and LSTM principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying RNNs in Deep Learning.

**Model answer:** Provide four definitions: include Sequence, Modeling, and two adjacent terms from Sequence Modeling RNNs and LSTM. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Sequence Modeling RNNs and LSTM that integrates Sequence, Modeling, and RNNs.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Modeling in Sequence Modeling RNNs and LSTM.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Sequence.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Sequence and Sequence Modeling. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Sequence and RNNs: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Sequence Modeling RNNs and LSTM, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling RNNs under constraints typical of Deep Learning.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how LSTM depends on earlier ideas such as Sequence in Sequence Modeling RNNs and LSTM.

**Model answer:** Dependency chain with one counterexample showing what fails if Sequence is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Sequence Modeling measurably improves an outcome in Deep Learning.

**Model answer:** Context, intervention using Sequence Modeling, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Modeling in Sequence Modeling RNNs and LSTM. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Sequence in Sequence Modeling RNNs and LSTM: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Deep Learning.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to RNNs for Sequence Modeling RNNs and LSTM.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of RNNs.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Modeling in Sequence Modeling RNNs and LSTM. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Sequence in Sequence Modeling RNNs and LSTM, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

