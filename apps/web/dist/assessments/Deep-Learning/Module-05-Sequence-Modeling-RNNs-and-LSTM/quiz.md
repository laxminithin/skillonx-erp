# Quiz — Deep Learning — Module 5: Sequence Modeling RNNs and LSTM

**Subject:** Deep Learning  
**Module:** Module 5 — Sequence Modeling RNNs and LSTM  
**Questions:** 77  
**Mix:** 13 Easy · 36 Intermediate · 28 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** An LSTM forget gate is a:

- **A.** Tanh candidate replacing pooling
- **B.** Sigmoid mask that scales the previous cell contents
- **C.** Stride-2 conv
- **D.** Softmax over ImageNet

**Answer:** B
**Explanation:** f_t ⊙ c_{t−1}.

### Q02  ·  Easy
**Question:** BPTT is:

- **A.** Winograd convolution
- **B.** Backpropagation on the unfolded recurrent graph with shared weights
- **C.** A pooling algorithm
- **D.** The perceptron convergence theorem

**Answer:** B
**Explanation:** Backprop through time.

### Q03  ·  Easy
**Question:** Encoder–decoder architectures map:

- **A.** A fixed 784-vector to XOR
- **B.** An ImageNet crop to 1000 classes only
- **C.** A source sequence to a target sequence via an encoded context
- **D.** A single perceptron threshold

**Answer:** C
**Explanation:** Seq2seq.

### Q04  ·  Easy
**Question:** Unfolding a recurrent net means:

- **A.** Deleting h_{t−1}
- **B.** Drawing one shared-weight copy of the body per time step
- **C.** Converting it into VGG-16
- **D.** Using unshared new layers for every t with no tying

**Answer:** B
**Explanation:** Goodfellow unfolding.

### Q05  ·  Easy
**Question:** Which option best describes **Context vector (basic seq2seq)**?

- **A.** Dropout p.
- **B.** The encoder’s final (or pooled) state passed to the decoder as the initial h or as a concatenated input — a bottleneck for long sources without attention.
- **C.** The forget gate bias of 0.
- **D.** A 3×3 conv kernel.

**Answer:** B
**Explanation:** Context vector (basic seq2seq): The encoder’s final (or pooled) state passed to the decoder as the initial h or as a concatenated input — a bottleneck for long sources without attention.

### Q06  ·  Easy
**Question:** Which option best describes **Deep RNN**?

- **A.** A 1958 perceptron.
- **B.** Stacking recurrent layers so each time step has a hierarchy of hidden states (depth in space as well as unfolding in time).
- **C.** Using only one hidden unit total.
- **D.** Replacing recurrence by pooling.

**Answer:** B
**Explanation:** Deep RNN: Stacking recurrent layers so each time step has a hierarchy of hidden states (depth in space as well as unfolding in time).

### Q07  ·  Easy
**Question:** Which option best describes **Forget gate**?

- **A.** Dropout p.
- **B.** f_t = σ(W_f [h_{t−1}, x_t] + b_f) that multiplies c_{t−1}, choosing what to erase from the cell.
- **C.** The output nonlinearity of a CNN.
- **D.** The learning rate.

**Answer:** B
**Explanation:** Forget gate: f_t = σ(W_f [h_{t−1}, x_t] + b_f) that multiplies c_{t−1}, choosing what to erase from the cell.

### Q08  ·  Easy
**Question:** Which option best describes **GRU**?

- **A.** An LSTM with four extra cells.
- **B.** A transformer with 8 heads.
- **C.** A gated RNN with two gates (reset, update), no separate cell, cheaper than LSTM but similar sequence power.
- **D.** A VGG block.

**Answer:** C
**Explanation:** GRU: A gated RNN with two gates (reset, update), no separate cell, cheaper than LSTM but similar sequence power.

### Q09  ·  Easy
**Question:** Which option best describes **Teacher forcing**?

- **A.** Training a sequential model by feeding the ground-truth previous output (or token) as input, rather than the model’s own prediction.
- **B.** Max-pooling over time.
- **C.** The perceptron rule.
- **D.** Always feeding the model’s own samples at train time as the only method.

**Answer:** A
**Explanation:** Teacher forcing: Training a sequential model by feeding the ground-truth previous output (or token) as input, rather than the model’s own prediction.

### Q10  ·  Easy
**Question:** Which option best describes **Unfolding a computational graph**?

- **A.** Using a different unshared net at every time with no tying.
- **B.** Representing a recurrent map by explicitly drawing one copy of the body per time step, sharing weights across the copies (Goodfellow).
- **C.** Converting an RNN into a CNN kernel.
- **D.** Dropout on pixels.

**Answer:** B
**Explanation:** Unfolding a computational graph: Representing a recurrent map by explicitly drawing one copy of the body per time step, sharing weights across the copies (Goodfellow).

### Q11  ·  Easy
**Question:** Which sequence correctly describes **bidirectional tagging**?

- **A.** Use only the backward net for causal speech
- **B.** Max-pool all T into one vector before every tag, destroying alignment
- **C.** Forward RNN on x_1..x_T → backward RNN on x_T..x_1 → concat states at each t → local classifier for the tag
- **D.** Replace both nets by a single perceptron on word length

