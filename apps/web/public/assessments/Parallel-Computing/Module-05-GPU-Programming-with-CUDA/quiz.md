# Quiz — Parallel Computing — Module 5: GPU Programming with CUDA

**Subject:** Parallel Computing  
**Module:** Module 5 — GPU Programming with CUDA  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A typical CUDA launch configuration is:

- **A.** <<<number of blocks, threads per block>>>
- **B.** pragma omp cuda
- **C.** a DFA 5-tuple
- **D.** <<<MPI ranks>>>

**Answer:** A
**Explanation:** Execution configuration.

### Q02  ·  Easy
**Question:** Threads in the same block can communicate via:

- **A.** __shared__ memory and __syncthreads
- **B.** Host malloc without maps
- **C.** OpenMP critical on the device by default
- **D.** MPI_Send inside the kernel as the only method

**Answer:** A
**Explanation:** Block-local scratchpad.

### Q03  ·  Easy
**Question:** Warp size on NVIDIA CUDA is:

- **A.** 8
- **B.** 1024
- **C.** 32
- **D.** 16

**Answer:** C
**Explanation:** SIMT group.

### Q04  ·  Easy
**Question:** Which option best describes **GPGPU**?

- **A.** MPI on Ethernet exclusively.
- **B.** Using a GPU for general-purpose data-parallel computation, not only graphics.
- **C.** Graphics-only rasterisation.
- **D.** OpenMP on a CPU socket only.

**Answer:** B
**Explanation:** GPGPU: Using a GPU for general-purpose data-parallel computation, not only graphics.

### Q05  ·  Easy
**Question:** Which option best describes **Grid**?

- **A.** Host threads.
- **B.** A single warp.
- **C.** The set of blocks launched for one kernel, identified by blockIdx.
- **D.** An OpenMP taskpool.

**Answer:** C
**Explanation:** Grid: The set of blocks launched for one kernel, identified by blockIdx.

### Q06  ·  Easy
**Question:** Which option best describes **Kernel**?

- **A.** A __host__-only C function.
- **B.** An OpenMP barrier.
- **C.** A __global__ function launched from the host to run on many GPU threads.
- **D.** An MPI_Reduce.

**Answer:** C
**Explanation:** Kernel: A __global__ function launched from the host to run on many GPU threads.

### Q07  ·  Easy
**Question:** Which option best describes **Occupancy**?

- **A.** OpenMP schedule chunk.
- **B.** Active warps per SM divided by the hardware maximum; limited by threads, registers, shared mem, blocks.
- **C.** MPI efficiency S/p.
- **D.** PCIe generation.

**Answer:** B
**Explanation:** Occupancy: Active warps per SM divided by the hardware maximum; limited by threads, registers, shared mem, blocks.

### Q08  ·  Easy
**Question:** Which option best describes **Register**?

- **A.** Host AVX registers used by GPU lanes.
- **B.** Global DRAM.
- **C.** MPI tags.
- **D.** The fastest per-thread storage; too many per thread limits occupancy.

**Answer:** D
**Explanation:** Register: The fastest per-thread storage; too many per thread limits occupancy.

### Q09  ·  Easy
**Question:** Which option best describes **Shared memory**?

- **A.** Host RAM.
- **B.** On-chip per-block scratchpad (__shared__), low latency, software-managed, banked.
- **C.** Constant cache only.
- **D.** Device DRAM.

**Answer:** B
**Explanation:** Shared memory: On-chip per-block scratchpad (__shared__), low latency, software-managed, banked.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **CUDA vector add**?

- **A.** OpenMP reduce on device pointers without a kernel
- **B.** cudaMalloc A,B,C → memcpy H2D → launch <<<grid,block>>> → memcpy D2H → cudaFree
- **C.** Launch before malloc
- **D.** D2H then kernel then H2D

**Answer:** B
**Explanation:** Correct sequence for CUDA vector add: cudaMalloc A,B,C → memcpy H2D → launch <<<grid,block>>> → memcpy D2H → cudaFree

### Q11  ·  Easy
**Question:** Which sequence correctly describes **occupancy-limited launch check**?

