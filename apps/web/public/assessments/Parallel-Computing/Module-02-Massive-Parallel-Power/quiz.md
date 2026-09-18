# Quiz — Parallel Computing — Module 2: Massive Parallel Power

**Subject:** Parallel Computing  
**Module:** Module 2 — Massive Parallel Power  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A NVIDIA warp has how many threads?

- **A.** 32
- **B.** 16
- **C.** 1024
- **D.** 8

**Answer:** A
**Explanation:** Standard warp width.

### Q02  ·  Easy
**Question:** Amdahl’s law applies most directly to:

- **A.** Fixed-size problems (strong scaling)
- **B.** I/O-free infinite n only
- **C.** Compilers
- **D.** Problems that grow so work/rank is constant only

**Answer:** A
**Explanation:** Serial fraction of a fixed job.

### Q03  ·  Easy
**Question:** An SM schedules:

- **A.** DFA states
- **B.** OpenMP sections onto disks
- **C.** MPI ranks onto Ethernet
- **D.** Warps onto execution units

**Answer:** D
**Explanation:** GPU block scheduler/warp scheduler.

### Q04  ·  Easy
**Question:** Speedup S=1 on p=8 means:

- **A.** E=1
- **B.** s=0
- **C.** No gain (T_p≈T_1)
- **D.** Perfect linear

**Answer:** C
**Explanation:** Parallel overhead ate the gain.

### Q05  ·  Easy
**Question:** Which option best describes **CUDA core**?

- **A.** A whole SM.
- **B.** A host pthread.
- **C.** A lane that executes a thread’s arithmetic in a warp (simplified teaching view).
- **D.** An MPI process.

**Answer:** C
**Explanation:** CUDA core: A lane that executes a thread’s arithmetic in a warp (simplified teaching view).

### Q06  ·  Easy
**Question:** Which option best describes **GPU**?

- **A.** An MPI rank daemon.
- **B.** A throughput processor with many simple cores organised to hide latency on data-parallel work.
- **C.** A latency-optimised uniprocessor with huge caches only.
- **D.** A coherence directory for NUMA.

**Answer:** B
**Explanation:** GPU: A throughput processor with many simple cores organised to hide latency on data-parallel work.

### Q07  ·  Easy
**Question:** Which option best describes **Gustafson’s law**?

- **A.** S = 1/s.
- **B.** Scaled speedup S = p − s(p−1) = s + p(1−s) when the parallel work grows with p.
- **C.** S = 1/p.
- **D.** The same as Amdahl on a fixed n.

**Answer:** B
**Explanation:** Gustafson’s law: Scaled speedup S = p − s(p−1) = s + p(1−s) when the parallel work grows with p.

### Q08  ·  Easy
**Question:** Which option best describes **PCIe transfer**?

- **A.** Faster than registers.
- **B.** Host↔device copies can dominate if kernels are small; overlap with compute when possible.
- **C.** Free and instantaneous.
- **D.** The same as L1 cache.

**Answer:** B
**Explanation:** PCIe transfer: Host↔device copies can dominate if kernels are small; overlap with compute when possible.

### Q09  ·  Easy
**Question:** Which option best describes **Scalability**?

- **A.** Whether MPI_Init succeeds.
- **B.** A CUDA core count only.
- **C.** A compiler version.
- **D.** How well S or E holds as p (and n) grow; limited by serial work, communication, load imbalance.

**Answer:** D
**Explanation:** Scalability: How well S or E holds as p (and n) grow; limited by serial work, communication, load imbalance.

### Q10  ·  Easy
**Question:** Which option best describes **Speedup S**?

- **A.** S = p always.
- **B.** S = T(p)/T(1).
- **C.** S(p) = T(1)/T(p) (or T_best_serial / T_parallel).
- **D.** S = efficiency.

**Answer:** C
**Explanation:** Speedup S: S(p) = T(1)/T(p) (or T_best_serial / T_parallel).

### Q11  ·  Easy
**Question:** Which sequence correctly describes **CPU–GPU offload**?

- **A.** Never synchronise and declare victory
- **B.** Launch before allocate
- **C.** Copy D2H before the kernel
- **D.** Allocate device buffers → copy H2D → launch kernel → copy D2H → sync → free; overlap streams if able

