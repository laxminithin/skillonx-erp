# Assignment — Deep Learning — Module 1 — Foundations of Neural Networks and Perceptron

**Subject:** Deep Learning  
**Module:** Module 1 — Foundations of Neural Networks and Perceptron  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a neural network according to Haykin? Name three benefits of distributed processing.

**Expected Key Points:**
- A massively parallel processor of simple units storing experiential knowledge.
- Benefits: robustness, generalisation, nonlinear mapping, parallelism (any three).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define the McCulloch–Pitts neuron and write y = φ(w·x − θ).

**Expected Key Points:**
- Binary inputs, fixed weights, fire if weighted sum ≥ threshold.
- φ is a step/signum.
- 1943 logical-calculus model.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain neural networks as directed graphs and the meaning of feedback.

**Expected Key Points:**
- Nodes = neurons, directed edges = synapses.
- Acyclic: feedforward.
- Cycles: feedback/recurrent dynamics, stability issues.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** State Rosenblatt’s perceptron and the learning rule in words.

**Expected Key Points:**
- Linear threshold classifier.
- On a false negative add x to w; on a false positive subtract x (bipolar variants similar).
- Correct points: no update.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** State the perceptron convergence theorem and why XOR is excluded.

**Expected Key Points:**
- If a separator exists, finite mistakes suffice to find one.
- XOR has no separator in R^2, so the hypothesis fails and cycling can persist.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO1
**Question:** Single-layer vs multilayer architectures. What can each represent?

**Expected Key Points:**
- Single layer: half-spaces / linearly separable Boolean functions.
- MLP: compositions of nonlinear features; universal approximation with enough hidden units (XOR as the witness).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Relation between the perceptron and the Bayes classifier for a Gaussian environment (Haykin).

**Expected Key Points:**
- Equal-covariance Gaussians ⇒ linear log-likelihood ratio.
- A perceptron can implement that linear score.
- It is not a full generative Bayesian engine; mismatched Σ ⇒ quadratic Bayes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** Design w, θ for AND and OR on {0,1}^2. Show XOR cannot use one such pair. Sketch the four points.

**Expected Key Points:**
- AND: w=(1,1), θ=1.5.
- OR: w=(1,1), θ=0.5.
- XOR: (0,0),(1,1) vs (0,1),(1,0) not linearly separable — draw the square.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Models of a neuron: induced field, bias, activation choices (step, sigmoid, tanh).

**Expected Key Points:**
- v=Σ w x + b; φ may be hard limiter (perceptron), logistic, tanh.
- Smooth φ needed later for backprop; step is not differentiable at 0.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** A lab: generate two 2-D Gaussian classes (shared Σ) and two XOR clouds. Train a perceptron on both. What must happen and what should students plot?

**Expected Key Points:**
- Gaussians: converges to a line near the Bayes boundary.
- XOR: no convergence to zero error.
- Plot decision lines, mistake counts vs epoch, and the four XOR points.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** w=(2,−1), b=−0.5. Classify (1,1), (0,1), (1,0). Give one misclassified point you could use in a perceptron update (assume labels +1, −1, +1 respectively) and the updated w,b with rate 1.

**Expected Key Points:**
- v: 2−1−0.5=0.5 → +1 OK; −1−0.5=−1.5 → −1 OK; 2−0.5=1.5 → +1 OK.
- If instead label of (1,0) were −1, update w ← w − (1,0), b ← b−1.
- Show arithmetic from the actual labels given; state the rule clearly.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘Deep learning made the perceptron obsolete, so convergence theorems do not matter.’ Critique.

**Expected Key Points:**
- Deep nets still use linear thresholds as pieces; separability intuition explains why hidden layers exist; many linear heads sit on learned features.
- The theorem is the cleanest learning guarantee students will see.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four network architectures Haykin distinguishes.

