# Quiz — Deep Learning — Module 2: MLP and Backpropagation

**Subject:** Deep Learning  
**Module:** Module 2 — MLP and Backpropagation  
**Questions:** 77  
**Mix:** 13 Easy · 36 Intermediate · 28 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A typical first guess for η in sigmoid backprop (order of magnitude) is:

- **A.** 3.7 exactly
- **B.** 10^6
- **C.** A small value such as 0.01–0.1, then tuned
- **D.** 0

**Answer:** C
**Explanation:** Heuristics: start modest.

### Q02  ·  Easy
**Question:** Back-propagation computes:

- **A.** Dropout masks only
- **B.** Gradients of the loss wrt weights by the chain rule
- **C.** The Bayes posterior for any Gaussian
- **D.** A linearly separating hyperplane for XOR in one step

**Answer:** B
**Explanation:** Reverse-mode differentiation on the MLP.

### Q03  ·  Easy
**Question:** One epoch means:

- **A.** One dropout trial
- **B.** One pass through the training set
- **C.** One scalar weight
- **D.** One convolutional stride

**Answer:** B
**Explanation:** Standard definition.

### Q04  ·  Easy
**Question:** Which option best describes **Delta / error signal**?

- **A.** The count of hidden units.
- **B.** δ = ∂E/∂v at a neuron, used to form weight gradients δ · (incoming activation).
- **C.** The learning rate η.
- **D.** The momentum α.

**Answer:** B
**Explanation:** Delta / error signal: δ = ∂E/∂v at a neuron, used to form weight gradients δ · (incoming activation).

### Q05  ·  Easy
**Question:** Which option best describes **Heuristic: sequential vs batch**?

- **A.** On-line cannot train XOR.
- **B.** Haykin’s heuristics: on-line updates introduce noise that can help escape some poor basins; full batch is a true gradient but can be expensive and get stuck.
- **C.** Heuristics forbid momentum.
- **D.** Batch is always noisier than on-line.

**Answer:** B
**Explanation:** Heuristic: sequential vs batch: Haykin’s heuristics: on-line updates introduce noise that can help escape some poor basins; full batch is a true gradient but can be expensive and get stuck.

### Q06  ·  Easy
**Question:** Which option best describes **Momentum**?

- **A.** L2 weight decay’s λ.
- **B.** An extra term that accumulates past gradients (velocity) so updates continue along consistent directions and damp oscillations.
- **C.** Setting η = 0.
- **D.** The perceptron threshold.

**Answer:** B
**Explanation:** Momentum: An extra term that accumulates past gradients (velocity) so updates continue along consistent directions and damp oscillations.

### Q07  ·  Easy
**Question:** Which option best describes **Multilayer perceptron (MLP)**?

- **A.** A single Rosenblatt perceptron with no hidden units.
- **B.** A feedforward net with one or more hidden layers of nonlinear units, typically trained by backpropagation.
- **C.** A recurrent net unrolled in time as the definition of MLP.
- **D.** A purely linear stack of matrix multiplies with no φ.

**Answer:** B
**Explanation:** Multilayer perceptron (MLP): A feedforward net with one or more hidden layers of nonlinear units, typically trained by backpropagation.

### Q08  ·  Easy
**Question:** Which option best describes **On-line / SGD learning**?

- **A.** Updating parameters after each example (or a minibatch), using a noisy instantaneous gradient.
- **B.** Closed-form linear least squares.
- **C.** Newton’s method with the full Hessian only.
- **D.** Waiting for the exact full-batch gradient every year.

**Answer:** A
**Explanation:** On-line / SGD learning: Updating parameters after each example (or a minibatch), using a noisy instantaneous gradient.

### Q09  ·  Easy
**Question:** Which option best describes **Universal approximation (informal)**?

- **A.** A linear perceptron already approximates every map.
- **B.** You always need at least 50 layers.
- **C.** A single hidden layer of enough sigmoidal units can approximate a wide class of continuous maps on compact sets; XOR is the small witness.
- **D.** Approximation requires convolution.

**Answer:** C
**Explanation:** Universal approximation (informal): A single hidden layer of enough sigmoidal units can approximate a wide class of continuous maps on compact sets; XOR is the small witness.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **applying a simple heuristic set**?

- **A.** Saturate sigmoids on purpose with |w|=100 → η=50 → never shuffle
- **B.** Use hard limiters so φ′=0 → train longer
- **C.** Normalise inputs → small random weights → choose modest η → optional momentum 0.9 → monitor validation → decay η if loss plateaus
- **D.** Disable the backward pass

**Answer:** C
**Explanation:** Correct sequence for applying a simple heuristic set: Normalise inputs → small random weights → choose modest η → optional momentum 0.9 → monitor validation → decay η if loss plateaus

### Q11  ·  Easy
**Question:** Which sequence correctly describes **backprop training step**?

- **A.** Update w first → then guess the output → skip deltas
- **B.** Forward pass to loss → backward pass of deltas via chain rule → update w ← w − η ∂E/∂w (plus momentum if used)
- **C.** Apply perceptron mistake rule on hidden steps that are not differentiable
- **D.** Randomise all w every epoch and call it backprop