- **A.** Ignore cudaGetDeviceProperties
- **B.** Always 1024 threads and 48 KB shared without checking
- **C.** Set grid=1, block=1 for HPC
- **D.** Read CC limits → pick block size multiple of 32 → estimate registers/shared → compute resident warps/SM → adjust

**Answer:** D
**Explanation:** Correct sequence for occupancy-limited launch check: Read CC limits → pick block size multiple of 32 → estimate registers/shared → compute resident warps/SM → adjust

### Q12  ·  Easy
**Question:** cudaMalloc allocates:

- **A.** __shared__ that persists after the kernel
- **B.** MPI windows only
- **C.** Host OpenMP private stacks
- **D.** Device global memory

**Answer:** D
**Explanation:** Device DRAM.

### Q13  ·  Intermediate
**Question:** Compute capability is used to know:

- **A.** Hardware limits (e.g. max threads per block, shared mem per SM)
- **B.** MPI tag space
- **C.** OpenMP nested level only
- **D.** The C++ standard

**Answer:** A
**Explanation:** Device arch.

### Q14  ·  Intermediate
**Question:** Global index i for a 1D grid is:

- **A.** blockIdx.x*blockDim.x + threadIdx.x
- **B.** threadIdx.x only
- **C.** warpSize*omp_get_num_threads()
- **D.** blockIdx.x only

**Answer:** A
**Explanation:** Standard idiom.

### Q15  ·  Intermediate
**Question:** Kernel launch with more than 1024 threads per block (on typical devices). Result?

- **A.** Launch failure / invalid config (limit often 1024)
- **B.** Automatic split to 2 SMs without error
- **C.** MPI_Abort
- **D.** OpenMP fallback

**Answer:** A
**Explanation:** Check compute-capability limits.

### Q16  ·  Intermediate
**Question:** Local memory in CUDA is:

- **A.** The same as __shared__
- **B.** Faster than registers
- **C.** Host RAM
- **D.** Per-thread DRAM spill, not ‘fast local SRAM’

**Answer:** D
**Explanation:** The name misleads students.

### Q17  ·  Intermediate
**Question:** N=100 vector add including H2D/D2H of 100 floats. GPU is slower than CPU. Why?

- **A.** GPUs cannot add floats
- **B.** Occupancy 100% forbids SAXPY
- **C.** Launch + copy overhead dominate tiny n
- **D.** Amdahl s=0

**Answer:** C
**Explanation:** Break-even size.

### Q18  ·  Intermediate
**Question:** Uncoalesced: thread i reads A[i*1000]. Effect?

- **A.** Many small DRAM transactions, low bandwidth
- **B.** Shared-memory broadcast
- **C.** A compile error
- **D.** Perfect coalescing

**Answer:** A
**Explanation:** Strided global loads.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **__global__** and **__device__**?

- **A.** __global__ runs on the CPU.
- **B.** __global__ is a kernel launched from the host (or other kernels); __device__ is GPU-callable only.
- **C.** __device__ launches from main().
- **D.** They are identical.

**Answer:** B
**Explanation:** __global__ is a kernel launched from the host (or other kernels); __device__ is GPU-callable only.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **cudaMemcpy H2D** and **kernel compute**?

- **A.** Copies move bytes over PCIe; kernels use device memory already on the GPU.
- **B.** H2D is a register move.
- **C.** They have equal GB/s to shared mem.
- **D.** Kernels run during H2D automatically always.

**Answer:** A
**Explanation:** Copies move bytes over PCIe; kernels use device memory already on the GPU.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **global memory** and **shared memory**?

- **A.** Shared is DRAM.
- **B.** Global is on-chip scratchpad.
- **C.** They have the same latency.
- **D.** Global: large, slow, grid-visible. Shared: small, fast, block-visible.

**Answer:** D
**Explanation:** Global: large, slow, grid-visible. Shared: small, fast, block-visible.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **occupancy** and **coalescing**?

- **A.** Occupancy is PCIe.
- **B.** Coalescing is register count.
- **C.** Occupancy: how many warps reside. Coalescing: how they access global memory.
- **D.** They are the same metric.

