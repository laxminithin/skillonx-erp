# Quiz — Parallel Computing — Module 1: One Processor Is No Longer Enough

**Subject:** Parallel Computing  
**Module:** Module 1 — One Processor Is No Longer Enough  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Data parallelism example:

- **A.** A single lock acquire
- **B.** A disk format
- **C.** Vector add of two arrays
- **D.** Lexer then parser then codegen as one serial chain on one core

**Answer:** C
**Explanation:** Same add, many indices.

### Q02  ·  Easy
**Question:** Flynn’s SIMD means:

- **A.** One instruction stream, multiple data elements
- **B.** A mutex
- **C.** Distributed-only MPI
- **D.** Many programs, one datum

**Answer:** A
**Explanation:** Classic taxonomy.

### Q03  ·  Easy
**Question:** OpenMP is primarily aimed at:

- **A.** Shared-memory multithreading
- **B.** DFA minimisation
- **C.** Disk RAID
- **D.** WAN routing

**Answer:** A
**Explanation:** Pragmas on a node.

### Q04  ·  Easy
**Question:** SPMD means:

- **A.** A NUMA hop
- **B.** Only SIMD hardware
- **C.** Each rank must be a different language
- **D.** The same program runs on many processes/threads

**Answer:** D
**Explanation:** MPI/OpenMP style.

### Q05  ·  Easy
**Question:** Which option best describes **Distributed memory**?

- **A.** OpenMP private clauses only.
- **B.** Each process has a private address space; communication is explicit (typically MPI messages).
- **C.** Registers of one CUDA thread.
- **D.** All cores share one cache-coherent DRAM.

**Answer:** B
**Explanation:** Distributed memory: Each process has a private address space; communication is explicit (typically MPI messages).

### Q06  ·  Easy
**Question:** Which option best describes **Functional / task parallelism**?

- **A.** Always SIMD on one vector register.
- **B.** A single instruction stream by Flynn.
- **C.** Different tasks/functions run concurrently, possibly on different data.
- **D.** Identical map over an array only.

**Answer:** C
**Explanation:** Functional / task parallelism: Different tasks/functions run concurrently, possibly on different data.

### Q07  ·  Easy
**Question:** Which option best describes **Need for parallelism**?

- **A.** Disabling caches so cores wait.
- **B.** Using many cores/nodes because clock-rate and ILP gains no longer deliver free sequential speedup.
- **C.** Replacing RAM with a slower disk to cut power.
- **D.** Running one thread on a 64-core CPU by law.

**Answer:** B
**Explanation:** Need for parallelism: Using many cores/nodes because clock-rate and ILP gains no longer deliver free sequential speedup.

### Q08  ·  Easy
**Question:** Which option best describes **OpenMP (intro)**?

- **A.** A CUDA occupancy calculator.
- **B.** Compiler pragmas and a runtime for shared-memory threads, often on a single node.
- **C.** A network MPI datatype.
- **D.** A MIMD cluster fabric.

**Answer:** B
**Explanation:** OpenMP (intro): Compiler pragmas and a runtime for shared-memory threads, often on a single node.

### Q09  ·  Easy
**Question:** Which option best describes **SISD**?

- **A.** An MPI cluster.
- **B.** A GPU with 4096 CUDA cores.
- **C.** Classical uniprocessor: one instruction stream, one data stream.
- **D.** A vector unit.

**Answer:** C
**Explanation:** SISD: Classical uniprocessor: one instruction stream, one data stream.

### Q10  ·  Easy
**Question:** Which option best describes **UMA**?

- **A.** NUMA where local DRAM is faster.
- **B.** Only distributed clusters.
- **C.** A GPU global-memory walk.
- **D.** Uniform Memory Access: all processors see similar latency to shared memory.

**Answer:** D
**Explanation:** UMA: Uniform Memory Access: all processors see similar latency to shared memory.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **choosing a programming model**?

- **A.** Write CUDA for a single-core SISD laptop only
- **B.** Classify memory (shared vs distributed) → pick OpenMP/threads and/or MPI → identify data vs task parallel loops → measure speedup
- **C.** Always start with a Turing machine
- **D.** Disable all caches first