**Answer:** C
**Explanation:** Correct sequence for bidirectional tagging: Forward RNN on x_1..x_T → backward RNN on x_T..x_1 → concat states at each t → local classifier for the tag

### Q12  ·  Easy
**Question:** Which sequence correctly describes **seq2seq encode–decode (basic)**?

- **A.** Classify the source with a 10-way softmax and stop
- **B.** Convolve source and target as images
- **C.** Use a bidirectional decoder that peeks at future target tokens at test time in an open-vocab translator without care
- **D.** Run encoder over source tokens → take final state as context → initialise decoder → generate target tokens (teacher forcing in train)

**Answer:** D
**Explanation:** Correct sequence for seq2seq encode–decode (basic): Run encoder over source tokens → take final state as context → initialise decoder → generate target tokens (teacher forcing in train)

### Q13  ·  Easy
**Question:** Which sequence correctly describes **unfolding an RNN**?

- **A.** Draw T independent MLPs with unshared θ and never sum gradients
- **B.** Write h_t = F(h_{t−1}, x_t; θ) for t=1..T with the same θ → draw T copies → share weights in forward and in BPTT
- **C.** Replace time with a 3×3 kernel
- **D.** Max-pool F across pixels

**Answer:** B
**Explanation:** Correct sequence for unfolding an RNN: Write h_t = F(h_{t−1}, x_t; θ) for t=1..T with the same θ → draw T copies → share weights in forward and in BPTT

### Q14  ·  Intermediate
**Question:** A GRU differs from an LSTM mainly by:

- **A.** Forbidding recurrence
- **B.** Using fewer gates and no separate cell (reset + update)
- **C.** Being a 3×3 residual conv
- **D.** Having four cells and six gates

**Answer:** B
**Explanation:** Cheaper gated RNN.

### Q15  ·  Intermediate
**Question:** A chatbot is trained with teacher forcing but babbles at test time. Related issue:

- **A.** Convolution padding
- **B.** Exposure bias: train gold prefixes vs free-running decode
- **C.** L2 on the forget bias
- **D.** Too much unfolding of the encoder

**Answer:** B
**Explanation:** Train/test mismatch in seq models.

### Q16  ·  Intermediate
**Question:** A forget gate near 1 and input gate near 0 implements:

- **A.** Carry of long-term cell memory (constant-error path)
- **B.** A CNN skip with F(x)+x on images only
- **C.** Max-pooling
- **D.** Hard reset of the cell every step

**Answer:** A
**Explanation:** Why LSTMs remember.

### Q17  ·  Intermediate
**Question:** A model must label each word using both left and right context, offline. Architecture:

- **A.** Bidirectional RNN/LSTM
- **B.** 3×3 conv with no time
- **C.** A single perceptron
- **D.** Causal unidirectional LM used as-is for the future

**Answer:** A
**Explanation:** BiRNN for tagging.

### Q18  ·  Intermediate
**Question:** A vanilla RNN on T=200 has ~0 training signal for t=1. Diagnosis:

- **A.** Stride 2 in a CNN
- **B.** PDI of weights
- **C.** Too much LSTM gating
- **D.** Vanishing gradients through time

**Answer:** D
**Explanation:** Jacobian product.

### Q19  ·  Intermediate
**Question:** Bidirectional RNNs are inappropriate when:

- **A.** Handwriting recognition of a complete line
- **B.** Offline speech recognition with the whole utterance available
- **C.** POS tagging of a finished sentence
- **D.** The application is strictly causal (must not peek at the future)

**Answer:** D
**Explanation:** Need future context vs cannot wait.

### Q20  ·  Intermediate
**Question:** Parameter tying in an unfolded graph means:

- **A.** Pooling replaces W
- **B.** Dropout is forbidden
- **C.** The same W is used at every t, so BPTT sums ∂E/∂W_t into one W
- **D.** Each t has a private W_t that is never tied

**Answer:** C
**Explanation:** Sharing through unfolding.

### Q21  ·  Intermediate
**Question:** Recursive nets (Goodfellow) apply a shared composition function to:

- **A.** Children in a tree/DAG, not only a linear timeline
- **B.** A strictly left-to-right chain as the only allowed graph
- **C.** Minibatch shuffle order
- **D.** A residual ImageNet block

**Answer:** A
**Explanation:** Tree-structured composition.

### Q22  ·  Intermediate
**Question:** Sentiment of a whole review (one label). A reasonable RNN use is:

- **A.** Emit a token at every step as a decoder of the same length always
- **B.** Use only a 5×5 conv on 32×32
- **C.** Require bidirectional future tokens after the label is needed in real time only
- **D.** Encode the token sequence, then classify from the final (or pooled) h_T

**Answer:** D
**Explanation:** Sequence classifier.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **LSTM** and **GRU**?

- **A.** LSTM has two gates; GRU has four.
- **B.** They are max-pooling layers.
- **C.** LSTM: cell + forget/input/output gates (4 affine maps). GRU: reset+update (2–3 maps), no separate cell. Similar empirical power, GRU cheaper.
- **D.** GRU has more parameters than LSTM for the same hidden size always.

**Answer:** C
**Explanation:** LSTM: cell + forget/input/output gates (4 affine maps). GRU: reset+update (2–3 maps), no separate cell. Similar empirical power, GRU cheaper.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **RNN** and **MLP on a fixed window**?