**Answer:** C
**Explanation:** Occupancy: how many warps reside. Coalescing: how they access global memory.

### Q23  ·  Intermediate
**Question:** Which option best describes **Block**?

- **A.** A warp of SMs.
- **B.** A group of threads that can synchronise with __syncthreads and share __shared__ memory.
- **C.** A grid of grids.
- **D.** An MPI communicator of nodes.

**Answer:** B
**Explanation:** Block: A group of threads that can synchronise with __syncthreads and share __shared__ memory.

### Q24  ·  Intermediate
**Question:** Which option best describes **CUDA**?

- **A.** An MPI communicator.
- **B.** NVIDIA’s parallel programming model: kernels, grids of blocks of threads, host API.
- **C.** A DFA.
- **D.** An OpenMP clause.

**Answer:** B
**Explanation:** CUDA: NVIDIA’s parallel programming model: kernels, grids of blocks of threads, host API.

### Q25  ·  Intermediate
**Question:** Which option best describes **Coalesced access**?

- **A.** Warps that hit consecutive aligned global addresses so memory transactions fuse.
- **B.** Random per-thread gathers that are always free.
- **C.** A host malloc pattern.
- **D.** Shared-memory bank conflicts by definition.

**Answer:** A
**Explanation:** Coalesced access: Warps that hit consecutive aligned global addresses so memory transactions fuse.

### Q26  ·  Intermediate
**Question:** Which option best describes **Compute capability**?

- **A.** OpenMP 3.0 vs 4.0 only.
- **B.** A device’s architecture version (e.g. 7.5) that dictates limits (threads/block, shared mem, …).
- **C.** A wall-clock.
- **D.** The MPI standard year.

**Answer:** B
**Explanation:** Compute capability: A device’s architecture version (e.g. 7.5) that dictates limits (threads/block, shared mem, …).

### Q27  ·  Intermediate
**Question:** Which option best describes **Constant memory**?

- **A.** Read-only cached memory for data that does not change during a kernel, broadcast-friendly.
- **B.** Registers.
- **C.** Shared memory banks.
- **D.** Writeable by every thread every cycle without cost.

**Answer:** A
**Explanation:** Constant memory: Read-only cached memory for data that does not change during a kernel, broadcast-friendly.

### Q28  ·  Intermediate
**Question:** Which option best describes **Global memory**?

- **A.** Per-thread registers.
- **B.** __shared__ on-chip only.
- **C.** Large off-chip device DRAM, visible to all threads, high latency, needs coalescing.
- **D.** Host-only malloc without cudaMalloc.

**Answer:** C
**Explanation:** Global memory: Large off-chip device DRAM, visible to all threads, high latency, needs coalescing.

### Q29  ·  Intermediate
**Question:** Which option best describes **Local memory**?

- **A.** On-chip shared memory.
- **B.** Host stack.
- **C.** Per-thread spilling/arrays that live in device DRAM (despite the name), not in registers.
- **D.** MPI buffers.

**Answer:** C
**Explanation:** Local memory: Per-thread spilling/arrays that live in device DRAM (despite the name), not in registers.

### Q30  ·  Intermediate
**Question:** Which option best describes **Thread**?

- **A.** An MPI process on a node.
- **B.** The finest CUDA execution agent, with its own registers and threadIdx.
- **C.** A whole SM.
- **D.** A host process only.

**Answer:** B
**Explanation:** Thread: The finest CUDA execution agent, with its own registers and threadIdx.

### Q31  ·  Intermediate
**Question:** Which option best describes **Trapezoidal on GPU**?

- **A.** Threads compute f(x_i) in parallel; a reduction (shared-mem tree or atomic/CUB) sums them.
- **B.** Only thread 0 evaluates all n points.
- **C.** A DFA.
- **D.** MPI_Scatter on device DRAM without a kernel.

**Answer:** A
**Explanation:** Trapezoidal on GPU: Threads compute f(x_i) in parallel; a reduction (shared-mem tree or atomic/CUB) sums them.

### Q32  ·  Intermediate
**Question:** Which option best describes **Vector add kernel**?