**Answer:** B
**Explanation:** Correct sequence for choosing a programming model: Classify memory (shared vs distributed) → pick OpenMP/threads and/or MPI → identify data vs task parallel loops → measure speedup

### Q12  ·  Easy
**Question:** Which sequence correctly describes **hybrid node+cluster sketch**?

- **A.** CUDA replaces Ethernet
- **B.** OpenMP across InfiniBand without processes
- **C.** MPI_THREAD_SINGLE required to use OpenMP illegal
- **D.** OpenMP inside a node (shared) + MPI across nodes (distributed)

**Answer:** D
**Explanation:** Correct sequence for hybrid node+cluster sketch: OpenMP inside a node (shared) + MPI across nodes (distributed)

### Q13  ·  Intermediate
**Question:** A cluster job launches the same a.out on 128 nodes with different ranks. The style is:

- **A.** SPMD
- **B.** OpenMP on one core
- **C.** MISD
- **D.** A different executable per node by Flynn SISD

**Answer:** A
**Explanation:** One program, many data/ranks.

### Q14  ·  Intermediate
**Question:** A weather model updates every grid cell with the same stencil. This is primarily:

- **A.** Data parallelism
- **B.** Cache-incoherent MPI by requirement
- **C.** A serial SISD loop that cannot be parallel
- **D.** Only functional pipelining of unrelated tasks

**Answer:** A
**Explanation:** Same stencil, many cells.

### Q15  ·  Intermediate
**Question:** Eight lab PCs with no shared RAM should use:

- **A.** MPI (or similar message passing)
- **B.** OpenMP across the Ethernet as threads on one heap
- **C.** Cache coherence over USB
- **D.** A single CUDA __shared__ array spanning PCs

**Answer:** A
**Explanation:** Distributed memory ⇒ messages.

### Q16  ·  Intermediate
**Question:** False sharing is harmful because:

- **A.** MPI tags overflow
- **B.** Cache lines, not variables, are the coherence unit
- **C.** Amdahl forbids arrays
- **D.** GPUs cannot use warps

**Answer:** B
**Explanation:** Line ping-pong.

### Q17  ·  Intermediate
**Question:** MPI is a natural fit when:

- **A.** Address spaces are private and data must be sent
- **B.** All threads share one heap on one laptop only and never leave it
- **C.** You cannot number processes
- **D.** You only need vector SIMD on one core

**Answer:** A
**Explanation:** Distributed memory.

### Q18  ·  Intermediate
**Question:** The power wall pushed hardware toward:

- **A.** More cores/threads instead of endless GHz
- **B.** Removing SIMD units
- **C.** Banning caches
- **D.** Single-core 20 GHz designs

**Answer:** A
**Explanation:** Energy/heat limits clocks.

### Q19  ·  Intermediate
**Question:** Two cores increment adjacent ints in a 64-byte line and slow down. The bug is:

- **A.** Amdahl serial fraction 100%
- **B.** MPI deadlock
- **C.** False sharing
- **D.** Warp divergence

**Answer:** C
**Explanation:** Line ping-pong, not true sharing of one variable.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **MPI** and **OpenMP**?

- **A.** They cannot be combined in a hybrid program.
- **B.** MPI cannot send integers.
- **C.** MPI: processes + messages, scales across nodes. OpenMP: threads + pragmas, node-level shared memory.
- **D.** OpenMP is the cluster interconnect.

**Answer:** C
**Explanation:** MPI: processes + messages, scales across nodes. OpenMP: threads + pragmas, node-level shared memory.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **SPMD** and **SIMD**?

- **A.** SPMD is a programming style (one program, many ranks); SIMD is hardware lockstep.
- **B.** SIMD is an MPI communicator.
- **C.** Every SIMD loop is an MPI process.
- **D.** SPMD requires vector registers.

**Answer:** A
**Explanation:** SPMD is a programming style (one program, many ranks); SIMD is hardware lockstep.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **data parallelism** and **task parallelism**?

- **A.** They are Flynn’s MISD only.
- **B.** Data parallelism forbids arrays.
- **C.** Task parallelism is always SIMD.
- **D.** Data: same op, many elements. Task: different functions concurrent.

**Answer:** D
**Explanation:** Data: same op, many elements. Task: different functions concurrent.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **shared memory** and **distributed memory**?

