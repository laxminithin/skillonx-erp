# Assignment — Deep Learning — Module 2 — MLP and Backpropagation

**Subject:** Deep Learning  
**Module:** Module 2 — MLP and Backpropagation  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define an MLP. Why does a hidden layer allow XOR?

**Expected Key Points:**
- Feedforward net with nonlinear hidden units.
- Hidden units can form intermediate features (e.g.
- OR/NAND) that an output unit AND-combines, separating the XOR diagonals.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish batch and on-line learning in one paragraph each.

**Expected Key Points:**
- Batch: sum/average gradient on all N, one update.
- On-line: update per example; noisy, cheaper steps, more updates per epoch.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write the chain rule for E(y(v(w))) and name the algorithm that organises it for every weight.

**Expected Key Points:**
- dE/dw = (dE/dy)(dy/dv)(dv/dw).
- Back-propagation reuses intermediate δs so each weight is O(1) extra work after the forward pass.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the learning rate η? Give one symptom of too large and too small.

**Expected Key Points:**
- Step-size scalar on −∇E.
- Too large: divergence/oscillation.
- Too small: very slow progress or apparent freeze.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Derive the output-layer delta for MSE + sigmoid, and the hidden-layer delta recurrence.

**Expected Key Points:**
- E=½(t−y)^2, y=σ(v), ∂E/∂v=(y−t)σ′=(y−t)y(1−y).
- Hidden: δ_j = σ′(v_j) Σ_k w_kj δ_k.
- Then ∂E/∂w_ji = δ_j x_i.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Heuristics that make backprop work better (Haykin): at least five.

**Expected Key Points:**
- Normalise inputs; small random init; tune η; momentum; shuffle on-line examples; match output nonlinearity to task; decay η; monitor validation; avoid saturating sigmoids.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Batch vs minibatch vs on-line for a 50 000-example digit set.

**Expected Key Points:**
- Full batch: one true gradient/epoch, heavy memory.
- On-line: 50k noisy steps.
- Minibatch 32–256: hardware-friendly compromise used in practice.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** 2–2–1 net, count parameters with biases. If η=0.2, δ_out=0.3, incoming hidden y=0.5, find Δw to that output weight (no momentum).

**Expected Key Points:**
- 9 parameters.
- Δw=−η δ y=−0.2×0.3×0.5=−0.03.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Why sigmoid+MSE saturates, and what modern classification heads do instead.

**Expected Key Points:**
- When y→1, σ′→0 so (y−t)σ′ vanishes even if t=1 and confidence is ‘stuck’.
- Softmax+cross-entropy gives δ=y−t at the logit, no extra σ′ factor.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Specify a lab that trains XOR with a 2–2–1 sigmoid MLP: init, η, momentum, plots, success criteria.

**Expected Key Points:**
- Random w~U(−0.5,0.5); η≈0.2–0.5; momentum 0.9 optional; plot loss vs epoch; decision surface; require all four XOR points correct.
- Contrast a 2–1 net that must fail.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** y=0.1, t=1, sigmoid MSE. Compute σ′ and output δ=(y−t)σ′. Repeat for y=0.5. Which learns faster and why?

**Expected Key Points:**
- σ′(0.1)=0.09, δ=(0.1−1)×0.09=−0.081.
- At 0.5, σ′=0.25, δ=(0.5−1)×0.25=−0.125.
- Mid-range |δ| larger than near 0; actually here |δ| is larger at 0.5.
- Near t=1, y=0.99 would be much worse (vanishing).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A team uses hard-limiter hidden units ‘because Rosenblatt did’ and still wants backprop. Critique.

**Expected Key Points:**
- φ′ is 0 almost everywhere: no gradient to hidden weights.
- Need smooth φ (sigmoid/tanh/ReLU).
- Perceptron rule does not assign hidden credit.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List the four stages of a backprop iteration.

**Expected Key Points:**
- Present input; forward activations; backward deltas; update weights (optionally with momentum).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is momentum? Give a typical coefficient.

**Expected Key Points:**
- Velocity v ← α v − η g, then w ← w + v (sign conventions vary).
- α ≈ 0.9 is classic.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Symmetry breaking and why random init should be small for sigmoids.

**Expected Key Points:**
- Equal weights → equal gradients → duplicate features.
- Small random w keeps v near 0 so σ′≈0.25, not saturated.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** How backprop is just differentiation: Jacobian of a layer and the chain.

**Expected Key Points:**
- Each layer y=phi(Wx+b).
- Backprop multiplies by W^T and phi-prime (elementwise).
- Reverse-mode AD accumulates the scalar loss gradient efficiently.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** Training loss falls, but a 2-hidden-unit XOR net still misclassifies (1,1). Debug list.

**Expected Key Points:**
- Dead/saturated units; η too large; poor init; not enough epochs; target coding ±1 vs 0/1 mismatch; missing bias; evaluating with a step while training a sigmoid.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define an epoch for on-line vs batch mode.

**Expected Key Points:**
- Both: one sweep of all examples.
- On-line: N updates.
- Batch: 1 update using all N.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Draw the 2–2–1 XOR net, label w and b, and show arrows for forward activations and backward δ.

**Expected Key Points:**
- Two hidden neurons, one output; forward left→right; δ right→left; each weight gets δ_child × a_parent.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Backprop is not a biological reverse synapse; it is organised calculus.’ Explain with Haykin’s differentiation view and one XOR number (e.g. φ′=0.25).

**Expected Key Points:**
- Credit assignment is the chain rule.
- Peak sigmoid slope 0.25 already shrinks hidden gradients.
- XOR shows why we need that calculus: hidden features must move.
- Biology may approximate, but the algorithm is AD.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 MLP and Backpropagation).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast MLP and Backpropagation in the context of MLP and Backpropagation. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Deep Learning scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of MLP as used in MLP and Backpropagation. Include one precise example.

**Model answer:** MLP is a foundational construct in MLP and Backpropagation. Example should name entities/operations and relate to Backpropagation. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on MLP and Backpropagation. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with MLP and Backpropagation theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply MLP Backpropagation to a realistic campus/industry scenario relevant to MLP and Backpropagation. State assumptions.

**Model answer:** Describe scenario, map concepts (MLP, Backpropagation), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Backpropagation and its role within MLP and Backpropagation.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to MLP if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within MLP and Backpropagation; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies MLP while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using MLP and Backpropagation principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying MLP Backpropagation in Deep Learning.

**Model answer:** Provide four definitions: include MLP, Backpropagation, and two adjacent terms from MLP and Backpropagation. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in MLP and Backpropagation that integrates MLP, Backpropagation, and MLP Backpropagation.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Backpropagation in MLP and Backpropagation.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to MLP.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both MLP and points. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving MLP and MLP Backpropagation: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from MLP and Backpropagation, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling MLP Backpropagation under constraints typical of Deep Learning.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as MLP in MLP and Backpropagation.

**Model answer:** Dependency chain with one counterexample showing what fails if MLP is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where points measurably improves an outcome in Deep Learning.

**Model answer:** Context, intervention using points, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Backpropagation in MLP and Backpropagation. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with MLP in MLP and Backpropagation: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Deep Learning.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to MLP Backpropagation for MLP and Backpropagation.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of MLP Backpropagation.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Backpropagation in MLP and Backpropagation. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about MLP in MLP and Backpropagation, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

