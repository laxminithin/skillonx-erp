# Quiz — Deep Learning — Module 4: Convolutional Neural Networks

**Subject:** Deep Learning  
**Module:** Module 4 — Convolutional Neural Networks  
**Questions:** 77  
**Mix:** 13 Easy · 36 Intermediate · 28 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** LeNet-5 was designed chiefly for:

- **A.** ImageNet 1000-way 2012
- **B.** Machine translation
- **C.** Handwritten digit recognition (conv–pool stacks + FC)
- **D.** Speech LSTMs

**Answer:** C
**Explanation:** Historical CNN.

### Q02  ·  Easy
**Question:** Parameter sharing in a conv layer means:

- **A.** Every location has unique unshared k×k weights
- **B.** The same kernel is used at every spatial location
- **C.** Pooling shares the loss
- **D.** All layers share one learning rate as the only meaning

**Answer:** B
**Explanation:** Core CNN prior.

### Q03  ·  Easy
**Question:** The usual formula for conv output width is:

- **A.** p − s + k
- **B.** (n + 2p − k)/s + 1
- **C.** n / k only
- **D.** n + k + s

**Answer:** B
**Explanation:** Standard arithmetic.

### Q04  ·  Easy
**Question:** Which option best describes **1×1 convolution**?

- **A.** A convolution that is illegal because k=1.
- **B.** Max-pooling.
- **C.** A conv that mixes channels at each location (bottleneck / projection) with kernel spatial size 1.
- **D.** A shift of 1 pixel with no channel mix.

**Answer:** C
**Explanation:** 1×1 convolution: A conv that mixes channels at each location (bottleneck / projection) with kernel spatial size 1.

### Q05  ·  Easy
**Question:** Which option best describes **Convolution operation (CNN)**?

- **A.** A fully connected multiply of every pixel with every weight, with no sharing.
- **B.** A linear operator that slides a small kernel over an input, computing local weighted sums (discrete cross-correlation in most libraries).
- **C.** Max-pooling with no weights.
- **D.** Dropout on a fully connected layer only.

**Answer:** B
**Explanation:** Convolution operation (CNN): A linear operator that slides a small kernel over an input, computing local weighted sums (discrete cross-correlation in most libraries).

### Q06  ·  Easy
**Question:** Which option best describes **Equivariance to translation**?

- **A.** Equivariance means the output never changes when the input translates.
- **B.** If the input shifts, a convolutional feature map shifts correspondingly (before pooling); conv is an infinitely strong prior that the same detector applies everywhere.
- **C.** The output is invariant to any permutation of pixels, including shuffles.
- **D.** Conv layers ignore local structure.

**Answer:** B
**Explanation:** Equivariance to translation: If the input shifts, a convolutional feature map shifts correspondingly (before pooling); conv is an infinitely strong prior that the same detector applies everywhere.

### Q07  ·  Easy
**Question:** Which option best describes **Feature map**?

- **A.** The momentum buffer.
- **B.** The spatial output of one filter across the image; depth is the number of filters.
- **C.** The scalar loss.
- **D.** A single perceptron weight.

**Answer:** B
**Explanation:** Feature map: The spatial output of one filter across the image; depth is the number of filters.

### Q08  ·  Easy
**Question:** Which option best describes **LeNet-5**?

- **A.** A 152-layer residual net.
- **B.** LeCun et al.’s 1990s conv net for digits: conv–pool–conv–pool–FC, a foundation of deep learning history.
- **C.** A bidirectional LSTM.
- **D.** The 2012 ImageNet winner with 60 M weights.

**Answer:** B
**Explanation:** LeNet-5: LeCun et al.’s 1990s conv net for digits: conv–pool–conv–pool–FC, a foundation of deep learning history.

### Q09  ·  Easy
**Question:** Which option best describes **Padding**?

- **A.** Adding border units (often zeros) so output width can be preserved (same) or valid (no pad) as designed.
- **B.** Batch size.
- **C.** The pooling type.
- **D.** Removing the kernel’s centre tap.

**Answer:** A
**Explanation:** Padding: Adding border units (often zeros) so output width can be preserved (same) or valid (no pad) as designed.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **CNN training step**?

- **A.** Update each spatial copy of the kernel independently with no tying
- **B.** Use the perceptron rule on XOR pixels only
- **C.** Skip the backward pass on shared weights
- **D.** Conv/pool forward → loss (e.g. softmax CE) → backprop through pooling (route to argmax) and conv (flip kernel / conv by δ) → SGD on shared kernels

**Answer:** D
**Explanation:** Correct sequence for CNN training step: Conv/pool forward → loss (e.g. softmax CE) → backprop through pooling (route to argmax) and conv (flip kernel / conv by δ) → SGD on shared kernels

### Q11  ·  Easy
**Question:** Which sequence correctly describes **computing conv output size**?

- **A.** Out = n + k always
- **B.** Write n, k, p, s → spatial out = (n + 2p − k)/s + 1 (integer-compatible choices) → channels = number of filters
- **C.** Ignore padding and set out = k
- **D.** Use Nernst 0.0591/n