**Answer:** D
**Explanation:** Correct sequence for CPU–GPU offload: Allocate device buffers → copy H2D → launch kernel → copy D2H → sync → free; overlap streams if able

### Q12  ·  Easy
**Question:** Which sequence correctly describes **measuring speedup honestly**?

- **A.** Ignore GPU memcpy
- **B.** Fix n (or state weak-scaling n(p)) → warm up → barrier → wall-clock min of repeats → S=T1/Tp, E=S/p → plot
- **C.** Time printf on one rank mid-loop
- **D.** Compare T_compile to T_run

**Answer:** B
**Explanation:** Correct sequence for measuring speedup honestly: Fix n (or state weak-scaling n(p)) → warm up → barrier → wall-clock min of repeats → S=T1/Tp, E=S/p → plot

### Q13  ·  Intermediate
**Question:** A 4K image filter is 95% pixel-independent. Best first target is:

- **A.** GPU/data-parallel kernel (plus copies budgeted)
- **B.** OpenMP critical around every pixel
- **C.** MPI deadlock on one pixel
- **D.** A single CPU core with Amdahl s=1

**Answer:** A
**Explanation:** Massive data parallelism.

### Q14  ·  Intermediate
**Question:** A student times CUDA from the first cudaMalloc including JIT. The number is:

- **A.** The official FLOP rate
- **B.** Amdahl s
- **C.** Unfair (warmup/init); time steady-state kernels+copies
- **D.** Warp size

**Answer:** C
**Explanation:** Warm up and use events/barriers.

### Q15  ·  Intermediate
**Question:** Efficiency 50% on 12 cores means speedup:

- **A.** 6
- **B.** 24
- **C.** 0.5
- **D.** 12

**Answer:** A
**Explanation:** S=E×p=6.

### Q16  ·  Intermediate
**Question:** Gustafson’s scaled speedup with serial α and p processors is:

- **A.** α + p(1−α)
- **B.** 1/(α+(1−α)/p)
- **C.** 1−α
- **D.** p/α

**Answer:** A
**Explanation:** Parallel work scales with p.

### Q17  ·  Intermediate
**Question:** Hybrid: CPU builds a tree (irregular) then GPU multiplies a dense matrix. This maps to:

- **A.** Task split CPU/GPU by workload type
- **B.** CPU for the GEMM only
- **C.** Forbidding PCIe
- **D.** GPU for the irregular pointer chase only

**Answer:** A
**Explanation:** Use each device’s strength.

### Q18  ·  Intermediate
**Question:** Latency hiding on a GPU relies on:

- **A.** Bigger PCIe copies
- **B.** One warp per SM always
- **C.** OpenMP critical
- **D.** Many resident warps so that stalled warps are swapped for ready ones

**Answer:** D
**Explanation:** Occupancy/ILP.

### Q19  ·  Intermediate
**Question:** PCIe copies belong in:

- **A.** T_serial only
- **B.** T_parallel (unless overlapped and hidden)
- **C.** Neither wall-clock
- **D.** Amdahl s=0 by definition

**Answer:** B
**Explanation:** End-to-end time.

### Q20  ·  Intermediate
**Question:** Weak scaling: 1 GPU does 1M particles in 1 s; 8 GPUs do 8M in 1.05 s. This is:

- **A.** Good weak scaling (slight overhead)
- **B.** Failed strong scaling of a tiny n
- **C.** Amdahl s=1
- **D.** S=8 on a fixed 1M

**Answer:** A
**Explanation:** Work/rank constant, time nearly flat.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **Amdahl** and **Gustafson**?

- **A.** They are the same equation.
- **B.** Gustafson assumes n fixed.
- **C.** Amdahl assumes infinite n.
- **D.** Amdahl: fixed n, serial fraction kills S. Gustafson: n grows, scaled S can stay large.

**Answer:** D
**Explanation:** Amdahl: fixed n, serial fraction kills S. Gustafson: n grows, scaled S can stay large.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **CPU core** and **CUDA core / GPU lane**?

- **A.** They have identical caches and clocks.
- **B.** CPU: latency, big caches, ILP, few cores. GPU: throughput, many lanes, latency hiding via warps.
- **C.** CPU cores cannot branch.
- **D.** CUDA cores run the OS scheduler.

**Answer:** B
**Explanation:** CPU: latency, big caches, ILP, few cores. GPU: throughput, many lanes, latency hiding via warps.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **linear speedup** and **superlinear speedup**?

