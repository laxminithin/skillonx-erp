# Assignment — Parallel Computing — Module 5 — GPU Programming with CUDA

**Subject:** Parallel Computing  
**Module:** Module 5 — GPU Programming with CUDA  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain grid, block and thread with a 1D vector of N elements.

**Expected Key Points:**
- Choose block=256, grid=ceil(N/256).
- i=blockIdx.x*blockDim.x+threadIdx.x; guard i<N.
- Block is the unit of shared mem/sync.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is compute capability? Name two limits it affects.

**Expected Key Points:**
- Architecture version.
- Max threads/block, shared mem/SM, occupancy, tensor cores, etc.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** List CUDA memory types and one property each.

**Expected Key Points:**
- Register: fastest, occupancy.
- Local: spill DRAM.
- Shared: block scratch.
- Global: large slow.
- Constant/texture: cached read-only.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a kernel? How is it launched?

**Expected Key Points:**
- __global__ void k(...); k<<<grid,block>>>(args); asynchronous wrt host until sync/copy.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write a complete vector-add flow (malloc, copy, launch, copy back) in pseudocode.

**Expected Key Points:**
- Allocate host+device; H2D A,B; launch; D2H C; compare vs CPU; free.
- Mention error checks.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Coalesced vs strided global loads with a 32-thread warp example.

**Expected Key Points:**
- A[i] consecutive: one 128-byte transaction class.
- A[i*32]: up to 32 transactions.
- Relate to SoA vs AoS.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Shared memory: when to use it for a 1D stencil.

**Expected Key Points:**
- Load tile+halos, syncthreads, reuse neighbours from SRAM instead of DRAM.
- Watch bank conflicts.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO3
**Question:** atomicAdd of n values vs block reduction + one atomic per block.

**Expected Key Points:**
- n atomics contend on one address.
- Block tree is O(log threads) in shared, then ~n/block atomics.
- CUB/warp shuffles.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** N=10^6, block=256. Grid? Warps/block? If 20 SMs with 64 warp slots, can this kernel fill the GPU? Discuss.

**Expected Key Points:**
- Grid=3907 blocks.
- 8 warps/block.
- Many more warps than 20*64=1280 slots; the device timeslices.
- Occupancy depends on resources not on grid size once enough blocks exist.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design a GPU trapezoidal integrator: mapping, reduction, copies, comparison to OpenMP/MPI versions.

**Expected Key Points:**
- Threads sample x_i; shared reduce; device reduce; copies of n vs of 1.
- When GPU wins (large n).
- Errors vs CPU reference.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Student uses block=32, grid=1 for a 10M SAXPY. Critique occupancy and latency hiding.

**Expected Key Points:**
- Only 1 warp resident if one block on one SM; rest of GPU idle.
- Need enough blocks to fill SMs and hide latency.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Tiled matrix multiply in CUDA: tile size, shared mem footprint, syncthreads, bounds.

**Expected Key Points:**
- TILE=32; As,Bs[TILE][TILE]; loops over tiles; 2 syncthreads; Cij accumulate; occupancy vs 48 KB.
- Contrast naive global triple loop.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List host API calls used in a minimal CUDA program.

**Expected Key Points:**
- cudaMalloc, cudaMemcpy, kernel<<<>>>, cudaDeviceSynchronize or memcpy sync, cudaFree, cudaGetLastError.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is occupancy and how registers and shared memory reduce it.

**Expected Key Points:**
- Resident warps / max.
- More registers/thread ⇒ fewer threads.
- More __shared__/block ⇒ fewer blocks/SM.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Warp divergence with a per-thread if (A[i]>0). When is it cheap?

**Expected Key Points:**
- Cheap if most of the warp takes the same path (sorted data, predicates).
- Expensive if random 50/50.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** Kernel correct on N=256, wrong on N=300. Likely bug.

**Expected Key Points:**
- Missing i<N guard; wrong grid ceil; uninitialised tail; shared tile halo; using threadIdx as global index only.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** Lab: vector add break-even N vs CPU; then add a fused saxpy+scale kernel to cut copies. Rubric.

**Expected Key Points:**
- Plot T vs N; include memcpy; fused kernel keeps data on device.
- Marks for events, errors, occupancy note.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** __syncthreads vs grid-level sync (cooperative groups / multiple kernels).

**Expected Key Points:**
- Block barrier is cheap and always there.
- Grid sync needs special launch or kernel split (global mem visible after kernel).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘GPUs reward regular, coalesced, high-arithmetic-intensity work.’ Discuss with vector add vs stencil vs irregular graph walk.

**Expected Key Points:**
- SAXPY: bandwidth-bound.
- Stencil: tiling helps.
- Graphs: divergence, uncoalesced, often CPU or special kernels.
- Occupancy ≠ enough.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** What does GPGPU mean, and why did CUDA make it mainstream?

**Expected Key Points:**
- General-purpose GPU.
- CUDA C with explicit kernels/memory beat the old GPGPU-via-shaders approach for HPC teaching and industry.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 GPU Programming with CUDA).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast GPU and Programming in the context of GPU Programming with CUDA. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Parallel Computing scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of GPU as used in GPU Programming with CUDA. Include one precise example.

**Model answer:** GPU is a foundational construct in GPU Programming with CUDA. Example should name entities/operations and relate to Programming. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on GPU and Programming. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with GPU Programming with CUDA theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply with to a realistic campus/industry scenario relevant to GPU Programming with CUDA. State assumptions.

**Model answer:** Describe scenario, map concepts (GPU, Programming), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Programming and its role within GPU Programming with CUDA.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to GPU if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to CUDA within GPU Programming with CUDA; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies GPU while building a solution involving CUDA. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using GPU Programming with CUDA principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying with in Parallel Computing.

**Model answer:** Provide four definitions: include GPU, Programming, and two adjacent terms from GPU Programming with CUDA. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in GPU Programming with CUDA that integrates GPU, Programming, and with.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Programming in GPU Programming with CUDA.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to GPU.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both GPU and GPU Programming. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving GPU and with: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from GPU Programming with CUDA, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling with under constraints typical of Parallel Computing.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how CUDA depends on earlier ideas such as GPU in GPU Programming with CUDA.

**Model answer:** Dependency chain with one counterexample showing what fails if GPU is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where GPU Programming measurably improves an outcome in Parallel Computing.

**Model answer:** Context, intervention using GPU Programming, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Programming in GPU Programming with CUDA. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with GPU in GPU Programming with CUDA: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Parallel Computing.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to with for GPU Programming with CUDA.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of with.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Programming in GPU Programming with CUDA. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about GPU in GPU Programming with CUDA, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