- **A.** Each thread computes one (or a stride of) i: C[i]=A[i]+B[i] using a global index.
- **B.** OpenMP critical per element required.
- **C.** An MPI_Allreduce of the vector.
- **D.** One thread adds the whole vector.

**Answer:** A
**Explanation:** Vector add kernel: Each thread computes one (or a stride of) i: C[i]=A[i]+B[i] using a global index.

### Q33  ·  Intermediate
**Question:** Which option best describes **__syncthreads**?

- **A.** Grid-wide barrier in all CUDA versions without coop groups.
- **B.** MPI_Barrier on the host.
- **C.** An atomicAdd.
- **D.** Barrier among threads of one block; all must reach it (same control-flow path).

**Answer:** D
**Explanation:** __syncthreads: Barrier among threads of one block; all must reach it (same control-flow path).

### Q34  ·  Intermediate
**Question:** Which option best describes **threadIdx / blockIdx / blockDim**?

- **A.** Built-ins that give a thread’s coordinates so it can compute a global index.
- **B.** PCIe BAR addresses.
- **C.** MPI ranks.
- **D.** OpenMP private copies.

**Answer:** A
**Explanation:** threadIdx / blockIdx / blockDim: Built-ins that give a thread’s coordinates so it can compute a global index.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **GPU trapezoidal**?

- **A.** MPI_Allreduce on host floats without copies
- **B.** printf every f(x_i) from the device as the reduction
- **C.** Thread 0 loops i=0..n-1 on the device
- **D.** Map threads to sample points → store f(x_i) → block reduce in shared → atomicAdd/global write of block sums → host or second kernel finishes

**Answer:** D
**Explanation:** Correct sequence for GPU trapezoidal: Map threads to sample points → store f(x_i) → block reduce in shared → atomicAdd/global write of block sums → host or second kernel finishes

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **shared-memory tile stencil (block)**?

- **A.** Grid-wide syncthreads
- **B.** Compute before the load
- **C.** Load halo+tile to __shared__ → __syncthreads → compute from shared → write global
- **D.** Skip the barrier when some threads skip the load

**Answer:** C
**Explanation:** Correct sequence for shared-memory tile stencil (block): Load halo+tile to __shared__ → __syncthreads → compute from shared → write global

### Q37  ·  Intermediate
**Question:** Which statement about **Coalesced access** is FALSE?

- **A.** Coalesced access is correctly understood as: warps that hit consecutive aligned global addresses so memory transactions fuse.
- **B.** Coalescing is irrelevant on GPUs.
- **C.** A useful way to remember Coalesced access is that it is not the same as “Random per-thread gathers that are always free”.
- **D.** In this module, Coalesced access is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Coalescing is irrelevant on GPUs.. Coalesced access actually means: Warps that hit consecutive aligned global addresses so memory transactions fuse.

### Q38  ·  Intermediate
**Question:** Which statement about **Compute capability** is FALSE?

- **A.** In this module, Compute capability is a core idea students must distinguish from nearby terms.
- **B.** Compute capability is the PCIe generation only.
- **C.** Compute capability is correctly understood as: a device’s architecture version (e.g. 7.5) that dictates limits (threads/block, shared mem, …).
- **D.** A useful way to remember Compute capability is that it is not the same as “The MPI standard year”.

**Answer:** B
**Explanation:** The false claim is: Compute capability is the PCIe generation only.. Compute capability actually means: A device’s architecture version (e.g. 7.5) that dictates limits (threads/block, shared mem, …).

### Q39  ·  Intermediate
**Question:** Which statement about **GPGPU** is FALSE?

- **A.** In this module, GPGPU is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember GPGPU is that it is not the same as “Graphics-only rasterisation”.
- **C.** GPGPU is correctly understood as: using a GPU for general-purpose data-parallel computation, not only graphics.
- **D.** GPGPU forbids arithmetic on arrays.

**Answer:** D
**Explanation:** The false claim is: GPGPU forbids arithmetic on arrays.. GPGPU actually means: Using a GPU for general-purpose data-parallel computation, not only graphics.

### Q40  ·  Intermediate
**Question:** Which statement about **Global memory** is FALSE?