- **A.** Linear: S=p. Superlinear can appear from cache effects when per-core working set shrinks.
- **B.** Linear means S=1.
- **C.** Efficiency 10% is linear.
- **D.** Superlinear is impossible in nature.

**Answer:** A
**Explanation:** Linear: S=p. Superlinear can appear from cache effects when per-core working set shrinks.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **speedup** and **efficiency**?

- **A.** They are always equal.
- **B.** S = S/p.
- **C.** S is T1/Tp; E is S/p (utilisation quality).
- **D.** E = T1/Tp.

**Answer:** C
**Explanation:** S is T1/Tp; E is S/p (utilisation quality).

### Q25  ·  Intermediate
**Question:** Which option best describes **Amdahl’s law**?

- **A.** S = s×p.
- **B.** S = 1−s.
- **C.** S = 1 / (s + (1−s)/p) for serial fraction s of a fixed-size problem.
- **D.** S = p − s.

**Answer:** C
**Explanation:** Amdahl’s law: S = 1 / (s + (1−s)/p) for serial fraction s of a fixed-size problem.

### Q26  ·  Intermediate
**Question:** Which option best describes **Efficiency E**?

- **A.** E = S/p, a number in (0,1] for sensible runs (can be tiny if overheads dominate).
- **B.** E is always 100% if p>1.
- **C.** E = S×p.
- **D.** E = p/S always > 1.

**Answer:** A
**Explanation:** Efficiency E: E = S/p, a number in (0,1] for sensible runs (can be tiny if overheads dominate).

### Q27  ·  Intermediate
**Question:** Which option best describes **Hybrid CPU–GPU**?

- **A.** MPI is forbidden.
- **B.** CPU runs control/I/O/irregular work; GPU runs data-parallel kernels; data moves over PCIe/NVLink.
- **C.** The GPU replaces the OS.
- **D.** The CPU cannot run after a kernel.

**Answer:** B
**Explanation:** Hybrid CPU–GPU: CPU runs control/I/O/irregular work; GPU runs data-parallel kernels; data moves over PCIe/NVLink.

### Q28  ·  Intermediate
**Question:** Which option best describes **Load imbalance**?

- **A.** Some workers idle while others finish leftover iterations; hurts S.
- **B.** Always good for Amdahl.
- **C.** Only a CUDA memory type.
- **D.** Impossible with static equal chunks if work per item varies.

**Answer:** A
**Explanation:** Load imbalance: Some workers idle while others finish leftover iterations; hurts S.

### Q29  ·  Intermediate
**Question:** Which option best describes **Occupancy (preview)**?

- **A.** Fraction of a SM’s maximum warps that are active; a performance heuristic, not a guarantee.
- **B.** MPI rank count / 32.
- **C.** Always 1 if the kernel compiles.
- **D.** OpenMP team size.

**Answer:** A
**Explanation:** Occupancy (preview): Fraction of a SM’s maximum warps that are active; a performance heuristic, not a guarantee.

### Q30  ·  Intermediate
**Question:** Which option best describes **Overheads of parallelism**?

- **A.** Always zero.
- **B.** Only compilation time.
- **C.** Negative time.
- **D.** Fork/join, messages, kernel launch, copies, synchronisation, extra memory.

**Answer:** D
**Explanation:** Overheads of parallelism: Fork/join, messages, kernel launch, copies, synchronisation, extra memory.

### Q31  ·  Intermediate
**Question:** Which option best describes **SIMT**?

- **A.** A distributed-memory MPI style.
- **B.** Single Instruction, Multiple Threads: SIMD-like lockstep with per-thread registers and masking.
- **C.** OpenMP guided scheduling.
- **D.** UMA DRAM.

**Answer:** B
**Explanation:** SIMT: Single Instruction, Multiple Threads: SIMD-like lockstep with per-thread registers and masking.

### Q32  ·  Intermediate
**Question:** Which option best describes **Streaming multiprocessor (SM)**?

- **A.** A CPU L3 slice only.
- **B.** A GPU building block that schedules warps onto CUDA cores / tensor pipes and holds shared memory.
- **C.** An OpenMP team.
- **D.** An MPI communicator.

**Answer:** B
**Explanation:** Streaming multiprocessor (SM): A GPU building block that schedules warps onto CUDA cores / tensor pipes and holds shared memory.