- **A.** RNNs cannot share weights in time.
- **B.** They are both 3×3 convs.
- **C.** RNNs share θ over unbounded T and keep state; windowed MLPs fix a finite context and have no h_t across steps.
- **D.** MLPs handle arbitrary T natively.

**Answer:** C
**Explanation:** RNNs share θ over unbounded T and keep state; windowed MLPs fix a finite context and have no h_t across steps.

### Q25  ·  Intermediate
**Question:** What is the most important distinction between **encoder–decoder** and **single RNN classifier**?

- **A.** They both require square n×n outputs.
- **B.** Seq2seq maps a sequence to another sequence via an encoder state + decoder; a classifier maps a sequence to one label.
- **C.** Classifiers always emit tokens one by one as a decoder.
- **D.** Seq2seq cannot translate.

**Answer:** B
**Explanation:** Seq2seq maps a sequence to another sequence via an encoder state + decoder; a classifier maps a sequence to one label.

### Q26  ·  Intermediate
**Question:** What is the most important distinction between **teacher forcing** and **free-running decode**?

- **A.** They are dropout.
- **B.** Free-running is required during every train step.
- **C.** Teacher forcing is used at test time as the default API.
- **D.** Train with gold prefixes; decode with the model’s own tokens (exposure bias if they disagree).

**Answer:** D
**Explanation:** Train with gold prefixes; decode with the model’s own tokens (exposure bias if they disagree).

### Q27  ·  Intermediate
**Question:** Which option best describes **BPTT**?

- **A.** Backpropagation through time: run reverse-mode AD on the unfolded graph, summing gradients into the shared θ.
- **B.** FFT convolution.
- **C.** The perceptron mistake rule on sequences.
- **D.** Using a different gradient for each time’s copy of W without tying.

**Answer:** A
**Explanation:** BPTT: Backpropagation through time: run reverse-mode AD on the unfolded graph, summing gradients into the shared θ.

### Q28  ·  Intermediate
**Question:** Which option best describes **Bidirectional RNN**?

- **A.** An LSTM with only a forget gate.
- **B.** Two RNNs, one left-to-right and one right-to-left, whose states are concatenated so each position sees the full context.
- **C.** A unidirectional causal RNN that cannot look ahead.
- **D.** A conv 3×3.

**Answer:** B
**Explanation:** Bidirectional RNN: Two RNNs, one left-to-right and one right-to-left, whose states are concatenated so each position sees the full context.

### Q29  ·  Intermediate
**Question:** Which option best describes **Encoder–decoder seq2seq**?

- **A.** An encoder RNN summarises the source into a context; a decoder RNN generates the target sequence (translation, captioning), possibly with attention in later extensions.
- **B.** Max-pool the source letters.
- **C.** A single perceptron on bag-of-words.
- **D.** A VGG stack with no recurrence.

**Answer:** A
**Explanation:** Encoder–decoder seq2seq: An encoder RNN summarises the source into a context; a decoder RNN generates the target sequence (translation, captioning), possibly with attention in later extensions.

### Q30  ·  Intermediate
**Question:** Which option best describes **Gating vs vanilla tanh RNN**?

- **A.** Vanilla RNNs already have three logistic gates.
- **B.** Gating always explodes T=2 gradients more than vanilla.
- **C.** Gates learn leaky integration so memory can have near-1 eigenvalues along some paths; vanilla RNNs typically have vanishing long-term credit assignment.
- **D.** LSTM cannot count beyond T=3.

**Answer:** C
**Explanation:** Gating vs vanilla tanh RNN: Gates learn leaky integration so memory can have near-1 eigenvalues along some paths; vanilla RNNs typically have vanishing long-term credit assignment.

### Q31  ·  Intermediate
**Question:** Which option best describes **Hidden state / memory**?

- **A.** A pooling window.
- **B.** h_t is a summary of the past that is updated each step; it is the RNN’s internal memory.
- **C.** The softmax temperature.
- **D.** The learning rate.

**Answer:** B
**Explanation:** Hidden state / memory: h_t is a summary of the past that is updated each step; it is the RNN’s internal memory.

### Q32  ·  Intermediate
**Question:** Which option best describes **Input (update) gate and cell candidate**?

- **A.** i_t scales a candidate ĉ_t (usually tanh) that is added into the cell: c_t = f_t ⊙ c_{t−1} + i_t ⊙ ĉ_t.
- **B.** L2 weight decay.
- **C.** Replacing the cell by a pooling index.
- **D.** A 1×1 convolution only.

**Answer:** A
**Explanation:** Input (update) gate and cell candidate: i_t scales a candidate ĉ_t (usually tanh) that is added into the cell: c_t = f_t ⊙ c_{t−1} + i_t ⊙ ĉ_t.

### Q33  ·  Intermediate
**Question:** Which option best describes **LSTM**?

- **A.** A gated RNN with a cell c_t and gates (forget, input, output) that learn to carry or overwrite memory, mitigating vanishing through time.
- **B.** A bidirectional pooling layer.
- **C.** A conv 3×3 residual block.
- **D.** A ReLU MLP with no state.

**Answer:** A
**Explanation:** LSTM: A gated RNN with a cell c_t and gates (forget, input, output) that learn to carry or overwrite memory, mitigating vanishing through time.

### Q34  ·  Intermediate
**Question:** Which option best describes **Output gate**?

