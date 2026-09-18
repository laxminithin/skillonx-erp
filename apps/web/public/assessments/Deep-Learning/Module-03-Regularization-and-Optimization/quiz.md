# Quiz — Deep Learning — Module 3: Regularization and Optimization

**Subject:** Deep Learning  
**Module:** Module 3 — Regularization and Optimization  
**Questions:** 77  
**Mix:** 13 Easy · 36 Intermediate · 28 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Dataset augmentation is intended to:

- **A.** Reduce the training set size
- **B.** Improve generalisation by teaching invariances using transformed copies
- **C.** Replace the optimiser with Newton
- **D.** Compute the Hessian condition number

**Answer:** B
**Explanation:** Goodfellow: more data via transforms.

### Q02  ·  Easy
**Question:** Early stopping uses which signal?

- **A.** Training error reaching 0 only
- **B.** The perceptron mistake count
- **C.** Validation error starting to worsen
- **D.** Dropout p hitting 0

**Answer:** C
**Explanation:** Cheap regulariser.

### Q03  ·  Easy
**Question:** L2 regularisation penalises:

- **A.** The batch size
- **B.** The squared Euclidean norm of (selected) weights
- **C.** Dropout p
- **D.** The number of layers only

**Answer:** B
**Explanation:** Parameter norm penalty.

### Q04  ·  Easy
**Question:** Semi-supervised learning uses:

- **A.** Only a Hessian
- **B.** Labelled and unlabelled examples together
- **C.** Only unlabelled examples and no task
- **D.** Only data-free random weights

**Answer:** B
**Explanation:** Core definition.

### Q05  ·  Easy
**Question:** Which option best describes **Dataset augmentation**?

- **A.** Creating extra training examples by transforming data (crops, flips, noise) so the model is invariant to those transformations.
- **B.** Reducing the learning rate.
- **C.** Adding L2 to the cost.
- **D.** Duplicating the same image 1000 times with no change.

**Answer:** A
**Explanation:** Dataset augmentation: Creating extra training examples by transforming data (crops, flips, noise) so the model is invariant to those transformations.

### Q06  ·  Easy
**Question:** Which option best describes **Early stopping**?

- **A.** Train until training loss is 0 regardless of validation.
- **B.** Stop after the first minibatch always.
- **C.** Stop training when validation error is best (with a patience window), as a cheap regulariser that limits effective capacity.
- **D.** The perceptron mistake bound.

**Answer:** C
**Explanation:** Early stopping: Stop training when validation error is best (with a patience window), as a cheap regulariser that limits effective capacity.

### Q07  ·  Easy
**Question:** Which option best describes **Local minimum**?

- **A.** Dropout’s random seed.
- **B.** A point where ∇L=0 and the Hessian is positive definite in a neighbourhood; in deep nets many critical points are saddles rather than bad local minima.
- **C.** The only critical points in high dimensions.
- **D.** A point with ∇L ≠ 0.

**Answer:** B
**Explanation:** Local minimum: A point where ∇L=0 and the Hessian is positive definite in a neighbourhood; in deep nets many critical points are saddles rather than bad local minima.

### Q08  ·  Easy
**Question:** Which option best describes **Parameter norm penalty**?

- **A.** Adding the training loss to itself.
- **B.** Adding Ω(θ) such as (1/2)||w||^2 to J, trading data fit against simplicity of parameters.
- **C.** Clipping gradients to 0.
- **D.** Forbidding all regularisers.

**Answer:** B
**Explanation:** Parameter norm penalty: Adding Ω(θ) such as (1/2)||w||^2 to J, trading data fit against simplicity of parameters.

### Q09  ·  Easy
**Question:** Which option best describes **Regularisation**?

- **A.** A method whose only goal is to drive training loss to 0 at any cost.
- **B.** Any modification of learning designed to reduce generalisation error, not merely training error (Goodfellow).
- **C.** The perceptron convergence theorem.
- **D.** A convolution stride.

**Answer:** B
**Explanation:** Regularisation: Any modification of learning designed to reduce generalisation error, not merely training error (Goodfellow).

### Q10  ·  Easy
**Question:** Which option best describes **Vanishing gradient**?

- **A.** A regulariser that adds λ||w||^2.
- **B.** Repeated multiplication by Jacobians with spectral radius < 1 (e.g. sigmoid φ′≤0.25) drives early-layer δ → 0.
- **C.** Gradients that grow as 2^depth without bound.
- **D.** Max-pooling.

**Answer:** B
**Explanation:** Vanishing gradient: Repeated multiplication by Jacobians with spectral radius < 1 (e.g. sigmoid φ′≤0.25) drives early-layer δ → 0.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **applying L2 / weight decay**?

- **A.** Multiply the labels by λ
- **B.** Add (λ/2)||w||^2 to the objective (usually not biases) → SGD step includes −ηλ w as well as −η∇L_data
- **C.** Zero the gradient of the data loss
- **D.** Increase ||w|| each step on purpose

**Answer:** B
**Explanation:** Correct sequence for applying L2 / weight decay: Add (λ/2)||w||^2 to the objective (usually not biases) → SGD step includes −ηλ w as well as −η∇L_data