### Q33  ·  Intermediate
**Question:** Which option best describes **Strong scaling**?

- **A.** Grow n with p.
- **B.** Always linear if you add nodes.
- **C.** Fix problem size, increase p, hope T drops (Amdahl-limited).
- **D.** Ignore serial I/O.

**Answer:** C
**Explanation:** Strong scaling: Fix problem size, increase p, hope T drops (Amdahl-limited).

### Q34  ·  Intermediate
**Question:** Which option best describes **Timing parallel codes**?

- **A.** Use wall-clock (e.g. MPI_Wtime, omp_get_wtime, cuda events); warm up; repeat; report min/median.
- **B.** Ignore GPU copies.
- **C.** Time only compilation.
- **D.** Use a single printf of CPU cycles across unsynchronised ranks as gospel.

**Answer:** A
**Explanation:** Timing parallel codes: Use wall-clock (e.g. MPI_Wtime, omp_get_wtime, cuda events); warm up; repeat; report min/median.

### Q35  ·  Intermediate
**Question:** Which option best describes **Warp**?

- **A.** An MPI derived datatype.
- **B.** A lockstep group of threads (32 on NVIDIA) executing in SIMT.
- **C.** A cache line of 64 bytes always.
- **D.** An OpenMP task.

**Answer:** B
**Explanation:** Warp: A lockstep group of threads (32 on NVIDIA) executing in SIMT.

### Q36  ·  Intermediate
**Question:** Which option best describes **Weak scaling**?

- **A.** Grow problem size with p so work per rank stays constant (Gustafson-style).
- **B.** Only GPU occupancy.
- **C.** Delete work as p grows.
- **D.** Fix n and add infinite p.

**Answer:** A
**Explanation:** Weak scaling: Grow problem size with p so work per rank stays constant (Gustafson-style).

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **Amdahl estimate**?

- **A.** Set s=p
- **B.** Assume s=0
- **C.** Profile serial time in vs out of parallel region → s = T_serial/T1 → S=1/(s+(1-s)/p) → compare to measured S
- **D.** Use Gustafson on a shrinking n

**Answer:** C
**Explanation:** Correct sequence for Amdahl estimate: Profile serial time in vs out of parallel region → s = T_serial/T1 → S=1/(s+(1-s)/p) → compare to measured S

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **strong-scaling study**?

- **A.** Stop at p=2
- **B.** Report only occupancy
- **C.** Always grow n with p only
- **D.** Hold n fixed → double p repeatedly → record T, S, E until E collapses → identify communication or serial cap

**Answer:** D
**Explanation:** Correct sequence for strong-scaling study: Hold n fixed → double p repeatedly → record T, S, E until E collapses → identify communication or serial cap

### Q39  ·  Intermediate
**Question:** Which statement about **Amdahl’s law** is FALSE?

- **A.** In this module, Amdahl’s law is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Amdahl’s law is that it is not the same as “S = s×p”.
- **C.** Amdahl says speedup is unbounded for any s>0.
- **D.** Amdahl’s law is correctly understood as: s = 1 / (s + (1−s)/p) for serial fraction s of a fixed-size problem.

**Answer:** C
**Explanation:** The false claim is: Amdahl says speedup is unbounded for any s>0.. Amdahl’s law actually means: S = 1 / (s + (1−s)/p) for serial fraction s of a fixed-size problem.

### Q40  ·  Intermediate
**Question:** Which statement about **GPU** is FALSE?

- **A.** In this module, GPU is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember GPU is that it is not the same as “A latency-optimised uniprocessor with huge caches only”.
- **C.** GPU is correctly understood as: a throughput processor with many simple cores organised to hide latency on data-parallel work.
- **D.** A GPU is always slower than one CPU core on every irregular serial task by law, and cannot help any HPC code.

**Answer:** D
**Explanation:** The false claim is: A GPU is always slower than one CPU core on every irregular serial task by law, and cannot help any HPC code.. GPU actually means: A throughput processor with many simple cores organised to hide latency on data-parallel work.

### Q41  ·  Intermediate
**Question:** Which statement about **Load imbalance** is FALSE?