**Answer:** B
**Explanation:** Correct sequence for computing conv output size: Write n, k, p, s → spatial out = (n + 2p − k)/s + 1 (integer-compatible choices) → channels = number of filters

### Q12  ·  Easy
**Question:** Which sequence correctly describes **historical CNN deepening**?

- **A.** ResNet in 1998 → LeNet in 2015 → AlexNet last
- **B.** Transformers in 1990 as LeNet
- **C.** LeNet digits → AlexNet ReLU/GPU/dropout 2012 → VGG 3×3 stacks → ResNet skips enabling 50–152 layers
- **D.** Perceptron 1958 as a 152-layer conv net

**Answer:** C
**Explanation:** Correct sequence for historical CNN deepening: LeNet digits → AlexNet ReLU/GPU/dropout 2012 → VGG 3×3 stacks → ResNet skips enabling 50–152 layers

### Q13  ·  Easy
**Question:** Zero-padding of 1 with 3×3 stride-1 conv is typically used to:

- **A.** Remove parameter sharing
- **B.** Keep spatial width unchanged (same conv)
- **C.** Always halve the map
- **D.** Replace pooling

**Answer:** B
**Explanation:** p=(k−1)/2.

### Q14  ·  Intermediate
**Question:** A 152-layer net without skips fails to train; with identity skips it does. Idea:

- **A.** Using only 11×11 kernels like early AlexNet as the skip
- **B.** Max-pool every layer with no conv
- **C.** Residual learning (ResNet)
- **D.** Removing all convolutions

**Answer:** C
**Explanation:** Degradation problem and residuals.

### Q15  ·  Intermediate
**Question:** A 224×224 RGB photo into a first layer that is fully connected to 1000 units would need about 224×224×3×1000 weights (order 1.5×10^8) already. CNNs avoid this via:

- **A.** Local kernels + parameter sharing
- **B.** Dropout only, keeping FC on pixels
- **C.** Increasing stride to 0
- **D.** Using no nonlinearity

**Answer:** A
**Explanation:** The motivation for conv.

### Q16  ·  Intermediate
**Question:** A conv layer is equivariant to translation because:

- **A.** FC layers are used as the first layer
- **B.** The output is constant under any shift
- **C.** Pooling is applied before conv always
- **D.** A shift of the input shifts the feature map (same kernel everywhere)

**Answer:** D
**Explanation:** Goodfellow terminology.

### Q17  ·  Intermediate
**Question:** A framework turns each 3×3 window into a matrix row times a W matrix. Algorithm:

- **A.** Naive six Python loops as the CUDA primitive
- **B.** im2col + GEMM efficient convolution
- **C.** Pooling
- **D.** Winograd for FFT-only 51×51 kernels as the only option

**Answer:** B
**Explanation:** Efficient conv algorithms.

### Q18  ·  Intermediate
**Question:** AlexNet’s historical importance is that it:

- **A.** Won ILSVRC 2012 with a deep ReLU CNN on GPUs (~60 M params), catalysing modern DL
- **B.** Introduced residual skips in 1998
- **C.** Was a bidirectional GRU
- **D.** Used only 5×5 conv like LeNet with 10^4 weights

**Answer:** A
**Explanation:** 2012 inflection.

### Q19  ·  Intermediate
**Question:** Face patches have eyes always near the top. A paper uses unshared locally connected layers because:

- **A.** LeNet forbids unshared layers on digits
- **B.** 1×1 conv cannot mix channels
- **C.** Sharing always wins on faces
- **D.** Statistics are not fully translation-invariant, so sharing can hurt

**Answer:** D
**Explanation:** Variant of basic conv.

### Q20  ·  Intermediate
**Question:** Max pooling’s main roles are:

- **A.** Replacing ReLU
- **B.** Spatial downsampling and limited translation robustness
- **C.** Computing softmax
- **D.** Learning a 5×5 shared kernel

**Answer:** B
**Explanation:** Pool motivation.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **VGG** and **ResNet**?

- **A.** They have the same parameter count of 60 M.
- **B.** VGG introduced residual blocks in 2012.
- **C.** ResNet forbids 3×3 conv.
- **D.** VGG deepens by stacking 3×3; ResNet adds identity skips so degradation is avoided and 100+ layers train.

**Answer:** D
**Explanation:** VGG deepens by stacking 3×3; ResNet adds identity skips so degradation is avoided and 100+ layers train.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **convolution** and **fully connected on raw pixels**?

- **A.** Conv cannot detect edges.
- **B.** They have identical connectivity.
- **C.** Conv uses local kernels and sharing; FC on images has a weight per pixel-pair and explodes in parameters.
- **D.** FC always has fewer parameters on 224×224 images.

**Answer:** C
**Explanation:** Conv uses local kernels and sharing; FC on images has a weight per pixel-pair and explodes in parameters.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **equivariance** and **invariance**?

- **A.** Invariance means the map translates with the cat.
- **B.** Pooling increases equivariance and decreases invariance.
- **C.** Conv feature maps shift with the input (equivariant); pooling/global pooling push toward invariance to small shifts.
- **D.** Equivariance means the output is constant under shifts.