- **A.** MPI is illegal on distributed memory.
- **B.** Shared: loads/stores (and locks). Distributed: explicit messages, private heaps.
- **C.** Shared memory cannot use threads.
- **D.** Distributed memory is cache-coherent by default.

**Answer:** B
**Explanation:** Shared: loads/stores (and locks). Distributed: explicit messages, private heaps.

### Q24  ·  Intermediate
**Question:** Which option best describes **Cache coherence**?

- **A.** A disk RAID checksum.
- **B.** MPI datatype packing.
- **C.** A protocol so that cached copies of a shared line stay consistent across cores.
- **D.** CUDA occupancy.

**Answer:** C
**Explanation:** Cache coherence: A protocol so that cached copies of a shared line stay consistent across cores.

### Q25  ·  Intermediate
**Question:** Which option best describes **Data parallelism**?

- **A.** Message-passing of ranks only.
- **B.** The same operation applied independently to many data elements (e.g. all array entries).
- **C.** False sharing by definition.
- **D.** Splitting a program into a pipeline of different functions on one datum.

**Answer:** B
**Explanation:** Data parallelism: The same operation applied independently to many data elements (e.g. all array entries).

### Q26  ·  Intermediate
**Question:** Which option best describes **False sharing**?

- **A.** Distinct variables on the same cache line ping-pong between cores although they are logically independent.
- **B.** A GPU warp divergence.
- **C.** MPI deadlock.
- **D.** Two threads writing the exact same variable.

**Answer:** A
**Explanation:** False sharing: Distinct variables on the same cache line ping-pong between cores although they are logically independent.

### Q27  ·  Intermediate
**Question:** Which option best describes **Flynn’s taxonomy**?

- **A.** A classification of computers by number of instruction and data streams (SISD, SIMD, MISD, MIMD).
- **B.** A list of MPI collectives.
- **C.** Amdahl’s formula only.
- **D.** A CUDA memory hierarchy.

**Answer:** A
**Explanation:** Flynn’s taxonomy: A classification of computers by number of instruction and data streams (SISD, SIMD, MISD, MIMD).

### Q28  ·  Intermediate
**Question:** Which option best describes **MIMD**?

- **A.** A single-core pipeline.
- **B.** Multiple Instruction, Multiple Data: independent cores run their own instruction streams.
- **C.** One instruction on a GPU warp only.
- **D.** A SIMD vector add.

**Answer:** B
**Explanation:** MIMD: Multiple Instruction, Multiple Data: independent cores run their own instruction streams.

### Q29  ·  Intermediate
**Question:** Which option best describes **MPI (intro)**?

- **A.** A message-passing API for distributed (and shared) machines: ranks, communicators, send/recv.
- **B.** A compiler pragma for for-loops only.
- **C.** A cache-coherence directory.
- **D.** A GPU kernel launcher.

**Answer:** A
**Explanation:** MPI (intro): A message-passing API for distributed (and shared) machines: ranks, communicators, send/recv.

### Q30  ·  Intermediate
**Question:** Which option best describes **NUMA**?

- **A.** Non-Uniform Memory Access: local memory is faster than remote socket memory.
- **B.** MPI_Barrier.
- **C.** Always faster than a register.
- **D.** A SIMD vector width.

**Answer:** A
**Explanation:** NUMA: Non-Uniform Memory Access: local memory is faster than remote socket memory.

### Q31  ·  Intermediate
**Question:** Which option best describes **Power wall**?

- **A.** A CUDA occupancy formula.
- **B.** Energy and heat stop frequency scaling, so designs add cores instead of GHz.
- **C.** A cache-coherence protocol name.
- **D.** A wall that MPI ranks bounce off.

**Answer:** B
**Explanation:** Power wall: Energy and heat stop frequency scaling, so designs add cores instead of GHz.

### Q32  ·  Intermediate
**Question:** Which option best describes **SIMD**?

- **A.** Multiple independent programs with no lockstep.
- **B.** Single Instruction, Multiple Data: one instruction stream operates on a vector of elements.
- **C.** A shared-memory mutex.
- **D.** MPI_Send semantics.

**Answer:** B
**Explanation:** SIMD: Single Instruction, Multiple Data: one instruction stream operates on a vector of elements.

