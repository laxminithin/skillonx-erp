# Assignment — Deep Learning — Module 3 — Regularization and Optimization

**Subject:** Deep Learning  
**Module:** Module 3 — Regularization and Optimization  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define regularisation in Goodfellow’s sense and give three examples from this module.

**Expected Key Points:**
- Reduce generalisation error.
- Examples: L2/weight decay, dataset augmentation, semi-supervised auxiliaries, dropout, early stopping (any three).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write the L2-regularised objective and interpret λ.

**Expected Key Points:**
- J = L_data(θ) + (λ/2)||w||^2.
- Larger λ stronger pull to 0, less effective capacity, possible underfitting.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is dataset augmentation? Give four image transforms that are usually label-preserving.

**Expected Key Points:**
- Synthesise extra x.
- Flips, small crops, translations, colour jitter, modest rotation, noise — not transforms that change the class (e.g.
- 180° on a 6 vs 9).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define a saddle point of the loss.

**Expected Key Points:**
- ∇L=0 and Hessian has both positive and negative eigenvalues: uphill in some directions, downhill in others.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** L2 penalty vs explicit weight decay, and a caveat for adaptive methods (Adam).

**Expected Key Points:**
- In SGD they match.
- Adam’s adaptive scaling can make a loss-L2 term not equal to decoupled weight decay; use the decoupled form if you mean true decay.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Ill-conditioning, local minima, plateaus and saddles as optimisation obstacles.

**Expected Key Points:**
- κ≫1: ravines.
- True bad minima exist but are not the whole story.
- Plateaus: tiny g.
- Saddles: stationary mixed curvature, common in high-D.
- SGD noise and momentum help some of these.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Vanishing and exploding gradients with a sigmoid numerical example (0.25^L).

**Expected Key Points:**
- Each layer can multiply δ by ≤0.25.
- L=8 → ~10^−5.
- Exploding: |W| large, product blows up.
- Fixes: init, ReLU/gates, skip connections, clip, residual/LSTM (preview).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** Dropout vs L2 vs early stopping: mechanism and when you might combine them.

**Expected Key Points:**
- Dropout: stochastic ensemble, co-adaptation.
- L2: shrink w.
- Early stop: implicit path-length.
- Combine at moderate strength; too much underfits.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Semi-supervised learning: why unlabelled x can help, with one concrete penalty idea.

**Expected Key Points:**
- Unlabelled x constrain the representation (smoothness, reconstruction, entropy minimisation, consistency under augmentation).
- Example: add a reconstruction loss on all x plus CE on labelled x.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** A 10k-image campus-logo classifier overfits. Write a regularisation+optimisation plan with numbers (λ, p, η, patience).

**Expected Key Points:**
- Augment flips/crops; L2 λ~10^−4; dropout p=0.5 on FC; Adam η=10^−3 or SGD η=0.01+momentum 0.9; early stop patience 8 epochs on val; if exploding, clip 5.0; monitor train/val gap.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** λ=10^−3, η=0.01, w=0.5, data-grad g=0.2. New w after one SGD+decay step. Also 0.25^6 to 3 s.f. for vanishing intuition.

**Expected Key Points:**
- w ← (1−10^−5)×0.5 − 0.01×0.2 ≈ 0.49999 − 0.002 = 0.498.
- 0.25^6 = 2.44×10^−4.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Nonconvexity means local minima make deep learning hopeless.’ Critique with saddles and SGD.

**Expected Key Points:**
- High-D critical points are mostly saddles; many minima have similar loss; SGD/momentum/noise traverse plateaus.
- The practical bottleneck is often ill-conditioning, vanishing/exploding, and overfit, not being trapped in terrible minima.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four challenges in neural-net optimisation from the module.

**Expected Key Points:**
- Ill-conditioning, local minima, saddles, plateaus/flat regions, vanishing/exploding gradients (any four).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Early stopping as regularisation: procedure and risk.

**Expected Key Points:**
- Track val; restore best.
- Risk: noisy val, need a third test set; stopping too early underfits.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Condition number of the Hessian and why second-order methods are discussed then abandoned for huge nets.

**Expected Key Points:**
- Newton rescales directions but Hessian is n^2 and may be indefinite at saddles.
- Hence first-order + tricks at ImageNet scale.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** How input noise or hidden noise regularises (Goodfellow intuition).

**Expected Key Points:**
- Forces invariance to perturbations; flattens sharp minima; dropout is structured hidden noise; augmentation is input noise that preserves y.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** A 40-layer tanh net trains on the last layers only (first-layer weights barely move). Diagnose and propose two architectural or init fixes.

**Expected Key Points:**
- Vanishing δ. Fixes: ReLU, residual connections (preview CNN/ResNet), LSTM-style gates for sequences, Xavier/He init, batch-norm, gradient clipping won’t revive true 0.25^40 collapse alone.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is underfitting vs overfitting in terms of train and val error?

**Expected Key Points:**
- Underfit: train error high.
- Overfit: train error low, val error high.
- Aim: both low.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** Hessian eigenvalues 5, 5, 0.0005. κ? If η must be < 2/λmax for a 1-D quadratic, an η stable for λ=5 is tiny for the 0.0005 direction — explain the ravine.

**Expected Key Points:**
- κ=5/0.0005=10000.
- Along the flat axis the effective step is ηλ≈0.0002, so thousands of steps to move — ill-conditioning.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Connect regularisation (L2, augmentation, SSL, dropout, early stopping) to optimisation pathologies (saddles, κ, vanishing). Why is ‘just train longer’ not a full answer?

**Expected Key Points:**
- Longer training can overfit and still stall in ravines/vanishing layers.
- Regularisers change the objective/data; optimisers and architecture change the trajectory.
- You need both a well-conditioned path and a bias toward simple functions.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Regularization and Optimization).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Regularization and Optimization in the context of Regularization and Optimization. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Deep Learning scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Regularization as used in Regularization and Optimization. Include one precise example.

**Model answer:** Regularization is a foundational construct in Regularization and Optimization. Example should name entities/operations and relate to Optimization. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Regularization and Optimization. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Regularization and Optimization theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Regularization Optimization to a realistic campus/industry scenario relevant to Regularization and Optimization. State assumptions.

**Model answer:** Describe scenario, map concepts (Regularization, Optimization), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Optimization and its role within Regularization and Optimization.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Regularization if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Regularization and Optimization; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Regularization while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Regularization and Optimization principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Regularization Optimization in Deep Learning.

**Model answer:** Provide four definitions: include Regularization, Optimization, and two adjacent terms from Regularization and Optimization. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Regularization and Optimization that integrates Regularization, Optimization, and Regularization Optimization.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Optimization in Regularization and Optimization.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Regularization.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Regularization and points. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Regularization and Regularization Optimization: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Regularization and Optimization, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Regularization Optimization under constraints typical of Deep Learning.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Regularization in Regularization and Optimization.

**Model answer:** Dependency chain with one counterexample showing what fails if Regularization is ignored.

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
**Question:** Interpret a hypothetical result/table/trace involving Optimization in Regularization and Optimization. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Regularization in Regularization and Optimization: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Deep Learning.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Regularization Optimization for Regularization and Optimization.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Regularization Optimization.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Optimization in Regularization and Optimization. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Regularization in Regularization and Optimization, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