**Answer:** B
**Explanation:** Correct sequence for backprop training step: Forward pass to loss → backward pass of deltas via chain rule → update w ← w − η ∂E/∂w (plus momentum if used)

### Q12  ·  Easy
**Question:** Which sequence correctly describes **on-line epoch**?

- **A.** Sum all gradients first, then a single update, by definition of on-line
- **B.** Update only after 1000 epochs of no compute
- **C.** Backprop from the input toward the loss
- **D.** Shuffle examples → for each x: forward, backward, immediate update → next x until the set is done

**Answer:** D
**Explanation:** Correct sequence for on-line epoch: Shuffle examples → for each x: forward, backward, immediate update → next x until the set is done

### Q13  ·  Easy
**Question:** XOR is used in this module to show that:

- **A.** A single perceptron converges on XOR
- **B.** Hidden nonlinear units plus backprop can learn a linearly nonseparable map
- **C.** η must be 3.7
- **D.** Batch learning is impossible

**Answer:** B
**Explanation:** Historical MLP witness.

### Q14  ·  Intermediate
**Question:** A student differentiates E wrt w by hand using dE/dφ · dφ/dv · dv/dw. They are using:

- **A.** The convergence theorem
- **B.** Dropout
- **C.** The chain rule (Haykin’s ‘backprop and differentiation’)
- **D.** Finite differences only

**Answer:** C
**Explanation:** Differentiation view of backprop.

### Q15  ·  Intermediate
**Question:** Haykin’s ‘backprop and differentiation’ emphasises that backprop is:

- **A.** Structured chain-rule differentiation of a composed map
- **B.** The same as the perceptron mistake rule
- **C.** Finite-difference probing of one weight per day
- **D.** A biological fact about synapses firing backwards

**Answer:** A
**Explanation:** Calculus, not biology.

### Q16  ·  Intermediate
**Question:** Hidden units all learned the same function. You probably:

- **A.** Used small random init
- **B.** Used XOR labels as inputs
- **C.** Used too much noise in SGD
- **D.** Initialised all weights to the same value (e.g. 0)

**Answer:** D
**Explanation:** Symmetry breaking.

### Q17  ·  Intermediate
**Question:** Momentum 0.9 is used mainly to:

- **A.** Smooth and accelerate along consistent gradient directions
- **B.** Replace the need for hidden units
- **C.** Zero all biases
- **D.** Make XOR linearly separable

**Answer:** A
**Explanation:** Velocity term.

### Q18  ·  Intermediate
**Question:** On-line learning differs from batch learning because it:

- **A.** Requires a non-differentiable step φ
- **B.** Never uses a learning rate
- **C.** Cannot use momentum
- **D.** Updates from individual examples (noisy gradient) rather than the full-set gradient

**Answer:** D
**Explanation:** Haykin batch vs on-line.

### Q19  ·  Intermediate
**Question:** The local gradient of a logistic sigmoid is largest when the output is:

- **A.** Exactly 2
- **B.** Near 0.5 (φ′=0.25)
- **C.** Undefined
- **D.** Near 0 or 1

**Answer:** B
**Explanation:** σ(1−σ) peaks at 1/4.

### Q20  ·  Intermediate
**Question:** Training loss chatters in a narrow valley. A Haykin heuristic to try is:

- **A.** Set φ′=0
- **B.** Switch to a hard limiter so backprop is exact
- **C.** Remove all hidden units
- **D.** Add momentum (and possibly lower η)

**Answer:** D
**Explanation:** Momentum along ravines.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **MSE + sigmoid output** and **cross-entropy + softmax**?

- **A.** They produce identical gradients for every net.
- **B.** Softmax cannot be differentiated.
- **C.** MSE is always better for 1000-way ImageNet.
- **D.** MSE can saturate (tiny φ′) and is a poor match to classification; CE+softmax gives cleaner ∂E/∂v = y−t.

**Answer:** D
**Explanation:** MSE can saturate (tiny φ′) and is a poor match to classification; CE+softmax gives cleaner ∂E/∂v = y−t.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **batch gradient** and **on-line / SGD**?

- **A.** Batch updates after every example.
- **B.** They always take the same path in weight space.
- **C.** Batch uses the true (or epoch) gradient; on-line uses a noisy per-example (or minibatch) gradient and updates more often.
- **D.** On-line waits for the whole set.

**Answer:** C
**Explanation:** Batch uses the true (or epoch) gradient; on-line uses a noisy per-example (or minibatch) gradient and updates more often.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **momentum** and **plain SGD**?

- **A.** Plain SGD already includes a velocity buffer.
- **B.** They differ only in the name of η.
- **C.** Momentum remembers recent gradients, speeding ravines and reducing chatter; plain SGD uses only the current gradient.
- **D.** Momentum is L2 decay.