- **A.** Early stopping.
- **B.** Stride in a CNN.
- **C.** The encoder’s pooling of the whole sentence as a scalar.
- **D.** o_t chooses how much of tanh(c_t) is exposed as h_t = o_t ⊙ tanh(c_t).

**Answer:** D
**Explanation:** Output gate: o_t chooses how much of tanh(c_t) is exposed as h_t = o_t ⊙ tanh(c_t).

### Q35  ·  Intermediate
**Question:** Which option best describes **RNN (recurrent net)**?

- **A.** A conv net with no time.
- **B.** A feedforward MLP that forbids h_{t−1}.
- **C.** A perceptron on XOR.
- **D.** A net whose hidden state h_t = F(h_{t−1}, x_t; θ) is reused, so it can map variable-length sequences with shared θ.

**Answer:** D
**Explanation:** RNN (recurrent net): A net whose hidden state h_t = F(h_{t−1}, x_t; θ) is reused, so it can map variable-length sequences with shared θ.

### Q36  ·  Intermediate
**Question:** Which option best describes **Recursive neural network**?

- **A.** A unidirectional RNN unfolded on a chain only.
- **B.** Dropout.
- **C.** A net that composes representations on a tree (or DAG) by applying the same module to children, not necessarily a linear time chain.
- **D.** A ResNet skip.

**Answer:** C
**Explanation:** Recursive neural network: A net that composes representations on a tree (or DAG) by applying the same module to children, not necessarily a linear time chain.

### Q37  ·  Intermediate
**Question:** Which option best describes **Vanishing gradient through time**?

- **A.** Backprop through T unfolded multiplies by ∂h_t/∂h_{t−1} repeatedly; if that Jacobian’s radius < 1, early-t gradients vanish (and may explode if > 1).
- **B.** L2 regularisation’s λ.
- **C.** Pooling.
- **D.** A problem that cannot occur in RNNs, only in CNNs.

**Answer:** A
**Explanation:** Vanishing gradient through time: Backprop through T unfolded multiplies by ∂h_t/∂h_{t−1} repeatedly; if that Jacobian’s radius < 1, early-t gradients vanish (and may explode if > 1).

### Q38  ·  Intermediate
**Question:** Which option best describes **Variable-length sequence**?

- **A.** Sequences cannot be batched.
- **B.** Every sentence must be exactly 28×28 like MNIST.
- **C.** T is fixed by VGG-16 to 16.
- **D.** RNNs accept T that varies by example because unfolding depth follows the data; padding+masks handle minibatches.

**Answer:** D
**Explanation:** Variable-length sequence: RNNs accept T that varies by example because unfolding depth follows the data; padding+masks handle minibatches.

### Q39  ·  Intermediate
**Question:** Which sequence correctly describes **BPTT**?

- **A.** Backprop only t=T and ignore earlier losses always
- **B.** Apply the perceptron mistake rule to h_0
- **C.** Use a different optimiser per time without tying
- **D.** Forward through the unfolded graph → backward from the loss(es) at each t → accumulate grads into shared θ → one optimiser step

**Answer:** D
**Explanation:** Correct sequence for BPTT: Forward through the unfolded graph → backward from the loss(es) at each t → accumulate grads into shared θ → one optimiser step

### Q40  ·  Intermediate
**Question:** Which sequence correctly describes **LSTM cell update**?

- **A.** Set c_t = tanh(W x_t) with no gates
- **B.** Apply softmax to the cell and discard h
- **C.** Pool c_{t−1} with stride 2
- **D.** Compute f, i, o, ĉ from h_{t−1}, x_t → c_t = f⊙c_{t−1} + i⊙ĉ → h_t = o⊙tanh(c_t)

**Answer:** D
**Explanation:** Correct sequence for LSTM cell update: Compute f, i, o, ĉ from h_{t−1}, x_t → c_t = f⊙c_{t−1} + i⊙ĉ → h_t = o⊙tanh(c_t)

### Q41  ·  Intermediate
**Question:** Which statement about **BPTT** is FALSE?

- **A.** BPTT forbids sharing W across time in the backward pass.
- **B.** A useful way to remember BPTT is that it is not the same as “Using a different gradient for each time’s copy of W without tying”.
- **C.** BPTT is correctly understood as: backpropagation through time: run reverse-mode AD on the unfolded graph, summing gradients into the shared θ.
- **D.** In this module, BPTT is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: BPTT forbids sharing W across time in the backward pass.. BPTT actually means: Backpropagation through time: run reverse-mode AD on the unfolded graph, summing gradients into the shared θ.

### Q42  ·  Intermediate
**Question:** Which statement about **Bidirectional RNN** is FALSE?

- **A.** In this module, Bidirectional RNN is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Bidirectional RNN is that it is not the same as “A unidirectional causal RNN that cannot look ahead”.
- **C.** Bidirectional RNN is correctly understood as: two RNNs, one left-to-right and one right-to-left, whose states are concatenated so each position sees the full context.
- **D.** Bidirectional RNNs are usable as-is for real-time causal generation of the next keystroke without delay.

**Answer:** D
**Explanation:** The false claim is: Bidirectional RNNs are usable as-is for real-time causal generation of the next keystroke without delay.. Bidirectional RNN actually means: Two RNNs, one left-to-right and one right-to-left, whose states are concatenated so each position sees the full context.