### Q33  ·  Intermediate
**Question:** Which option best describes **SPMD**?

- **A.** Single Program, Multiple Data: the same binary runs on all processes/threads with different ranks/IDs.
- **B.** A cache protocol.
- **C.** Each node loads a different executable by requirement.
- **D.** SIMD lockstep on one core only.

**Answer:** A
**Explanation:** SPMD: Single Program, Multiple Data: the same binary runs on all processes/threads with different ranks/IDs.

### Q34  ·  Intermediate
**Question:** Which option best describes **Shared memory**?

- **A.** Nodes that can communicate only by sending messages over a network.
- **B.** A CUDA __global__ launch only.
- **C.** Processors communicate by reading/writing a common address space (threads, OpenMP).
- **D.** HDFS replication.

**Answer:** C
**Explanation:** Shared memory: Processors communicate by reading/writing a common address space (threads, OpenMP).

### Q35  ·  Intermediate
**Question:** Which option best describes **Speedup (preview)**?

- **A.** S = T_parallel / T_sequential.
- **B.** Always equal to the number of cores.
- **C.** Always 1.
- **D.** S = T_sequential / T_parallel, how many times faster the parallel run is.

**Answer:** D
**Explanation:** Speedup (preview): S = T_sequential / T_parallel, how many times faster the parallel run is.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **coherence of a dirty line (MESI intuition)**?

- **A.** MPI_Send updates every DRAM
- **B.** All caches ignore writes
- **C.** Core writes → line Exclusive/Modified → other copies Invalidated → later readers fetch the new value
- **D.** The compiler deletes the line

**Answer:** C
**Explanation:** Correct sequence for coherence of a dirty line (MESI intuition): Core writes → line Exclusive/Modified → other copies Invalidated → later readers fetch the new value

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **from serial to data-parallel loop**?

- **A.** Reverse Amdahl then skip measuring
- **B.** Convert the loop to a TM ID
- **C.** Insert MPI_Barrier after every statement always
- **D.** Identify independent iterations → partition data → map workers → join/reduce answers → time T1 vs Tp

**Answer:** D
**Explanation:** Correct sequence for from serial to data-parallel loop: Identify independent iterations → partition data → map workers → join/reduce answers → time T1 vs Tp

### Q38  ·  Intermediate
**Question:** Which statement about **Cache coherence** is FALSE?

- **A.** In this module, Cache coherence is a core idea students must distinguish from nearby terms.
- **B.** Cache coherence is correctly understood as: a protocol so that cached copies of a shared line stay consistent across cores.
- **C.** Coherence is unnecessary on shared-memory multiprocessors.
- **D.** A useful way to remember Cache coherence is that it is not the same as “A disk RAID checksum”.

**Answer:** C
**Explanation:** The false claim is: Coherence is unnecessary on shared-memory multiprocessors.. Cache coherence actually means: A protocol so that cached copies of a shared line stay consistent across cores.

### Q39  ·  Intermediate
**Question:** Which statement about **Data parallelism** is FALSE?

- **A.** In this module, Data parallelism is a core idea students must distinguish from nearby terms.
- **B.** Data parallelism requires each element to take a different algorithm.
- **C.** Data parallelism is correctly understood as: the same operation applied independently to many data elements (e.g. all array entries).
- **D.** A useful way to remember Data parallelism is that it is not the same as “Splitting a program into a pipeline of different functions on one datum”.

**Answer:** B
**Explanation:** The false claim is: Data parallelism requires each element to take a different algorithm.. Data parallelism actually means: The same operation applied independently to many data elements (e.g. all array entries).

### Q40  ·  Intermediate
**Question:** Which statement about **Flynn’s taxonomy** is FALSE?

- **A.** Flynn’s taxonomy is correctly understood as: a classification of computers by number of instruction and data streams (SISD, SIMD, MISD, MIMD).
- **B.** Flynn’s taxonomy classifies languages, not machines.
- **C.** A useful way to remember Flynn’s taxonomy is that it is not the same as “A list of MPI collectives”.
- **D.** In this module, Flynn’s taxonomy is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Flynn’s taxonomy classifies languages, not machines.. Flynn’s taxonomy actually means: A classification of computers by number of instruction and data streams (SISD, SIMD, MISD, MIMD).