- **A.** In this module, Global memory is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Global memory is that it is not the same as “Per-thread registers”.
- **C.** Global memory has the same latency as a register.
- **D.** Global memory is correctly understood as: large off-chip device DRAM, visible to all threads, high latency, needs coalescing.

**Answer:** C
**Explanation:** The false claim is: Global memory has the same latency as a register.. Global memory actually means: Large off-chip device DRAM, visible to all threads, high latency, needs coalescing.

### Q41  ·  Intermediate
**Question:** Which statement about **Grid** is FALSE?

- **A.** A useful way to remember Grid is that it is not the same as “A single warp”.
- **B.** In this module, Grid is a core idea students must distinguish from nearby terms.
- **C.** Grid is correctly understood as: the set of blocks launched for one kernel, identified by blockIdx.
- **D.** A grid contains only one thread always.

**Answer:** D
**Explanation:** The false claim is: A grid contains only one thread always.. Grid actually means: The set of blocks launched for one kernel, identified by blockIdx.

### Q42  ·  Intermediate
**Question:** Which statement about **Local memory** is FALSE?

- **A.** In this module, Local memory is a core idea students must distinguish from nearby terms.
- **B.** Local memory is correctly understood as: per-thread spilling/arrays that live in device DRAM (despite the name), not in registers.
- **C.** Local memory is faster than registers.
- **D.** A useful way to remember Local memory is that it is not the same as “On-chip shared memory”.

**Answer:** C
**Explanation:** The false claim is: Local memory is faster than registers.. Local memory actually means: Per-thread spilling/arrays that live in device DRAM (despite the name), not in registers.

### Q43  ·  Intermediate
**Question:** Which statement about **Register** is FALSE?

- **A.** In this module, Register is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Register is that it is not the same as “Global DRAM”.
- **C.** Register is correctly understood as: the fastest per-thread storage; too many per thread limits occupancy.
- **D.** Using more registers always increases occupancy.

**Answer:** D
**Explanation:** The false claim is: Using more registers always increases occupancy.. Register actually means: The fastest per-thread storage; too many per thread limits occupancy.

### Q44  ·  Intermediate
**Question:** Which statement about **Thread** is FALSE?

- **A.** In this module, Thread is a core idea students must distinguish from nearby terms.
- **B.** Thread is correctly understood as: the finest CUDA execution agent, with its own registers and threadIdx.
- **C.** A CUDA thread is an OpenMP team.
- **D.** A useful way to remember Thread is that it is not the same as “An MPI process on a node”.

**Answer:** C
**Explanation:** The false claim is: A CUDA thread is an OpenMP team.. Thread actually means: The finest CUDA execution agent, with its own registers and threadIdx.

### Q45  ·  Intermediate
**Question:** Which statement about **Trapezoidal on GPU** is FALSE?

- **A.** In this module, Trapezoidal on GPU is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Trapezoidal on GPU is that it is not the same as “Only thread 0 evaluates all n points”.
- **C.** GPU trapezoidal forbids reductions.
- **D.** Trapezoidal on GPU is correctly understood as: threads compute f(x_i) in parallel; a reduction (shared-mem tree or atomic/CUB) sums them.

**Answer:** C
**Explanation:** The false claim is: GPU trapezoidal forbids reductions.. Trapezoidal on GPU actually means: Threads compute f(x_i) in parallel; a reduction (shared-mem tree or atomic/CUB) sums them.

### Q46  ·  Intermediate
**Question:** __syncthreads() is undefined if:

- **A.** All threads of the block reach it
- **B.** Some threads of the block skip it (divergent barrier)
- **C.** It is used once per kernel in a non-divergent path
- **D.** The block has 32 threads

**Answer:** B
**Explanation:** All (or none in a reconverged sense) must participate.

### Q47  ·  Intermediate
**Question:** i = blockIdx.x*blockDim.x+threadIdx.x; if(i<N) C[i]=A[i]+B[i]. This is:

- **A.** A standard vector-add kernel
- **B.** A host loop without a launch
- **C.** OpenMP guided
- **D.** An MPI_Scatter

**Answer:** A
**Explanation:** Global index pattern.

### Q48  ·  Difficult
**Question:** 256 threads/block. Warps per block?