### Q12  ·  Easy
**Question:** Which sequence correctly describes **early-stopping protocol**?

- **A.** Peek at the test set every minibatch to choose the epoch
- **B.** Stop when training error is exactly 0 only
- **C.** Never use a validation split
- **D.** Split val set → train, record val error each epoch → keep best weights when val stops improving (patience) → report test once

**Answer:** D
**Explanation:** Correct sequence for early-stopping protocol: Split val set → train, record val error each epoch → keep best weights when val stops improving (patience) → report test once

### Q13  ·  Easy
**Question:** Which sequence correctly describes **semi-supervised sketch**?

- **A.** Ignore unlabelled x by definition of SSL
- **B.** Use unlabelled y-test as if they were known
- **C.** Train supervised loss on labelled pairs + unsupervised consistency/reconstruction on unlabelled x → joint SGD
- **D.** Replace the classifier with pooling only

**Answer:** C
**Explanation:** Correct sequence for semi-supervised sketch: Train supervised loss on labelled pairs + unsupervised consistency/reconstruction on unlabelled x → joint SGD

### Q14  ·  Intermediate
**Question:** Co-adaptation: hidden unit A is useful only if B is present. Dropout fights this by:

- **A.** Removing the loss
- **B.** Increasing L2 on biases only
- **C.** Forcing units to be useful in random subnetworks
- **D.** Tying A and B’s weights

**Answer:** C
**Explanation:** Ensemble of thinned nets.

### Q15  ·  Intermediate
**Question:** Critical point analysis of a 10^7-parameter net. Most ∇L=0 points are expected to be:

- **A.** Global minima only
- **B.** Plateaus with ∇L huge
- **C.** Isolated local minima only
- **D.** Saddles (mixed Hessian spectrum), not well-defined bad minima

**Answer:** D
**Explanation:** High-dimensional nonconvex geometry.

### Q16  ·  Intermediate
**Question:** Gradient clipping is aimed at:

- **A.** Exploding gradients (large ||g||)
- **B.** Making sigmoids vanish faster
- **C.** Removing the need for η
- **D.** Increasing κ of a spherical Hessian

**Answer:** A
**Explanation:** Rescale huge gradients.

### Q17  ·  Intermediate
**Question:** In very high dimensions, typical critical points of deep-net losses are:

- **A.** Only global minima
- **B.** Saddle points with mixed Hessian eigenvalues
- **C.** Points with ∇L ≠ 0
- **D.** Only isolated local minima with all-positive eigenvalues

**Answer:** B
**Explanation:** Modern nonconvex picture.

### Q18  ·  Intermediate
**Question:** Training NaNs after a ReLU net’s learning-rate bump. A safety tool is:

- **A.** Hard-limiter activations
- **B.** Gradient clipping (and/or lower η, better init)
- **C.** Setting λ=0 and η=5 together
- **D.** Removing all regularisation

**Answer:** B
**Explanation:** Exploding-gradient control.

### Q19  ·  Intermediate
**Question:** Training accuracy 99%, validation 60% on a small dataset. First regularisers to try:

- **A.** More data/augmentation, L2/dropout, early stopping
- **B.** Remove all hidden units
- **C.** Explode the gradient on purpose
- **D.** Train 10× longer with larger η only

**Answer:** A
**Explanation:** Classic overfitting.

### Q20  ·  Intermediate
**Question:** Vanishing gradients in a deep sigmoid net scale in the worst case like:

- **A.** Products of factors ≤ 0.25 per layer
- **B.** 2^L growth each layer
- **C.** The batch size N
- **D.** Exactly λ of L2

**Answer:** A
**Explanation:** φ′≤1/4.

### Q21  ·  Intermediate
**Question:** Weight decay in plain SGD implements L2 by:

- **A.** Clipping gradients at λ
- **B.** Adding λ to the learning rate
- **C.** Dropping units with probability λ
- **D.** Multiplying weights by (1−ηλ) each step in addition to the data gradient

**Answer:** D
**Explanation:** w ← (1−ηλ)w − ηg.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **L2 / weight decay** and **L1 penalty**?

- **A.** They are dropout.
- **B.** L1 is weight decay in SGD always.
- **C.** L2 shrinks weights smoothly; L1 drives many weights to exact 0 (sparsity).
- **D.** L2 produces exact zeros more often than L1.

**Answer:** C
**Explanation:** L2 shrinks weights smoothly; L1 drives many weights to exact 0 (sparsity).

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **early stopping** and **L2 penalty**?

- **A.** They cannot be combined.
- **B.** L2 is a stopping rule on epochs only.
- **C.** Early stopping maximises ||w||.
- **D.** Both limit effective capacity. Early stopping is implicit (path length in GD); L2 is an explicit quadratic penalty.

**Answer:** D
**Explanation:** Both limit effective capacity. Early stopping is implicit (path length in GD); L2 is an explicit quadratic penalty.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **supervised** and **semi-supervised**?

- **A.** They both ignore labels.
- **B.** Supervised uses only labelled pairs; semi-supervised also exploits unlabelled x.
- **C.** Semi-supervised forbids unlabelled data.
- **D.** Supervised requires unlabelled data.