### Q41  ·  Intermediate
**Question:** Which statement about **MPI (intro)** is FALSE?

- **A.** In this module, MPI (intro) is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MPI (intro) is that it is not the same as “A compiler pragma for for-loops only”.
- **C.** MPI programs cannot run on a cluster; they need one shared RAM.
- **D.** MPI (intro) is correctly understood as: a message-passing API for distributed (and shared) machines: ranks, communicators, send/recv.

**Answer:** C
**Explanation:** The false claim is: MPI programs cannot run on a cluster; they need one shared RAM.. MPI (intro) actually means: A message-passing API for distributed (and shared) machines: ranks, communicators, send/recv.

### Q42  ·  Intermediate
**Question:** Which statement about **Need for parallelism** is FALSE?

- **A.** In this module, Need for parallelism is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Need for parallelism is that it is not the same as “Replacing RAM with a slower disk to cut power”.
- **C.** Need for parallelism is correctly understood as: using many cores/nodes because clock-rate and ILP gains no longer deliver free sequential speedup.
- **D.** Single-thread GHz has kept doubling every year with no power wall.

**Answer:** D
**Explanation:** The false claim is: Single-thread GHz has kept doubling every year with no power wall.. Need for parallelism actually means: Using many cores/nodes because clock-rate and ILP gains no longer deliver free sequential speedup.

### Q43  ·  Intermediate
**Question:** Which statement about **SIMD** is FALSE?

- **A.** In this module, SIMD is a core idea students must distinguish from nearby terms.
- **B.** SIMD is correctly understood as: single Instruction, Multiple Data: one instruction stream operates on a vector of elements.
- **C.** SIMD means each core runs a different instruction stream.
- **D.** A useful way to remember SIMD is that it is not the same as “Multiple independent programs with no lockstep”.

**Answer:** C
**Explanation:** The false claim is: SIMD means each core runs a different instruction stream.. SIMD actually means: Single Instruction, Multiple Data: one instruction stream operates on a vector of elements.

### Q44  ·  Intermediate
**Question:** Which statement about **SISD** is FALSE?

- **A.** A useful way to remember SISD is that it is not the same as “A GPU with 4096 CUDA cores”.
- **B.** In this module, SISD is a core idea students must distinguish from nearby terms.
- **C.** SISD is correctly understood as: classical uniprocessor: one instruction stream, one data stream.
- **D.** A laptop CPU core is never SISD even in scalar mode.

**Answer:** D
**Explanation:** The false claim is: A laptop CPU core is never SISD even in scalar mode.. SISD actually means: Classical uniprocessor: one instruction stream, one data stream.

### Q45  ·  Intermediate
**Question:** Which statement about **Shared memory** is FALSE?

- **A.** In this module, Shared memory is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Shared memory is that it is not the same as “Nodes that can communicate only by sending messages over a network”.
- **C.** Shared memory means each core has a private RAM that others cannot load.
- **D.** Shared memory is correctly understood as: processors communicate by reading/writing a common address space (threads, OpenMP).

**Answer:** C
**Explanation:** The false claim is: Shared memory means each core has a private RAM that others cannot load.. Shared memory actually means: Processors communicate by reading/writing a common address space (threads, OpenMP).

### Q46  ·  Intermediate
**Question:** Which statement about **UMA** is FALSE?

- **A.** In this module, UMA is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember UMA is that it is not the same as “Only distributed clusters”.
- **C.** UMA is correctly understood as: uniform Memory Access: all processors see similar latency to shared memory.
- **D.** UMA means remote NUMA hops are an order of magnitude cheaper than local.

**Answer:** D
**Explanation:** The false claim is: UMA means remote NUMA hops are an order of magnitude cheaper than local.. UMA actually means: Uniform Memory Access: all processors see similar latency to shared memory.

### Q47  ·  Intermediate
**Question:** Why is a cluster not UMA shared memory?

- **A.** MPI_Send is a load instruction
- **B.** Ethernet implements MESI
- **C.** All ranks share libc heap pointers
- **D.** Each node’s DRAM is not a cache-coherent global address space

**Answer:** D
**Explanation:** Private memories.

### Q48  ·  Difficult
**Question:** A 16-core workstation with one DRAM should start with:

- **A.** A UTM simulation
- **B.** OpenMP (or pthreads) on shared memory
- **C.** One MPI rank per Ethernet switch only
- **D.** Disabling caches to avoid coherence

**Answer:** B
**Explanation:** Node-level shared memory matches OpenMP.

### Q49  ·  Difficult
**Question:** A 4-core NUMA node can still need MPI if:

- **A.** You scale the same program to many such nodes without a global shared heap
- **B.** SIMD is illegal
- **C.** OpenMP cannot spawn 4 threads
- **D.** NUMA forbids loads

**Answer:** A
**Explanation:** Cluster = distributed.

### Q50  ·  Difficult
**Question:** A 4-core UMA node vs 4 networked PCs. If each message costs 50 µs and a shared-memory CAS is 50 ns, the ratio of those two latencies is:

- **A.** 1000× (message slower)
- **B.** 1×
- **C.** 0.001× (message faster)
- **D.** 50×

**Answer:** A
**Explanation:** 50e-6 / 50e-9 = 1000.

### Q51  ·  Difficult
**Question:** A compiler’s lexer, parser and codegen as overlapping stages on a stream of files is:

- **A.** Pure SIMD on one register
- **B.** False sharing of MPI ranks
- **C.** Task/pipeline (functional) parallelism
- **D.** A UMA interconnect

**Answer:** C
**Explanation:** Different functions concurrent.

### Q52  ·  Difficult
**Question:** A dual-socket server is slower when threads are pinned far from their arrays. This is:

- **A.** A CUDA occupancy miss only
- **B.** SIMD lockstep
- **C.** NUMA locality
- **D.** UMA with uniform 1-cycle DRAM

**Answer:** C
**Explanation:** Remote DRAM costs more.

### Q53  ·  Difficult
**Question:** A sequential job takes 40 s. The parallel version takes 8 s. Speedup is:

- **A.** 0.2
- **B.** 8
- **C.** 40
- **D.** 5

**Answer:** D
**Explanation:** S = 40/8 = 5.

### Q54  ·  Difficult
**Question:** Amdahl: 25% of a program is strictly serial, 8 processors on the rest. Speedup is:

- **A.** 4
- **B.** 0.25
- **C.** 8
- **D.** 3.2

**Answer:** D
**Explanation:** S=1/(0.25+0.75/8)=1/(0.25+0.09375)=1/0.34375=3.2.

### Q55  ·  Difficult
**Question:** An array of 2^20 floats, each thread of 8 OpenMP threads gets a contiguous chunk. Elements per thread:

- **A.** 131072
- **B.** 8
- **C.** 1048576
- **D.** 20

**Answer:** A
**Explanation:** 2^20 / 8 = 2^17 = 131072.

### Q56  ·  Difficult
**Question:** Cache coherence does not by itself specify:

- **A.** Whether a line can have two dirty copies in MESI (it shouldn’t)
- **B.** That caches exist
- **C.** That cores load DRAM
- **D.** The memory consistency model (when stores become globally ordered)

**Answer:** D
**Explanation:** Coherence ≠ consistency.

### Q57  ·  Difficult
**Question:** Coherence traffic explodes when every core writes the same counter. A first fix is:

- **A.** Switch to SISD GPUs
- **B.** Add more false sharing
- **C.** Delete caches and hope
- **D.** Privatise then reduce, or use atomics carefully

**Answer:** D
**Explanation:** True sharing of one line; reduce privately.

### Q58  ·  Difficult
**Question:** Flynn: a GPU warp executing one instruction on 32 lanes is best classified as:

- **A.** A mutex
- **B.** SIMD (SIMT is a SIMD variant)
- **C.** MISD
- **D.** SISD

**Answer:** B
**Explanation:** One instruction, many data lanes.

### Q59  ·  Difficult
**Question:** If 10% is serial, Amdahl’s infinite-processor upper bound is:

- **A.** 0.1
- **B.** 90
- **C.** 10
- **D.** ∞

**Answer:** C
**Explanation:** S_max=1/s=1/0.10=10.

### Q60  ·  Difficult
**Question:** Speedup 5 on 8 cores. Parallel efficiency is:

- **A.** 100%
- **B.** 5%
- **C.** 62.5%
- **D.** 8%