- **A.** 32
- **B.** 16
- **C.** 256
- **D.** 8

**Answer:** D
**Explanation:** 256/32=8.

### Q49  ·  Difficult
**Question:** Constant memory helps when:

- **A.** All threads read the same read-only parameters (broadcast)
- **B.** It replaces all global arrays of GB scale
- **C.** Each thread writes a unique constant cell
- **D.** Data is streamed once with no reuse

**Answer:** A
**Explanation:** Cached broadcast.

### Q50  ·  Difficult
**Question:** Max threads per SM = 2048, block = 256 threads, occupancy-limited only by threads. Blocks per SM?

- **A.** 32
- **B.** 4
- **C.** 8
- **D.** 256

**Answer:** C
**Explanation:** 2048/256=8.

### Q51  ·  Difficult
**Question:** Occupancy limited because each thread uses 64 registers and the SM has a register file cap. Fix?

- **A.** Call MPI_Init in the kernel
- **B.** Disable coalescing
- **C.** Use fewer registers (restructure), or accept fewer warps, or change block size
- **D.** Raise threads/block past 1024

**Answer:** C
**Explanation:** Resource limits.

### Q52  ·  Difficult
**Question:** Those 8 blocks × 8 warps/block. Warps per SM? If max is 64, occupancy?

- **A.** 64 warps, 100%
- **B.** 8 warps, 12.5%
- **C.** 256 warps, 400%
- **D.** 32 warps, 50%

**Answer:** A
**Explanation:** 8×8=64; 64/64=100%.

### Q53  ·  Difficult
**Question:** Threads in a block load a tile into __shared__, __syncthreads(), then compute. The syncthreads is needed to:

- **A.** Synchronise the whole grid
- **B.** Copy to the host
- **C.** Wait until the tile is fully visible to the block
- **D.** Replace coalescing

**Answer:** C
**Explanation:** Shared-memory handshake.

### Q54  ·  Difficult
**Question:** Trapezoidal n=1024 points, one thread per interior point, 256-thread blocks. Blocks needed (ceil)?

- **A.** 8
- **B.** 4
- **C.** 256
- **D.** 1024

**Answer:** B
**Explanation:** 1024/256=4.

### Q55  ·  Difficult
**Question:** Trapezoidal reduction: each block writes one partial sum, host sums 1000 partials. Bottleneck if n is huge?

- **A.** atomicAdd per thread to one global with no cost
- **B.** Always sum on the CPU 10^9 partials
- **C.** Skip the kernel
- **D.** Better: hierarchical device reduction (or CUB) so the host sees few values

**Answer:** D
**Explanation:** Two-level reduction.

### Q56  ·  Difficult
**Question:** Vector length N=1_000_000, 256 threads/block. Grid size (ceil)?

- **A.** 3907
- **B.** 256
- **C.** 1e6
- **D.** 32

**Answer:** A
**Explanation:** ceil(1e6/256)=3906.25 → 3907.

### Q57  ·  Difficult
**Question:** Warp of 32, 16 threads take if, 16 take else, both sides do work. Cost?

- **A.** A barrier on the host
- **B.** Both sides serialised (divergence)
- **C.** Free MIMD
- **D.** PCIe ×2

**Answer:** B
**Explanation:** SIMT masking.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **__host__** and **__device__**?

- **A.** device functions run on the CPU OS.
- **B.** They cannot coexist on one function.
- **C.** host: CPU compiler. device: GPU compiler. A function may be both.
- **D.** host kernels launch grids.

**Answer:** C
**Explanation:** host: CPU compiler. device: GPU compiler. A function may be both.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **atomicAdd (global)** and **shared-memory reduction tree**?

- **A.** Atomics are simple but contend; block trees + one atomic per block scale better.
- **B.** Trees are always slower.
- **C.** They are OpenMP nowait.
- **D.** atomicAdd is a grid barrier.

**Answer:** A
**Explanation:** Atomics are simple but contend; block trees + one atomic per block scale better.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **thread** and **block**?