**Answer:** B
**Explanation:** Supervised uses only labelled pairs; semi-supervised also exploits unlabelled x.

### Q25  ·  Intermediate
**Question:** What is the most important distinction between **vanishing gradient** and **exploding gradient**?

- **A.** Exploding means sigmoid φ′=0.25^L → 0.
- **B.** They cannot both arise from Jacobian products.
- **C.** Vanishing: products ≪ 1, early layers freeze. Exploding: products ≫ 1, steps NaN. Both come from chained Jacobians.
- **D.** Vanishing means ||g||→∞.

**Answer:** C
**Explanation:** Vanishing: products ≪ 1, early layers freeze. Exploding: products ≫ 1, steps NaN. Both come from chained Jacobians.

### Q26  ·  Intermediate
**Question:** Which option best describes **Capacity / overfitting**?

- **A.** Too much capacity + too little data/regularisation fits noise; training error << validation error.
- **B.** More data always increases overfitting.
- **C.** L2 cannot affect capacity.
- **D.** Overfitting means training error is high and val error is low.

**Answer:** A
**Explanation:** Capacity / overfitting: Too much capacity + too little data/regularisation fits noise; training error << validation error.

### Q27  ·  Intermediate
**Question:** Which option best describes **Condition number κ**?

- **A.** κ = |λ_max/λ_min| of the Hessian (or covariance); large κ means ill-conditioned curvature.
- **B.** κ = number of layers.
- **C.** κ = dropout p.
- **D.** κ = η / λ.

**Answer:** A
**Explanation:** Condition number κ: κ = |λ_max/λ_min| of the Hessian (or covariance); large κ means ill-conditioned curvature.

### Q28  ·  Intermediate
**Question:** Which option best describes **Dropout (intuition)**?

- **A.** A pooling operation on feature maps only.
- **B.** Removing L2 penalties.
- **C.** Always dropping the loss function.
- **D.** Randomly zeroing units at train time (keep p≈0.5 hidden) prevents co-adaptation; at test time scale weights by p — an ensemble-like regulariser.

**Answer:** D
**Explanation:** Dropout (intuition): Randomly zeroing units at train time (keep p≈0.5 hidden) prevents co-adaptation; at test time scale weights by p — an ensemble-like regulariser.

### Q29  ·  Intermediate
**Question:** Which option best describes **Exploding gradient**?

- **A.** Products of Jacobians with large norms make updates NaN/huge; often tamed by clipping or better init/gates.
- **B.** Dataset augmentation.
- **C.** The same as L2 weight decay.
- **D.** A benefit of sigmoid saturation.

**Answer:** A
**Explanation:** Exploding gradient: Products of Jacobians with large norms make updates NaN/huge; often tamed by clipping or better init/gates.

### Q30  ·  Intermediate
**Question:** Which option best describes **Ill-conditioning**?

- **A.** A Hessian with a huge condition number: gradients point poorly, so first-order steps zigzag and progress is slow in some directions.
- **B.** Dropout keep probability.
- **C.** A perfectly spherical Hessian with κ=1.
- **D.** The vanishing of all singular values equally.

**Answer:** A
**Explanation:** Ill-conditioning: A Hessian with a huge condition number: gradients point poorly, so first-order steps zigzag and progress is slow in some directions.

### Q31  ·  Intermediate
**Question:** Which option best describes **L2 parameter penalty / weight decay**?

- **A.** Dropout’s random mask.
- **B.** Adding λ||w||_1 only, which is L1.
- **C.** Batch normalisation.
- **D.** Adding (λ/2)||w||^2 to the cost, which pulls weights toward 0 and, in SGD, subtracts λ w each step (weight decay).

**Answer:** D
**Explanation:** L2 parameter penalty / weight decay: Adding (λ/2)||w||^2 to the cost, which pulls weights toward 0 and, in SGD, subtracts λ w each step (weight decay).

### Q32  ·  Intermediate
**Question:** Which option best describes **Noise as regularisation**?

- **A.** Batch learning forbids any stochasticity.
- **B.** Noise always destroys learning and is never used on purpose.
- **C.** Noise is the same as exploding gradients.
- **D.** Injecting noise in inputs, hidden units, or weights can flatten sharp minima and improve generalisation (augmentation and dropout are instances).

**Answer:** D
**Explanation:** Noise as regularisation: Injecting noise in inputs, hidden units, or weights can flatten sharp minima and improve generalisation (augmentation and dropout are instances).

### Q33  ·  Intermediate
**Question:** Which option best describes **Plateau / flat region**?

- **A.** A region with tiny gradients (near-zero Hessian spectrum in some directions), so progress looks stalled even if a better basin exists.
- **B.** A convolutional kernel of size 1.
- **C.** A region of infinitely steep cliffs only.
- **D.** The ImageNet validation set.

**Answer:** A
**Explanation:** Plateau / flat region: A region with tiny gradients (near-zero Hessian spectrum in some directions), so progress looks stalled even if a better basin exists.

### Q34  ·  Intermediate
**Question:** Which option best describes **Saddle point**?

- **A.** A local minimum with all eigenvalues positive.
- **B.** A point that is never stationary.
- **C.** A critical point with mixed Hessian eigenvalues (some +, some −); ubiquitous in high-dimensional nonconvex nets.
- **D.** A local maximum only.

