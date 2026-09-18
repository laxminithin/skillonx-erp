# Quiz — Deep Learning — Module 1: Foundations of Neural Networks and Perceptron

**Subject:** Deep Learning  
**Module:** Module 1 — Foundations of Neural Networks and Perceptron  
**Questions:** 77  
**Mix:** 13 Easy · 36 Intermediate · 28 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A feedforward network’s computational graph is:

- **A.** A graph that must contain a cycle
- **B.** An undirected Ising model only
- **C.** A directed acyclic graph from inputs to outputs
- **D.** A single undirected edge

**Answer:** C
**Explanation:** Acyclic layered maps.

### Q02  ·  Easy
**Question:** McCulloch and Pitts (1943) modelled a neuron as:

- **A.** A residual block
- **B.** A binary threshold unit
- **C.** A GRU
- **D.** A batch-norm layer

**Answer:** B
**Explanation:** Historical neuron model.

### Q03  ·  Easy
**Question:** Rosenblatt’s perceptron is primarily:

- **A.** A softmax regression with hidden ReLUs
- **B.** A linear threshold neuron with a mistake-driven learning rule
- **C.** An LSTM language model
- **D.** A 152-layer residual CNN

**Answer:** B
**Explanation:** 1958 perceptron.

### Q04  ·  Easy
**Question:** The perceptron convergence theorem requires:

- **A.** XOR in the input space
- **B.** Linearly separable classes
- **C.** Dropout 0.5
- **D.** A nonconvex deep net

**Answer:** B
**Explanation:** Separability hypothesis.

### Q05  ·  Easy
**Question:** Which option best describes **Activation (squashing) function**?

- **A.** A typically nonlinear map φ(v) from induced local field v to the neuron’s output (signum, sigmoid, tanh, ReLU).
- **B.** A one-hot label vector.
- **C.** The SGD minibatch size.
- **D.** The sum of squared errors with no φ.

**Answer:** A
**Explanation:** Activation (squashing) function: A typically nonlinear map φ(v) from induced local field v to the neuron’s output (signum, sigmoid, tanh, ReLU).

### Q06  ·  Easy
**Question:** Which option best describes **Bias / threshold**?

- **A.** The momentum α.
- **B.** An extra parameter b (or a weight on a clamped input +1) that shifts the decision hyperplane away from the origin.
- **C.** Dropout keep probability p.
- **D.** The learning rate η.

**Answer:** B
**Explanation:** Bias / threshold: An extra parameter b (or a weight on a clamped input +1) that shifts the decision hyperplane away from the origin.

### Q07  ·  Easy
**Question:** Which option best describes **Feedback**?

- **A.** L2 weight decay.
- **B.** A closed loop in which a neuron’s output is fed back, possibly through other units, affecting its future input (recurrent / dynamical nets).
- **C.** Feedforward-only layered mapping with no loops.
- **D.** Dropout’s random mask.

**Answer:** B
**Explanation:** Feedback: A closed loop in which a neuron’s output is fed back, possibly through other units, affecting its future input (recurrent / dynamical nets).

### Q08  ·  Easy
**Question:** Which option best describes **Linear separability**?

- **A.** Any Boolean function, including XOR, is linearly separable in 2-D inputs.
- **B.** Separability requires at least three hidden layers.
- **C.** Two classes can be partitioned by a hyperplane in the feature space (including a bias/threshold).
- **D.** Classes that overlap completely in every direction are still linearly separable.

**Answer:** C
**Explanation:** Linear separability: Two classes can be partitioned by a hyperplane in the feature space (including a bias/threshold).

### Q09  ·  Easy
**Question:** Which option best describes **Neural network**?

- **A.** A single hard-wired lookup table that cannot adapt weights.
- **B.** A massively parallel distributed processor of simple processing units that can store experiential knowledge and make it available for use (Haykin).
- **C.** A purely symbolic Prolog interpreter with no numeric weights.
- **D.** A digital multiplexer with no learning rule.

**Answer:** B
**Explanation:** Neural network: A massively parallel distributed processor of simple processing units that can store experiential knowledge and make it available for use (Haykin).

### Q10  ·  Easy
**Question:** Which option best describes **Rosenblatt perceptron**?

- **A.** An LSTM with three gates.
- **B.** A single McCulloch–Pitts-style linear threshold neuron trained by the perceptron learning rule on labelled examples (1958).
- **C.** A deep residual CNN with skip connections.
- **D.** A softmax of 1000 ImageNet classes.

**Answer:** B
**Explanation:** Rosenblatt perceptron: A single McCulloch–Pitts-style linear threshold neuron trained by the perceptron learning rule on labelled examples (1958).

### Q11  ·  Easy
**Question:** Which sequence correctly describes **perceptron training epoch**?

- **A.** Always backprop through three hidden layers
- **B.** Present x → compute v=w·x+b → threshold → if misclassified, w ← w ± x (and bias) → next example
- **C.** Compute softmax, then Adam on a Hessian
- **D.** Update w even when the example is already correct, by subtracting a random image

**Answer:** B
**Explanation:** Correct sequence for perceptron training epoch: Present x → compute v=w·x+b → threshold → if misclassified, w ← w ± x (and bias) → next example