**Answer:** C
**Explanation:** E = S/p = 5/8 = 0.625.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **SIMD** and **MIMD**?

- **A.** SIMD is lockstep one instruction on vectors; MIMD runs independent streams.
- **B.** SIMD is MPI only.
- **C.** MIMD cannot run different branches.
- **D.** They are the same Flynn class.

**Answer:** A
**Explanation:** SIMD is lockstep one instruction on vectors; MIMD runs independent streams.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **UMA** and **NUMA**?

- **A.** UMA is only GPU global memory.
- **B.** They describe MPI ranks, not hardware.
- **C.** UMA has roughly equal DRAM latency; NUMA is faster to local banks.
- **D.** NUMA has uniform latency.

**Answer:** C
**Explanation:** UMA has roughly equal DRAM latency; NUMA is faster to local banks.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **cache coherence** and **memory consistency**?

- **A.** Coherence: one line’s copies. Consistency: when a store becomes visible in program order.
- **B.** They are identical terms.
- **C.** Coherence decides MPI tag matching.
- **D.** Consistency is only RAID.

**Answer:** A
**Explanation:** Coherence: one line’s copies. Consistency: when a store becomes visible in program order.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **multicore CPU** and **cluster**?

- **A.** Multicore chips cannot run OpenMP.
- **B.** A cluster is always UMA shared RAM.
- **C.** Multicore: shared memory on a board. Cluster: networked nodes, typically distributed memory.
- **D.** Clusters cannot run MPI.

**Answer:** C
**Explanation:** Multicore: shared memory on a board. Cluster: networked nodes, typically distributed memory.

### Q65  ·  Difficult
**Question:** Which statement about **Distributed memory** is FALSE?

- **A.** Distributed memory makes MPI_Send unnecessary because loads are coherent.
- **B.** A useful way to remember Distributed memory is that it is not the same as “All cores share one cache-coherent DRAM”.
- **C.** Distributed memory is correctly understood as: each process has a private address space; communication is explicit (typically MPI messages).
- **D.** In this module, Distributed memory is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Distributed memory makes MPI_Send unnecessary because loads are coherent.. Distributed memory actually means: Each process has a private address space; communication is explicit (typically MPI messages).

### Q66  ·  Difficult
**Question:** Which statement about **False sharing** is FALSE?

- **A.** False sharing is correctly understood as: distinct variables on the same cache line ping-pong between cores although they are logically independent.
- **B.** A useful way to remember False sharing is that it is not the same as “Two threads writing the exact same variable”.
- **C.** False sharing happens only with distributed-memory MPI.
- **D.** In this module, False sharing is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: False sharing happens only with distributed-memory MPI.. False sharing actually means: Distinct variables on the same cache line ping-pong between cores although they are logically independent.

### Q67  ·  Difficult
**Question:** Which statement about **Functional / task parallelism** is FALSE?

- **A.** Task parallelism is identical to SIMD lockstep.
- **B.** A useful way to remember Functional / task parallelism is that it is not the same as “Always SIMD on one vector register”.
- **C.** In this module, Functional / task parallelism is a core idea students must distinguish from nearby terms.
- **D.** Functional / task parallelism is correctly understood as: different tasks/functions run concurrently, possibly on different data.

**Answer:** A
**Explanation:** The false claim is: Task parallelism is identical to SIMD lockstep.. Functional / task parallelism actually means: Different tasks/functions run concurrently, possibly on different data.

### Q68  ·  Difficult
**Question:** Which statement about **MIMD** is FALSE?

- **A.** In this module, MIMD is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MIMD is that it is not the same as “One instruction on a GPU warp only”.
- **C.** MIMD is correctly understood as: multiple Instruction, Multiple Data: independent cores run their own instruction streams.
- **D.** MIMD forbids different threads from executing different branches.

**Answer:** D
**Explanation:** The false claim is: MIMD forbids different threads from executing different branches.. MIMD actually means: Multiple Instruction, Multiple Data: independent cores run their own instruction streams.

### Q69  ·  Difficult
**Question:** Which statement about **NUMA** is FALSE?