- **A.** A block groups threads that share memory and syncthreads; a thread is one lane.
- **B.** They are MPI ranks.
- **C.** A thread contains blocks.
- **D.** A block cannot hold more than one thread.

**Answer:** A
**Explanation:** A block groups threads that share memory and syncthreads; a thread is one lane.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **warp divergence** and **false sharing on CPU**?

- **A.** Divergence is an MPI deadlock.
- **B.** GPUs cannot branch.
- **C.** Divergence: threads in a warp take different branches, serialising lanes. False sharing: CPU cache lines.
- **D.** They are identical bugs.

**Answer:** C
**Explanation:** Divergence: threads in a warp take different branches, serialising lanes. False sharing: CPU cache lines.

### Q62  ·  Difficult
**Question:** Which statement about **Block** is FALSE?

- **A.** In this module, Block is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Block is that it is not the same as “A grid of grids”.
- **C.** Block is correctly understood as: a group of threads that can synchronise with __syncthreads and share __shared__ memory.
- **D.** Threads in different blocks can __syncthreads with each other.

**Answer:** D
**Explanation:** The false claim is: Threads in different blocks can __syncthreads with each other.. Block actually means: A group of threads that can synchronise with __syncthreads and share __shared__ memory.

### Q63  ·  Difficult
**Question:** Which statement about **CUDA** is FALSE?

- **A.** In this module, CUDA is a core idea students must distinguish from nearby terms.
- **B.** CUDA kernels run on the CPU host by default.
- **C.** A useful way to remember CUDA is that it is not the same as “An OpenMP clause”.
- **D.** CUDA is correctly understood as: nVIDIA’s parallel programming model: kernels, grids of blocks of threads, host API.

**Answer:** B
**Explanation:** The false claim is: CUDA kernels run on the CPU host by default.. CUDA actually means: NVIDIA’s parallel programming model: kernels, grids of blocks of threads, host API.

### Q64  ·  Difficult
**Question:** Which statement about **Constant memory** is FALSE?

- **A.** Constant memory is correctly understood as: read-only cached memory for data that does not change during a kernel, broadcast-friendly.
- **B.** A useful way to remember Constant memory is that it is not the same as “Writeable by every thread every cycle without cost”.
- **C.** Constant memory is ideal for a unique write per thread.
- **D.** In this module, Constant memory is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Constant memory is ideal for a unique write per thread.. Constant memory actually means: Read-only cached memory for data that does not change during a kernel, broadcast-friendly.

### Q65  ·  Difficult
**Question:** Which statement about **Kernel** is FALSE?

- **A.** A kernel is launched with mpi_for.
- **B.** A useful way to remember Kernel is that it is not the same as “A __host__-only C function”.
- **C.** In this module, Kernel is a core idea students must distinguish from nearby terms.
- **D.** Kernel is correctly understood as: a __global__ function launched from the host to run on many GPU threads.

**Answer:** A
**Explanation:** The false claim is: A kernel is launched with mpi_for.. Kernel actually means: A __global__ function launched from the host to run on many GPU threads.

### Q66  ·  Difficult
**Question:** Which statement about **Occupancy** is FALSE?

- **A.** A useful way to remember Occupancy is that it is not the same as “MPI efficiency S/p”.
- **B.** Occupancy is correctly understood as: active warps per SM divided by the hardware maximum; limited by threads, registers, shared mem, blocks.
- **C.** Occupancy is always equal to the kernel’s FLOP rate.
- **D.** In this module, Occupancy is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Occupancy is always equal to the kernel’s FLOP rate.. Occupancy actually means: Active warps per SM divided by the hardware maximum; limited by threads, registers, shared mem, blocks.

### Q67  ·  Difficult
**Question:** Which statement about **Shared memory** is FALSE?

- **A.** Shared memory is automatically coherent across the whole grid.
- **B.** A useful way to remember Shared memory is that it is not the same as “Device DRAM”.
- **C.** Shared memory is correctly understood as: on-chip per-block scratchpad (__shared__), low latency, software-managed, banked.
- **D.** In this module, Shared memory is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Shared memory is automatically coherent across the whole grid.. Shared memory actually means: On-chip per-block scratchpad (__shared__), low latency, software-managed, banked.