### Q43  ·  Intermediate
**Question:** Which statement about **Deep RNN** is FALSE?

- **A.** Deep RNNs are defined as CNNs with 152 layers and no h_t.
- **B.** A useful way to remember Deep RNN is that it is not the same as “Using only one hidden unit total”.
- **C.** In this module, Deep RNN is a core idea students must distinguish from nearby terms.
- **D.** Deep RNN is correctly understood as: stacking recurrent layers so each time step has a hierarchy of hidden states (depth in space as well as unfolding in time).

**Answer:** A
**Explanation:** The false claim is: Deep RNNs are defined as CNNs with 152 layers and no h_t.. Deep RNN actually means: Stacking recurrent layers so each time step has a hierarchy of hidden states (depth in space as well as unfolding in time).

### Q44  ·  Intermediate
**Question:** Which statement about **GRU** is FALSE?

- **A.** In this module, GRU is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember GRU is that it is not the same as “An LSTM with four extra cells”.
- **C.** GRU has more gates than LSTM (six vs three).
- **D.** GRU is correctly understood as: a gated RNN with two gates (reset, update), no separate cell, cheaper than LSTM but similar sequence power.

**Answer:** C
**Explanation:** The false claim is: GRU has more gates than LSTM (six vs three).. GRU actually means: A gated RNN with two gates (reset, update), no separate cell, cheaper than LSTM but similar sequence power.

### Q45  ·  Intermediate
**Question:** Which statement about **Hidden state / memory** is FALSE?

- **A.** RNNs store the entire raw sequence in a growing unshared list of new weights per t.
- **B.** Hidden state / memory is correctly understood as: h_t is a summary of the past that is updated each step; it is the RNN’s internal memory.
- **C.** A useful way to remember Hidden state / memory is that it is not the same as “The learning rate”.
- **D.** In this module, Hidden state / memory is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: RNNs store the entire raw sequence in a growing unshared list of new weights per t.. Hidden state / memory actually means: h_t is a summary of the past that is updated each step; it is the RNN’s internal memory.

### Q46  ·  Intermediate
**Question:** Which statement about **Input (update) gate and cell candidate** is FALSE?

- **A.** A useful way to remember Input (update) gate and cell candidate is that it is not the same as “Replacing the cell by a pooling index”.
- **B.** In this module, Input (update) gate and cell candidate is a core idea students must distinguish from nearby terms.
- **C.** Input (update) gate and cell candidate is correctly understood as: i_t scales a candidate ĉ_t (usually tanh) that is added into the cell: c_t = f_t ⊙ c_{t−1} + i_t ⊙ ĉ_t.
- **D.** LSTM cells add the candidate with no input gate and no forget gate in the standard equations.

**Answer:** D
**Explanation:** The false claim is: LSTM cells add the candidate with no input gate and no forget gate in the standard equations.. Input (update) gate and cell candidate actually means: i_t scales a candidate ĉ_t (usually tanh) that is added into the cell: c_t = f_t ⊙ c_{t−1} + i_t ⊙ ĉ_t.

### Q47  ·  Intermediate
**Question:** Which statement about **LSTM** is FALSE?

- **A.** LSTM is correctly understood as: a gated RNN with a cell c_t and gates (forget, input, output) that learn to carry or overwrite memory, mitigating vanishing through time.
- **B.** A useful way to remember LSTM is that it is not the same as “A conv 3×3 residual block”.
- **C.** LSTM removes all gating so the cell always fully resets every step.
- **D.** In this module, LSTM is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: LSTM removes all gating so the cell always fully resets every step.. LSTM actually means: A gated RNN with a cell c_t and gates (forget, input, output) that learn to carry or overwrite memory, mitigating vanishing through time.

### Q48  ·  Intermediate
**Question:** Which statement about **Unfolding a computational graph** is FALSE?

- **A.** A useful way to remember Unfolding a computational graph is that it is not the same as “Using a different unshared net at every time with no tying”.
- **B.** In this module, Unfolding a computational graph is a core idea students must distinguish from nearby terms.
- **C.** Unfolding means deleting recurrence so the graph has no time axis.
- **D.** Unfolding a computational graph is correctly understood as: representing a recurrent map by explicitly drawing one copy of the body per time step, sharing weights across the copies (Goodfellow).

**Answer:** C
**Explanation:** The false claim is: Unfolding means deleting recurrence so the graph has no time axis.. Unfolding a computational graph actually means: Representing a recurrent map by explicitly drawing one copy of the body per time step, sharing weights across the copies (Goodfellow).

### Q49  ·  Intermediate
**Question:** Which statement about **Variable-length sequence** is FALSE?

- **A.** A useful way to remember Variable-length sequence is that it is not the same as “Every sentence must be exactly 28×28 like MNIST”.
- **B.** MLPs with a fixed 784 input are the only models that handle variable T.
- **C.** In this module, Variable-length sequence is a core idea students must distinguish from nearby terms.
- **D.** Variable-length sequence is correctly understood as: rNNs accept T that varies by example because unfolding depth follows the data; padding+masks handle minibatches.

**Answer:** B
**Explanation:** The false claim is: MLPs with a fixed 784 input are the only models that handle variable T.. Variable-length sequence actually means: RNNs accept T that varies by example because unfolding depth follows the data; padding+masks handle minibatches.