**Answer:** C
**Explanation:** Momentum remembers recent gradients, speeding ravines and reducing chatter; plain SGD uses only the current gradient.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **perceptron rule** and **backprop on an MLP**?

- **A.** They are identical for XOR.
- **B.** Perceptron: hard threshold, mistake-only, no hidden credit assignment. Backprop: smooth φ, every weight gets a gradient.
- **C.** Backprop cannot train hidden units.
- **D.** Perceptron uses the chain rule through 10 layers.

**Answer:** B
**Explanation:** Perceptron: hard threshold, mistake-only, no hidden credit assignment. Backprop: smooth φ, every weight gets a gradient.

### Q25  ·  Intermediate
**Question:** Which option best describes **Back-propagation**?

- **A.** Finite differences on one weight at a time as the only method.
- **B.** An application of the chain rule that computes ∂E/∂w for every weight by propagating deltas from the output layer backward.
- **C.** A random search over weights.
- **D.** The perceptron mistake rule on XOR.

**Answer:** B
**Explanation:** Back-propagation: An application of the chain rule that computes ∂E/∂w for every weight by propagating deltas from the output layer backward.

### Q26  ·  Intermediate
**Question:** Which option best describes **Batch learning**?

- **A.** Dropout’s coin flip.
- **B.** Weight updates after accumulating the gradient (or error) over the whole training set (one epoch batch).
- **C.** Convolution with stride 2.
- **D.** Updating after every single example with no accumulation.

**Answer:** B
**Explanation:** Batch learning: Weight updates after accumulating the gradient (or error) over the whole training set (one epoch batch).

### Q27  ·  Intermediate
**Question:** Which option best describes **Chain rule**?

- **A.** The perceptron mistake count.
- **B.** Finite differences only.
- **C.** A rule that forbids differentiating compositions.
- **D.** dE/dw = (dE/dy)(dy/dv)(dv/dw), the differentiation backbone of backprop (Haykin: backprop and differentiation).

**Answer:** D
**Explanation:** Chain rule: dE/dw = (dE/dy)(dy/dv)(dv/dw), the differentiation backbone of backprop (Haykin: backprop and differentiation).

### Q28  ·  Intermediate
**Question:** Which option best describes **Epoch**?

- **A.** One pass over the entire training set (in batch, one update; in on-line, one update per example).
- **B.** A convolutional kernel.
- **C.** The momentum buffer.
- **D.** A single weight scalar.

**Answer:** A
**Explanation:** Epoch: One pass over the entire training set (in batch, one update; in on-line, one update per example).

### Q29  ·  Intermediate
**Question:** Which option best describes **Forward pass**?

- **A.** Compute activations layer by layer from the input to the output (and loss) using current weights.
- **B.** Shuffle the Hessian.
- **C.** Update weights before computing any output.
- **D.** Propagate deltas from input to output.

**Answer:** A
**Explanation:** Forward pass: Compute activations layer by layer from the input to the output (and loss) using current weights.

### Q30  ·  Intermediate
**Question:** Which option best describes **Hidden layer**?

- **A.** The softmax labels.
- **B.** The input pixels themselves.
- **C.** A pooling layer in all MLPs.
- **D.** An intermediate layer whose outputs are features, not the final labels, enabling nonlinearly separable maps such as XOR.

**Answer:** D
**Explanation:** Hidden layer: An intermediate layer whose outputs are features, not the final labels, enabling nonlinearly separable maps such as XOR.

### Q31  ·  Intermediate
**Question:** Which option best describes **Learning rate η**?

- **A.** A positive scalar that scales the weight step −η ∂E/∂w; too large diverges, too small crawls.
- **B.** The batch size.
- **C.** The momentum coefficient, always 0.9.
- **D.** The number of hidden neurons.

**Answer:** A
**Explanation:** Learning rate η: A positive scalar that scales the weight step −η ∂E/∂w; too large diverges, too small crawls.

### Q32  ·  Intermediate
**Question:** Which option best describes **Local gradient at a sigmoid unit**?

- **A.** δ ∝ (t − y) y (1 − y) at an output sigmoid with MSE, because φ′ = y(1−y).
- **B.** δ = η only.
- **C.** δ = 0.0591.
- **D.** δ = 1 always.

**Answer:** A
**Explanation:** Local gradient at a sigmoid unit: δ ∝ (t − y) y (1 − y) at an output sigmoid with MSE, because φ′ = y(1−y).

### Q33  ·  Intermediate
**Question:** Which option best describes **Output layer choice**?

- **A.** All MLPs must use signum outputs so backprop works.
- **B.** Softmax is required for XOR with one output bit.
- **C.** Linear outputs are illegal for regression.
- **D.** Linear outputs for regression; sigmoid for independent bits; softmax+cross-entropy for exclusive classes (modern practice alongside Haykin’s MSE/sigmoid treatment).

**Answer:** D
**Explanation:** Output layer choice: Linear outputs for regression; sigmoid for independent bits; softmax+cross-entropy for exclusive classes (modern practice alongside Haykin’s MSE/sigmoid treatment).