**Answer:** C
**Explanation:** Conv feature maps shift with the input (equivariant); pooling/global pooling push toward invariance to small shifts.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **max-pool** and **strided convolution**?

- **A.** They are dropout.
- **B.** Pool: fixed summary, no extra detector params. Strided conv: learned downsample. Both reduce spatial size.
- **C.** Pool learns a 3×3 kernel.
- **D.** Strided conv cannot downsample.

**Answer:** B
**Explanation:** Pool: fixed summary, no extra detector params. Strided conv: learned downsample. Both reduce spatial size.

### Q25  ·  Intermediate
**Question:** Which option best describes **AlexNet**?

- **A.** ResNet-50.
- **B.** A 1989 5-layer digit net with no ReLU.
- **C.** VGG-16’s 3×3 stack as published in 2012 under the name AlexNet.
- **D.** Krizhevsky et al. 2012 ImageNet winner: deep ReLU conv net (~60 M params), GPU training, dropout — the modern deep-learning inflection.

**Answer:** D
**Explanation:** AlexNet: Krizhevsky et al. 2012 ImageNet winner: deep ReLU conv net (~60 M params), GPU training, dropout — the modern deep-learning inflection.

### Q26  ·  Intermediate
**Question:** Which option best describes **Dilated / atrous convolution**?

- **A.** Inserting gaps in the kernel taps to grow receptive field without extra parameters or pooling loss of resolution.
- **B.** A fully connected layer.
- **C.** Always using stride 3 instead.
- **D.** Max-pool 2×2 only.

**Answer:** A
**Explanation:** Dilated / atrous convolution: Inserting gaps in the kernel taps to grow receptive field without extra parameters or pooling loss of resolution.

### Q27  ·  Intermediate
**Question:** Which option best describes **Efficient convolution**?

- **A.** Implementing conv via im2col+GEMM, FFT, or Winograd to use BLAS/GPUs rather than naive 6-nested loops.
- **B.** Computing conv only on CPU scalars.
- **C.** Replacing conv with an MLP of the same size always.
- **D.** Evaluating each inner product in Python for-loops as the fastest method.

**Answer:** A
**Explanation:** Efficient convolution: Implementing conv via im2col+GEMM, FFT, or Winograd to use BLAS/GPUs rather than naive 6-nested loops.

### Q28  ·  Intermediate
**Question:** Which option best describes **Infinitely strong prior (Goodfellow)**?

- **A.** A weak L2 penalty of λ=10^−8 only.
- **B.** No inductive bias at all.
- **C.** Conv+pool hard-constrain the model: local connectivity, sharing, and a form of invariance — equivalent to a prior that forbids most weight patterns a dense net could learn.
- **D.** Bayesian dropout as the only prior.

**Answer:** C
**Explanation:** Infinitely strong prior (Goodfellow): Conv+pool hard-constrain the model: local connectivity, sharing, and a form of invariance — equivalent to a prior that forbids most weight patterns a dense net could learn.

### Q29  ·  Intermediate
**Question:** Which option best describes **Kernel / filter**?

- **A.** The learning rate.
- **B.** The entire ImageNet dataset.
- **C.** A residual identity skip with no weights ever.
- **D.** A small learnable tensor (e.g. 3×3×C_in) that is the shared parameter of a convolution.

**Answer:** D
**Explanation:** Kernel / filter: A small learnable tensor (e.g. 3×3×C_in) that is the shared parameter of a convolution.

### Q30  ·  Intermediate
**Question:** Which option best describes **Local connectivity**?

- **A.** Each unit looks only at a receptive field, not at the whole image, matching the statistics of natural images.
- **B.** A fully connected ImageNet head as the first layer always.
- **C.** Every unit connects to every pixel as in a first FC layer on raw 224×224×3.
- **D.** Connectivity only through recurrence in time.

**Answer:** A
**Explanation:** Local connectivity: Each unit looks only at a receptive field, not at the whole image, matching the statistics of natural images.

### Q31  ·  Intermediate
**Question:** Which option best describes **Locally connected (unshared) conv**?

- **A.** 1×1 conv that must share.
- **B.** Global average pooling.
- **C.** Standard conv with sharing.
- **D.** Local receptive fields without parameter sharing — more parameters, used when statistics are not translation-stationary (e.g. faces).

**Answer:** D
**Explanation:** Locally connected (unshared) conv: Local receptive fields without parameter sharing — more parameters, used when statistics are not translation-stationary (e.g. faces).

### Q32  ·  Intermediate
**Question:** Which option best describes **Parameter sharing**?

- **A.** The same kernel weights are used at every spatial location, slashing parameter count versus a locally unshared dense layer.
- **B.** Sharing the dropout mask across epochs only.
- **C.** Each pixel having its own unrelated k×k weights (locally connected).
- **D.** Tying the learning rates of two layers.

**Answer:** A
**Explanation:** Parameter sharing: The same kernel weights are used at every spatial location, slashing parameter count versus a locally unshared dense layer.