### Q50  ·  Difficult
**Question:** A cheaper gated alternative to LSTM for a mobile keyboard LM is:

- **A.** A 138 M VGG
- **B.** Hard-limiter perceptron
- **C.** ResNet-152 on each character image only
- **D.** GRU (reset and update gates)

**Answer:** D
**Explanation:** GRU vs LSTM.

### Q51  ·  Difficult
**Question:** A forget-gate sigmoid output of 0.01 on a cell value 2.0 contributes how much of that memory onward?

- **A.** 0.01
- **B.** 1.99
- **C.** 2.0
- **D.** 0.02

**Answer:** D
**Explanation:** f⊙c = 0.01×2=0.02; nearly forgotten.

### Q52  ·  Difficult
**Question:** A vanilla RNN multiplies by tanh′ ≤ 1. If the typical factor is 0.9, after 50 steps 0.9^50 is closest to:

- **A.** 1.0
- **B.** 50
- **C.** 0.90
- **D.** 0.0052

**Answer:** D
**Explanation:** 0.9^50 ≈ 0.00515 — already tiny, vanishing through time.

### Q53  ·  Difficult
**Question:** BPTT truncated to 30 steps on a length-400 stream updates using how many time copies per step?

- **A.** 400 always
- **B.** 30 unfolded steps (not the full 400)
- **C.** 0
- **D.** 1

**Answer:** B
**Explanation:** Truncated BPTT limits the Jacobian chain.

### Q54  ·  Difficult
**Question:** English→Kannada translation with variable lengths. Classic module architecture:

- **A.** XOR MLP
- **B.** Encoder–decoder seq2seq RNN
- **C.** A 10-class ResNet on pixels only
- **D.** k-means

**Answer:** B
**Explanation:** Seq2seq.

### Q55  ·  Difficult
**Question:** Forget gate ≈ 1.0, input gate ≈ 0, cell 5.0. Next cell is closest to:

- **A.** 2.5
- **B.** 1.0
- **C.** 5.0 (memory carried)
- **D.** 0

**Answer:** C
**Explanation:** c_t ≈ 1·5 + 0·ĉ = 5.

### Q56  ·  Difficult
**Question:** GRU with two gates plus a candidate, roughly 3 affine maps of the same sizes, is about:

- **A.** 60 300 parameters
- **B.** 20100
- **C.** 3
- **D.** 80 400

**Answer:** A
**Explanation:** 3×20100=60300, cheaper than LSTM’s 4 maps.

### Q57  ·  Difficult
**Question:** If the factor is 1.1, 1.1^50 is closest to:

- **A.** 117
- **B.** 0.005
- **C.** 1.1
- **D.** 50

**Answer:** A
**Explanation:** 1.1^50 ≈ 117.4 — explosion through time.

### Q58  ·  Difficult
**Question:** LSTM parameter count for 4 gates, input 50, hidden 50, with bias, is:

- **A.** 4
- **B.** 10 000
- **C.** 2500
- **D.** 20 200

**Answer:** D
**Explanation:** 4×((50+50)×50 + 50)=4×5050=20200.

### Q59  ·  Difficult
**Question:** LSTM with d_x=100, d_h=100, four gates with biases, parameter count is 4[(d_x+d_h)d_h + d_h] =:

- **A.** 400
- **B.** 80 400
- **C.** 20 000
- **D.** 10 000

**Answer:** B
**Explanation:** 4×(200×100+100)=4×20100=80400.

### Q60  ·  Difficult
**Question:** Parse-tree composition of two phrases with a shared module. Goodfellow name:

- **A.** Max-pooling 2×2
- **B.** A strictly chain RNN with no tree
- **C.** AlexNet
- **D.** Recursive neural network (tree-structured)

**Answer:** D
**Explanation:** Recursive ≠ recurrent.

### Q61  ·  Difficult
**Question:** Replacing that vanilla net with an LSTM makes long copy-memory tasks easier because:

- **A.** Softmax vanishes less than sigmoid by a constant 3.7
- **B.** Forget/input gates create carry paths with multiplier near 1
- **C.** LSTMs remove BPTT
- **D.** T is forced to 5

**Answer:** B
**Explanation:** Constant error carousel / gated carry.

### Q62  ·  Difficult
**Question:** Seq2seq encoder on T=20, hidden 256, then a decoder of 12 tokens. Unfolded copies of the encoder body equal:

- **A.** 20 (shared weights)
- **B.** 256
- **C.** 32 unshared nets
- **D.** 12

**Answer:** A
**Explanation:** Unfolding depth = sequence length; θ is shared.

### Q63  ·  Difficult
**Question:** Speech frames should not use a bidirectional net if the product must emit now. Reason:

- **A.** Bidirectional needs future frames, adding latency
- **B.** LSTMs are illegal on speech
- **C.** GRUs require the future
- **D.** Unidirectional RNNs cannot model audio

**Answer:** A
**Explanation:** Causality.

### Q64  ·  Difficult
**Question:** Vanishing through time happens because BPTT multiplies:

- **A.** The CNN condition number κ once
- **B.** Many factors ∂h_t/∂h_{t−1} (or tanh′ W) along the unfolded chain
- **C.** 0.0591/n
- **D.** Only the dropout mask