### Q12  ·  Easy
**Question:** Which sequence correctly describes **relating perceptron to Bayes (equal Gaussian Σ)**?

- **A.** Fit a 50-layer ResNet to two 1-D Gaussians as the only Bayes method
- **B.** Use XOR as the Gaussian environment
- **C.** Assume class-conditionals N(μ,Σ) → log-posterior ratio is linear in x → implement that linear score with a threshold neuron
- **D.** Replace the likelihood by a pooling layer

**Answer:** C
**Explanation:** Correct sequence for relating perceptron to Bayes (equal Gaussian Σ): Assume class-conditionals N(μ,Σ) → log-posterior ratio is linear in x → implement that linear score with a threshold neuron

### Q13  ·  Easy
**Question:** Which sequence correctly describes **testing linear separability in 2-D**?

- **A.** Run k-means with k=3 and declare separability
- **B.** Compute PDI of the weights
- **C.** Assume the convergence theorem applies to every dataset
- **D.** Plot the two classes → try a line (hyperplane) → if one line works, a perceptron can learn it; if they form XOR, it cannot

**Answer:** D
**Explanation:** Correct sequence for testing linear separability in 2-D: Plot the two classes → try a line (hyperplane) → if one line works, a perceptron can learn it; if they form XOR, it cannot

### Q14  ·  Intermediate
**Question:** A campus badge classifier uses only height and weight and a single threshold neuron. It will succeed if:

- **A.** The two classes are linearly separable in that plane
- **B.** There are cycles in the graph
- **C.** η is exactly 3.7
- **D.** The classes form XOR in that plane

**Answer:** A
**Explanation:** Perceptron = linear threshold.

### Q15  ·  Intermediate
**Question:** Adding a clamped x0=1 with weight w0 is equivalent to:

- **A.** Making XOR separable without hidden units
- **B.** Introducing a bias so the hyperplane need not pass through the origin
- **C.** Removing feedback
- **D.** Setting the learning rate to 1

**Answer:** B
**Explanation:** Homogeneous coordinates for the threshold.

### Q16  ·  Intermediate
**Question:** Equal-covariance Gaussian males/females on one feature. The perceptron is related to Bayes because:

- **A.** Gaussians are never linearly separable
- **B.** The perceptron estimates the full covariance inverse every step
- **C.** Bayes requires a deep LSTM
- **D.** The optimal boundary is linear, so a perceptron can implement the Bayes discriminant form

**Answer:** D
**Explanation:** Haykin: perceptron vs Bayes in a Gaussian environment.

### Q17  ·  Intermediate
**Question:** If the perceptron makes no updates for a full epoch, then:

- **A.** Every training point is correctly classified by the current hyperplane
- **B.** The network has become recurrent
- **C.** η has vanished
- **D.** The data must be XOR

**Answer:** A
**Explanation:** Mistake-driven rule idles when correct.

### Q18  ·  Intermediate
**Question:** In Haykin’s account, feedback means:

- **A.** L2 regularisation
- **B.** Cycles in the directed signal-flow graph, yielding dynamics
- **C.** Data augmentation
- **D.** The momentum term in SGD only

**Answer:** B
**Explanation:** Architectural feedback.

### Q19  ·  Intermediate
**Question:** The induced local field v is:

- **A.** The weighted sum of inputs plus bias, before φ
- **B.** The output after softmax always
- **C.** The number of mistakes in the convergence bound
- **D.** The learning rate

**Answer:** A
**Explanation:** v = w·x + b.

### Q20  ·  Intermediate
**Question:** Training a perceptron on XOR runs forever with oscillating weights. The textbook diagnosis is:

- **A.** η is too small but a separator exists
- **B.** Bayes’ rule is false
- **C.** The bias must be removed
- **D.** The data are not linearly separable; convergence theorem does not apply

**Answer:** D
**Explanation:** XOR is the classic counterexample.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **feedforward net** and **recurrent net**?

- **A.** Feedforward nets always feed the output back to the input.
- **B.** The two architectures are identical directed graphs.
- **C.** Feedforward graphs are acyclic static maps; recurrent nets have feedback and therefore state/dynamics.
- **D.** Recurrent nets cannot have cycles.

**Answer:** C
**Explanation:** Feedforward graphs are acyclic static maps; recurrent nets have feedback and therefore state/dynamics.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **linearly separable** and **XOR**?

- **A.** The perceptron convergence theorem covers XOR.
- **B.** XOR’s positive and negative pairs are not separable by one hyperplane; separable problems are.
- **C.** XOR is the definition of linear separability.
- **D.** Every 2-D Boolean function is separable.

**Answer:** B
**Explanation:** XOR’s positive and negative pairs are not separable by one hyperplane; separable problems are.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **single-layer perceptron** and **multilayer perceptron**?

- **A.** Hidden layers cannot create new features.
- **B.** Both have identical VC dimension equal to 1.
- **C.** One threshold layer can only cut half-spaces; hidden layers compose nonlinear features so XOR becomes separable.
- **D.** An MLP is just a perceptron with momentum.

**Answer:** C
**Explanation:** One threshold layer can only cut half-spaces; hidden layers compose nonlinear features so XOR becomes separable.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **synaptic weight** and **learning rate η**?