**Expected Key Points:**
- Single-layer feedforward, multilayer feedforward, recurrent, lattice (or radial-basis); mention feedback vs acyclic.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Role of the bias and of the clamped-input trick.

**Expected Key Points:**
- Bias shifts the hyperplane.
- Equivalently augment x with 1 and learn w0.
- Without bias, the plane is forced through the origin.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Positive vs negative feedback in neural dynamical systems.

**Expected Key Points:**
- Positive: amplification, possible instability.
- Negative: restoring forces, possible stable attractors (Hopfield-style energy).
- Haykin treats this before modern LSTMs.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What does generalisation mean, and why can zero training error still fail?

**Expected Key Points:**
- Performance on unseen x.
- A perceptron that memorised a tiny separable set may still err if the true distributions overlap or the features are poor.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** Access-control uses one perceptron on (temperature, humidity) to detect ‘door open’. Failures at night look like XOR vs day. Advise.

**Expected Key Points:**
- One hyperplane cannot capture an XOR-like interaction.
- Add a hidden layer, engineer a feature (e.g.
- product or time-of-day), or use an MLP.
- Do not wait for perceptron convergence.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define synaptic weight and induced local field.

**Expected Key Points:**
- w_ij multiplies the signal from j to i.
- v_i = Σ_j w_ij y_j + b_i, input to φ.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Draw a 2-input perceptron and a 2–2–1 feedforward net that can implement XOR. Label weights conceptually.

**Expected Key Points:**
- First: one neuron, 2 weights + bias.
- Second: two hidden threshold units (OR-like and NAND-like) plus an AND-like output — the classic XOR MLP.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Trace the path from McCulloch–Pitts (1943) through Rosenblatt (1958) to why multilayer nets and backprop became necessary.

**Expected Key Points:**
- M–P: computation.
- Perceptron: learning + convergence on separable data.
- Minsky–Papert XOR limitation.
- Hidden layers restore power but need a differentiable training rule — the bridge to Module 2.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Foundations of Neural Networks and Perceptron).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Foundations and Neural in the context of Foundations of Neural Networks and Perceptron. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Deep Learning scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Foundations as used in Foundations of Neural Networks and Perceptron. Include one precise example.

**Model answer:** Foundations is a foundational construct in Foundations of Neural Networks and Perceptron. Example should name entities/operations and relate to Neural. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Foundations and Neural. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Foundations of Neural Networks and Perceptron theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Networks to a realistic campus/industry scenario relevant to Foundations of Neural Networks and Perceptron. State assumptions.

**Model answer:** Describe scenario, map concepts (Foundations, Neural), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Neural and its role within Foundations of Neural Networks and Perceptron.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Foundations if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Perceptron within Foundations of Neural Networks and Perceptron; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Foundations while building a solution involving Perceptron. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Foundations of Neural Networks and Perceptron principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Networks in Deep Learning.

**Model answer:** Provide four definitions: include Foundations, Neural, and two adjacent terms from Foundations of Neural Networks and Perceptron. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Foundations of Neural Networks and Perceptron that integrates Foundations, Neural, and Networks.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Neural in Foundations of Neural Networks and Perceptron.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Foundations.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Foundations and Foundations Neural. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Foundations and Networks: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Foundations of Neural Networks and Perceptron, show intermediate results, box the final answer, and sanity-check.

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
**Question:** Explain how Perceptron depends on earlier ideas such as Foundations in Foundations of Neural Networks and Perceptron.

**Model answer:** Dependency chain with one counterexample showing what fails if Foundations is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Foundations Neural measurably improves an outcome in Deep Learning.

**Model answer:** Context, intervention using Foundations Neural, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Neural in Foundations of Neural Networks and Perceptron. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Foundations in Foundations of Neural Networks and Perceptron: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Deep Learning.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Networks for Foundations of Neural Networks and Perceptron.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Networks.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Neural in Foundations of Neural Networks and Perceptron. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Foundations in Foundations of Neural Networks and Perceptron, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

