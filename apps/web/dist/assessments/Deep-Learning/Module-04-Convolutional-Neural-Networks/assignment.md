# Assignment — Deep Learning — Module 4 — Convolutional Neural Networks

**Subject:** Deep Learning  
**Module:** Module 4 — Convolutional Neural Networks  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define the convolution operation used in CNNs and the roles of kernel, stride and padding.

**Expected Key Points:**
- Local sliding dot-product with a learnable kernel.
- Stride: step/downsample.
- Padding: border to control (n+2p−k)/s+1.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is pooling? Contrast max and average pooling.

**Expected Key Points:**
- Neighbourhood summary that downsamples.
- Max: strongest detector response.
- Avg: mean activation.
- Neither has a learned kernel in the basic form.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Why parameter sharing and local connectivity suit images.

**Expected Key Points:**
- Local statistics repeat across the field of view (edges).
- Sharing one edge detector everywhere cuts params and implements a translation prior.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** State equivariance vs invariance with a 1-pixel shift example.

**Expected Key Points:**
- Equivariant: cat moves right, feature map peak moves right.
- Invariant: label ‘cat’ unchanged.
- Pooling/global pool pushes toward invariance.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Convolution and pooling as an infinitely strong prior (Goodfellow).

**Expected Key Points:**
- Hard constraints: locality, sharing, certain invariances.
- Equivalent to putting probability 0 on most MLP weight settings.
- Inductive bias, not a tiny L2 λ.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Input 64×64×3, conv 7×7, 64 filters, p=3, s=2, plus bias. Output shape and parameter count.

**Expected Key Points:**
- Out spatial (64+6−7)/2+1=32, shape 32×32×64.
- Params 7×7×3×64 + 64 = 9472.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Variants: strided conv, dilation, 1×1, locally connected unshared, transposed conv (as a structured-output tool).

**Expected Key Points:**
- Stride: learned downsample.
- Dilation: larger RF.
- 1×1: channel mixer.
- Unshared: position-dependent.
- Transposed: upsample maps for segmentation/generation.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** LeNet, AlexNet, VGG, ResNet: one idea and one scale number each.

**Expected Key Points:**
- LeNet: digits, tiny, 5×5, 1990s.
- AlexNet: 2012, ~60 M, ReLU/GPU.
- VGG-16: 3×3, ~138 M.
- ResNet-50: skips, ~25 M, 50 layers trainable.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Efficient convolution: im2col, FFT, Winograd — when each helps.

**Expected Key Points:**
- im2col+GEMM: general, library-fast.
- FFT: large kernels.
- Winograd: small (3×3) with fewer multiplies.
- GPUs use these rather than naive 6-loops.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a tiny CNN for 32×32 RGB campus-icon classification (10 classes). Give layer shapes, sizes via the formula, and approx params.

**Expected Key Points:**
- conv 3×3 32 p1 s1 → 32×32×32 (params 896); pool 2 → 16×16; conv 64 p1 → 16×16×64 (18496); pool → 8×8; FC 10.
- Show arithmetic.
- Mention ReLU, dropout on FC, data aug.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Two 3×3 convs 64→64 vs one 5×5 64→64 (bias on). Params and a receptive-field comment (VGG logic).

**Expected Key Points:**
- Two 3×3: 2×36928=73856.
- One 5×5: 25×64×64+64=102464.
- Two 3×3: fewer params, RF 5, extra φ in between — VGG’s stacking argument.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Just flatten 224×224×3 into an MLP; CNNs are a fad.’ Critique with parameter counts and the strong prior.

**Expected Key Points:**
- FC first layer ~150 M weights already for 1000 units, no locality.
- CNNs reuse 3×3×3×64 kernels (~1792 weights) across ~50k locations.
- Without the prior you need far more data to relearn translation.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four CNN data types beyond 2-D images (Goodfellow ‘data types’).