- **A.** They are the same scalar.
- **B.** Weights are hyperparameters chosen once and never updated.
- **C.** η is stored per synapse as the only memory.
- **D.** Weights are the stored knowledge; η is a hyperparameter that scales updates, not a stored pattern.

**Answer:** D
**Explanation:** Weights are the stored knowledge; η is a hyperparameter that scales updates, not a stored pattern.

### Q25  ·  Intermediate
**Question:** Which option best describes **Bayes classifier (Gaussian)**?

- **A.** For equal-covariance Gaussians, the Bayes-optimal decision is a linear (or quadratic if covariances differ) function of x; the perceptron approximates a linear discriminant.
- **B.** Bayes’ rule forbids using a threshold on a linear score.
- **C.** The perceptron is exactly the posterior p(C|x) for every density.
- **D.** Bayes classifiers cannot be linear for any Gaussian pair.

**Answer:** A
**Explanation:** Bayes classifier (Gaussian): For equal-covariance Gaussians, the Bayes-optimal decision is a linear (or quadratic if covariances differ) function of x; the perceptron approximates a linear discriminant.

### Q26  ·  Intermediate
**Question:** Which option best describes **Directed graph view**?

- **A.** Haykin treats a neural net as a directed graph whose nodes are neurons and whose directed links carry signals (signal-flow graph).
- **B.** A confusion matrix.
- **C.** An undirected Markov random field with no arrows.
- **D.** A spreadsheet with no edges.

**Answer:** A
**Explanation:** Directed graph view: Haykin treats a neural net as a directed graph whose nodes are neurons and whose directed links carry signals (signal-flow graph).

### Q27  ·  Intermediate
**Question:** Which option best describes **Feedforward architecture**?

- **A.** A network whose output is wired back to the input as a dynamical system.
- **B.** A Hopfield energy net.
- **C.** An acyclic layered network in which signals travel only from input toward output (single-layer or MLP).
- **D.** A bidirectional RNN unfolded both ways.

**Answer:** C
**Explanation:** Feedforward architecture: An acyclic layered network in which signals travel only from input toward output (single-layer or MLP).

### Q28  ·  Intermediate
**Question:** Which option best describes **Generalisation (Haykin sense)**?

- **A.** Memorising the training set with zero regard to new samples.
- **B.** The perceptron convergence theorem itself.
- **C.** The network’s ability to produce reasonable outputs for inputs not seen during training.
- **D.** The count of hidden neurons.

**Answer:** C
**Explanation:** Generalisation (Haykin sense): The network’s ability to produce reasonable outputs for inputs not seen during training.

### Q29  ·  Intermediate
**Question:** Which option best describes **Induced local field**?

- **A.** The number of classes K.
- **B.** v = Σ w_i x_i + b, the net input to the activation function.
- **C.** The output y = φ(v) after squashing.
- **D.** The learning rate η.

**Answer:** B
**Explanation:** Induced local field: v = Σ w_i x_i + b, the net input to the activation function.

### Q30  ·  Intermediate
**Question:** Which option best describes **McCulloch–Pitts neuron**?

- **A.** A convolutional filter with shared weights.
- **B.** A linear regression with no threshold.
- **C.** An LSTM forget gate.
- **D.** A binary threshold unit that computes a weighted sum of inputs and fires if the sum exceeds a threshold (1943 model).

**Answer:** D
**Explanation:** McCulloch–Pitts neuron: A binary threshold unit that computes a weighted sum of inputs and fires if the sum exceeds a threshold (1943 model).

### Q31  ·  Intermediate
**Question:** Which option best describes **Perceptron convergence theorem**?

- **A.** The theorem says training error grows without bound.
- **B.** Convergence requires a softmax and cross-entropy.
- **C.** The perceptron always converges, even for XOR, to zero training error.
- **D.** If the two classes are linearly separable, the perceptron algorithm finds a separating hyperplane in a finite number of updates.

**Answer:** D
**Explanation:** Perceptron convergence theorem: If the two classes are linearly separable, the perceptron algorithm finds a separating hyperplane in a finite number of updates.

### Q32  ·  Intermediate
**Question:** Which option best describes **Perceptron learning rule**?

- **A.** If a labelled example is misclassified, add (or subtract) the input vector to the weight vector; correct examples leave w unchanged.
- **B.** Use the Adam second-moment estimate.
- **C.** Always subtract η ∇L for a smooth MSE, including when the example is already correct and φ is a sigmoid.
- **D.** Set all weights to zero after every mistake.

**Answer:** A
**Explanation:** Perceptron learning rule: If a labelled example is misclassified, add (or subtract) the input vector to the weight vector; correct examples leave w unchanged.

### Q33  ·  Intermediate
**Question:** Which option best describes **Recurrent architecture**?

- **A.** A network with feedback loops, hence a dynamical system with internal state, as opposed to a static mapping.
- **B.** PCA.
- **C.** A strictly layered MLP with no cycles.
- **D.** A linear FIR filter with no recurrence.

**Answer:** A
**Explanation:** Recurrent architecture: A network with feedback loops, hence a dynamical system with internal state, as opposed to a static mapping.

### Q34  ·  Intermediate
**Question:** Which option best describes **Signum / hard limiter**?