### Q34  ·  Intermediate
**Question:** Which option best describes **Stopping / early hints**?

- **A.** Always train until training error is exactly 0, ignoring validation.
- **B.** Stop after one example.
- **C.** Monitor validation error; stop or reduce η when it rises — a practical backprop heuristic against overtraining.
- **D.** Use CPR as the stopping criterion.

**Answer:** C
**Explanation:** Stopping / early hints: Monitor validation error; stop or reduce η when it rises — a practical backprop heuristic against overtraining.

### Q35  ·  Intermediate
**Question:** Which option best describes **Weight initialisation**?

- **A.** Choosing small random w so neurons start in the linear region of sigmoids and break symmetry; all-zero init fails for hidden units.
- **B.** Copying ImageNet weights into XOR.
- **C.** Setting every weight to 0 in a multilayer sigmoid net as best practice.
- **D.** Setting every weight to 10^6 so sigmoids saturate on purpose.

**Answer:** A
**Explanation:** Weight initialisation: Choosing small random w so neurons start in the linear region of sigmoids and break symmetry; all-zero init fails for hidden units.

### Q36  ·  Intermediate
**Question:** Which option best describes **XOR with an MLP**?

- **A.** XOR remains impossible for any finite MLP.
- **B.** XOR is linearly separable so hidden units are unused.
- **C.** A 2–2–1 (or similar) net with nonlinear hidden units can draw the two diagonal XOR classes; a single layer cannot.
- **D.** XOR needs a 152-layer ResNet as the minimum.

**Answer:** C
**Explanation:** XOR with an MLP: A 2–2–1 (or similar) net with nonlinear hidden units can draw the two diagonal XOR classes; a single layer cannot.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **XOR MLP solution outline**?

- **A.** Use one perceptron and wait for the convergence theorem
- **B.** Set all weights to 0 and stop
- **C.** Convolve the 2-D points with a 5×5 ImageNet kernel
- **D.** Place two hidden threshold/sigmoid units that detect the two OR-like patterns → combine them at the output → train by backprop from the XOR targets

**Answer:** D
**Explanation:** Correct sequence for XOR MLP solution outline: Place two hidden threshold/sigmoid units that detect the two OR-like patterns → combine them at the output → train by backprop from the XOR targets

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **computing a hidden delta**?

- **A.** Set δ_j = η always
- **B.** Use CPR = 87.6 W/(DAT)
- **C.** Copy the output label into every hidden unit
- **D.** Receive Σ_k w_kj δ_k from the layer above → multiply by φ′(v_j) → use δ_j x_i as ∂E/∂w_ji

**Answer:** D
**Explanation:** Correct sequence for computing a hidden delta: Receive Σ_k w_kj δ_k from the layer above → multiply by φ′(v_j) → use δ_j x_i as ∂E/∂w_ji

### Q39  ·  Intermediate
**Question:** Which statement about **Back-propagation** is FALSE?

- **A.** In this module, Back-propagation is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Back-propagation is that it is not the same as “A random search over weights”.
- **C.** Back-propagation is correctly understood as: an application of the chain rule that computes ∂E/∂w for every weight by propagating deltas from the output layer backward.
- **D.** Backprop requires that every activation be a non-differentiable step function.

**Answer:** D
**Explanation:** The false claim is: Backprop requires that every activation be a non-differentiable step function.. Back-propagation actually means: An application of the chain rule that computes ∂E/∂w for every weight by propagating deltas from the output layer backward.

### Q40  ·  Intermediate
**Question:** Which statement about **Batch learning** is FALSE?

- **A.** Batch learning means using a batch size of 1 only.
- **B.** Batch learning is correctly understood as: weight updates after accumulating the gradient (or error) over the whole training set (one epoch batch).
- **C.** A useful way to remember Batch learning is that it is not the same as “Updating after every single example with no accumulation”.
- **D.** In this module, Batch learning is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Batch learning means using a batch size of 1 only.. Batch learning actually means: Weight updates after accumulating the gradient (or error) over the whole training set (one epoch batch).

### Q41  ·  Intermediate
**Question:** Which statement about **Delta / error signal** is FALSE?

- **A.** Delta in backprop is the dropout mask and is never a derivative.
- **B.** A useful way to remember Delta / error signal is that it is not the same as “The learning rate η”.
- **C.** In this module, Delta / error signal is a core idea students must distinguish from nearby terms.
- **D.** Delta / error signal is correctly understood as: δ = ∂E/∂v at a neuron, used to form weight gradients δ · (incoming activation).

**Answer:** A
**Explanation:** The false claim is: Delta in backprop is the dropout mask and is never a derivative.. Delta / error signal actually means: δ = ∂E/∂v at a neuron, used to form weight gradients δ · (incoming activation).

### Q42  ·  Intermediate
**Question:** Which statement about **Epoch** is FALSE?