### Q33  ·  Intermediate
**Question:** Which option best describes **Pooling**?

- **A.** Softmax.
- **B.** A downsample that summarises a local neighbourhood (max or average), providing a bit of translation robustness and smaller maps.
- **C.** A learned 3×3 convolution with no reduction.
- **D.** L2 weight decay.

**Answer:** B
**Explanation:** Pooling: A downsample that summarises a local neighbourhood (max or average), providing a bit of translation robustness and smaller maps.

### Q34  ·  Intermediate
**Question:** Which option best describes **Stride**?

- **A.** Dropout p.
- **B.** The step size with which the kernel moves; stride s downsamples by about s.
- **C.** Padding amount only.
- **D.** The number of filters.

**Answer:** B
**Explanation:** Stride: The step size with which the kernel moves; stride s downsamples by about s.

### Q35  ·  Intermediate
**Question:** Which option best describes **Structured output**?

- **A.** CNN predictions that are not a single class but a tensor with spatial or relational structure (maps, sequences of detections, pixel labels).
- **B.** A scalar MSE only.
- **C.** Dropout p.
- **D.** Always a 1000-way softmax only.

**Answer:** A
**Explanation:** Structured output: CNN predictions that are not a single class but a tensor with spatial or relational structure (maps, sequences of detections, pixel labels).

### Q36  ·  Intermediate
**Question:** Which option best describes **VGG and ResNet**?

- **A.** VGG introduced skip connections; ResNet introduced 11×11 conv as its only idea.
- **B.** ResNet cannot exceed 8 layers.
- **C.** VGG: very deep stacks of 3×3 conv (VGG-16 ~138 M params). ResNet: identity skip connections so 50–152 layers remain trainable (residual learning).
- **D.** VGG-16 has about 60 000 parameters like a tiny MLP.

**Answer:** C
**Explanation:** VGG and ResNet: VGG: very deep stacks of 3×3 conv (VGG-16 ~138 M params). ResNet: identity skip connections so 50–152 layers remain trainable (residual learning).

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **forward convolution (one map)**?

- **A.** Max-pool first with no kernel → then ignore sharing
- **B.** Backprop before the input exists
- **C.** Fully connect every pixel to a unique weight with no reuse
- **D.** Slide kernel with stride s → dot with the receptive field + bias → apply φ → write that pixel of the feature map

**Answer:** D
**Explanation:** Correct sequence for forward convolution (one map): Slide kernel with stride s → dot with the receptive field + bias → apply φ → write that pixel of the feature map

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **im2col convolution**?

- **A.** FFT the labels
- **B.** Pool the GEMM weights
- **C.** Run a bidirectional LSTM on each patch as the definition of im2col
- **D.** Extract patches into a matrix → multiply by a weights matrix (GEMM) → reshape to output maps

**Answer:** D
**Explanation:** Correct sequence for im2col convolution: Extract patches into a matrix → multiply by a weights matrix (GEMM) → reshape to output maps

### Q39  ·  Intermediate
**Question:** Which statement about **1×1 convolution** is FALSE?

- **A.** In this module, 1×1 convolution is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember 1×1 convolution is that it is not the same as “A convolution that is illegal because k=1”.
- **C.** 1×1 conv cannot change the number of channels.
- **D.** 1×1 convolution is correctly understood as: a conv that mixes channels at each location (bottleneck / projection) with kernel spatial size 1.

**Answer:** C
**Explanation:** The false claim is: 1×1 conv cannot change the number of channels.. 1×1 convolution actually means: A conv that mixes channels at each location (bottleneck / projection) with kernel spatial size 1.

### Q40  ·  Intermediate
**Question:** Which statement about **AlexNet** is FALSE?

- **A.** A useful way to remember AlexNet is that it is not the same as “A 1989 5-layer digit net with no ReLU”.
- **B.** AlexNet had fewer than 100 000 parameters and no GPUs.
- **C.** In this module, AlexNet is a core idea students must distinguish from nearby terms.
- **D.** AlexNet is correctly understood as: krizhevsky et al. 2012 ImageNet winner: deep ReLU conv net (~60 M params), GPU training, dropout — the modern deep-learning inflection.

**Answer:** B
**Explanation:** The false claim is: AlexNet had fewer than 100 000 parameters and no GPUs.. AlexNet actually means: Krizhevsky et al. 2012 ImageNet winner: deep ReLU conv net (~60 M params), GPU training, dropout — the modern deep-learning inflection.

### Q41  ·  Intermediate
**Question:** Which statement about **Convolution operation (CNN)** is FALSE?

- **A.** A useful way to remember Convolution operation (CNN) is that it is not the same as “A fully connected multiply of every pixel with every weight, with no sharing”.
- **B.** In this module, Convolution operation (CNN) is a core idea students must distinguish from nearby terms.
- **C.** Convolution in CNNs forbids using the same kernel at more than one spatial location.
- **D.** Convolution operation (CNN) is correctly understood as: a linear operator that slides a small kernel over an input, computing local weighted sums (discrete cross-correlation in most libraries).