- **A.** Load imbalance is correctly understood as: some workers idle while others finish leftover iterations; hurts S.
- **B.** Perfect balance is guaranteed by spawning p threads.
- **C.** A useful way to remember Load imbalance is that it is not the same as “Always good for Amdahl”.
- **D.** In this module, Load imbalance is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Perfect balance is guaranteed by spawning p threads.. Load imbalance actually means: Some workers idle while others finish leftover iterations; hurts S.

### Q42  ·  Intermediate
**Question:** Which statement about **Occupancy (preview)** is FALSE?

- **A.** In this module, Occupancy (preview) is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Occupancy (preview) is that it is not the same as “MPI rank count / 32”.
- **C.** 100% occupancy always maximises runtime performance.
- **D.** Occupancy (preview) is correctly understood as: fraction of a SM’s maximum warps that are active; a performance heuristic, not a guarantee.

**Answer:** C
**Explanation:** The false claim is: 100% occupancy always maximises runtime performance.. Occupancy (preview) actually means: Fraction of a SM’s maximum warps that are active; a performance heuristic, not a guarantee.

### Q43  ·  Intermediate
**Question:** Which statement about **SIMT** is FALSE?

- **A.** In this module, SIMT is a core idea students must distinguish from nearby terms.
- **B.** SIMT is correctly understood as: single Instruction, Multiple Threads: SIMD-like lockstep with per-thread registers and masking.
- **C.** SIMT means each thread in a warp fetches a different instruction stream every cycle without masking.
- **D.** A useful way to remember SIMT is that it is not the same as “A distributed-memory MPI style”.

**Answer:** C
**Explanation:** The false claim is: SIMT means each thread in a warp fetches a different instruction stream every cycle without masking.. SIMT actually means: Single Instruction, Multiple Threads: SIMD-like lockstep with per-thread registers and masking.

### Q44  ·  Intermediate
**Question:** Which statement about **Scalability** is FALSE?

- **A.** In this module, Scalability is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Scalability is that it is not the same as “A CUDA core count only”.
- **C.** Scalability is correctly understood as: how well S or E holds as p (and n) grow; limited by serial work, communication, load imbalance.
- **D.** A program is scalable iff it uses a GPU.

**Answer:** D
**Explanation:** The false claim is: A program is scalable iff it uses a GPU.. Scalability actually means: How well S or E holds as p (and n) grow; limited by serial work, communication, load imbalance.

### Q45  ·  Intermediate
**Question:** Which statement about **Speedup S** is FALSE?

- **A.** A useful way to remember Speedup S is that it is not the same as “S = T(p)/T(1)”.
- **B.** In this module, Speedup S is a core idea students must distinguish from nearby terms.
- **C.** Speedup S is correctly understood as: s(p) = T(1)/T(p) (or T_best_serial / T_parallel).
- **D.** Speedup is T(p) minus T(1).

**Answer:** D
**Explanation:** The false claim is: Speedup is T(p) minus T(1).. Speedup S actually means: S(p) = T(1)/T(p) (or T_best_serial / T_parallel).

### Q46  ·  Intermediate
**Question:** Which statement about **Strong scaling** is FALSE?

- **A.** In this module, Strong scaling is a core idea students must distinguish from nearby terms.
- **B.** Strong scaling is correctly understood as: fix problem size, increase p, hope T drops (Amdahl-limited).
- **C.** Strong scaling always stays linear because communication is free.
- **D.** A useful way to remember Strong scaling is that it is not the same as “Grow n with p”.

**Answer:** C
**Explanation:** The false claim is: Strong scaling always stays linear because communication is free.. Strong scaling actually means: Fix problem size, increase p, hope T drops (Amdahl-limited).

### Q47  ·  Intermediate
**Question:** Which statement about **Warp** is FALSE?

- **A.** In this module, Warp is a core idea students must distinguish from nearby terms.
- **B.** A warp is 8 threads on all NVIDIA GPUs by definition.
- **C.** Warp is correctly understood as: a lockstep group of threads (32 on NVIDIA) executing in SIMT.
- **D.** A useful way to remember Warp is that it is not the same as “An OpenMP task”.

**Answer:** B
**Explanation:** The false claim is: A warp is 8 threads on all NVIDIA GPUs by definition.. Warp actually means: A lockstep group of threads (32 on NVIDIA) executing in SIMT.

### Q48  ·  Difficult
**Question:** A kernel is 2 ms, H2D+D2H copies 8 ms, CPU launch 0.1 ms. Wall roughly?