- **A.** An epoch is defined as 50 gradient steps regardless of dataset size.
- **B.** A useful way to remember Epoch is that it is not the same as “A single weight scalar”.
- **C.** Epoch is correctly understood as: one pass over the entire training set (in batch, one update; in on-line, one update per example).
- **D.** In this module, Epoch is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: An epoch is defined as 50 gradient steps regardless of dataset size.. Epoch actually means: One pass over the entire training set (in batch, one update; in on-line, one update per example).

### Q43  ·  Intermediate
**Question:** Which statement about **Learning rate η** is FALSE?

- **A.** Learning rate η is correctly understood as: a positive scalar that scales the weight step −η ∂E/∂w; too large diverges, too small crawls.
- **B.** A useful way to remember Learning rate η is that it is not the same as “The momentum coefficient, always 0.9”.
- **C.** The optimal η is always 3.7 because that is a Li-ion voltage.
- **D.** In this module, Learning rate η is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: The optimal η is always 3.7 because that is a Li-ion voltage.. Learning rate η actually means: A positive scalar that scales the weight step −η ∂E/∂w; too large diverges, too small crawls.

### Q44  ·  Intermediate
**Question:** Which statement about **Multilayer perceptron (MLP)** is FALSE?

- **A.** A useful way to remember Multilayer perceptron (MLP) is that it is not the same as “A single Rosenblatt perceptron with no hidden units”.
- **B.** In this module, Multilayer perceptron (MLP) is a core idea students must distinguish from nearby terms.
- **C.** An MLP is a convolutional residual network with skip connections by definition.
- **D.** Multilayer perceptron (MLP) is correctly understood as: a feedforward net with one or more hidden layers of nonlinear units, typically trained by backpropagation.

**Answer:** C
**Explanation:** The false claim is: An MLP is a convolutional residual network with skip connections by definition.. Multilayer perceptron (MLP) actually means: A feedforward net with one or more hidden layers of nonlinear units, typically trained by backpropagation.

### Q45  ·  Intermediate
**Question:** Which statement about **Output layer choice** is FALSE?

- **A.** A useful way to remember Output layer choice is that it is not the same as “Softmax is required for XOR with one output bit”.
- **B.** Differentiable training requires a hard ±1 output with derivative 0 almost everywhere.
- **C.** In this module, Output layer choice is a core idea students must distinguish from nearby terms.
- **D.** Output layer choice is correctly understood as: linear outputs for regression; sigmoid for independent bits; softmax+cross-entropy for exclusive classes (modern practice alongside Haykin’s MSE/sigmoid treatment).

**Answer:** B
**Explanation:** The false claim is: Differentiable training requires a hard ±1 output with derivative 0 almost everywhere.. Output layer choice actually means: Linear outputs for regression; sigmoid for independent bits; softmax+cross-entropy for exclusive classes (modern practice alongside Haykin’s MSE/sigmoid treatment).

### Q46  ·  Intermediate
**Question:** Which statement about **Universal approximation (informal)** is FALSE?

- **A.** In this module, Universal approximation (informal) is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Universal approximation (informal) is that it is not the same as “A linear perceptron already approximates every map”.
- **C.** MLPs cannot approximate XOR even with unlimited hidden units.
- **D.** Universal approximation (informal) is correctly understood as: a single hidden layer of enough sigmoidal units can approximate a wide class of continuous maps on compact sets; XOR is the small witness.

**Answer:** C
**Explanation:** The false claim is: MLPs cannot approximate XOR even with unlimited hidden units.. Universal approximation (informal) actually means: A single hidden layer of enough sigmoidal units can approximate a wide class of continuous maps on compact sets; XOR is the small witness.

### Q47  ·  Intermediate
**Question:** Which statement about **Weight initialisation** is FALSE?

- **A.** A useful way to remember Weight initialisation is that it is not the same as “Setting every weight to 0 in a multilayer sigmoid net as best practice”.
- **B.** In this module, Weight initialisation is a core idea students must distinguish from nearby terms.
- **C.** Weight initialisation is correctly understood as: choosing small random w so neurons start in the linear region of sigmoids and break symmetry; all-zero init fails for hidden units.
- **D.** Initialising all hidden weights to identical values preserves a useful symmetry that backprop needs.

**Answer:** D
**Explanation:** The false claim is: Initialising all hidden weights to identical values preserves a useful symmetry that backprop needs.. Weight initialisation actually means: Choosing small random w so neurons start in the linear region of sigmoids and break symmetry; all-zero init fails for hidden units.

### Q48  ·  Intermediate
**Question:** XOR training with one hidden layer of two sigmoids eventually drops error. This supports:

- **A.** Hidden nonlinear features + backprop credit assignment
- **B.** That XOR is linear
- **C.** That η must be 0
- **D.** The perceptron convergence theorem for XOR

**Answer:** A
**Explanation:** Classic MLP demonstration.

### Q49  ·  Intermediate
**Question:** You need ∂E/∂w of a hidden weight. Backprop does this by:

- **A.** Using only the perceptron rule
- **B.** δ_hidden = φ′(v) Σ_k w_k δ_k then ∂E/∂w = δ_hidden · x
- **C.** Ignoring the chain rule
- **D.** Randomising that weight