**Answer:** C
**Explanation:** Saddle point: A critical point with mixed Hessian eigenvalues (some +, some −); ubiquitous in high-dimensional nonconvex nets.

### Q35  ·  Intermediate
**Question:** Which option best describes **Semi-supervised learning**?

- **A.** Supervised ImageNet pretraining only.
- **B.** Using a small labelled set together with a large unlabelled set to improve a predictor (e.g. reconstruction, consistency, or generative penalties).
- **C.** Using only labelled data by definition.
- **D.** Using only unlabelled data with no prediction task.

**Answer:** B
**Explanation:** Semi-supervised learning: Using a small labelled set together with a large unlabelled set to improve a predictor (e.g. reconstruction, consistency, or generative penalties).

### Q36  ·  Intermediate
**Question:** Which option best describes **Underfitting**?

- **A.** Training error is ~0 and val error is huge.
- **B.** A synonym of dropout.
- **C.** The model is too constrained (or badly optimised) so even training error stays high.
- **D.** Always caused by too little L2.

**Answer:** C
**Explanation:** Underfitting: The model is too constrained (or badly optimised) so even training error stays high.

### Q37  ·  Intermediate
**Question:** Which option best describes **Weight decay vs L2 loss term**?

- **A.** Weight decay increases ||w|| each step.
- **B.** In simple SGD they coincide (decay w ← (1−ηλ)w − η∇L_data); in adaptive methods the equivalence can break unless implemented as true decay.
- **C.** L2 penalties only apply to biases, never to weights.
- **D.** They are never related.

**Answer:** B
**Explanation:** Weight decay vs L2 loss term: In simple SGD they coincide (decay w ← (1−ηλ)w − η∇L_data); in adaptive methods the equivalence can break unless implemented as true decay.

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **augmentation training loop**?

- **A.** Transform the test labels using the training seed
- **B.** Duplicate x without any transform and call it a new class
- **C.** Apply L2 instead of changing x
- **D.** Sample x → apply random legal transform (crop/flip/noise) → supervised loss on transformed x → SGD

**Answer:** D
**Explanation:** Correct sequence for augmentation training loop: Sample x → apply random legal transform (crop/flip/noise) → supervised loss on transformed x → SGD

### Q39  ·  Intermediate
**Question:** Which sequence correctly describes **diagnosing vanishing vs exploding**?

- **A.** Assume all problems are L1 vs L2
- **B.** Remove the chain rule
- **C.** Increase η if NaNs appear
- **D.** Watch ||g|| per layer: collapse toward input ⇒ vanishing; NaNs/huge ‖Δw‖ ⇒ exploding → then init, φ, clip, depth, skip/gates

**Answer:** D
**Explanation:** Correct sequence for diagnosing vanishing vs exploding: Watch ||g|| per layer: collapse toward input ⇒ vanishing; NaNs/huge ‖Δw‖ ⇒ exploding → then init, φ, clip, depth, skip/gates

### Q40  ·  Intermediate
**Question:** Which statement about **Condition number κ** is FALSE?

- **A.** A condition number of 10^7 means SGD will take perfectly spherical, easy steps.
- **B.** A useful way to remember Condition number κ is that it is not the same as “κ = η / λ”.
- **C.** Condition number κ is correctly understood as: κ = |λ_max/λ_min| of the Hessian (or covariance); large κ means ill-conditioned curvature.
- **D.** In this module, Condition number κ is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A condition number of 10^7 means SGD will take perfectly spherical, easy steps.. Condition number κ actually means: κ = |λ_max/λ_min| of the Hessian (or covariance); large κ means ill-conditioned curvature.

### Q41  ·  Intermediate
**Question:** Which statement about **Early stopping** is FALSE?

- **A.** In this module, Early stopping is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Early stopping is that it is not the same as “Train until training loss is 0 regardless of validation”.
- **C.** Early stopping is illegal because it looks at a validation set.
- **D.** Early stopping is correctly understood as: stop training when validation error is best (with a patience window), as a cheap regulariser that limits effective capacity.

**Answer:** C
**Explanation:** The false claim is: Early stopping is illegal because it looks at a validation set.. Early stopping actually means: Stop training when validation error is best (with a patience window), as a cheap regulariser that limits effective capacity.

### Q42  ·  Intermediate
**Question:** Which statement about **Exploding gradient** is FALSE?

- **A.** A useful way to remember Exploding gradient is that it is not the same as “The same as L2 weight decay”.
- **B.** In this module, Exploding gradient is a core idea students must distinguish from nearby terms.
- **C.** Exploding gradient is correctly understood as: products of Jacobians with large norms make updates NaN/huge; often tamed by clipping or better init/gates.
- **D.** Exploding gradients are solved by using a larger η.

**Answer:** D
**Explanation:** The false claim is: Exploding gradients are solved by using a larger η.. Exploding gradient actually means: Products of Jacobians with large norms make updates NaN/huge; often tamed by clipping or better init/gates.

### Q43  ·  Intermediate
**Question:** Which statement about **Local minimum** is FALSE?