**Answer:** C
**Explanation:** The false claim is: Convolution in CNNs forbids using the same kernel at more than one spatial location.. Convolution operation (CNN) actually means: A linear operator that slides a small kernel over an input, computing local weighted sums (discrete cross-correlation in most libraries).

### Q42  ·  Intermediate
**Question:** Which statement about **Dilated / atrous convolution** is FALSE?

- **A.** A useful way to remember Dilated / atrous convolution is that it is not the same as “Always using stride 3 instead”.
- **B.** In this module, Dilated / atrous convolution is a core idea students must distinguish from nearby terms.
- **C.** Dilated / atrous convolution is correctly understood as: inserting gaps in the kernel taps to grow receptive field without extra parameters or pooling loss of resolution.
- **D.** Dilation shrinks the receptive field to 1×1 always.

**Answer:** D
**Explanation:** The false claim is: Dilation shrinks the receptive field to 1×1 always.. Dilated / atrous convolution actually means: Inserting gaps in the kernel taps to grow receptive field without extra parameters or pooling loss of resolution.

### Q43  ·  Intermediate
**Question:** Which statement about **Efficient convolution** is FALSE?

- **A.** FFT convolution is always slower than naive loops for 3×3 kernels on GPUs by a law of nature.
- **B.** A useful way to remember Efficient convolution is that it is not the same as “Evaluating each inner product in Python for-loops as the fastest method”.
- **C.** Efficient convolution is correctly understood as: implementing conv via im2col+GEMM, FFT, or Winograd to use BLAS/GPUs rather than naive 6-nested loops.
- **D.** In this module, Efficient convolution is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: FFT convolution is always slower than naive loops for 3×3 kernels on GPUs by a law of nature.. Efficient convolution actually means: Implementing conv via im2col+GEMM, FFT, or Winograd to use BLAS/GPUs rather than naive 6-nested loops.

### Q44  ·  Intermediate
**Question:** Which statement about **Equivariance to translation** is FALSE?

- **A.** Convolution is invariant, not equivariant, to translation before any pooling.
- **B.** A useful way to remember Equivariance to translation is that it is not the same as “The output is invariant to any permutation of pixels, including shuffles”.
- **C.** In this module, Equivariance to translation is a core idea students must distinguish from nearby terms.
- **D.** Equivariance to translation is correctly understood as: if the input shifts, a convolutional feature map shifts correspondingly (before pooling); conv is an infinitely strong prior that the same detector applies everywhere.

**Answer:** A
**Explanation:** The false claim is: Convolution is invariant, not equivariant, to translation before any pooling.. Equivariance to translation actually means: If the input shifts, a convolutional feature map shifts correspondingly (before pooling); conv is an infinitely strong prior that the same detector applies everywhere.

### Q45  ·  Intermediate
**Question:** Which statement about **Local connectivity** is FALSE?

- **A.** Local connectivity is correctly understood as: each unit looks only at a receptive field, not at the whole image, matching the statistics of natural images.
- **B.** A useful way to remember Local connectivity is that it is not the same as “Every unit connects to every pixel as in a first FC layer on raw 224×224×3”.
- **C.** Local connectivity means a 3×3 conv on ImageNet is illegal.
- **D.** In this module, Local connectivity is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Local connectivity means a 3×3 conv on ImageNet is illegal.. Local connectivity actually means: Each unit looks only at a receptive field, not at the whole image, matching the statistics of natural images.

### Q46  ·  Intermediate
**Question:** Which statement about **Pooling** is FALSE?

- **A.** In this module, Pooling is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Pooling is that it is not the same as “A learned 3×3 convolution with no reduction”.
- **C.** Pooling is correctly understood as: a downsample that summarises a local neighbourhood (max or average), providing a bit of translation robustness and smaller maps.
- **D.** Pooling increases the spatial size of feature maps by design.

**Answer:** D
**Explanation:** The false claim is: Pooling increases the spatial size of feature maps by design.. Pooling actually means: A downsample that summarises a local neighbourhood (max or average), providing a bit of translation robustness and smaller maps.

### Q47  ·  Intermediate
**Question:** Which statement about **Stride** is FALSE?

- **A.** Stride is always 1 and cannot change the output map size.
- **B.** Stride is correctly understood as: the step size with which the kernel moves; stride s downsamples by about s.
- **C.** A useful way to remember Stride is that it is not the same as “The number of filters”.
- **D.** In this module, Stride is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Stride is always 1 and cannot change the output map size.. Stride actually means: The step size with which the kernel moves; stride s downsamples by about s.

### Q48  ·  Intermediate
**Question:** Winograd and FFT methods exist because:

- **A.** Naive convolution is computationally heavy; algebraic/GEMM/FFT factorisations reuse work
- **B.** They replace backprop
- **C.** They compute dropout masks
- **D.** They train the perceptron

**Answer:** A
**Explanation:** Efficient convolution algorithms.

### Q49  ·  Intermediate
**Question:** You need output 32×32 from input 32×32 with 3×3 kernels. Set:

- **A.** p=0, s=1
- **B.** p=2, s=3
- **C.** p=0, s=2
- **D.** p=1, s=1

**Answer:** D
**Explanation:** (32+2−3)+1=32.

### Q50  ·  Difficult
**Question:** A 2012 ImageNet result used ReLU, dropout, and two GPUs. Landmark net:

- **A.** AlexNet
- **B.** ResNet-152
- **C.** VGG-19 as published in 1998
- **D.** LeNet-5 on MNIST only

**Answer:** A
**Explanation:** History of DL.

### Q51  ·  Difficult
**Question:** A 3×3 conv, 256→256, bias on, parameter count is:

- **A.** 256
- **B.** 65 536
- **C.** 9
- **D.** 590 080

**Answer:** D
**Explanation:** 9×256×256 + 256 = 589824+256=590080.

### Q52  ·  Difficult
**Question:** A 3×3 conv, 64 input channels, 128 output channels, plus bias, has how many parameters?

- **A.** 73 856
- **B.** 128
- **C.** 3 072
- **D.** 576

**Answer:** A
**Explanation:** 3×3×64×128 + 128 = 73728+128=73856.

### Q53  ·  Difficult
**Question:** After conv, a 2×2 max-pool stride 2 is inserted. Immediate effects:

- **A.** Maps double in width
- **B.** Parameter count of the pool kernel is 3×3×C×C
- **C.** Equivariance becomes a fully connected mix of all pixels
- **D.** Spatial size halves; small translations of a max peak are tolerated

**Answer:** D
**Explanation:** Pooling role.

### Q54  ·  Difficult
**Question:** AlexNet is classically cited as having about how many parameters?

- **A.** 1 million
- **B.** 138 million
- **C.** 60 million
- **D.** 60 thousand

**Answer:** C
**Explanation:** ~60 M (Krizhevsky 2012). VGG-16 is the ~138 M one.

### Q55  ·  Difficult
**Question:** Detecting a logo anywhere on a slide. Convolution helps because:

- **A.** Pooling is forbidden
- **B.** The same detector is applied at every location (sharing / equivariance)
- **C.** Each location is forced to use a unique unshared kernel
- **D.** The net is fully connected on pixels

**Answer:** B
**Explanation:** Translation prior.

### Q56  ·  Difficult
**Question:** Input 32×32, kernel 3×3, pad 1, stride 1. Output spatial size is:

- **A.** 32×32
- **B.** 16×16
- **C.** 30×30
- **D.** 34×34

**Answer:** A
**Explanation:** (32+2−3)/1+1=32 (same convolution).

### Q57  ·  Difficult
**Question:** Input 32×32, kernel 3×3, pad 1, stride 2. Output spatial size is:

- **A.** 17×17
- **B.** 16×16
- **C.** 32×32
- **D.** 8×8

**Answer:** B
**Explanation:** (32+2−3)/2+1=16.

### Q58  ·  Difficult
**Question:** Input 32×32, kernel 5×5, pad 0, stride 1. Spatial output size (n−k)/s+1 is:

- **A.** 27×27
- **B.** 5×5
- **C.** 32×32
- **D.** 28×28

**Answer:** D
**Explanation:** (32−5)/1+1=28. (LeNet C1 on 32×32.)

### Q59  ·  Difficult
**Question:** LeNet-style first layer: 1 input channel, six 5×5 filters, biases. Parameters:

- **A.** 156
- **B.** 150
- **C.** 6
- **D.** 25

**Answer:** A
**Explanation:** 5×5×1×6 + 6 = 156.

### Q60  ·  Difficult
**Question:** Max-pool 2×2 with stride 2 on a 28×28 map yields:

- **A.** 28×28
- **B.** 14×14
- **C.** 7×7
- **D.** 27×27

**Answer:** B
**Explanation:** Halve each spatial dimension.

### Q61  ·  Difficult
**Question:** Receptive field is too small at high resolution. A cheap expansion without pooling is:

- **A.** Dropout p=0
- **B.** Stride 0
- **C.** Forcing FC on 224×224
- **D.** Dilated convolution

**Answer:** D
**Explanation:** Atrous/dilated variant.

### Q62  ·  Difficult
**Question:** Semantic segmentation emits a class per pixel. This is a CNN:

- **A.** A perceptron on XOR
- **B.** Structured (spatial) output, not a single image-level label
- **C.** Scalar regression of one number only
- **D.** An LSTM language model

**Answer:** B
**Explanation:** Goodfellow structured outputs.

### Q63  ·  Difficult
**Question:** VGG-style 3×3 conv 64→64 with bias. Parameters:

- **A.** 9
- **B.** 4096
- **C.** 64
- **D.** 36 928

**Answer:** D
**Explanation:** 3×3×64×64 + 64 = 36864+64=36928.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **LeNet** and **AlexNet**?

- **A.** LeNet had 60 M parameters.
- **B.** AlexNet predates LeNet.
- **C.** LeNet: small digit CNNs in the 90s. AlexNet: 2012 ImageNet, ReLU, dropout, GPUs, ~60 M params.
- **D.** They are both ResNets.