### Q68  ·  Difficult
**Question:** Which statement about **Vector add kernel** is FALSE?

- **A.** In this module, Vector add kernel is a core idea students must distinguish from nearby terms.
- **B.** Vector add cannot run on a GPU.
- **C.** Vector add kernel is correctly understood as: each thread computes one (or a stride of) i: C[i]=A[i]+B[i] using a global index.
- **D.** A useful way to remember Vector add kernel is that it is not the same as “One thread adds the whole vector”.

**Answer:** B
**Explanation:** The false claim is: Vector add cannot run on a GPU.. Vector add kernel actually means: Each thread computes one (or a stride of) i: C[i]=A[i]+B[i] using a global index.

### Q69  ·  Difficult
**Question:** Which statement about **__syncthreads** is FALSE?

- **A.** A useful way to remember __syncthreads is that it is not the same as “Grid-wide barrier in all CUDA versions without coop groups”.
- **B.** __syncthreads synchronises the entire grid.
- **C.** In this module, __syncthreads is a core idea students must distinguish from nearby terms.
- **D.** __syncthreads is correctly understood as: barrier among threads of one block; all must reach it (same control-flow path).

**Answer:** B
**Explanation:** The false claim is: __syncthreads synchronises the entire grid.. __syncthreads actually means: Barrier among threads of one block; all must reach it (same control-flow path).

### Q70  ·  Difficult
**Question:** Which statement about **threadIdx / blockIdx / blockDim** is FALSE?

- **A.** A useful way to remember threadIdx / blockIdx / blockDim is that it is not the same as “MPI ranks”.
- **B.** threadIdx / blockIdx / blockDim is correctly understood as: built-ins that give a thread’s coordinates so it can compute a global index.
- **C.** In this module, threadIdx / blockIdx / blockDim is a core idea students must distinguish from nearby terms.
- **D.** They are identical to omp_get_thread_num on the host.

**Answer:** D
**Explanation:** The false claim is: They are identical to omp_get_thread_num on the host.. threadIdx / blockIdx / blockDim actually means: Built-ins that give a thread’s coordinates so it can compute a global index.

### Q71  ·  Difficult
**Question:** Why might 128-thread blocks beat 1024-thread blocks?

- **A.** 1024 is illegal always
- **B.** Warps are 128 threads
- **C.** PCIe prefers 128
- **D.** Register/shared limits raise occupancy or reduce spilling at 128; 1024 may starve the SM

**Answer:** D
**Explanation:** Occupancy is a trade-off.

### Q72  ·  Difficult
**Question:** blockDim = (16,16,1). Threads per block?

- **A.** 512
- **B.** 16
- **C.** 32
- **D.** 256

**Answer:** D
**Explanation:** 16×16=256.

### Q73  ·  Difficult
**Question:** gridDim=(32,32), block 16×16. Total threads?

- **A.** 64
- **B.** 1024
- **C.** 262144
- **D.** 256

**Answer:** C
**Explanation:** 1024 blocks × 256 threads = 262144.

---

## Quick answer key

Q01–A | Q02–A | Q03–C | Q04–B | Q05–C | Q06–C | Q07–B | Q08–D | Q09–B | Q10–B | Q11–D | Q12–D | Q13–A | Q14–A | Q15–A | Q16–D | Q17–C | Q18–A | Q19–B | Q20–A | Q21–D | Q22–C | Q23–B | Q24–B | Q25–A | Q26–B | Q27–A | Q28–C | Q29–C | Q30–B | Q31–A | Q32–A | Q33–D | Q34–A | Q35–D | Q36–C | Q37–B | Q38–B | Q39–D | Q40–C | Q41–D | Q42–C | Q43–D | Q44–C | Q45–C | Q46–B | Q47–A | Q48–D | Q49–A | Q50–C | Q51–C | Q52–A | Q53–C | Q54–B | Q55–D | Q56–A | Q57–B | Q58–C | Q59–A | Q60–A | Q61–C | Q62–D | Q63–B | Q64–C | Q65–A | Q66–C | Q67–A | Q68–B | Q69–B | Q70–D | Q71–D | Q72–D | Q73–C