**Answer:** B
**Explanation:** Backward delta recurrence.

### Q50  ·  Difficult
**Question:** A 2–2–1 MLP (biases included) has how many scalar weights?

- **A.** 12
- **B.** 4
- **C.** 9
- **D.** 6

**Answer:** C
**Explanation:** 2×2 + 2 hidden biases + 2×1 + 1 output bias = 4+2+2+1=9.

### Q51  ·  Difficult
**Question:** A hidden sigmoid has y=0.5. Then φ′(v)=y(1−y) is:

- **A.** 0.0
- **B.** 1.0
- **C.** 0.5
- **D.** 0.25

**Answer:** D
**Explanation:** 0.5×0.5=0.25, the maximum slope.

### Q52  ·  Difficult
**Question:** A lab compares one update per epoch vs one per example on the same XOR set. They are comparing:

- **A.** LSTM vs GRU
- **B.** Dropout vs L2
- **C.** Pooling vs convolution
- **D.** Batch vs on-line learning

**Answer:** D
**Explanation:** Haykin batch vs on-line.

### Q53  ·  Difficult
**Question:** A weight update Δw = −η δ x with η=0.1, δ=0.4, x=2. Δw is:

- **A.** −0.8
- **B.** −0.08
- **C.** 0.08
- **D.** 0.4

**Answer:** B
**Explanation:** −0.1×0.4×2 = −0.08.

### Q54  ·  Difficult
**Question:** All-zero weight init in a multilayer net is harmful because:

- **A.** It implements Bayes’ rule
- **B.** It is required by the perceptron convergence theorem
- **C.** It maximises φ′ at every unit immediately
- **D.** Hidden units remain symmetric and compute identical functions under backprop

**Answer:** D
**Explanation:** Symmetry breaking.

### Q55  ·  Difficult
**Question:** Chain rule: E=(y−t)^2/2, y=φ(w x), φ′=0.2, y−t=0.5, x=1. ∂E/∂w is:

- **A.** 0.50
- **B.** 0.10
- **C.** 1.00
- **D.** 0.20

**Answer:** B
**Explanation:** ∂E/∂y=0.5, times 0.2 times 1 = 0.10.

### Q56  ·  Difficult
**Question:** Full batch of N=200 examples, on-line SGD does how many weight updates per epoch?

- **A.** 200
- **B.** 199
- **C.** 0
- **D.** 1

**Answer:** A
**Explanation:** One update per example in classical on-line mode.

### Q57  ·  Difficult
**Question:** If y=0.99 at a sigmoid, φ′ is:

- **A.** 0.0099 ≈ 0.01
- **B.** 1.0
- **C.** 0.99
- **D.** 0.25

**Answer:** A
**Explanation:** 0.99×0.01=0.0099; vanishing local gradient.

### Q58  ·  Difficult
**Question:** Loss explodes after you set η=5 on a sigmoid net. Likely cause:

- **A.** Batch size of 200 is illegal
- **B.** Learning rate far too large
- **C.** Momentum too small always
- **D.** Chain rule does not hold

**Answer:** B
**Explanation:** Heuristic: tune η.

### Q59  ·  Difficult
**Question:** Minibatch size 32 is a compromise because:

- **A.** It noisily approximates the batch gradient but vectorises well
- **B.** It replaces the need for φ′
- **C.** It is the XOR dataset size
- **D.** It is theoretically identical to N=1 and N=all always

**Answer:** A
**Explanation:** Practice between Haykin’s two poles.

### Q60  ·  Difficult
**Question:** Momentum: v_t = 0.9 v_{t−1} + 0.1 g_t with v_{t−1}=1, g_t=0. Velocity v_t is:

- **A.** 0.1
- **B.** 0.0
- **C.** 1.0
- **D.** 0.9

**Answer:** D
**Explanation:** 0.9×1 + 0.1×0 = 0.9; the velocity keeps going.

### Q61  ·  Difficult
**Question:** Output sigmoids sit at 0.999 while targets are 1, and learning stalls. Diagnosis:

- **A.** Need more perceptron mistakes
- **B.** Vanishing φ′ = y(1−y) at saturation; saturated MSE/sigmoid
- **C.** η is optimally large
- **D.** Chain rule failed

**Answer:** B
**Explanation:** Local gradient collapse.

### Q62  ·  Difficult
**Question:** The same 200 examples in true batch mode give how many updates per epoch?

- **A.** 1
- **B.** 400
- **C.** 10
- **D.** 200

**Answer:** A
**Explanation:** Accumulate then one step.

### Q63  ·  Difficult
**Question:** Validation error starts rising while training error still falls. A practical heuristic is:

- **A.** Increase hidden units without limit
- **B.** Switch every φ to a step function
- **C.** Train until train error is 0 at all costs
- **D.** Stop / regularise / reduce η (early-stopping flavour)

**Answer:** D
**Explanation:** Overtraining signal.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **XOR linear model** and **XOR MLP**?