- **A.** ≈10.1 ms
- **B.** 2 ms
- **C.** 0.1 ms
- **D.** 8 ms

**Answer:** A
**Explanation:** Sum of copies + kernel + launch if not overlapped.

### Q49  ·  Difficult
**Question:** Adding GPUs does not help a code that is 80% serial file parse. Amdahl S_max is:

- **A.** ∞
- **B.** 80
- **C.** 1.25
- **D.** 5

**Answer:** C
**Explanation:** 1/0.8=1.25.

### Q50  ·  Difficult
**Question:** Amdahl: serial fraction s=0.2, p=8. Speedup?

- **A.** 1.25
- **B.** 8
- **C.** 5
- **D.** ≈3.33

**Answer:** D
**Explanation:** S=1/(0.2+0.8/8)=1/(0.2+0.1)=1/0.3≈3.333.

### Q51  ·  Difficult
**Question:** Block of 256 threads. Warps per block (warp=32)?

- **A.** 4
- **B.** 8
- **C.** 32
- **D.** 256

**Answer:** B
**Explanation:** 256/32=8.

### Q52  ·  Difficult
**Question:** GPU: 40 SMs × 64 max warps/SM. Max concurrent warps on the device?

- **A.** 2560
- **B.** 64
- **C.** 40
- **D.** 2048

**Answer:** A
**Explanation:** 40×64=2560 warps.

### Q53  ·  Difficult
**Question:** Gustafson: serial fraction of scaled run α=0.1, p=16. Scaled speedup?

- **A.** 10
- **B.** 1.6
- **C.** 14.5
- **D.** 16

**Answer:** C
**Explanation:** S=α+p(1−α)=0.1+16×0.9=14.5.

### Q54  ·  Difficult
**Question:** Occupancy 100% but kernel slow because each thread uses many registers spilling. Lesson:

- **A.** s=0
- **B.** MPI_Wtime is wrong
- **C.** Occupancy is a heuristic; spills/bandwidth matter
- **D.** Always raise occupancy

**Answer:** C
**Explanation:** Balance resources.

### Q55  ·  Difficult
**Question:** Superlinear S=9 on 8 cores appears. A plausible reason:

- **A.** A timing bug is impossible
- **B.** Amdahl s=1
- **C.** MPI_Barrier creates energy
- **D.** Per-core data now fits in cache

**Answer:** D
**Explanation:** Cache effects can yield S>p.

### Q56  ·  Difficult
**Question:** T(1)=100 s, T(16)=10 s. Speedup and efficiency?

- **A.** S=10, E=10%
- **B.** S=0.1, E=16%
- **C.** S=16, E=100%
- **D.** S=10, E=62.5%

**Answer:** D
**Explanation:** S=100/10=10; E=10/16=0.625.

### Q57  ·  Difficult
**Question:** T(p) increases as p grows for fixed n. Likely causes:

- **A.** Gustafson success
- **B.** Communication/overheads dominating (poor strong scaling)
- **C.** Perfect linear speedup
- **D.** Zero serial fraction

**Answer:** B
**Explanation:** Too little work per rank.

### Q58  ·  Difficult
**Question:** Weak scaling keeps T≈constant while n∝p. Communication that grows with p will:

- **A.** Eventually raise T and hurt weak scaling
- **B.** Convert the GPU to SISD
- **C.** Always stay hidden
- **D.** Reduce α to 0

**Answer:** A
**Explanation:** Allgather-type growth.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **SM** and **warp**?

- **A.** They are MPI ranks.
- **B.** An SM is 32 OpenMP threads.
- **C.** An SM hosts many warps; a warp is 32 lockstep threads.
- **D.** A warp contains many SMs.

**Answer:** C
**Explanation:** An SM hosts many warps; a warp is 32 lockstep threads.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **kernel time** and **PCIe copy time**?

- **A.** Useful GPU work vs transfer overhead; both belong in T_parallel.
- **B.** Copies are not part of wall time.
- **C.** PCIe is faster than shared memory.
- **D.** Kernels run on the host CPU.

**Answer:** A
**Explanation:** Useful GPU work vs transfer overhead; both belong in T_parallel.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **occupancy** and **performance**?