**Expected Key Points:**
- 1-D audio/text, 2-D images, 3-D video/volumetric medical, multi-channel graphs with appropriate conv, stereo, etc.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a structured output from a CNN? Give two tasks.

**Expected Key Points:**
- Outputs with internal structure: per-pixel labels (segmentation), bounding-box maps, dense depth, keypoint heatmaps — not only a single class id.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Backprop through a conv layer: why the kernel gradient sums over positions.

**Expected Key Points:**
- Each position used the same w, so ∂E/∂w = Σ_locations δ ⋆ patch.
- Sharing ties those copies in the backward pass too.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** ResNet skip: what is added, and why it eases vanishing/degradation.

**Expected Key Points:**
- y = F(x)+x (identity).
- Gradients have a +1 path.
- Training very deep conv stacks becomes optimisation of residuals, not a near-zero mapping.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** A detector is great on centred icons but fails when the icon is in a corner. Which CNN properties should have helped, and what might be wrong?

**Expected Key Points:**
- Sharing/equivariance should detect in corners.
- Failures: too little aug, valid conv cropping context, FC layers that leak absolute position, insufficient RF, train data only centred.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define receptive field of a unit.

**Expected Key Points:**
- The input region that unit’s activation depends on, grown by stacked conv/pool (and dilation).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** n=28, k=5, p=0, s=1 then 2×2 pool s=2 (LeNet-ish). Sizes after conv and after pool. If 6 then 16 filters, comments on LeNet C1/S2/C3.

**Expected Key Points:**
- Conv: 24×24; pool: 12×12.
- C1: 6 maps on 32×32→28 with 5×5; then pool 14; C3 16 maps… recount with 32 if using original LeNet padding story.
- Show formula clearly on the 28-input variant.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Tell the history of deep learning through CNNs: Neocognitron/LeNet → AlexNet 2012 → VGG → ResNet, tying each to an idea in this module.

**Expected Key Points:**
- Hubel–Wiesel locality; Fukushima; LeCun conv+backprop on digits; 2012 GPU+ReLU+dropout; VGG 3×3 depth; ResNet skips.
- Each step is architecture as prior plus optimisation becoming feasible.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Convolutional Neural Networks).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Convolutional and Neural in the context of Convolutional Neural Networks. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Deep Learning scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Convolutional as used in Convolutional Neural Networks. Include one precise example.

**Model answer:** Convolutional is a foundational construct in Convolutional Neural Networks. Example should name entities/operations and relate to Neural. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Convolutional and Neural. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Convolutional Neural Networks theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Networks to a realistic campus/industry scenario relevant to Convolutional Neural Networks. State assumptions.

**Model answer:** Describe scenario, map concepts (Convolutional, Neural), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Neural and its role within Convolutional Neural Networks.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Convolutional if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Convolutional Neural within Convolutional Neural Networks; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Convolutional while building a solution involving Convolutional Neural. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Convolutional Neural Networks principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Networks in Deep Learning.

**Model answer:** Provide four definitions: include Convolutional, Neural, and two adjacent terms from Convolutional Neural Networks. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Convolutional Neural Networks that integrates Convolutional, Neural, and Networks.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Neural in Convolutional Neural Networks.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Convolutional.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Convolutional and Neural Networks. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Convolutional and Networks: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Convolutional Neural Networks, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Networks under constraints typical of Deep Learning.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Convolutional Neural depends on earlier ideas such as Convolutional in Convolutional Neural Networks.

**Model answer:** Dependency chain with one counterexample showing what fails if Convolutional is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Neural Networks measurably improves an outcome in Deep Learning.

**Model answer:** Context, intervention using Neural Networks, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Neural in Convolutional Neural Networks. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Convolutional in Convolutional Neural Networks: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Deep Learning.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Networks for Convolutional Neural Networks.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Networks.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Neural in Convolutional Neural Networks. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Convolutional in Convolutional Neural Networks, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