- **A.** Linear models solve XOR in R^2.
- **B.** MLPs cannot represent XOR.
- **C.** Linear: 0 hidden, impossible. MLP: hidden nonlinear features, possible, trained by backprop.
- **D.** Both have the same decision regions.

**Answer:** C
**Explanation:** Linear: 0 hidden, impossible. MLP: hidden nonlinear features, possible, trained by backprop.

### Q65  ·  Difficult
**Question:** What is the most important distinction between **all-zero init** and **small random init**?

- **A.** Random init always saturates sigmoids if |w|≪1.
- **B.** Zero init is recommended for tanh MLPs.
- **C.** Zero init keeps hidden units symmetric so they learn the same features; small random breaks symmetry.
- **D.** They are equivalent after one epoch.

**Answer:** C
**Explanation:** Zero init keeps hidden units symmetric so they learn the same features; small random breaks symmetry.

### Q66  ·  Difficult
**Question:** What is the most important distinction between **forward pass** and **backward pass**?

- **A.** They are the same loop.
- **B.** Backward runs before any forward pass by definition.
- **C.** Forward updates the weights.
- **D.** Forward computes activations and loss; backward computes δs and ∂E/∂w via the chain rule.

**Answer:** D
**Explanation:** Forward computes activations and loss; backward computes δs and ∂E/∂w via the chain rule.

### Q67  ·  Difficult
**Question:** What is the most important distinction between **too-large η** and **too-small η**?

- **A.** Small η always diverges.
- **B.** Large η always finds the global min faster with no risk.
- **C.** η does not affect the step.
- **D.** Large η: overshoot/divergence/oscillation. Small η: slow training, may freeze in plateaus.

**Answer:** D
**Explanation:** Large η: overshoot/divergence/oscillation. Small η: slow training, may freeze in plateaus.

### Q68  ·  Difficult
**Question:** Which statement about **Chain rule** is FALSE?

- **A.** Chain rule is correctly understood as: dE/dw = (dE/dy)(dy/dv)(dv/dw), the differentiation backbone of backprop (Haykin: backprop and differentiation).
- **B.** The chain rule does not apply to nested activations in an MLP.
- **C.** In this module, Chain rule is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Chain rule is that it is not the same as “A rule that forbids differentiating compositions”.

**Answer:** B
**Explanation:** The false claim is: The chain rule does not apply to nested activations in an MLP.. Chain rule actually means: dE/dw = (dE/dy)(dy/dv)(dv/dw), the differentiation backbone of backprop (Haykin: backprop and differentiation).

### Q69  ·  Difficult
**Question:** Which statement about **Forward pass** is FALSE?

- **A.** Forward pass is correctly understood as: compute activations layer by layer from the input to the output (and loss) using current weights.
- **B.** In this module, Forward pass is a core idea students must distinguish from nearby terms.
- **C.** The forward pass starts at the output layer and ends at the pixels.
- **D.** A useful way to remember Forward pass is that it is not the same as “Update weights before computing any output”.

**Answer:** C
**Explanation:** The false claim is: The forward pass starts at the output layer and ends at the pixels.. Forward pass actually means: Compute activations layer by layer from the input to the output (and loss) using current weights.

### Q70  ·  Difficult
**Question:** Which statement about **Heuristic: sequential vs batch** is FALSE?

- **A.** Heuristic: sequential vs batch is correctly understood as: haykin’s heuristics: on-line updates introduce noise that can help escape some poor basins; full batch is a true gradient but can be expensive and get stuck.
- **B.** A useful way to remember Heuristic: sequential vs batch is that it is not the same as “Batch is always noisier than on-line”.
- **C.** Haykin claims batch learning and on-line learning are mathematically identical at batch size 1 million only.
- **D.** In this module, Heuristic: sequential vs batch is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Haykin claims batch learning and on-line learning are mathematically identical at batch size 1 million only.. Heuristic: sequential vs batch actually means: Haykin’s heuristics: on-line updates introduce noise that can help escape some poor basins; full batch is a true gradient but can be expensive and get stuck.

### Q71  ·  Difficult
**Question:** Which statement about **Hidden layer** is FALSE?

- **A.** A useful way to remember Hidden layer is that it is not the same as “The input pixels themselves”.
- **B.** Hidden layers are illegal in Haykin’s MLP chapter.
- **C.** Hidden layer is correctly understood as: an intermediate layer whose outputs are features, not the final labels, enabling nonlinearly separable maps such as XOR.
- **D.** In this module, Hidden layer is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Hidden layers are illegal in Haykin’s MLP chapter.. Hidden layer actually means: An intermediate layer whose outputs are features, not the final labels, enabling nonlinearly separable maps such as XOR.

### Q72  ·  Difficult
**Question:** Which statement about **Local gradient at a sigmoid unit** is FALSE?

- **A.** Local gradient at a sigmoid unit is correctly understood as: δ ∝ (t − y) y (1 − y) at an output sigmoid with MSE, because φ′ = y(1−y).
- **B.** Sigmoid φ′ is 1 at saturation, so deltas grow as |v| → ∞.
- **C.** In this module, Local gradient at a sigmoid unit is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Local gradient at a sigmoid unit is that it is not the same as “δ = 1 always”.