**Answer:** B
**Explanation:** Product of Jacobians in T.

### Q65  ·  Difficult
**Question:** What is the most important distinction between **LSTM** and **vanilla RNN**?

- **A.** LSTMs cannot train on T>5 by design.
- **B.** Vanilla RNNs cannot vanish.
- **C.** LSTM gates create paths where memory can pass with multiplier ≈1; vanilla tanh RNNs vanish/explode with T.
- **D.** They have identical state equations.

**Answer:** C
**Explanation:** LSTM gates create paths where memory can pass with multiplier ≈1; vanilla tanh RNNs vanish/explode with T.

### Q66  ·  Difficult
**Question:** What is the most important distinction between **recurrent net** and **recursive net**?

- **A.** The words are strict synonyms in Goodfellow.
- **B.** Recursive nets cannot share a composition function.
- **C.** Both are CNNs.
- **D.** Recurrent: chain in time. Recursive: shared module on a tree/graph (e.g. parse trees).

**Answer:** D
**Explanation:** Recurrent: chain in time. Recursive: shared module on a tree/graph (e.g. parse trees).

### Q67  ·  Difficult
**Question:** What is the most important distinction between **unidirectional RNN** and **bidirectional RNN**?

- **A.** They differ only in the size of the convolution kernel.
- **B.** Bi RNNs are required for language-model next-character that must not peek.
- **C.** Uni RNNs always see the future.
- **D.** Uni: causal, uses past only. Bi: past and future at each t — not for real-time next-token without delay.

**Answer:** D
**Explanation:** Uni: causal, uses past only. Bi: past and future at each t — not for real-time next-token without delay.

### Q68  ·  Difficult
**Question:** What is the most important distinction between **vanishing through time** and **vanishing through depth (MLP/CNN)**?

- **A.** They are unrelated mathematically.
- **B.** Clipping fixes vanishing completely.
- **C.** Both are products of Jacobians. Time: T steps of ∂h/∂h. Depth: L layers of φ′W. LSTM/residuals target each axis.
- **D.** Only CNNs can vanish.

**Answer:** C
**Explanation:** Both are products of Jacobians. Time: T steps of ∂h/∂h. Depth: L layers of φ′W. LSTM/residuals target each axis.

### Q69  ·  Difficult
**Question:** Which statement about **Context vector (basic seq2seq)** is FALSE?

- **A.** Context vector (basic seq2seq) is correctly understood as: the encoder’s final (or pooled) state passed to the decoder as the initial h or as a concatenated input — a bottleneck for long sources without attention.
- **B.** A useful way to remember Context vector (basic seq2seq) is that it is not the same as “A 3×3 conv kernel”.
- **C.** The context vector must be a scalar 0.25.
- **D.** In this module, Context vector (basic seq2seq) is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: The context vector must be a scalar 0.25.. Context vector (basic seq2seq) actually means: The encoder’s final (or pooled) state passed to the decoder as the initial h or as a concatenated input — a bottleneck for long sources without attention.

### Q70  ·  Difficult
**Question:** Which statement about **Encoder–decoder seq2seq** is FALSE?

- **A.** Encoder–decoder seq2seq is correctly understood as: an encoder RNN summarises the source into a context; a decoder RNN generates the target sequence (translation, captioning), possibly with attention in later extensions.
- **B.** In this module, Encoder–decoder seq2seq is a core idea students must distinguish from nearby terms.
- **C.** Seq2seq cannot handle variable-length input and output.
- **D.** A useful way to remember Encoder–decoder seq2seq is that it is not the same as “A single perceptron on bag-of-words”.

**Answer:** C
**Explanation:** The false claim is: Seq2seq cannot handle variable-length input and output.. Encoder–decoder seq2seq actually means: An encoder RNN summarises the source into a context; a decoder RNN generates the target sequence (translation, captioning), possibly with attention in later extensions.

### Q71  ·  Difficult
**Question:** Which statement about **Forget gate** is FALSE?

- **A.** The forget gate is a max-pool over the cell.
- **B.** In this module, Forget gate is a core idea students must distinguish from nearby terms.
- **C.** Forget gate is correctly understood as: f_t = σ(W_f [h_{t−1}, x_t] + b_f) that multiplies c_{t−1}, choosing what to erase from the cell.
- **D.** A useful way to remember Forget gate is that it is not the same as “The output nonlinearity of a CNN”.

**Answer:** A
**Explanation:** The false claim is: The forget gate is a max-pool over the cell.. Forget gate actually means: f_t = σ(W_f [h_{t−1}, x_t] + b_f) that multiplies c_{t−1}, choosing what to erase from the cell.

### Q72  ·  Difficult
**Question:** Which statement about **Gating vs vanilla tanh RNN** is FALSE?

- **A.** A useful way to remember Gating vs vanilla tanh RNN is that it is not the same as “Vanilla RNNs already have three logistic gates”.
- **B.** In this module, Gating vs vanilla tanh RNN is a core idea students must distinguish from nearby terms.
- **C.** Gating vs vanilla tanh RNN is correctly understood as: gates learn leaky integration so memory can have near-1 eigenvalues along some paths; vanilla RNNs typically have vanishing long-term credit assignment.
- **D.** Gates exist to make vanishing worse on purpose.