- **A.** Every critical point of a deep net is a disastrous local minimum that SGD can never leave.
- **B.** A useful way to remember Local minimum is that it is not the same as “The only critical points in high dimensions”.
- **C.** In this module, Local minimum is a core idea students must distinguish from nearby terms.
- **D.** Local minimum is correctly understood as: a point where ∇L=0 and the Hessian is positive definite in a neighbourhood; in deep nets many critical points are saddles rather than bad local minima.

**Answer:** A
**Explanation:** The false claim is: Every critical point of a deep net is a disastrous local minimum that SGD can never leave.. Local minimum actually means: A point where ∇L=0 and the Hessian is positive definite in a neighbourhood; in deep nets many critical points are saddles rather than bad local minima.

### Q44  ·  Intermediate
**Question:** Which statement about **Noise as regularisation** is FALSE?

- **A.** A useful way to remember Noise as regularisation is that it is not the same as “Noise always destroys learning and is never used on purpose”.
- **B.** Goodfellow argues that SGD’s noise cannot interact with generalisation.
- **C.** In this module, Noise as regularisation is a core idea students must distinguish from nearby terms.
- **D.** Noise as regularisation is correctly understood as: injecting noise in inputs, hidden units, or weights can flatten sharp minima and improve generalisation (augmentation and dropout are instances).

**Answer:** B
**Explanation:** The false claim is: Goodfellow argues that SGD’s noise cannot interact with generalisation.. Noise as regularisation actually means: Injecting noise in inputs, hidden units, or weights can flatten sharp minima and improve generalisation (augmentation and dropout are instances).

### Q45  ·  Intermediate
**Question:** Which statement about **Plateau / flat region** is FALSE?

- **A.** Plateau / flat region is correctly understood as: a region with tiny gradients (near-zero Hessian spectrum in some directions), so progress looks stalled even if a better basin exists.
- **B.** A useful way to remember Plateau / flat region is that it is not the same as “A region of infinitely steep cliffs only”.
- **C.** Plateaus have enormous gradients that always explode.
- **D.** In this module, Plateau / flat region is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Plateaus have enormous gradients that always explode.. Plateau / flat region actually means: A region with tiny gradients (near-zero Hessian spectrum in some directions), so progress looks stalled even if a better basin exists.

### Q46  ·  Intermediate
**Question:** Which statement about **Regularisation** is FALSE?

- **A.** A useful way to remember Regularisation is that it is not the same as “A method whose only goal is to drive training loss to 0 at any cost”.
- **B.** In this module, Regularisation is a core idea students must distinguish from nearby terms.
- **C.** Regularisation is defined as increasing the training-set error on purpose with no test-set goal.
- **D.** Regularisation is correctly understood as: any modification of learning designed to reduce generalisation error, not merely training error (Goodfellow).

**Answer:** C
**Explanation:** The false claim is: Regularisation is defined as increasing the training-set error on purpose with no test-set goal.. Regularisation actually means: Any modification of learning designed to reduce generalisation error, not merely training error (Goodfellow).

### Q47  ·  Intermediate
**Question:** Which statement about **Semi-supervised learning** is FALSE?

- **A.** In this module, Semi-supervised learning is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Semi-supervised learning is that it is not the same as “Using only labelled data by definition”.
- **C.** Semi-supervised learning is correctly understood as: using a small labelled set together with a large unlabelled set to improve a predictor (e.g. reconstruction, consistency, or generative penalties).
- **D.** Semi-supervised learning forbids looking at any unlabelled example.

**Answer:** D
**Explanation:** The false claim is: Semi-supervised learning forbids looking at any unlabelled example.. Semi-supervised learning actually means: Using a small labelled set together with a large unlabelled set to improve a predictor (e.g. reconstruction, consistency, or generative penalties).

### Q48  ·  Intermediate
**Question:** Which statement about **Weight decay vs L2 loss term** is FALSE?

- **A.** L2 regularisation is the same as momentum 0.9.
- **B.** Weight decay vs L2 loss term is correctly understood as: in simple SGD they coincide (decay w ← (1−ηλ)w − η∇L_data); in adaptive methods the equivalence can break unless implemented as true decay.
- **C.** A useful way to remember Weight decay vs L2 loss term is that it is not the same as “They are never related”.
- **D.** In this module, Weight decay vs L2 loss term is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: L2 regularisation is the same as momentum 0.9.. Weight decay vs L2 loss term actually means: In simple SGD they coincide (decay w ← (1−ηλ)w − η∇L_data); in adaptive methods the equivalence can break unless implemented as true decay.

### Q49  ·  Intermediate
**Question:** You have 500 labelled medical images and 50 000 unlabelled. A module-aligned approach is:

- **A.** Throw away the 50 000
- **B.** Use only L2 and ignore unlabelled x
- **C.** Label-smooth the test set using its true labels
- **D.** Semi-supervised learning (consistency/reconstruction/generative auxiliary)

**Answer:** D
**Explanation:** SSL uses unlabelled x.

### Q50  ·  Difficult
**Question:** 0.25^4 equals:

- **A.** 0.00390625
- **B.** 4.0
- **C.** 0.25
- **D.** 1.0

**Answer:** A
**Explanation:** (1/4)^4 = 1/256 ≈ 0.0039.