**Answer:** C
**Explanation:** LeNet: small digit CNNs in the 90s. AlexNet: 2012 ImageNet, ReLU, dropout, GPUs, ~60 M params.

### Q65  ·  Difficult
**Question:** What is the most important distinction between **naive nested-loop conv** and **im2col / Winograd / FFT**?

- **A.** Naive Python loops are the GPU standard.
- **B.** FFT cannot implement convolution in theory.
- **C.** Naive is simple and slow; im2col uses GEMM; Winograd shines at 3×3; FFT at larger kernels.
- **D.** Winograd only works for RNNs.

**Answer:** C
**Explanation:** Naive is simple and slow; im2col uses GEMM; Winograd shines at 3×3; FFT at larger kernels.

### Q66  ·  Difficult
**Question:** What is the most important distinction between **parameter sharing** and **locally connected unshared**?

- **A.** Unshared always has fewer weights.
- **B.** Sharing forbids using a kernel at two locations.
- **C.** They are 1×1 pooling.
- **D.** Sharing: one kernel everywhere (translation prior). Unshared: different kernels per location (more params).

**Answer:** D
**Explanation:** Sharing: one kernel everywhere (translation prior). Unshared: different kernels per location (more params).

### Q67  ·  Difficult
**Question:** What is the most important distinction between **stride 1** and **stride 2**?

- **A.** They differ only in padding.
- **B.** Stride 2 always increases map size.
- **C.** Stride cannot appear in the output-size formula.
- **D.** Stride 2 roughly halves spatial size (with suitable k,p); stride 1 preserves more resolution.

**Answer:** D
**Explanation:** Stride 2 roughly halves spatial size (with suitable k,p); stride 1 preserves more resolution.

### Q68  ·  Difficult
**Question:** Which statement about **Feature map** is FALSE?

- **A.** A feature map is the 1000-vector of ImageNet class logits only.
- **B.** In this module, Feature map is a core idea students must distinguish from nearby terms.
- **C.** Feature map is correctly understood as: the spatial output of one filter across the image; depth is the number of filters.
- **D.** A useful way to remember Feature map is that it is not the same as “The scalar loss”.

**Answer:** A
**Explanation:** The false claim is: A feature map is the 1000-vector of ImageNet class logits only.. Feature map actually means: The spatial output of one filter across the image; depth is the number of filters.

### Q69  ·  Difficult
**Question:** Which statement about **Infinitely strong prior (Goodfellow)** is FALSE?

- **A.** In this module, Infinitely strong prior (Goodfellow) is a core idea students must distinguish from nearby terms.
- **B.** Infinitely strong prior (Goodfellow) is correctly understood as: conv+pool hard-constrain the model: local connectivity, sharing, and a form of invariance — equivalent to a prior that forbids most weight patterns a dense net could learn.
- **C.** A useful way to remember Infinitely strong prior (Goodfellow) is that it is not the same as “A weak L2 penalty of λ=10^−8 only”.
- **D.** CNNs are infinitely weakly biased compared with MLPs on images.

**Answer:** D
**Explanation:** The false claim is: CNNs are infinitely weakly biased compared with MLPs on images.. Infinitely strong prior (Goodfellow) actually means: Conv+pool hard-constrain the model: local connectivity, sharing, and a form of invariance — equivalent to a prior that forbids most weight patterns a dense net could learn.

### Q70  ·  Difficult
**Question:** Which statement about **Kernel / filter** is FALSE?

- **A.** A useful way to remember Kernel / filter is that it is not the same as “The entire ImageNet dataset”.
- **B.** A kernel is a unique unshared weight tensor at every spatial position by definition of convolution.
- **C.** Kernel / filter is correctly understood as: a small learnable tensor (e.g. 3×3×C_in) that is the shared parameter of a convolution.
- **D.** In this module, Kernel / filter is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A kernel is a unique unshared weight tensor at every spatial position by definition of convolution.. Kernel / filter actually means: A small learnable tensor (e.g. 3×3×C_in) that is the shared parameter of a convolution.

### Q71  ·  Difficult
**Question:** Which statement about **LeNet-5** is FALSE?

- **A.** LeNet-5 is correctly understood as: leCun et al.’s 1990s conv net for digits: conv–pool–conv–pool–FC, a foundation of deep learning history.
- **B.** A useful way to remember LeNet-5 is that it is not the same as “The 2012 ImageNet winner with 60 M weights”.
- **C.** LeNet-5 is a transformer language model from 2017.
- **D.** In this module, LeNet-5 is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: LeNet-5 is a transformer language model from 2017.. LeNet-5 actually means: LeCun et al.’s 1990s conv net for digits: conv–pool–conv–pool–FC, a foundation of deep learning history.

### Q72  ·  Difficult
**Question:** Which statement about **Locally connected (unshared) conv** is FALSE?