**Answer:** D
**Explanation:** The false claim is: Gates exist to make vanishing worse on purpose.. Gating vs vanilla tanh RNN actually means: Gates learn leaky integration so memory can have near-1 eigenvalues along some paths; vanilla RNNs typically have vanishing long-term credit assignment.

### Q73  ·  Difficult
**Question:** Which statement about **Output gate** is FALSE?

- **A.** Output gate is correctly understood as: o_t chooses how much of tanh(c_t) is exposed as h_t = o_t ⊙ tanh(c_t).
- **B.** The output gate deletes the cell permanently.
- **C.** In this module, Output gate is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Output gate is that it is not the same as “The encoder’s pooling of the whole sentence as a scalar”.

**Answer:** B
**Explanation:** The false claim is: The output gate deletes the cell permanently.. Output gate actually means: o_t chooses how much of tanh(c_t) is exposed as h_t = o_t ⊙ tanh(c_t).

### Q74  ·  Difficult
**Question:** Which statement about **RNN (recurrent net)** is FALSE?

- **A.** A useful way to remember RNN (recurrent net) is that it is not the same as “A feedforward MLP that forbids h_{t−1}”.
- **B.** An RNN cannot share θ across time steps by definition.
- **C.** RNN (recurrent net) is correctly understood as: a net whose hidden state h_t = F(h_{t−1}, x_t; θ) is reused, so it can map variable-length sequences with shared θ.
- **D.** In this module, RNN (recurrent net) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: An RNN cannot share θ across time steps by definition.. RNN (recurrent net) actually means: A net whose hidden state h_t = F(h_{t−1}, x_t; θ) is reused, so it can map variable-length sequences with shared θ.

### Q75  ·  Difficult
**Question:** Which statement about **Recursive neural network** is FALSE?

- **A.** In this module, Recursive neural network is a core idea students must distinguish from nearby terms.
- **B.** Recursive neural network is correctly understood as: a net that composes representations on a tree (or DAG) by applying the same module to children, not necessarily a linear time chain.
- **C.** A useful way to remember Recursive neural network is that it is not the same as “A unidirectional RNN unfolded on a chain only”.
- **D.** Recursive nets in Goodfellow’s sense are the same as recurrent nets; the words are never distinguished.

**Answer:** D
**Explanation:** The false claim is: Recursive nets in Goodfellow’s sense are the same as recurrent nets; the words are never distinguished.. Recursive neural network actually means: A net that composes representations on a tree (or DAG) by applying the same module to children, not necessarily a linear time chain.

### Q76  ·  Difficult
**Question:** Which statement about **Teacher forcing** is FALSE?

- **A.** In this module, Teacher forcing is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Teacher forcing is that it is not the same as “Always feeding the model’s own samples at train time as the only method”.
- **C.** Teacher forcing is correctly understood as: training a sequential model by feeding the ground-truth previous output (or token) as input, rather than the model’s own prediction.
- **D.** Teacher forcing is illegal in encoder–decoder training.

**Answer:** D
**Explanation:** The false claim is: Teacher forcing is illegal in encoder–decoder training.. Teacher forcing actually means: Training a sequential model by feeding the ground-truth previous output (or token) as input, rather than the model’s own prediction.

### Q77  ·  Difficult
**Question:** Which statement about **Vanishing gradient through time** is FALSE?

- **A.** Vanishing gradient through time is correctly understood as: backprop through T unfolded multiplies by ∂h_t/∂h_{t−1} repeatedly; if that Jacobian’s radius < 1, early-t gradients vanish (and may explode if > 1).
- **B.** BPTT gradients never depend on T, so long sequences are as easy as T=2.
- **C.** In this module, Vanishing gradient through time is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Vanishing gradient through time is that it is not the same as “A problem that cannot occur in RNNs, only in CNNs”.

**Answer:** B
**Explanation:** The false claim is: BPTT gradients never depend on T, so long sequences are as easy as T=2.. Vanishing gradient through time actually means: Backprop through T unfolded multiplies by ∂h_t/∂h_{t−1} repeatedly; if that Jacobian’s radius < 1, early-t gradients vanish (and may explode if > 1).

---

## Quick answer key

Q01–B | Q02–B | Q03–C | Q04–B | Q05–B | Q06–B | Q07–B | Q08–C | Q09–A | Q10–B | Q11–C | Q12–D | Q13–B | Q14–B | Q15–B | Q16–A | Q17–A | Q18–D | Q19–D | Q20–C | Q21–A | Q22–D | Q23–C | Q24–C | Q25–B | Q26–D | Q27–A | Q28–B | Q29–A | Q30–C | Q31–B | Q32–A | Q33–A | Q34–D | Q35–D | Q36–C | Q37–A | Q38–D | Q39–D | Q40–D | Q41–A | Q42–D | Q43–A | Q44–C | Q45–A | Q46–D | Q47–C | Q48–C | Q49–B | Q50–D | Q51–D | Q52–D | Q53–B | Q54–B | Q55–C | Q56–A | Q57–A | Q58–D | Q59–B | Q60–D | Q61–B | Q62–A | Q63–A | Q64–B | Q65–C | Q66–D | Q67–D | Q68–C | Q69–C | Q70–C | Q71–A | Q72–D | Q73–B | Q74–B | Q75–D | Q76–D | Q77–B