- **A.** Low occupancy always wins.
- **B.** Occupancy is MPI efficiency.
- **C.** High occupancy helps hide latency but can lose if it cuts registers/cache per thread.
- **D.** They are identical.

**Answer:** C
**Explanation:** High occupancy helps hide latency but can lose if it cuts registers/cache per thread.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **strong scaling** and **weak scaling**?

- **A.** Strong: fixed n, vary p. Weak: n ∝ p, work/rank ~ constant.
- **B.** Strong grows n linearly with p by definition.
- **C.** Weak fixes n.
- **D.** They ignore time.

**Answer:** A
**Explanation:** Strong: fixed n, vary p. Weak: n ∝ p, work/rank ~ constant.

### Q63  ·  Difficult
**Question:** Which statement about **CUDA core** is FALSE?

- **A.** A CUDA core runs an independent MIMD OS.
- **B.** A useful way to remember CUDA core is that it is not the same as “A whole SM”.
- **C.** In this module, CUDA core is a core idea students must distinguish from nearby terms.
- **D.** CUDA core is correctly understood as: a lane that executes a thread’s arithmetic in a warp (simplified teaching view).

**Answer:** A
**Explanation:** The false claim is: A CUDA core runs an independent MIMD OS.. CUDA core actually means: A lane that executes a thread’s arithmetic in a warp (simplified teaching view).

### Q64  ·  Difficult
**Question:** Which statement about **Efficiency E** is FALSE?

- **A.** A useful way to remember Efficiency E is that it is not the same as “E = S×p”.
- **B.** Efficiency E is correctly understood as: e = S/p, a number in (0,1] for sensible runs (can be tiny if overheads dominate).
- **C.** In this module, Efficiency E is a core idea students must distinguish from nearby terms.
- **D.** Efficiency grows linearly with p for a fixed problem with a serial fraction.

**Answer:** D
**Explanation:** The false claim is: Efficiency grows linearly with p for a fixed problem with a serial fraction.. Efficiency E actually means: E = S/p, a number in (0,1] for sensible runs (can be tiny if overheads dominate).

### Q65  ·  Difficult
**Question:** Which statement about **Gustafson’s law** is FALSE?

- **A.** Gustafson forbids problem size from growing.
- **B.** A useful way to remember Gustafson’s law is that it is not the same as “The same as Amdahl on a fixed n”.
- **C.** Gustafson’s law is correctly understood as: scaled speedup S = p − s(p−1) = s + p(1−s) when the parallel work grows with p.
- **D.** In this module, Gustafson’s law is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Gustafson forbids problem size from growing.. Gustafson’s law actually means: Scaled speedup S = p − s(p−1) = s + p(1−s) when the parallel work grows with p.

### Q66  ·  Difficult
**Question:** Which statement about **Hybrid CPU–GPU** is FALSE?

- **A.** In this module, Hybrid CPU–GPU is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Hybrid CPU–GPU is that it is not the same as “The GPU replaces the OS”.
- **C.** Hybrid CPU–GPU is correctly understood as: cPU runs control/I/O/irregular work; GPU runs data-parallel kernels; data moves over PCIe/NVLink.
- **D.** Hybrid codes never copy data; the GPU magically sees all malloc heaps.

**Answer:** D
**Explanation:** The false claim is: Hybrid codes never copy data; the GPU magically sees all malloc heaps.. Hybrid CPU–GPU actually means: CPU runs control/I/O/irregular work; GPU runs data-parallel kernels; data moves over PCIe/NVLink.

### Q67  ·  Difficult
**Question:** Which statement about **Overheads of parallelism** is FALSE?

- **A.** A useful way to remember Overheads of parallelism is that it is not the same as “Always zero”.
- **B.** Adding p=1024 never adds overhead.
- **C.** In this module, Overheads of parallelism is a core idea students must distinguish from nearby terms.
- **D.** Overheads of parallelism is correctly understood as: fork/join, messages, kernel launch, copies, synchronisation, extra memory.

**Answer:** B
**Explanation:** The false claim is: Adding p=1024 never adds overhead.. Overheads of parallelism actually means: Fork/join, messages, kernel launch, copies, synchronisation, extra memory.

### Q68  ·  Difficult
**Question:** Which statement about **PCIe transfer** is FALSE?