### Q51  ·  Difficult
**Question:** A 20-layer sigmoid MLP has near-zero gradients in layer 1. This is:

- **A.** Successful skip connections
- **B.** Vanishing gradients (φ′≤0.25 compounded)
- **C.** Exploding gradients
- **D.** L2 being too small

**Answer:** B
**Explanation:** Product of small derivatives.

### Q52  ·  Difficult
**Question:** A Hessian has eigenvalues 10 and 0.001. Condition number κ is:

- **A.** 0.001
- **B.** 1
- **C.** 10.001
- **D.** 10 000

**Answer:** D
**Explanation:** 10 / 0.001 = 10^4, severely ill-conditioned.

### Q53  ·  Difficult
**Question:** A vision model fails on flipped campus photos. A Goodfellow-style fix is:

- **A.** Semi-supervised labels on the test set
- **B.** Horizontal-flip (and related) dataset augmentation
- **C.** L2 on the softmax only
- **D.** Increasing κ of the Hessian

**Answer:** B
**Explanation:** Augment with the invariance you need.

### Q54  ·  Difficult
**Question:** Dropout at train time with keep probability p, inverted-dropout style, typically:

- **A.** Replaces L2 with L1
- **B.** Sets p=0 for hidden layers
- **C.** Resamples a new mask at every test query as required by Goodfellow
- **D.** Scales surviving units by 1/p during training so the test net uses the full weights without extra scaling

**Answer:** D
**Explanation:** Keep train/test expectations aligned.

### Q55  ·  Difficult
**Question:** Dropout keep probability p=0.5 on a hidden unit with activation 2.0 at train (kept). Test-time inverted dropout without rescaling the unit would expect mean:

- **A.** 0.5^8
- **B.** 0 always at test
- **C.** 1.0 if you forget to scale (0.5×2), which is why we scale by p or 1/p in the chosen convention
- **D.** 2.0 with no convention needed ever

**Answer:** C
**Explanation:** At p=0.5 the average train activation is halved unless inverted dropout scales during train.

### Q56  ·  Difficult
**Question:** Early stopping picked epoch 12 of 50. If each epoch is 100 steps, the selected trajectory length is:

- **A.** 50 epochs
- **B.** 1200 optimiser steps
- **C.** 12 steps
- **D.** 100 steps

**Answer:** B
**Explanation:** 12×100=1200; capacity is limited by how far GD travelled.

### Q57  ·  Difficult
**Question:** Gradient clipping: if ||g||=50 and clip at 5, the scaled ||g|| becomes:

- **A.** 5
- **B.** 0
- **C.** 10
- **D.** 50

**Answer:** A
**Explanation:** Multiply g by 5/50 so the norm is 5.

### Q58  ·  Difficult
**Question:** Ill-conditioning hurts SGD because:

- **A.** SGD cannot run when λ_max exists
- **B.** A large Hessian κ makes the gradient a poor guide to the long, useful directions of a ravine
- **C.** The loss becomes convex automatically
- **D.** κ=1 maximises zigzagging

**Answer:** B
**Explanation:** Curvature mismatch.

### Q59  ·  Difficult
**Question:** L2 term (λ/2) w^2 for λ=0.01 and a weight w=2 contributes:

- **A.** 2.0
- **B.** 0.02 to the cost
- **C.** 0.01
- **D.** 0.0001

**Answer:** B
**Explanation:** (0.01/2)×4 = 0.02.

### Q60  ·  Difficult
**Question:** Loss decreases extremely slowly despite a healthy ||g|| that oscillates in sign along a ravine. Suspect:

- **A.** Dropout keep p=1 as the only cause
- **B.** Perfect spherical curvature
- **C.** Linear separability of XOR
- **D.** Ill-conditioning (large Hessian κ)

**Answer:** D
**Explanation:** Curvature mismatch.

### Q61  ·  Difficult
**Question:** SGD vs full-batch GD on a saddle-rich loss. Noise in SGD can:

- **A.** Increase Hessian κ by definition
- **B.** Replace the need for a loss function
- **C.** Always converge to the worst local minimum
- **D.** Help escape some saddles/flat regions compared with exact GD

**Answer:** D
**Explanation:** Stochasticity vs saddles.

### Q62  ·  Difficult
**Question:** SGD with weight decay: w ← (1 − ηλ) w − η g. If η=0.1, λ=0.1, w=1, g=0, new w is:

- **A.** 0.99
- **B.** 0.9
- **C.** 0.0
- **D.** 1.0

**Answer:** A
**Explanation:** (1 − 0.01)×1 = 0.99.

### Q63  ·  Difficult
**Question:** Sigmoid φ′ ≤ 0.25. After 8 saturated-ish layers, a crude product 0.25^8 is closest to:

- **A.** 8
- **B.** 0.25
- **C.** 1
- **D.** 1.5 × 10^−5

**Answer:** D
**Explanation:** 0.25^8 = (1/4)^8 = 1/65536 ≈ 1.53×10^−5 — vanishing.

### Q64  ·  Difficult
**Question:** Validation loss was best at epoch 8 then rose. You should:

- **A.** Reload epoch-8 weights (early stopping)
- **B.** Report training loss only
- **C.** Increase dropout at test time randomly per user
- **D.** Always keep epoch 200