- **A.** A linear φ(v)=v with no decision.
- **B.** Softmax over 1000 logits.
- **C.** ReLU(v) = max(0,v) only, with no thresholding at the output of Rosenblatt’s original unit.
- **D.** φ(v) = +1 if v ≥ 0 and −1 otherwise (or a 0/1 step); the classical perceptron nonlinearity.

**Answer:** D
**Explanation:** Signum / hard limiter: φ(v) = +1 if v ≥ 0 and −1 otherwise (or a 0/1 step); the classical perceptron nonlinearity.

### Q35  ·  Intermediate
**Question:** Which option best describes **Synapse / weight**?

- **A.** A pooling window size.
- **B.** A connection strength w_ij that scales the signal from neuron j to neuron i; learning changes these weights.
- **C.** The learning-rate hyperparameter η itself.
- **D.** The bias-only term with no incoming signal.

**Answer:** B
**Explanation:** Synapse / weight: A connection strength w_ij that scales the signal from neuron j to neuron i; learning changes these weights.

### Q36  ·  Intermediate
**Question:** Which option best describes **XOR problem (single perceptron)**?

- **A.** XOR is not linearly separable in the original (x1,x2) plane, so one perceptron cannot realise it.
- **B.** XOR requires a convolution with stride 2.
- **C.** XOR is solved by setting the threshold to 0.0591.
- **D.** XOR is linearly separable so one perceptron suffices.

**Answer:** A
**Explanation:** XOR problem (single perceptron): XOR is not linearly separable in the original (x1,x2) plane, so one perceptron cannot realise it.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **McCulloch–Pitts firing**?

- **A.** Apply LSTM forget, input and output gates
- **B.** Sample dropout masks on the weights
- **C.** Convolve with a 3×3 kernel and max-pool
- **D.** Binary inputs arrive → weighted sum vs threshold → output 1 or 0

**Answer:** D
**Explanation:** Correct sequence for McCulloch–Pitts firing: Binary inputs arrive → weighted sum vs threshold → output 1 or 0

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **building a directed NN graph**?

- **A.** Draw an undirected clique and stop
- **B.** Replace all edges by pooling windows
- **C.** Write a confusion matrix as the architecture
- **D.** Place neuron nodes → draw directed synaptic edges with weights → mark input/output nodes → note any feedback loops

**Answer:** D
**Explanation:** Correct sequence for building a directed NN graph: Place neuron nodes → draw directed synaptic edges with weights → mark input/output nodes → note any feedback loops

### Q39  ·  Intermediate
**Question:** Which statement about **Bayes classifier (Gaussian)** is FALSE?

- **A.** Haykin’s Gaussian-environment result is that the perceptron is optimal for XOR.
- **B.** A useful way to remember Bayes classifier (Gaussian) is that it is not the same as “Bayes classifiers cannot be linear for any Gaussian pair”.
- **C.** Bayes classifier (Gaussian) is correctly understood as: for equal-covariance Gaussians, the Bayes-optimal decision is a linear (or quadratic if covariances differ) function of x; the perceptron approximates a linear discriminant.
- **D.** In this module, Bayes classifier (Gaussian) is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Haykin’s Gaussian-environment result is that the perceptron is optimal for XOR.. Bayes classifier (Gaussian) actually means: For equal-covariance Gaussians, the Bayes-optimal decision is a linear (or quadratic if covariances differ) function of x; the perceptron approximates a linear discriminant.

### Q40  ·  Intermediate
**Question:** Which statement about **Feedback** is FALSE?

- **A.** Feedback in Haykin’s sense is the same as the momentum coefficient α and never creates recurrence.
- **B.** A useful way to remember Feedback is that it is not the same as “Feedforward-only layered mapping with no loops”.
- **C.** In this module, Feedback is a core idea students must distinguish from nearby terms.
- **D.** Feedback is correctly understood as: a closed loop in which a neuron’s output is fed back, possibly through other units, affecting its future input (recurrent / dynamical nets).

**Answer:** A
**Explanation:** The false claim is: Feedback in Haykin’s sense is the same as the momentum coefficient α and never creates recurrence.. Feedback actually means: A closed loop in which a neuron’s output is fed back, possibly through other units, affecting its future input (recurrent / dynamical nets).

### Q41  ·  Intermediate
**Question:** Which statement about **Induced local field** is FALSE?

- **A.** In this module, Induced local field is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Induced local field is that it is not the same as “The output y = φ(v) after squashing”.
- **C.** Induced local field is correctly understood as: v = Σ w_i x_i + b, the net input to the activation function.
- **D.** The induced local field is the derivative of the sigmoid and is always 0.25.

**Answer:** D
**Explanation:** The false claim is: The induced local field is the derivative of the sigmoid and is always 0.25.. Induced local field actually means: v = Σ w_i x_i + b, the net input to the activation function.

### Q42  ·  Intermediate
**Question:** Which statement about **Linear separability** is FALSE?

- **A.** In this module, Linear separability is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Linear separability is that it is not the same as “Any Boolean function, including XOR, is linearly separable in 2-D inputs”.
- **C.** Linear separability means the XOR dataset in R^2 can be split by one straight line.
- **D.** Linear separability is correctly understood as: two classes can be partitioned by a hyperplane in the feature space (including a bias/threshold).