- **A.** A useful way to remember PCIe transfer is that it is not the same as “Free and instantaneous”.
- **B.** PCIe transfer is correctly understood as: host↔device copies can dominate if kernels are small; overlap with compute when possible.
- **C.** Kernel time always dwarfs PCIe for 4 KB copies.
- **D.** In this module, PCIe transfer is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Kernel time always dwarfs PCIe for 4 KB copies.. PCIe transfer actually means: Host↔device copies can dominate if kernels are small; overlap with compute when possible.

### Q69  ·  Difficult
**Question:** Which statement about **Streaming multiprocessor (SM)** is FALSE?

- **A.** In this module, Streaming multiprocessor (SM) is a core idea students must distinguish from nearby terms.
- **B.** An SM is a whole MPI cluster.
- **C.** A useful way to remember Streaming multiprocessor (SM) is that it is not the same as “An MPI communicator”.
- **D.** Streaming multiprocessor (SM) is correctly understood as: a GPU building block that schedules warps onto CUDA cores / tensor pipes and holds shared memory.

**Answer:** B
**Explanation:** The false claim is: An SM is a whole MPI cluster.. Streaming multiprocessor (SM) actually means: A GPU building block that schedules warps onto CUDA cores / tensor pipes and holds shared memory.

### Q70  ·  Difficult
**Question:** Which statement about **Timing parallel codes** is FALSE?

- **A.** In this module, Timing parallel codes is a core idea students must distinguish from nearby terms.
- **B.** gettimeofday on rank 3 without a barrier is a perfect global timer.
- **C.** Timing parallel codes is correctly understood as: use wall-clock (e.g. MPI_Wtime, omp_get_wtime, cuda events); warm up; repeat; report min/median.
- **D.** A useful way to remember Timing parallel codes is that it is not the same as “Use a single printf of CPU cycles across unsynchronised ranks as gospel”.

**Answer:** B
**Explanation:** The false claim is: gettimeofday on rank 3 without a barrier is a perfect global timer.. Timing parallel codes actually means: Use wall-clock (e.g. MPI_Wtime, omp_get_wtime, cuda events); warm up; repeat; report min/median.

### Q71  ·  Difficult
**Question:** Which statement about **Weak scaling** is FALSE?

- **A.** Weak scaling is correctly understood as: grow problem size with p so work per rank stays constant (Gustafson-style).
- **B.** A useful way to remember Weak scaling is that it is not the same as “Fix n and add infinite p”.
- **C.** Weak scaling requires n independent of p.
- **D.** In this module, Weak scaling is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Weak scaling requires n independent of p.. Weak scaling actually means: Grow problem size with p so work per rank stays constant (Gustafson-style).

### Q72  ·  Difficult
**Question:** Why can measured S beat Amdahl’s prediction?

- **A.** Amdahl is false for all codes
- **B.** p was 1
- **C.** GPUs ignore time
- **D.** Amdahl’s s was overestimated, or T(1) was not the best serial, or superlinear caches

**Answer:** D
**Explanation:** Model vs measurement.

### Q73  ·  Difficult
**Question:** s=0.05. Amdahl p→∞ limit?

- **A.** 0.05
- **B.** 5
- **C.** 20
- **D.** ∞

**Answer:** C
**Explanation:** S_max=1/0.05=20.

---

## Quick answer key

Q01–A | Q02–A | Q03–D | Q04–C | Q05–C | Q06–B | Q07–B | Q08–B | Q09–D | Q10–C | Q11–D | Q12–B | Q13–A | Q14–C | Q15–A | Q16–A | Q17–A | Q18–D | Q19–B | Q20–A | Q21–D | Q22–B | Q23–A | Q24–C | Q25–C | Q26–A | Q27–B | Q28–A | Q29–A | Q30–D | Q31–B | Q32–B | Q33–C | Q34–A | Q35–B | Q36–A | Q37–C | Q38–D | Q39–C | Q40–D | Q41–B | Q42–C | Q43–C | Q44–D | Q45–D | Q46–C | Q47–B | Q48–A | Q49–C | Q50–D | Q51–B | Q52–A | Q53–C | Q54–C | Q55–D | Q56–D | Q57–B | Q58–A | Q59–C | Q60–A | Q61–C | Q62–A | Q63–A | Q64–D | Q65–A | Q66–D | Q67–B | Q68–C | Q69–B | Q70–B | Q71–C | Q72–D | Q73–C