**Answer:** A
**Explanation:** Early stopping as regulariser.

### Q65  ·  Difficult
**Question:** What is the most important distinction between **data augmentation** and **more real labelled data**?

- **A.** They are identical operations.
- **B.** Augmentation replaces the need for a task loss.
- **C.** New labels are illegal in semi-supervised learning.
- **D.** Augmentation manufactures related examples cheaply; new real labels add true coverage but cost annotation.

**Answer:** D
**Explanation:** Augmentation manufactures related examples cheaply; new real labels add true coverage but cost annotation.

### Q66  ·  Difficult
**Question:** What is the most important distinction between **dropout** and **weight decay**?

- **A.** Dropout is λ||w||^2.
- **B.** Weight decay randomly zeros units.
- **C.** Dropout is stochastic co-adaptation control / implicit ensemble; weight decay is a deterministic quadratic penalty on w.
- **D.** They are the same algorithm.

**Answer:** C
**Explanation:** Dropout is stochastic co-adaptation control / implicit ensemble; weight decay is a deterministic quadratic penalty on w.

### Q67  ·  Difficult
**Question:** What is the most important distinction between **ill-conditioned Hessian** and **spherical Hessian**?

- **A.** Ill-conditioning makes Newton unnecessary and SGD trivial.
- **B.** Spherical Hessians have κ=10^9.
- **C.** Ill-conditioned: long ravines, tiny steps needed in steep directions. Spherical: κ≈1, SGD directions match useful movement.
- **D.** κ does not affect first-order methods.

**Answer:** C
**Explanation:** Ill-conditioned: long ravines, tiny steps needed in steep directions. Spherical: κ≈1, SGD directions match useful movement.

### Q68  ·  Difficult
**Question:** What is the most important distinction between **local minimum** and **saddle**?

- **A.** Saddles cannot have ∇L=0.
- **B.** Local minima are more common than saddles in high-D according to the usual modern picture.
- **C.** The two are the same eigenvalue pattern.
- **D.** Minima: Hessian PSD. Saddles: mixed signs. High-D deep nets are dominated by saddles, not poor minima, as the typical critical points.

**Answer:** D
**Explanation:** Minima: Hessian PSD. Saddles: mixed signs. High-D deep nets are dominated by saddles, not poor minima, as the typical critical points.

### Q69  ·  Difficult
**Question:** Which statement about **Capacity / overfitting** is FALSE?

- **A.** Capacity / overfitting is correctly understood as: too much capacity + too little data/regularisation fits noise; training error << validation error.
- **B.** Overfitting is diagnosed when training and validation curves match perfectly.
- **C.** In this module, Capacity / overfitting is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Capacity / overfitting is that it is not the same as “Overfitting means training error is high and val error is low”.

**Answer:** B
**Explanation:** The false claim is: Overfitting is diagnosed when training and validation curves match perfectly.. Capacity / overfitting actually means: Too much capacity + too little data/regularisation fits noise; training error << validation error.

### Q70  ·  Difficult
**Question:** Which statement about **Dataset augmentation** is FALSE?

- **A.** In this module, Dataset augmentation is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Dataset augmentation is that it is not the same as “Duplicating the same image 1000 times with no change”.
- **C.** Dataset augmentation is correctly understood as: creating extra training examples by transforming data (crops, flips, noise) so the model is invariant to those transformations.
- **D.** Augmentation is illegal for images because it changes pixels.

**Answer:** D
**Explanation:** The false claim is: Augmentation is illegal for images because it changes pixels.. Dataset augmentation actually means: Creating extra training examples by transforming data (crops, flips, noise) so the model is invariant to those transformations.

### Q71  ·  Difficult
**Question:** Which statement about **Dropout (intuition)** is FALSE?

- **A.** Dropout (intuition) is correctly understood as: randomly zeroing units at train time (keep p≈0.5 hidden) prevents co-adaptation; at test time scale weights by p — an ensemble-like regulariser.
- **B.** Dropout at test time independently re-samples a new mask for every customer query as the standard inference rule.
- **C.** In this module, Dropout (intuition) is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Dropout (intuition) is that it is not the same as “Always dropping the loss function”.

**Answer:** B
**Explanation:** The false claim is: Dropout at test time independently re-samples a new mask for every customer query as the standard inference rule.. Dropout (intuition) actually means: Randomly zeroing units at train time (keep p≈0.5 hidden) prevents co-adaptation; at test time scale weights by p — an ensemble-like regulariser.

### Q72  ·  Difficult
**Question:** Which statement about **Ill-conditioning** is FALSE?

- **A.** Ill-conditioning is correctly understood as: a Hessian with a huge condition number: gradients point poorly, so first-order steps zigzag and progress is slow in some directions.
- **B.** In this module, Ill-conditioning is a core idea students must distinguish from nearby terms.
- **C.** Ill-conditioning means the training loss is exactly convex with κ=1.
- **D.** A useful way to remember Ill-conditioning is that it is not the same as “A perfectly spherical Hessian with κ=1”.