**Answer:** C
**Explanation:** The false claim is: Linear separability means the XOR dataset in R^2 can be split by one straight line.. Linear separability actually means: Two classes can be partitioned by a hyperplane in the feature space (including a bias/threshold).

### Q43  ·  Intermediate
**Question:** Which statement about **Neural network** is FALSE?

- **A.** A useful way to remember Neural network is that it is not the same as “A single hard-wired lookup table that cannot adapt weights”.
- **B.** In this module, Neural network is a core idea students must distinguish from nearby terms.
- **C.** A neural network is defined as a CPU cache-replacement policy with no neurons.
- **D.** Neural network is correctly understood as: a massively parallel distributed processor of simple processing units that can store experiential knowledge and make it available for use (Haykin).

**Answer:** C
**Explanation:** The false claim is: A neural network is defined as a CPU cache-replacement policy with no neurons.. Neural network actually means: A massively parallel distributed processor of simple processing units that can store experiential knowledge and make it available for use (Haykin).

### Q44  ·  Intermediate
**Question:** Which statement about **Perceptron learning rule** is FALSE?

- **A.** A useful way to remember Perceptron learning rule is that it is not the same as “Always subtract η ∇L for a smooth MSE, including when the example is already correct and φ is a sigmoid”.
- **B.** In this module, Perceptron learning rule is a core idea students must distinguish from nearby terms.
- **C.** Perceptron learning rule is correctly understood as: if a labelled example is misclassified, add (or subtract) the input vector to the weight vector; correct examples leave w unchanged.
- **D.** The perceptron rule updates weights on every example, including those already classified correctly, by a random Gaussian.

**Answer:** D
**Explanation:** The false claim is: The perceptron rule updates weights on every example, including those already classified correctly, by a random Gaussian.. Perceptron learning rule actually means: If a labelled example is misclassified, add (or subtract) the input vector to the weight vector; correct examples leave w unchanged.

### Q45  ·  Intermediate
**Question:** Which statement about **Recurrent architecture** is FALSE?

- **A.** Recurrent architecture is correctly understood as: a network with feedback loops, hence a dynamical system with internal state, as opposed to a static mapping.
- **B.** A useful way to remember Recurrent architecture is that it is not the same as “A strictly layered MLP with no cycles”.
- **C.** Recurrent nets are feedforward MLPs with one extra bias.
- **D.** In this module, Recurrent architecture is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Recurrent nets are feedforward MLPs with one extra bias.. Recurrent architecture actually means: A network with feedback loops, hence a dynamical system with internal state, as opposed to a static mapping.

### Q46  ·  Intermediate
**Question:** Which statement about **Signum / hard limiter** is FALSE?

- **A.** A useful way to remember Signum / hard limiter is that it is not the same as “Softmax over 1000 logits”.
- **B.** The original perceptron used a GELU activation published in 2016.
- **C.** In this module, Signum / hard limiter is a core idea students must distinguish from nearby terms.
- **D.** Signum / hard limiter is correctly understood as: φ(v) = +1 if v ≥ 0 and −1 otherwise (or a 0/1 step); the classical perceptron nonlinearity.

**Answer:** B
**Explanation:** The false claim is: The original perceptron used a GELU activation published in 2016.. Signum / hard limiter actually means: φ(v) = +1 if v ≥ 0 and −1 otherwise (or a 0/1 step); the classical perceptron nonlinearity.

### Q47  ·  Intermediate
**Question:** Which statement about **Synapse / weight** is FALSE?

- **A.** Synaptic weights are frozen biological constants that gradient descent is forbidden to change.
- **B.** Synapse / weight is correctly understood as: a connection strength w_ij that scales the signal from neuron j to neuron i; learning changes these weights.
- **C.** A useful way to remember Synapse / weight is that it is not the same as “The bias-only term with no incoming signal”.
- **D.** In this module, Synapse / weight is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Synaptic weights are frozen biological constants that gradient descent is forbidden to change.. Synapse / weight actually means: A connection strength w_ij that scales the signal from neuron j to neuron i; learning changes these weights.

### Q48  ·  Intermediate
**Question:** XOR cannot be solved by one perceptron because:

- **A.** Bayes’ rule fails for Boolean data
- **B.** The learning rate must be 0
- **C.** McCulloch–Pitts neurons cannot add
- **D.** The positive and negative pairs are not linearly separable in R^2

**Answer:** D
**Explanation:** Geometric diagonal pattern.

### Q49  ·  Intermediate
**Question:** You need a static map from pixels to 10 digits with no memory of past images. Default architecture:

- **A.** A single perceptron on raw 784-D XOR-style digits
- **B.** An untrained McCulloch–Pitts net with random thresholds only
- **C.** Feedforward (MLP/CNN), not a dynamical recurrent net
- **D.** Hopfield net as the first choice

**Answer:** C
**Explanation:** Feedforward classifiers.

### Q50  ·  Difficult
**Question:** A neuron must output −1 or +1 with no in-between. The classical φ is:

- **A.** Dropout mask
- **B.** Signum / hard limiter
- **C.** Softmax
- **D.** Identity φ(v)=v

**Answer:** B
**Explanation:** Rosenblatt-style bipolar output.

### Q51  ·  Difficult
**Question:** A neuron uses φ(v)=1/(1+e^{−v}). φ(0) equals:

- **A.** 0.25
- **B.** 1
- **C.** 0.5
- **D.** 0

**Answer:** C
**Explanation:** Sigmoid(0)=1/2. (Note φ′(0)=0.25, which is the derivative, not φ.)

### Q52  ·  Difficult
**Question:** A perceptron has weights w = (1, 1) and bias b = −1.5. For x = (1, 0), the induced field v = w·x + b is:

- **A.** 2.5
- **B.** 0.5
- **C.** 1.5
- **D.** −0.5 (output 0 or −1 if threshold at 0)

**Answer:** D
**Explanation:** v = 1·1 + 1·0 − 1.5 = −0.5; the hard limiter does not fire.

### Q53  ·  Difficult
**Question:** A recurrent net is left running with positive feedback and no saturation. Risk:

- **A.** Unstable growth of the state (Haykin feedback discussion)
- **B.** Automatic Bayesian optimality
- **C.** Linear separability of XOR
- **D.** Guaranteed perceptron convergence

**Answer:** A
**Explanation:** Positive loops can destabilise.

### Q54  ·  Difficult
**Question:** A student draws an MLP but wires the output back to a hidden unit. The architecture is:

- **A.** A perceptron by Rosenblatt’s definition
- **B.** Recurrent (feedback), not a purely feedforward MLP
- **C.** Still feedforward because it has layers
- **D.** A pooling layer

**Answer:** B
**Explanation:** A cycle means feedback.

### Q55  ·  Difficult
**Question:** AND with 0/1 inputs is realised by w=(1,1), θ=1.5 (fire if v≥θ). How many of the four Boolean corners fire?

- **A.** Only (1,1) — one corner
- **B.** None
- **C.** All four corners
- **D.** Three corners

**Answer:** A
**Explanation:** Sums: 0,1,1,2; only 2 ≥ 1.5.

### Q56  ·  Difficult
**Question:** After finite mistakes a perceptron stops updating and classifies the whole training set. You may conclude:

- **A.** The net has three hidden layers
- **B.** Generalisation error is necessarily 0%
- **C.** XOR was solved by one neuron
- **D.** Training data were linearly separable (theorem’s hypothesis held)

**Answer:** D
**Explanation:** Convergence ⇒ a separator existed.

### Q57  ·  Difficult
**Question:** For two Gaussians with a shared covariance, the Bayes boundary is:

- **A.** A convolution with stride 2
- **B.** A hyperplane (linear discriminant), hence perceptron-representable
- **C.** Impossible to implement with a threshold
- **D.** Always a deep MLP with three hidden layers

**Answer:** B
**Explanation:** Equal-Σ Gaussian Bayes is linear.

### Q58  ·  Difficult
**Question:** Haykin asks you to view the net as a signal-flow graph. You should draw:

- **A.** A confusion matrix only
- **B.** An undirected social network
- **C.** A Gantt chart of epochs
- **D.** Directed edges carrying signals between neuron nodes

**Answer:** D
**Explanation:** Directed graph view of NNs.

### Q59  ·  Difficult
**Question:** If a linearly separable set needs at most 12 mistakes before a separator is found, the convergence theorem says the number of updates is:

- **A.** Finite (here at most those mistake-driven updates, not infinite)
- **B.** Zero because XOR is separable
- **C.** Exactly 10^6 always
- **D.** Infinite for every separable set

**Answer:** A
**Explanation:** Finite mistake bound on separable data.

### Q60  ·  Difficult
**Question:** OR with w=(1,1), θ=0.5. How many of the four 0/1 corners fire?

- **A.** Four
- **B.** Three: (1,0),(0,1),(1,1)
- **C.** One
- **D.** Two: only (0,0) and (1,1)

**Answer:** B
**Explanation:** Sums 0,1,1,2; three exceed 0.5.

### Q61  ·  Difficult
**Question:** Sigmoid derivative φ′(v)=φ(1−φ) has maximum value:

- **A.** 1 at v=0
- **B.** 0.25 at v=0
- **C.** 0 at v=0
- **D.** 0.5 at v=0

**Answer:** B
**Explanation:** Max of σ(1−σ) is 0.25. This number later explains vanishing gradients.

### Q62  ·  Difficult
**Question:** Two 1-D Gaussians, equal variance, means 0 and 4. The Bayes threshold for equal priors is at:

- **A.** x = 4
- **B.** x = 8
- **C.** x = 0
- **D.** x = 2

**Answer:** D
**Explanation:** Midpoint of the means for equal Σ and priors.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **Bayes linear discriminant** and **perceptron hyperplane**?

- **A.** Bayes classifiers are never linear.
- **B.** The perceptron outputs calibrated Bayesian posteriors always.
- **C.** For equal-covariance Gaussians the Bayes boundary is linear, which a perceptron can implement; the perceptron does not estimate full posteriors.
- **D.** They differ only in the name of the bias.

**Answer:** C
**Explanation:** For equal-covariance Gaussians the Bayes boundary is linear, which a perceptron can implement; the perceptron does not estimate full posteriors.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **McCulloch–Pitts neuron** and **Rosenblatt perceptron**?

- **A.** They are CNNs from 2012.
- **B.** Rosenblatt removed the threshold.
- **C.** M–P already included backprop through time.
- **D.** M–P is the 1943 threshold model; Rosenblatt added a supervised learning rule and proved convergence for separable data.