**Answer:** B
**Explanation:** The false claim is: Sigmoid φ′ is 1 at saturation, so deltas grow as |v| → ∞.. Local gradient at a sigmoid unit actually means: δ ∝ (t − y) y (1 − y) at an output sigmoid with MSE, because φ′ = y(1−y).

### Q73  ·  Difficult
**Question:** Which statement about **Momentum** is FALSE?

- **A.** Momentum is the same as dropout keep-probability.
- **B.** In this module, Momentum is a core idea students must distinguish from nearby terms.
- **C.** Momentum is correctly understood as: an extra term that accumulates past gradients (velocity) so updates continue along consistent directions and damp oscillations.
- **D.** A useful way to remember Momentum is that it is not the same as “Setting η = 0”.

**Answer:** A
**Explanation:** The false claim is: Momentum is the same as dropout keep-probability.. Momentum actually means: An extra term that accumulates past gradients (velocity) so updates continue along consistent directions and damp oscillations.

### Q74  ·  Difficult
**Question:** Which statement about **On-line / SGD learning** is FALSE?

- **A.** In this module, On-line / SGD learning is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember On-line / SGD learning is that it is not the same as “Waiting for the exact full-batch gradient every year”.
- **C.** On-line / SGD learning is correctly understood as: updating parameters after each example (or a minibatch), using a noisy instantaneous gradient.
- **D.** On-line learning forbids any use of a learning rate.

**Answer:** D
**Explanation:** The false claim is: On-line learning forbids any use of a learning rate.. On-line / SGD learning actually means: Updating parameters after each example (or a minibatch), using a noisy instantaneous gradient.

### Q75  ·  Difficult
**Question:** Which statement about **Stopping / early hints** is FALSE?

- **A.** A useful way to remember Stopping / early hints is that it is not the same as “Always train until training error is exactly 0, ignoring validation”.
- **B.** In this module, Stopping / early hints is a core idea students must distinguish from nearby terms.
- **C.** Stopping / early hints is correctly understood as: monitor validation error; stop or reduce η when it rises — a practical backprop heuristic against overtraining.
- **D.** Validation error is illegal to look at during backprop.

**Answer:** D
**Explanation:** The false claim is: Validation error is illegal to look at during backprop.. Stopping / early hints actually means: Monitor validation error; stop or reduce η when it rises — a practical backprop heuristic against overtraining.

### Q76  ·  Difficult
**Question:** Which statement about **XOR with an MLP** is FALSE?

- **A.** In this module, XOR with an MLP is a core idea students must distinguish from nearby terms.
- **B.** XOR with an MLP is correctly understood as: a 2–2–1 (or similar) net with nonlinear hidden units can draw the two diagonal XOR classes; a single layer cannot.
- **C.** A useful way to remember XOR with an MLP is that it is not the same as “XOR remains impossible for any finite MLP”.
- **D.** Backprop cannot train XOR because the error surface is convex with no minimum.

**Answer:** D
**Explanation:** The false claim is: Backprop cannot train XOR because the error surface is convex with no minimum.. XOR with an MLP actually means: A 2–2–1 (or similar) net with nonlinear hidden units can draw the two diagonal XOR classes; a single layer cannot.

### Q77  ·  Difficult
**Question:** Why do hidden-layer weights receive a usable gradient in backprop?

- **A.** The perceptron theorem extends to every DAG
- **B.** δ_j = φ′(v_j) Σ_k w_kj δ_k assigns blame through differentiable layers
- **C.** Random search replaces the chain rule
- **D.** Hidden units use a hard limiter whose derivative is 1 everywhere

**Answer:** B
**Explanation:** Credit assignment.

---

## Quick answer key

Q01–C | Q02–B | Q03–B | Q04–B | Q05–B | Q06–B | Q07–B | Q08–A | Q09–C | Q10–C | Q11–B | Q12–D | Q13–B | Q14–C | Q15–A | Q16–D | Q17–A | Q18–D | Q19–B | Q20–D | Q21–D | Q22–C | Q23–C | Q24–B | Q25–B | Q26–B | Q27–D | Q28–A | Q29–A | Q30–D | Q31–A | Q32–A | Q33–D | Q34–C | Q35–A | Q36–C | Q37–D | Q38–D | Q39–D | Q40–A | Q41–A | Q42–A | Q43–C | Q44–C | Q45–B | Q46–C | Q47–D | Q48–A | Q49–B | Q50–C | Q51–D | Q52–D | Q53–B | Q54–D | Q55–B | Q56–A | Q57–A | Q58–B | Q59–A | Q60–D | Q61–B | Q62–A | Q63–D | Q64–C | Q65–C | Q66–D | Q67–D | Q68–B | Q69–C | Q70–C | Q71–B | Q72–B | Q73–A | Q74–D | Q75–D | Q76–D | Q77–B