**Answer:** C
**Explanation:** The false claim is: Ill-conditioning means the training loss is exactly convex with κ=1.. Ill-conditioning actually means: A Hessian with a huge condition number: gradients point poorly, so first-order steps zigzag and progress is slow in some directions.

### Q73  ·  Difficult
**Question:** Which statement about **L2 parameter penalty / weight decay** is FALSE?

- **A.** A useful way to remember L2 parameter penalty / weight decay is that it is not the same as “Adding λ||w||_1 only, which is L1”.
- **B.** L2 regularisation encourages weights to grow without bound so the model can memorise.
- **C.** L2 parameter penalty / weight decay is correctly understood as: adding (λ/2)||w||^2 to the cost, which pulls weights toward 0 and, in SGD, subtracts λ w each step (weight decay).
- **D.** In this module, L2 parameter penalty / weight decay is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: L2 regularisation encourages weights to grow without bound so the model can memorise.. L2 parameter penalty / weight decay actually means: Adding (λ/2)||w||^2 to the cost, which pulls weights toward 0 and, in SGD, subtracts λ w each step (weight decay).

### Q74  ·  Difficult
**Question:** Which statement about **Parameter norm penalty** is FALSE?

- **A.** Parameter norm penalty is correctly understood as: adding Ω(θ) such as (1/2)||w||^2 to J, trading data fit against simplicity of parameters.
- **B.** A useful way to remember Parameter norm penalty is that it is not the same as “Forbidding all regularisers”.
- **C.** Norm penalties always regularise biases more strongly than weights as the only recommended setting.
- **D.** In this module, Parameter norm penalty is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Norm penalties always regularise biases more strongly than weights as the only recommended setting.. Parameter norm penalty actually means: Adding Ω(θ) such as (1/2)||w||^2 to J, trading data fit against simplicity of parameters.

### Q75  ·  Difficult
**Question:** Which statement about **Saddle point** is FALSE?

- **A.** In this module, Saddle point is a core idea students must distinguish from nearby terms.
- **B.** Saddle point is correctly understood as: a critical point with mixed Hessian eigenvalues (some +, some −); ubiquitous in high-dimensional nonconvex nets.
- **C.** A useful way to remember Saddle point is that it is not the same as “A local minimum with all eigenvalues positive”.
- **D.** Saddles cannot exist when the number of parameters exceeds 2.

**Answer:** D
**Explanation:** The false claim is: Saddles cannot exist when the number of parameters exceeds 2.. Saddle point actually means: A critical point with mixed Hessian eigenvalues (some +, some −); ubiquitous in high-dimensional nonconvex nets.

### Q76  ·  Difficult
**Question:** Which statement about **Underfitting** is FALSE?

- **A.** A useful way to remember Underfitting is that it is not the same as “Training error is ~0 and val error is huge”.
- **B.** In this module, Underfitting is a core idea students must distinguish from nearby terms.
- **C.** Underfitting is correctly understood as: the model is too constrained (or badly optimised) so even training error stays high.
- **D.** Underfitting means you should immediately add 100 million extra parameters with no other change.

**Answer:** D
**Explanation:** The false claim is: Underfitting means you should immediately add 100 million extra parameters with no other change.. Underfitting actually means: The model is too constrained (or badly optimised) so even training error stays high.

### Q77  ·  Difficult
**Question:** Which statement about **Vanishing gradient** is FALSE?

- **A.** Vanishing gradients make early layers learn faster than the output layer.
- **B.** In this module, Vanishing gradient is a core idea students must distinguish from nearby terms.
- **C.** Vanishing gradient is correctly understood as: repeated multiplication by Jacobians with spectral radius < 1 (e.g. sigmoid φ′≤0.25) drives early-layer δ → 0.
- **D.** A useful way to remember Vanishing gradient is that it is not the same as “Gradients that grow as 2^depth without bound”.

**Answer:** A
**Explanation:** The false claim is: Vanishing gradients make early layers learn faster than the output layer.. Vanishing gradient actually means: Repeated multiplication by Jacobians with spectral radius < 1 (e.g. sigmoid φ′≤0.25) drives early-layer δ → 0.

---

## Quick answer key

Q01–B | Q02–C | Q03–B | Q04–B | Q05–A | Q06–C | Q07–B | Q08–B | Q09–B | Q10–B | Q11–B | Q12–D | Q13–C | Q14–C | Q15–D | Q16–A | Q17–B | Q18–B | Q19–A | Q20–A | Q21–D | Q22–C | Q23–D | Q24–B | Q25–C | Q26–A | Q27–A | Q28–D | Q29–A | Q30–A | Q31–D | Q32–D | Q33–A | Q34–C | Q35–B | Q36–C | Q37–B | Q38–D | Q39–D | Q40–A | Q41–C | Q42–D | Q43–A | Q44–B | Q45–C | Q46–C | Q47–D | Q48–A | Q49–D | Q50–A | Q51–B | Q52–D | Q53–B | Q54–D | Q55–C | Q56–B | Q57–A | Q58–B | Q59–B | Q60–D | Q61–D | Q62–A | Q63–D | Q64–A | Q65–D | Q66–C | Q67–C | Q68–D | Q69–B | Q70–D | Q71–B | Q72–C | Q73–B | Q74–C | Q75–D | Q76–D | Q77–A