**Answer:** D
**Explanation:** M–P is the 1943 threshold model; Rosenblatt added a supervised learning rule and proved convergence for separable data.

### Q65  ·  Difficult
**Question:** What is the most important distinction between **perceptron rule** and **gradient descent on MSE**?

- **A.** They are the same update for tanh MLPs.
- **B.** Perceptron needs a Hessian.
- **C.** MSE descent never uses a learning rate.
- **D.** Perceptron updates only on mistakes with a hard threshold; smooth MSE+sigmoid uses a derivative every example.

**Answer:** D
**Explanation:** Perceptron updates only on mistakes with a hard threshold; smooth MSE+sigmoid uses a derivative every example.

### Q66  ·  Difficult
**Question:** What is the most important distinction between **positive feedback** and **negative feedback**?

- **A.** Feedback polarity never matters.
- **B.** Negative feedback always diverges.
- **C.** Positive feedback can destabilise/amplify; negative feedback can stabilise operating points in dynamical nets (Haykin).
- **D.** Both are dropout masks.

**Answer:** C
**Explanation:** Positive feedback can destabilise/amplify; negative feedback can stabilise operating points in dynamical nets (Haykin).

### Q67  ·  Difficult
**Question:** Which statement about **Activation (squashing) function** is FALSE?

- **A.** In this module, Activation (squashing) function is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Activation (squashing) function is that it is not the same as “The sum of squared errors with no φ”.
- **C.** Activation (squashing) function is correctly understood as: a typically nonlinear map φ(v) from induced local field v to the neuron’s output (signum, sigmoid, tanh, ReLU).
- **D.** A neuron must use φ(v) = v for all hidden layers or it cannot compute XOR.

**Answer:** D
**Explanation:** The false claim is: A neuron must use φ(v) = v for all hidden layers or it cannot compute XOR.. Activation (squashing) function actually means: A typically nonlinear map φ(v) from induced local field v to the neuron’s output (signum, sigmoid, tanh, ReLU).

### Q68  ·  Difficult
**Question:** Which statement about **Bias / threshold** is FALSE?

- **A.** Bias / threshold is correctly understood as: an extra parameter b (or a weight on a clamped input +1) that shifts the decision hyperplane away from the origin.
- **B.** A useful way to remember Bias / threshold is that it is not the same as “The learning rate η”.
- **C.** A perceptron with no bias can still realise every linearly separable dichotomy that requires an offset from the origin.
- **D.** In this module, Bias / threshold is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: A perceptron with no bias can still realise every linearly separable dichotomy that requires an offset from the origin.. Bias / threshold actually means: An extra parameter b (or a weight on a clamped input +1) that shifts the decision hyperplane away from the origin.

### Q69  ·  Difficult
**Question:** Which statement about **Directed graph view** is FALSE?

- **A.** Directed graph view is correctly understood as: haykin treats a neural net as a directed graph whose nodes are neurons and whose directed links carry signals (signal-flow graph).
- **B.** In this module, Directed graph view is a core idea students must distinguish from nearby terms.
- **C.** Neural nets cannot be drawn as directed graphs because feedback is illegal.
- **D.** A useful way to remember Directed graph view is that it is not the same as “An undirected Markov random field with no arrows”.

**Answer:** C
**Explanation:** The false claim is: Neural nets cannot be drawn as directed graphs because feedback is illegal.. Directed graph view actually means: Haykin treats a neural net as a directed graph whose nodes are neurons and whose directed links carry signals (signal-flow graph).

### Q70  ·  Difficult
**Question:** Which statement about **Feedforward architecture** is FALSE?

- **A.** In this module, Feedforward architecture is a core idea students must distinguish from nearby terms.
- **B.** Feedforward architecture is correctly understood as: an acyclic layered network in which signals travel only from input toward output (single-layer or MLP).
- **C.** A useful way to remember Feedforward architecture is that it is not the same as “A network whose output is wired back to the input as a dynamical system”.
- **D.** Feedforward nets are defined by the presence of cycles in the computational graph.

**Answer:** D
**Explanation:** The false claim is: Feedforward nets are defined by the presence of cycles in the computational graph.. Feedforward architecture actually means: An acyclic layered network in which signals travel only from input toward output (single-layer or MLP).

### Q71  ·  Difficult
**Question:** Which statement about **Generalisation (Haykin sense)** is FALSE?

- **A.** A useful way to remember Generalisation (Haykin sense) is that it is not the same as “Memorising the training set with zero regard to new samples”.
- **B.** In this module, Generalisation (Haykin sense) is a core idea students must distinguish from nearby terms.
- **C.** Generalisation (Haykin sense) is correctly understood as: the network’s ability to produce reasonable outputs for inputs not seen during training.
- **D.** Generalisation is guaranteed as soon as training error is zero, even with more weights than examples.

**Answer:** D
**Explanation:** The false claim is: Generalisation is guaranteed as soon as training error is zero, even with more weights than examples.. Generalisation (Haykin sense) actually means: The network’s ability to produce reasonable outputs for inputs not seen during training.

### Q72  ·  Difficult
**Question:** Which statement about **McCulloch–Pitts neuron** is FALSE?