- **A.** Locally connected (unshared) conv is correctly understood as: local receptive fields without parameter sharing — more parameters, used when statistics are not translation-stationary (e.g. faces).
- **B.** Unshared locally connected layers have fewer parameters than shared conv.
- **C.** In this module, Locally connected (unshared) conv is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Locally connected (unshared) conv is that it is not the same as “Standard conv with sharing”.

**Answer:** B
**Explanation:** The false claim is: Unshared locally connected layers have fewer parameters than shared conv.. Locally connected (unshared) conv actually means: Local receptive fields without parameter sharing — more parameters, used when statistics are not translation-stationary (e.g. faces).

### Q73  ·  Difficult
**Question:** Which statement about **Padding** is FALSE?

- **A.** In this module, Padding is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Padding is that it is not the same as “Removing the kernel’s centre tap”.
- **C.** Padding is correctly understood as: adding border units (often zeros) so output width can be preserved (same) or valid (no pad) as designed.
- **D.** Padding is illegal in convolution because it would change (n+2p−k)/s+1.

**Answer:** D
**Explanation:** The false claim is: Padding is illegal in convolution because it would change (n+2p−k)/s+1.. Padding actually means: Adding border units (often zeros) so output width can be preserved (same) or valid (no pad) as designed.

### Q74  ·  Difficult
**Question:** Which statement about **Parameter sharing** is FALSE?

- **A.** Parameter sharing is correctly understood as: the same kernel weights are used at every spatial location, slashing parameter count versus a locally unshared dense layer.
- **B.** In this module, Parameter sharing is a core idea students must distinguish from nearby terms.
- **C.** Parameter sharing means every layer must have identical shape to the input image.
- **D.** A useful way to remember Parameter sharing is that it is not the same as “Each pixel having its own unrelated k×k weights (locally connected)”.

**Answer:** C
**Explanation:** The false claim is: Parameter sharing means every layer must have identical shape to the input image.. Parameter sharing actually means: The same kernel weights are used at every spatial location, slashing parameter count versus a locally unshared dense layer.

### Q75  ·  Difficult
**Question:** Which statement about **Structured output** is FALSE?

- **A.** Structured output is correctly understood as: cNN predictions that are not a single class but a tensor with spatial or relational structure (maps, sequences of detections, pixel labels).
- **B.** CNNs cannot emit per-pixel maps, only one label per dataset.
- **C.** In this module, Structured output is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Structured output is that it is not the same as “Always a 1000-way softmax only”.

**Answer:** B
**Explanation:** The false claim is: CNNs cannot emit per-pixel maps, only one label per dataset.. Structured output actually means: CNN predictions that are not a single class but a tensor with spatial or relational structure (maps, sequences of detections, pixel labels).

### Q76  ·  Difficult
**Question:** Which statement about **VGG and ResNet** is FALSE?

- **A.** A useful way to remember VGG and ResNet is that it is not the same as “VGG introduced skip connections; ResNet introduced 11×11 conv as its only idea”.
- **B.** In this module, VGG and ResNet is a core idea students must distinguish from nearby terms.
- **C.** VGG and ResNet is correctly understood as: vGG: very deep stacks of 3×3 conv (VGG-16 ~138 M params). ResNet: identity skip connections so 50–152 layers remain trainable (residual learning).
- **D.** ResNet’s skips make convolution illegal.

**Answer:** D
**Explanation:** The false claim is: ResNet’s skips make convolution illegal.. VGG and ResNet actually means: VGG: very deep stacks of 3×3 conv (VGG-16 ~138 M params). ResNet: identity skip connections so 50–152 layers remain trainable (residual learning).

### Q77  ·  Difficult
**Question:** ‘Convolution and pooling as an infinitely strong prior’ means:

- **A.** Bayesian dropout with p=0
- **B.** The architecture forbids the dense-net weight patterns that would violate locality/sharing/invariance
- **C.** No inductive bias relative to an MLP
- **D.** λ→∞ on every weight including the kernel

**Answer:** B
**Explanation:** Goodfellow Ch. 9 view.

---

## Quick answer key

Q01–C | Q02–B | Q03–B | Q04–C | Q05–B | Q06–B | Q07–B | Q08–B | Q09–A | Q10–D | Q11–B | Q12–C | Q13–B | Q14–C | Q15–A | Q16–D | Q17–B | Q18–A | Q19–D | Q20–B | Q21–D | Q22–C | Q23–C | Q24–B | Q25–D | Q26–A | Q27–A | Q28–C | Q29–D | Q30–A | Q31–D | Q32–A | Q33–B | Q34–B | Q35–A | Q36–C | Q37–D | Q38–D | Q39–C | Q40–B | Q41–C | Q42–D | Q43–A | Q44–A | Q45–C | Q46–D | Q47–A | Q48–A | Q49–D | Q50–A | Q51–D | Q52–A | Q53–D | Q54–C | Q55–B | Q56–A | Q57–B | Q58–D | Q59–A | Q60–B | Q61–D | Q62–B | Q63–D | Q64–C | Q65–C | Q66–D | Q67–D | Q68–A | Q69–D | Q70–B | Q71–C | Q72–B | Q73–D | Q74–C | Q75–B | Q76–D | Q77–B