- **A.** In this module, NUMA is a core idea students must distinguish from nearby terms.
- **B.** NUMA systems have identical latency to every DRAM address.
- **C.** NUMA is correctly understood as: non-Uniform Memory Access: local memory is faster than remote socket memory.
- **D.** A useful way to remember NUMA is that it is not the same as “A SIMD vector width”.

**Answer:** B
**Explanation:** The false claim is: NUMA systems have identical latency to every DRAM address.. NUMA actually means: Non-Uniform Memory Access: local memory is faster than remote socket memory.

### Q70  ·  Difficult
**Question:** Which statement about **OpenMP (intro)** is FALSE?

- **A.** A useful way to remember OpenMP (intro) is that it is not the same as “A network MPI datatype”.
- **B.** OpenMP (intro) is correctly understood as: compiler pragmas and a runtime for shared-memory threads, often on a single node.
- **C.** OpenMP is the only way to program distributed-memory supercomputers without a shared heap.
- **D.** In this module, OpenMP (intro) is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: OpenMP is the only way to program distributed-memory supercomputers without a shared heap.. OpenMP (intro) actually means: Compiler pragmas and a runtime for shared-memory threads, often on a single node.

### Q71  ·  Difficult
**Question:** Which statement about **Power wall** is FALSE?

- **A.** In this module, Power wall is a core idea students must distinguish from nearby terms.
- **B.** The power wall says voltage can rise without limit to raise clock.
- **C.** A useful way to remember Power wall is that it is not the same as “A wall that MPI ranks bounce off”.
- **D.** Power wall is correctly understood as: energy and heat stop frequency scaling, so designs add cores instead of GHz.

**Answer:** B
**Explanation:** The false claim is: The power wall says voltage can rise without limit to raise clock.. Power wall actually means: Energy and heat stop frequency scaling, so designs add cores instead of GHz.

### Q72  ·  Difficult
**Question:** Which statement about **SPMD** is FALSE?

- **A.** A useful way to remember SPMD is that it is not the same as “Each node loads a different executable by requirement”.
- **B.** SPMD is correctly understood as: single Program, Multiple Data: the same binary runs on all processes/threads with different ranks/IDs.
- **C.** In this module, SPMD is a core idea students must distinguish from nearby terms.
- **D.** SPMD is incompatible with MPI.

**Answer:** D
**Explanation:** The false claim is: SPMD is incompatible with MPI.. SPMD actually means: Single Program, Multiple Data: the same binary runs on all processes/threads with different ranks/IDs.

### Q73  ·  Difficult
**Question:** Which statement about **Speedup (preview)** is FALSE?

- **A.** A useful way to remember Speedup (preview) is that it is not the same as “S = T_parallel / T_sequential”.
- **B.** Speedup cannot exceed 1 even with 100 idle-free cores.
- **C.** In this module, Speedup (preview) is a core idea students must distinguish from nearby terms.
- **D.** Speedup (preview) is correctly understood as: s = T_sequential / T_parallel, how many times faster the parallel run is.

**Answer:** B
**Explanation:** The false claim is: Speedup cannot exceed 1 even with 100 idle-free cores.. Speedup (preview) actually means: S = T_sequential / T_parallel, how many times faster the parallel run is.

---

## Quick answer key

Q01–C | Q02–A | Q03–A | Q04–D | Q05–B | Q06–C | Q07–B | Q08–B | Q09–C | Q10–D | Q11–B | Q12–D | Q13–A | Q14–A | Q15–A | Q16–B | Q17–A | Q18–A | Q19–C | Q20–C | Q21–A | Q22–D | Q23–B | Q24–C | Q25–B | Q26–A | Q27–A | Q28–B | Q29–A | Q30–A | Q31–B | Q32–B | Q33–A | Q34–C | Q35–D | Q36–C | Q37–D | Q38–C | Q39–B | Q40–B | Q41–C | Q42–D | Q43–C | Q44–D | Q45–C | Q46–D | Q47–D | Q48–B | Q49–A | Q50–A | Q51–C | Q52–C | Q53–D | Q54–D | Q55–A | Q56–D | Q57–D | Q58–B | Q59–C | Q60–C | Q61–A | Q62–C | Q63–A | Q64–C | Q65–A | Q66–C | Q67–A | Q68–D | Q69–B | Q70–C | Q71–B | Q72–D | Q73–B