- **A.** A useful way to remember McCulloch–Pitts neuron is that it is not the same as “A linear regression with no threshold”.
- **B.** The McCulloch–Pitts neuron outputs a real sigmoid and has no threshold.
- **C.** McCulloch–Pitts neuron is correctly understood as: a binary threshold unit that computes a weighted sum of inputs and fires if the sum exceeds a threshold (1943 model).
- **D.** In this module, McCulloch–Pitts neuron is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The McCulloch–Pitts neuron outputs a real sigmoid and has no threshold.. McCulloch–Pitts neuron actually means: A binary threshold unit that computes a weighted sum of inputs and fires if the sum exceeds a threshold (1943 model).

### Q73  ·  Difficult
**Question:** Which statement about **Perceptron convergence theorem** is FALSE?

- **A.** Perceptron convergence theorem is correctly understood as: if the two classes are linearly separable, the perceptron algorithm finds a separating hyperplane in a finite number of updates.
- **B.** The convergence theorem states that a single perceptron solves every nonlinearly separable problem in one epoch.
- **C.** In this module, Perceptron convergence theorem is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Perceptron convergence theorem is that it is not the same as “The perceptron always converges, even for XOR, to zero training error”.

**Answer:** B
**Explanation:** The false claim is: The convergence theorem states that a single perceptron solves every nonlinearly separable problem in one epoch.. Perceptron convergence theorem actually means: If the two classes are linearly separable, the perceptron algorithm finds a separating hyperplane in a finite number of updates.

### Q74  ·  Difficult
**Question:** Which statement about **Rosenblatt perceptron** is FALSE?

- **A.** Rosenblatt’s perceptron is a multilayer autoencoder trained by backprop.
- **B.** In this module, Rosenblatt perceptron is a core idea students must distinguish from nearby terms.
- **C.** Rosenblatt perceptron is correctly understood as: a single McCulloch–Pitts-style linear threshold neuron trained by the perceptron learning rule on labelled examples (1958).
- **D.** A useful way to remember Rosenblatt perceptron is that it is not the same as “A deep residual CNN with skip connections”.

**Answer:** A
**Explanation:** The false claim is: Rosenblatt’s perceptron is a multilayer autoencoder trained by backprop.. Rosenblatt perceptron actually means: A single McCulloch–Pitts-style linear threshold neuron trained by the perceptron learning rule on labelled examples (1958).

### Q75  ·  Difficult
**Question:** Which statement about **XOR problem (single perceptron)** is FALSE?

- **A.** XOR problem (single perceptron) is correctly understood as: xOR is not linearly separable in the original (x1,x2) plane, so one perceptron cannot realise it.
- **B.** A single-layer perceptron realises XOR because (1,1) and (0,0) share a half-plane with (1,0).
- **C.** In this module, XOR problem (single perceptron) is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember XOR problem (single perceptron) is that it is not the same as “XOR is linearly separable so one perceptron suffices”.

**Answer:** B
**Explanation:** The false claim is: A single-layer perceptron realises XOR because (1,1) and (0,0) share a half-plane with (1,0).. XOR problem (single perceptron) actually means: XOR is not linearly separable in the original (x1,x2) plane, so one perceptron cannot realise it.

### Q76  ·  Difficult
**Question:** Why does a bias (or clamped +1 input) matter?

- **A.** It replaces the need for weights
- **B.** It is the same as a recurrent loop
- **C.** It makes XOR linearly separable in 2-D without hidden units
- **D.** It lets the hyperplane miss the origin, so more dichotomies are representable

**Answer:** D
**Explanation:** Affine vs linear through origin.

### Q77  ·  Difficult
**Question:** XOR: points (0,0) and (1,1) vs (0,1) and (1,0). A single linear threshold in R^2 can separate them?

- **A.** No — not linearly separable
- **B.** Yes, with w=(0,0), θ=1
- **C.** Yes, because the perceptron convergence theorem always applies
- **D.** Yes, with w=(1,1), θ=0.5

**Answer:** A
**Explanation:** The two classes are the diagonals; no line splits them.

---

## Quick answer key

Q01–C | Q02–B | Q03–B | Q04–B | Q05–A | Q06–B | Q07–B | Q08–C | Q09–B | Q10–B | Q11–B | Q12–C | Q13–D | Q14–A | Q15–B | Q16–D | Q17–A | Q18–B | Q19–A | Q20–D | Q21–C | Q22–B | Q23–C | Q24–D | Q25–A | Q26–A | Q27–C | Q28–C | Q29–B | Q30–D | Q31–D | Q32–A | Q33–A | Q34–D | Q35–B | Q36–A | Q37–D | Q38–D | Q39–A | Q40–A | Q41–D | Q42–C | Q43–C | Q44–D | Q45–C | Q46–B | Q47–A | Q48–D | Q49–C | Q50–B | Q51–C | Q52–D | Q53–A | Q54–B | Q55–A | Q56–D | Q57–B | Q58–D | Q59–A | Q60–B | Q61–B | Q62–D | Q63–C | Q64–D | Q65–D | Q66–C | Q67–D | Q68–C | Q69–C | Q70–D | Q71–D | Q72–B | Q73–B | Q74–A | Q75–B | Q76–D | Q77–A
